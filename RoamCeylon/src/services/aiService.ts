import apiService from './api';
import { retryWithBackoff } from '../utils/networkUtils';

export interface TripPlanRequest {
  destination: string;
  duration: string; // e.g., '3 days'
  budget: string; // e.g., 'Medium', 'Low', 'High'
  interests?: string[];
}

export interface TripActivity {
  description: string;
  coordinate?: [number, number]; // [longitude, latitude]
  dayNumber?: number;
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
}

  // Backend response interfaces
interface BackendActivity {
  placeName: string;
  shortDescription: string;
  // coordinate is missing in backend
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
        ...request,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      };

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
        itinerary: backendData.plan.dayByDayPlan.map((day) => ({
          day: day.day,
          activities: day.activities.map((act, idx) => {
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
