import AsyncStorage from '@react-native-async-storage/async-storage';
import { TripPlanResponse } from './aiService';
import { plannerApiService } from './plannerApiService';

const STORAGE_KEY = 'saved_trips';

export interface SavedTrip {
  id: string;
  name: string;
  tripPlan: TripPlanResponse;
  savedAt: string;
  thumbnail?: string;
}

export interface TripFeedback {
  tripId?: string;
  isPositive: boolean;
  reasons?: string[]; // e.g., 'Expensive', 'Too busy', 'Bad location'
  timestamp: string;
}

class TripStorageService {
  private useBackend = true; // Try backend first, fallback to local

  /**
   * Get all saved trips (from backend or local storage) with optional pagination
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of items per page
   */
  async getSavedTrips(
    page?: number,
    pageSize?: number
  ): Promise<SavedTrip[] | { data: SavedTrip[]; hasMore: boolean; total: number }> {
    if (this.useBackend) {
      try {
        const trips = await plannerApiService.getSavedTrips();

        // If pagination params provided, paginate the results
        if (page !== undefined && pageSize !== undefined) {
          const total = trips.length;
          const startIndex = (page - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          const paginatedData = trips.slice(startIndex, endIndex);
          const hasMore = endIndex < total;

          return {
            data: paginatedData,
            hasMore,
            total,
          };
        }

        return trips;
      } catch (error) {
        console.warn('Backend unavailable, using local storage:', error);
        this.useBackend = false;
        return this.getLocalTrips(page, pageSize);
      }
    }
    return this.getLocalTrips(page, pageSize);
  }

  /**
   * Save a new trip (to backend or local storage)
   */
  async saveTrip(name: string, tripPlan: TripPlanResponse): Promise<SavedTrip> {
    if (this.useBackend) {
      try {
        const savedTrip = await plannerApiService.saveTrip(name, tripPlan);
        // Also save locally as backup
        await this.saveLocalTrip(savedTrip);
        return savedTrip;
      } catch (error) {
        console.warn('Backend save failed, using local storage:', error);
        this.useBackend = false;
        return this.saveLocalTrip({
          id: Date.now().toString(),
          name,
          tripPlan,
          savedAt: new Date().toISOString(),
        });
      }
    }
    return this.saveLocalTrip({
      id: Date.now().toString(),
      name,
      tripPlan,
      savedAt: new Date().toISOString(),
    });
  }

  /**
   * Delete a saved trip (from backend or local storage)
   */
  async deleteTrip(id: string): Promise<void> {
    if (this.useBackend) {
      try {
        await plannerApiService.deleteTrip(id);
        // Also delete locally
        await this.deleteLocalTrip(id);
      } catch (error) {
        console.warn('Backend delete failed, using local storage:', error);
        this.useBackend = false;
        await this.deleteLocalTrip(id);
      }
    } else {
      await this.deleteLocalTrip(id);
    }
  }

  /**
   * Get a single trip by ID (from backend or local storage)
   */
  async getTripById(id: string): Promise<SavedTrip | null> {
    if (this.useBackend) {
      try {
        return await plannerApiService.getTripById(id);
      } catch (error) {
        console.warn('Backend unavailable, using local storage:', error);
        this.useBackend = false;
        return this.getLocalTripById(id);
      }
    }
    return this.getLocalTripById(id);
  }

  /**
   * Update a saved trip (on backend or local storage)
   */
  async updateTrip(id: string, updates: Partial<SavedTrip>): Promise<void> {
    if (this.useBackend && updates.name && updates.tripPlan) {
      try {
        await plannerApiService.updateTrip(id, updates.name, updates.tripPlan);
        // Also update locally
        await this.updateLocalTrip(id, updates);
      } catch (error) {
        console.warn('Backend update failed, using local storage:', error);
        this.useBackend = false;
        await this.updateLocalTrip(id, updates);
      }
    } else {
      await this.updateLocalTrip(id, updates);
    }
  }

  /**
   * Save trip feedback (currently local only)
   */
  async saveFeedback(feedback: TripFeedback): Promise<void> {
    try {
      const feedbackKey = 'trip_feedback';

      // If we have a backend and the trip ID is a UUID (not a temp ID), send to backend
      // Simple UUID check or just length check (UUID is 36 chars)
      const isBackendId = feedback.tripId && feedback.tripId.length === 36 && !feedback.tripId.startsWith('temp_');

      if (this.useBackend && isBackendId) {
        try {
          await plannerApiService.submitFeedback(feedback.tripId!, {
            rating: feedback.isPositive ? 5 : 1, // Simple mapping for now
            comment: feedback.reasons ? feedback.reasons.join(', ') : undefined,
            categories: {
              isPositive: feedback.isPositive,
              reasons: feedback.reasons || []
            }
          });
          // Also save locally as backup/history
        } catch (error) {
          console.warn('Backend feedback failed, falling back to local:', error);
          // Fallthrough to local save
        }
      }

      const existing = await AsyncStorage.getItem(feedbackKey);
      const feedbacks: TripFeedback[] = existing ? JSON.parse(existing) : [];
      feedbacks.push(feedback);
      await AsyncStorage.setItem(feedbackKey, JSON.stringify(feedbacks));
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
  }

  /**
   * Get the most recent feedback for a specific trip from local storage
   */
  async getFeedbackForTrip(tripId: string): Promise<TripFeedback | null> {
    try {
      const feedbackKey = 'trip_feedback';
      const existing = await AsyncStorage.getItem(feedbackKey);
      if (!existing) return null;

      const feedbacks: TripFeedback[] = JSON.parse(existing);
      // Return the most recent feedback entry for this tripId
      const tripFeedbacks = feedbacks.filter(f => f.tripId === tripId);
      if (tripFeedbacks.length === 0) return null;

      return tripFeedbacks[tripFeedbacks.length - 1];
    } catch (error) {
      console.error('Error loading feedback for trip:', error);
      return null;
    }
  }

  // ===== Local Storage Methods (Fallback) =====

  private async getLocalTrips(
    page?: number,
    pageSize?: number
  ): Promise<SavedTrip[] | { data: SavedTrip[]; hasMore: boolean; total: number }> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) return page !== undefined && pageSize !== undefined ? { data: [], hasMore: false, total: 0 } : [];

      const parsed = JSON.parse(data);

      // Validate that parsed data is an array
      if (!Array.isArray(parsed)) {
        console.error('Stored trips data is not an array, clearing corrupted data');
        await AsyncStorage.removeItem(STORAGE_KEY);
        return page !== undefined && pageSize !== undefined ? { data: [], hasMore: false, total: 0 } : [];
      }

      // Filter out any corrupted trip objects
      const validTrips = parsed.filter(trip =>
        trip &&
        trip.id &&
        trip.name &&
        trip.tripPlan &&
        trip.tripPlan.itinerary &&
        Array.isArray(trip.tripPlan.itinerary)
      );

      // If pagination params provided, paginate the results
      if (page !== undefined && pageSize !== undefined) {
        const total = validTrips.length;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = validTrips.slice(startIndex, endIndex);
        const hasMore = endIndex < total;

        return {
          data: paginatedData,
          hasMore,
          total,
        };
      }

      return validTrips;
    } catch (error) {
      console.error('Error loading local trips:', error);
      // Clear corrupted data
      await AsyncStorage.removeItem(STORAGE_KEY);
      return page !== undefined && pageSize !== undefined ? { data: [], hasMore: false, total: 0 } : [];
    }
  }

  private async saveLocalTrip(trip: SavedTrip): Promise<SavedTrip> {
    try {
      const tripsResult = await this.getLocalTrips();
      const trips = Array.isArray(tripsResult) ? tripsResult : tripsResult.data;
      trips.unshift(trip);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
      return trip;
    } catch (error) {
      console.error('Error saving local trip:', error);
      throw error;
    }
  }

  private async deleteLocalTrip(id: string): Promise<void> {
    try {
      const tripsResult = await this.getLocalTrips();
      const trips = Array.isArray(tripsResult) ? tripsResult : tripsResult.data;
      const filtered = trips.filter(trip => trip.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting local trip:', error);
      throw error;
    }
  }

  private async getLocalTripById(id: string): Promise<SavedTrip | null> {
    try {
      const tripsResult = await this.getLocalTrips();
      const trips = Array.isArray(tripsResult) ? tripsResult : tripsResult.data;
      return trips.find(trip => trip.id === id) || null;
    } catch (error) {
      console.error('Error getting local trip:', error);
      return null;
    }
  }

  private async updateLocalTrip(id: string, updates: Partial<SavedTrip>): Promise<void> {
    try {
      const tripsResult = await this.getLocalTrips();
      const trips = Array.isArray(tripsResult) ? tripsResult : tripsResult.data;
      const index = trips.findIndex(trip => trip.id === id);
      if (index !== -1) {
        trips[index] = { ...trips[index], ...updates };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
      }
    } catch (error) {
      console.error('Error updating local trip:', error);
      throw error;
    }
  }
}

export const tripStorageService = new TripStorageService();
