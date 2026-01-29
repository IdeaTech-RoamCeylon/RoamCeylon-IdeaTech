import AsyncStorage from '@react-native-async-storage/async-storage';
import { TripPlanResponse } from './aiService';

const STORAGE_KEY = 'saved_trips';

export interface SavedTrip {
  id: string;
  name: string;
  tripPlan: TripPlanResponse;
  savedAt: string;
  thumbnail?: string;
}

class TripStorageService {
  /**
   * Get all saved trips
   */
  async getSavedTrips(): Promise<SavedTrip[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading saved trips:', error);
      return [];
    }
  }

  /**
   * Save a new trip
   */
  async saveTrip(name: string, tripPlan: TripPlanResponse): Promise<SavedTrip> {
    try {
      const trips = await this.getSavedTrips();
      const newTrip: SavedTrip = {
        id: Date.now().toString(),
        name,
        tripPlan,
        savedAt: new Date().toISOString(),
      };
      trips.unshift(newTrip); // Add to beginning
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
      return newTrip;
    } catch (error) {
      console.error('Error saving trip:', error);
      throw error;
    }
  }

  /**
   * Delete a saved trip
   */
  async deleteTrip(id: string): Promise<void> {
    try {
      const trips = await this.getSavedTrips();
      const filtered = trips.filter(trip => trip.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting trip:', error);
      throw error;
    }
  }

  /**
   * Get a single trip by ID
   */
  async getTripById(id: string): Promise<SavedTrip | null> {
    try {
      const trips = await this.getSavedTrips();
      return trips.find(trip => trip.id === id) || null;
    } catch (error) {
      console.error('Error getting trip:', error);
      return null;
    }
  }

  /**
   * Update a saved trip
   */
  async updateTrip(id: string, updates: Partial<SavedTrip>): Promise<void> {
    try {
      const trips = await this.getSavedTrips();
      const index = trips.findIndex(trip => trip.id === id);
      if (index !== -1) {
        trips[index] = { ...trips[index], ...updates };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
      }
    } catch (error) {
      console.error('Error updating trip:', error);
      throw error;
    }
  }
}

export const tripStorageService = new TripStorageService();
