import apiService from './api';
import { retryWithBackoff } from '../utils/networkUtils';

export interface TripPlanRequest {
  destination: string;
  duration: string; // e.g., '3 days'
  budget: string; // e.g., 'Medium', 'Low', 'High'
  interests?: string[];
  // Saved Trip Context integration
  useSavedContext?: boolean; // default true
  mode?: 'new' | 'refine'; // default 'refine'
  tripId?: string; // optional specific trip refinement
}

export interface TripActivity {
  description: string;
  coordinate?: [number, number]; // [longitude, latitude]
  dayNumber?: number;
  
  // Preference-aware data from backend
  category?: string; // 'Culture', 'Nature', 'Beach', etc.
  matchedPreferences?: string[]; // User preferences that matched this activity
  confidenceScore?: 'High' | 'Medium' | 'Low';
  tips?: string[]; // Helpful tips from backend
}

export interface TripDay {
  day: number;
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
  confidenceScore?: 'High' | 'Medium' | 'Low';
  explanation?: {
    rankingFactors?: {
      preferenceMatch?: string[];
    };
    tips?: string[];
  };
}

interface BackendDayPlan {
  day: number;
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

class AIService {
  // MOCK_DELAY removed

  async generateTripPlan(request: TripPlanRequest): Promise<TripPlanResponse> {
    try {
      // Parse duration to calculate dates
      const durationStr = request.duration || '1';
      // extract number from string (e.g. "3 days" -> 3)
      const dayCount = parseInt(durationStr) || 1;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + dayCount - 1); // -1 because start==end is 1 day

      const payload = {
        destination: request.destination,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        preferences: request.interests || [],
        // Include saved context parameters
        useSavedContext: request.useSavedContext,
        mode: request.mode,
        tripId: request.tripId,
      };

      // Log preferences being sent to backend
      console.log('[AIService] Generating trip plan with preferences:', payload.preferences);
      console.log('[AIService] Full request payload:', JSON.stringify(payload, null, 2));

      // Fetch data matching the BACKEND structure
      const wrapper = await retryWithBackoff(
        () => apiService.post<BackendResponseWrapper>('/ai/trip-plan', payload),
        {
          maxAttempts: 3,
          initialDelay: 1000,
        }
      );

      const backendData = wrapper.data;

      // Helper to generate mock coordinates near Kandy (7.2906, 80.6337)
      // purely for demonstration until backend provides real coords
      const getMockCoordinates = (index: number): [number, number] => {
        const baseLat = 7.2906;
        const baseLng = 80.6337;
        // spread out by ~1-2km randomly
        const latOffset = (Math.random() - 0.5) * 0.04; 
        const lngOffset = (Math.random() - 0.5) * 0.04;
        return [baseLng + lngOffset, baseLat + latOffset];
      };

      // Adapter: Convert Backend Response to Frontend Response
      const mappedResponse: TripPlanResponse = {
        destination: backendData.plan.destination,
        duration: String(backendData.plan.totalDays),
        budget: request.budget || 'Medium', // Backend doesn't echo budget, preserve from request
        // Version tracking
        tripId: backendData.plan.summary?.tripId,
        versionNo: backendData.plan.summary?.versionNo,
        usedSavedContext: backendData.plan.summary?.usedSavedContext,
        itinerary: backendData.plan.dayByDayPlan.map((day) => ({
          day: day.day,
          activities: day.activities.map((act, idx) => {
             // Log raw activity data to debug preference matching
             if (idx === 0) {
               console.log('[AIService] Raw backend activity:', {
                 placeName: act.placeName,
                 category: act.category,
                 preferenceMatch: act.explanation?.rankingFactors?.preferenceMatch
               });
             }

             // Logic to avoid generic names like "Kandy"
             const destLower = backendData.plan.destination.toLowerCase().trim();
             const placeLower = act.placeName.toLowerCase().trim();
             
             // If place name is just the destination name (e.g. "Kandy" == "Kandy"), use description
             const shouldUseDescription = placeLower === destLower || placeLower.includes(destLower);
             
             const finalDescription = shouldUseDescription && act.shortDescription 
                ? act.shortDescription 
                : act.placeName;

             return {
                description: finalDescription,
                coordinate: getMockCoordinates(idx), // Inject mock coordinate
                // Map preference-aware data from backend
                category: act.category,
                matchedPreferences: act.explanation?.rankingFactors?.preferenceMatch || [],
                confidenceScore: act.confidenceScore,
                tips: act.explanation?.tips,
             };
          }),
        })),
      };

      return mappedResponse;
    } catch (error) {
      console.error('[AIService] Error in generateTripPlan after retries:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();
export default aiService;
