import { apiService } from './api';
import { RideStatus } from '../components/RideTimeline';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RIDE_STORAGE_KEY = 'active_ride_session';

interface PersistedRideSession {
  startTime: number;
  rideId: string;
}

export interface DriverInfo {
  name: string;
  rating: number;
  vehicle: string;
  phone: string;
  photo?: string;
}

export interface ActiveRideResponse {
  id: string;
  status: RideStatus;
  estimatedArrival: number | null;
  driver: DriverInfo;
  pickup: string;
  destination: string;
  fare: string;
}

export const transportService = {
  /**
   * Fetches the current active ride status from the backend.
   */
  getActiveRide: async (): Promise<ActiveRideResponse | null> => {
    try {
      // Try to fetch from backend first
      const response = await apiService.get<any>('/transport/active-ride').catch(() => null);
      
      if (response) {
        if (response.success) return response.data;
        return response;
      }

      // Fallback to local persistent simulation
      try {
        const sessionData = await AsyncStorage.getItem(RIDE_STORAGE_KEY);
        let startTime: number;
        let rideId: string;

        if (sessionData) {
          const session = JSON.parse(sessionData) as PersistedRideSession;
          startTime = session.startTime;
          rideId = session.rideId;
        } else {
          // Initialize new session if none exists (for demo purposes, auto-start on first load)
          // In a real app, this would happen on "Request Ride"
          startTime = Date.now();
          rideId = 'local-ride-' + startTime;
          await AsyncStorage.setItem(RIDE_STORAGE_KEY, JSON.stringify({ startTime, rideId }));
        }

        // Calculate elapsed time
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        
        // Define ride duration phases (total 120s)
        const TOTAL_DURATION = 120;
        const currentCycleTime = elapsedSeconds % TOTAL_DURATION; // Loop for demo
        
        // OR: specific one-time flow
        // const currentCycleTime = elapsedSeconds;

        let status: RideStatus;
        let eta: number | null = null;
        const driverName = 'Rajesh Kumar';
        const driverPhone = '+94771234567';

        if (currentCycleTime < 20) status = 'requested';
        else if (currentCycleTime < 40) status = 'assigned';
        else if (currentCycleTime < 70) {
          status = 'enroute';
          eta = Math.ceil((70 - currentCycleTime) / 10) + 1;
        }
        else if (currentCycleTime < 90) status = 'arrived';
        else if (currentCycleTime < 110) status = 'inprogress';
        else status = 'completed';

        return {
          id: rideId,
          status,
          estimatedArrival: eta,
          driver: {
            name: driverName,
            rating: 4.8,
            vehicle: 'Toyota Prius (CAB-1234)',
            phone: driverPhone,
          },
          pickup: 'Galle Face Hotel, Colombo',
          destination: 'Bandaranaike International Airport',
          fare: 'LKR 2,500',
        };

      } catch (e) {
        console.error('Error reading ride session:', e);
        return null;
      }
    } catch (error) {
      console.error('Error fetching active ride:', error);
      return null;
    }
  },

  /**
   * Resets the local demo session (useful for "Plan Another Trip" or "Cancel Ride")
   */
  resetSession: async () => {
    try {
      await AsyncStorage.removeItem(RIDE_STORAGE_KEY);
    } catch (e) {
      console.error('Error resetting ride session:', e);
    }
  },
};
