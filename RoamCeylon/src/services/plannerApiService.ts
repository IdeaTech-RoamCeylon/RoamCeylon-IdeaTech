import { apiService } from './api';
import { TripPlanResponse } from './aiService';

// Backend API types
export interface BackendSavedTrip {
  id: string; // Changed from number to string
  userId: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  itinerary: any;
  createdAt: string;
  updatedAt: string;
}

export interface SaveTripRequest {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  itinerary: TripPlanResponse;
}

// Frontend types (for compatibility with existing UI)
export interface SavedTrip {
  id: string;
  name: string;
  tripPlan: TripPlanResponse;
  savedAt: string;
  thumbnail?: string;
}

/**
 * Planner API Service
 * Connects to backend endpoints for saving and retrieving trip plans
 */

// Simple cache implementation
let tripsCache: SavedTrip[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 minute

export const plannerApiService = {
  /**
   * Save a new trip to the backend
   */
  async saveTrip(name: string, tripPlan: TripPlanResponse): Promise<SavedTrip> {
    try {
      // Calculate start and end dates from duration
      const startDate = new Date();
      const duration = parseInt(tripPlan.duration) || 1;
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + duration);

      const request: SaveTripRequest = {
        name,
        destination: tripPlan.destination,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        itinerary: tripPlan,
      };

      const response = await apiService.post<{ data: BackendSavedTrip }>('/planner/save', request);
      
      // Invalidate cache on mutation
      tripsCache = null;
      
      // Transform backend response to frontend format
      return this.transformBackendTrip(response.data);
    } catch (error) {
      console.error('Error saving trip to backend:', error);
      throw error;
    }
  },

  /**
   * Get all saved trips from the backend (with caching)
   */
  async getSavedTrips(): Promise<SavedTrip[]> {
    try {
      // Return cached data if still valid
      const now = Date.now();
      if (tripsCache && (now - cacheTimestamp) < CACHE_DURATION) {
        return tripsCache;
      }

      const response = await apiService.get<{ data: BackendSavedTrip[] }>('/planner/history');
      
      // Transform and cache the response
      tripsCache = response.data.map(trip => this.transformBackendTrip(trip));
      cacheTimestamp = now;
      
      return tripsCache;
    } catch (error) {
      console.error('Error loading trips from backend:', error);
      throw error;
    }
  },

  /**
   * Update an existing trip
   */
  async updateTrip(id: string, name: string, tripPlan: TripPlanResponse): Promise<SavedTrip> {
    try {
      const startDate = new Date();
      const duration = parseInt(tripPlan.duration) || 1;
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + duration);

      const request: SaveTripRequest = {
        name,
        destination: tripPlan.destination,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        itinerary: tripPlan,
      };

      const response = await apiService.put<{ data: BackendSavedTrip }>(`/planner/${id}`, request);
      
      // Invalidate cache on mutation
      tripsCache = null;
      
      return this.transformBackendTrip(response.data);
    } catch (error) {
      console.error('Error updating trip on backend:', error);
      throw error;
    }
  },

  /**
   * Delete a trip
   */
  async deleteTrip(id: string): Promise<void> {
    try {
      await apiService.delete(`/planner/${id}`);
      
      // Invalidate cache on mutation
      tripsCache = null;
    } catch (error) {
      console.error('Error deleting trip from backend:', error);
      throw error;
    }
  },

  async submitFeedback(tripId: string, feedbackValue: any): Promise<void> {
    try {
      await apiService.post('/planner/feedback', {
        tripId,
        feedbackValue,
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  },

  /**
   * Get a single trip by ID
   */
  async getTripById(id: string): Promise<SavedTrip | null> {
    try {
      const trips = await this.getSavedTrips();
      return trips.find(trip => trip.id === id) || null;
    } catch (error) {
      console.error('Error getting trip by ID:', error);
      return null;
    }
  },

  /**
   * Manually invalidate cache (useful for force refresh)
   */
  invalidateCache() {
    tripsCache = null;
    cacheTimestamp = 0;
  },

  /**
   * Transform backend trip format to frontend format
   */
  transformBackendTrip(backendTrip: BackendSavedTrip): SavedTrip {
    return {
      id: backendTrip.id.toString(),
      name: backendTrip.name,
      tripPlan: backendTrip.itinerary as TripPlanResponse,
      savedAt: backendTrip.createdAt,
    };
  },
};
