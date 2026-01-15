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


  async generateTripPlan(request: TripPlanRequest): Promise<TripPlanResponse> {
    try {
      const response = await retryWithBackoff(
        () => apiService.post<TripPlanResponse>('/ai/trip-plan', request),
        {
          maxAttempts: 3,
          initialDelay: 1000,
        }
      );
      return response;
    } catch (error) {
      console.error('[AIService] Error in generateTripPlan after retries:', error);
      throw error;
    }
  }


}

export const aiService = new AIService();
export default aiService;
