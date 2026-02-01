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

class TripStorageService {
  private useBackend = true; // Try backend first, fallback to local

  /**
   * Get all saved trips (from backend or local storage)
   */
  async getSavedTrips(): Promise<SavedTrip[]> {
    if (this.useBackend) {
      try {
        return await plannerApiService.getSavedTrips();
      } catch (error) {
        console.warn('Backend unavailable, using local storage:', error);
        this.useBackend = false;
        return this.getLocalTrips();
      }
    }
    return this.getLocalTrips();
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

  // ===== Local Storage Methods (Fallback) =====

  private async getLocalTrips(): Promise<SavedTrip[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading local trips:', error);
      return [];
    }
  }

  private async saveLocalTrip(trip: SavedTrip): Promise<SavedTrip> {
    try {
      const trips = await this.getLocalTrips();
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
      const trips = await this.getLocalTrips();
      const filtered = trips.filter(trip => trip.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting local trip:', error);
      throw error;
    }
  }

  private async getLocalTripById(id: string): Promise<SavedTrip | null> {
    try {
      const trips = await this.getLocalTrips();
      return trips.find(trip => trip.id === id) || null;
    } catch (error) {
      console.error('Error getting local trip:', error);
      return null;
    }
  }

  private async updateLocalTrip(id: string, updates: Partial<SavedTrip>): Promise<void> {
    try {
      const trips = await this.getLocalTrips();
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
