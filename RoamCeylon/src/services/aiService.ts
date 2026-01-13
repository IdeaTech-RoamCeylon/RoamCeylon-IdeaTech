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

class AIService {
  private static MOCK_DELAY = 1500; // ms

  async generateTripPlan(request: TripPlanRequest): Promise<TripPlanResponse> {
    try {
      // TODO: Uncomment when backend endpoint is ready
      // const response = await retryWithBackoff(
      //   () => apiService.post<TripPlanResponse>('/ai/trip-plan', request),
      //   {
      //     maxAttempts: 3,
      //     initialDelay: 1000,
      //   }
      // );
      // return response;

      // Mock implementation with retry logic
      const result = await retryWithBackoff(
        async () => {
          await new Promise(resolve => setTimeout(resolve, AIService.MOCK_DELAY));
          return this.getMockTripPlan(request);
        },
        {
          maxAttempts: 3,
          initialDelay: 1000,
        }
      );

      return result;
    } catch (error) {
      console.error('[AIService] Error in generateTripPlan after retries:', error);
      throw error;
    }
  }

  private getMockTripPlan(request: TripPlanRequest): TripPlanResponse {
    const { destination, duration, budget } = request;
    const days = parseInt(duration) || 3;
    const itinerary: TripDay[] = [];

    for (let i = 1; i <= days; i++) {
      itinerary.push({
        day: i,
        activities: [
          { description: `Morning visit to key attraction in ${destination}` },
          { description: `Lunch at a local ${budget} budget restaurant` },
          { description: 'Afternoon sightseeing and cultural experience' },
          { description: 'Evening relaxation and dinner' },
        ],
      });
    }

    return {
      destination,
      duration,
      budget,
      itinerary,
    };
  }
}

export const aiService = new AIService();
export default aiService;
