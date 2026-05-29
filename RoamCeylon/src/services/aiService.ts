import apiService from './api';
import { retryWithBackoff } from '../utils/networkUtils';

export interface TripPlanRequest {
  destination: string;
  duration: string; // e.g., '3 days'
  budget: string; // e.g., 'Medium', 'Low', 'High', 'Luxury'
  interests?: string[];
  pax?: string; // Number of people traveling
  chatContext?: string; // Condensed summary of chat for enriched search
  // Saved Trip Context integration
  useSavedContext?: boolean; // default true
  mode?: 'new' | 'refine'; // default 'refine'
  tripId?: string; // optional specific trip refinement
  lastDayPreference?: 'explore' | 'head_home';
}

export interface TripActivity {
  placeName?: string;
  description: string;    // place name shown in the card
  coordinate?: [number, number]; // [longitude, latitude]
  dayNumber?: number;

  // Rich fields from Gemini enrichment
  time?: string;          // e.g. "08:00 AM"
  richDescription?: string; // 2-sentence vivid narrative
  tip?: string;           // insider local tip
  costUSD?: number;       // entry/activity cost in USD
  photoUrl?: string;      // Unsplash photo URL
  photoKeyword?: string;  // search keyword used
  imageUrl?: string | null; // Nhost Storage URL
  estimatedDuration?: string; // e.g. "1-2 hours"

  // Preference-aware data from backend
  category?: string;
  matchedPreferences?: string[];
  hasPositiveFeedback?: boolean;
  confidenceScore?: 'High' | 'Medium' | 'Low';
  tips?: string[]; // kept for backward-compat
}

export interface TripDay {
  day: number;
  date?: string;
  theme?: string;
  themeTitle?: string;
  activities: TripActivity[];
}

export interface TripPlanResponse {
  destination: string;
  duration: string;
  budget: string;
  itinerary: TripDay[];
  // Version tracking (from backend)
  tripId?: string;
  versionNo?: number;
  usedSavedContext?: boolean;
}

// Backend response interfaces
interface BackendActivity {
  placeName: string;
  shortDescription: string;
  category?: string;
  timeSlot?: string;
  estimatedDuration?: string;
  confidenceScore?: 'High' | 'Medium' | 'Low';
  explanation?: {
    rankingFactors?: {
      preferenceMatch?: string[];
    };
    hasPositiveFeedback?: boolean;
    tips?: string[];
  };
}

interface BackendDayPlan {
  day: number;
  date?: string;
  theme?: string;
  activities: BackendActivity[];
}

interface BackendTripPlanBody {
  plan: {
    destination: string;
    totalDays: number;
    dates: { start: string; end: string };
    dayByDayPlan: BackendDayPlan[];
    summary: any;
  };
  message: string;
}

interface BackendResponseWrapper {
  statusCode: number;
  success: boolean;
  data: BackendTripPlanBody;
}

// Enriched activity from POST /ai/enrich-plan
interface EnrichedActivity {
  placeName: string;
  shortDescription: string;
  category: string;
  timeSlot?: string;
  estimatedDuration?: string;
  time: string;
  richDescription: string;
  tip: string;
  costUSD: number;
  photoKeyword: string;
  imageUrl?: string | null;
}

interface EnrichedDay {
  day: number;
  date: string;
  theme: string;
  themeTitle: string;
  activities: EnrichedActivity[];
}

interface EnrichPlanResponse {
  statusCode: number;
  success: boolean;
  data: { enrichedDays: EnrichedDay[] };
}

/**
 * Build an Unsplash Source URL for a given keyword.
 * Uses the free Unsplash Source API — no API key needed.
 */
const getUnsplashPhotoUrl = (keyword: string, width = 400, height = 220): string => {
  const encoded = encodeURIComponent(keyword);
  // Use a deterministic seed based on the keyword so the same place always
  // gets the same image (Unsplash Source picks randomly otherwise).
  const seed = keyword.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return `https://source.unsplash.com/${width}x${height}/?${encoded}&sig=${seed}`;
};

class AIService {
  private lastRequestKey: string | null = null;
  private cachedResponse: TripPlanResponse | null = null;

