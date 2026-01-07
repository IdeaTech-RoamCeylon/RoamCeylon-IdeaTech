import apiService from './api';

export interface TripPlanRequest {
  destination: string;
  duration: string; // e.g., '3 days'
  budget: string; // e.g., 'Medium', 'Low', 'High'
  interests?: string[];
}

export interface TripDay {
  day: number;
  activities: string[];
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
      // const response = await apiService.post<TripPlanResponse>('/ai/trip-plan', request);
      // return response;

      // Mock implementation
      console.log('Generating trip plan for:', request);
      await new Promise(resolve => setTimeout(resolve, AIService.MOCK_DELAY));

      return this.getMockTripPlan(request);
    } catch (error) {
      console.error('Error in generateTripPlan:', error);
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
          `Morning visit to key attraction in ${destination}`,
          `Lunch at a local ${budget} budget restaurant`,
          'Afternoon sightseeing and cultural experience',
          'Evening relaxation and dinner',
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