  async generateTripPlan(request: TripPlanRequest): Promise<TripPlanResponse> {
    try {
      // 1. Generate a cache key based on meaningful preferences
      const cacheKey = JSON.stringify({
        destination: request.destination?.trim().toLowerCase(),
        duration: request.duration,
        budget: request.budget,
        interests: request.interests ? [...request.interests].sort() : [],
        useSavedContext: request.useSavedContext,
        mode: request.mode,
        tripId: request.tripId,
        lastDayPreference: request.lastDayPreference,
      });

      // 2. Check if we have a valid cache hit (skip cache for fresh plans)
      const isNewPlan = request.mode === 'new';
      if (!isNewPlan && this.cachedResponse && this.lastRequestKey === cacheKey) {
        return this.cachedResponse;
      }

      // Parse duration to calculate dates
      const durationStr = request.duration || '1';
      const dayCount = parseInt(durationStr.replace(/\D/g, '')) || 1;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + dayCount - 1);

      const payload = {
        destination: request.destination,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        preferences: request.interests || [],
        useSavedContext: request.useSavedContext,
        mode: request.mode,
        tripId: request.tripId,
        // Chat-context fields for accuracy
        budget: request.budget,
        pax: request.pax,
        chatContext: request.chatContext,
        lastDayPreference: request.lastDayPreference,
      };

      // Step 1: Get raw embedding-based plan
      const wrapper = await retryWithBackoff(
        () => apiService.post<BackendResponseWrapper>('/ai/trip-plan', payload),
        { maxAttempts: 3, initialDelay: 1000 },
      );

      const backendData = wrapper.data;
      const rawDays: BackendDayPlan[] = backendData.plan.dayByDayPlan || [];

      // Step 2: Enrich with Gemini (times, rich descriptions, tips, costs, photo keywords)
      let enrichedDays: EnrichedDay[] = [];
      try {
        const enrichPayload = {
          destination: backendData.plan.destination || request.destination,
          budget: request.budget,
          pax: request.pax,
          preferences: request.interests || [],
          dayByDayPlan: rawDays.map((d) => ({
            day: d.day,
            date: d.date || '',
            theme: d.theme || '',
            activities: d.activities.map((a) => ({
              placeName: a.placeName,
              shortDescription: a.shortDescription,
              category: a.category || 'Sightseeing',
              timeSlot: a.timeSlot,
              estimatedDuration: a.estimatedDuration,
            })),
          })),
        };

        const enrichWrapper = await retryWithBackoff(
          () => apiService.post<EnrichPlanResponse>('/ai/enrich-plan', enrichPayload),
          { maxAttempts: 2, initialDelay: 500 },
        );
        enrichedDays = enrichWrapper.data.enrichedDays || [];
      } catch (enrichErr) {
        console.warn('[aiService] Enrichment failed, using raw data:', enrichErr);
        // Fall back to raw days shaped as enriched
        enrichedDays = rawDays.map((d) => ({
          day: d.day,
          date: d.date || '',
          theme: d.theme || '',
          themeTitle: `Day ${d.day}: ${backendData.plan.destination}`,
          activities: d.activities.map((a) => ({
            placeName: a.placeName,
            shortDescription: a.shortDescription,
            category: a.category || 'Sightseeing',
            timeSlot: a.timeSlot,
            estimatedDuration: a.estimatedDuration,
            time: a.timeSlot === 'Afternoon' ? '01:00 PM' : a.timeSlot === 'Evening' ? '06:00 PM' : '08:00 AM',
            richDescription: a.shortDescription,
            tip: a.explanation?.tips?.[0] || '',
            costUSD: 0,
            photoKeyword: a.placeName + ' Sri Lanka',
          })),
        }));
      }

      // Step 3: Map enriched days to frontend TripPlanResponse
      const safeItinerary: TripDay[] = enrichedDays.map((day) => ({
        day: day.day,
        date: day.date,
        theme: day.theme,
        themeTitle: day.themeTitle,
        activities: day.activities
          .filter((act) => act && act.placeName)
          .map((act, idx) => {
            // Find the matching raw activity for preferences / confidence
            const rawDay = rawDays.find((d) => d.day === day.day);
            const rawAct = rawDay?.activities.find(
              (r) => r.placeName?.toLowerCase().trim() === act.placeName?.toLowerCase().trim(),
            );

            return {
              placeName: act.placeName,
              description: act.placeName,
              coordinate: undefined as [number, number] | undefined,
              dayNumber: day.day,
              time: act.time,
              richDescription: act.richDescription,
              tip: act.tip,
              costUSD: act.costUSD,
              imageUrl: act.imageUrl,
              photoUrl: getUnsplashPhotoUrl(act.photoKeyword, 400, 220),
              photoKeyword: act.photoKeyword,
              category: act.category || rawAct?.category || 'General',
              matchedPreferences: rawAct?.explanation?.rankingFactors?.preferenceMatch || [],
              hasPositiveFeedback: rawAct?.explanation?.hasPositiveFeedback,
              confidenceScore: rawAct?.confidenceScore,
              estimatedDuration: act.estimatedDuration || rawAct?.estimatedDuration,
              tips: rawAct?.explanation?.tips || (act.tip ? [act.tip] : []),
            } as TripActivity;
          }),
      }));

      // Edge Case: No activities
      const totalActivities = safeItinerary.reduce((sum, d) => sum + d.activities.length, 0);
      if (safeItinerary.length === 0 || totalActivities === 0) {
        throw new Error(
          'We could not generate a plan for these preferences. Please try adjusting your destination or interests.',
        );
      }

      const mappedResponse: TripPlanResponse = {
        destination: backendData.plan.destination || request.destination,
        duration: String(backendData.plan.totalDays || safeItinerary.length),
        budget: request.budget || 'Medium',
        tripId: backendData.plan.summary?.tripId,
        versionNo: backendData.plan.summary?.versionNo,
        usedSavedContext: backendData.plan.summary?.usedSavedContext,
        itinerary: safeItinerary,
      };

      // 3. Update Cache
      this.lastRequestKey = cacheKey;
      this.cachedResponse = mappedResponse;

      return mappedResponse;
    } catch (error) {
      throw error;
    }
  }
}

export const aiService = new AIService();
export default aiService;
