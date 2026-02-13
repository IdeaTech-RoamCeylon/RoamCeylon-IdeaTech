import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { TripPlanResponse } from '../services/aiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  QUERY: 'planner_query',
  TRIP_PLAN: 'planner_trip_plan',
  CURRENT_TRIP_ID: 'planner_current_trip_id',
  IS_EDITING: 'planner_is_editing',
};

interface PlannerContextProps {
  query: {
    destination: string;
    duration: string;
    budget: string;
    interests: string[];
    pace: string;
  };
  setQuery: React.Dispatch<React.SetStateAction<{
    destination: string;
    duration: string;
    budget: string;
    interests: string[];
    pace: string;
  }>>;
  tripPlan: TripPlanResponse | null;
  setTripPlan: React.Dispatch<React.SetStateAction<TripPlanResponse | null>>;
  clearPlanner: () => void;
  currentTripId: string | null;
  setCurrentTripId: React.Dispatch<React.SetStateAction<string | null>>;
  isEditing: boolean;
  startEditing: (tripId: string) => void;
  stopEditing: () => void;
}

const PlannerContext = createContext<PlannerContextProps | undefined>(undefined);

export const PlannerProvider = ({ children }: { children: ReactNode }) => {
  const [query, setQuery] = useState({
    destination: '',
    duration: '',
    budget: 'Medium',
    interests: [] as string[],
    pace: 'Moderate',
  });
  const [tripPlan, setTripPlan] = useState<TripPlanResponse | null>(null);
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Load state from storage on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const storedQuery = await AsyncStorage.getItem(STORAGE_KEYS.QUERY);
        const storedTripPlan = await AsyncStorage.getItem(STORAGE_KEYS.TRIP_PLAN);
        const storedCurrentTripId = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_TRIP_ID);
        const storedIsEditing = await AsyncStorage.getItem(STORAGE_KEYS.IS_EDITING);

        if (storedQuery) {
          try {
            const parsedQuery = JSON.parse(storedQuery);
            // Validate query structure
            if (parsedQuery && typeof parsedQuery === 'object') {
              setQuery(parsedQuery);
            }
          } catch (e) {
            console.error('Failed to parse stored query:', e);
            await AsyncStorage.removeItem(STORAGE_KEYS.QUERY);
          }
        }
        if (storedTripPlan) {
          try {
            const parsedPlan = JSON.parse(storedTripPlan);
            // Validate trip plan structure
            if (parsedPlan && parsedPlan.itinerary && Array.isArray(parsedPlan.itinerary)) {
              setTripPlan(parsedPlan);
            }
          } catch (e) {
            console.error('Failed to parse stored trip plan:', e);
            await AsyncStorage.removeItem(STORAGE_KEYS.TRIP_PLAN);
          }
        }
        if (storedCurrentTripId) {
          setCurrentTripId(storedCurrentTripId);
        }
        if (storedIsEditing) {
          try {
            setIsEditing(JSON.parse(storedIsEditing));
          } catch (e) {
            console.error('Failed to parse isEditing flag:', e);
            await AsyncStorage.removeItem(STORAGE_KEYS.IS_EDITING);
          }
        }
      } catch (error) {
        console.error('Failed to load planner state:', error);
        // Clear corrupted data
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.QUERY,
          STORAGE_KEYS.TRIP_PLAN,
          STORAGE_KEYS.CURRENT_TRIP_ID,
          STORAGE_KEYS.IS_EDITING
        ]);
      }
    };
    loadState();
  }, []);

  // Debounce query saves to prevent excessive AsyncStorage writes
  // Wait 500ms after last change before saving
  useEffect(() => {
    const saveTimer = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.QUERY, JSON.stringify(query));
      } catch (error) {
        console.error('Failed to save query:', error);
      }
    }, 500); // 500ms debounce delay

    return () => clearTimeout(saveTimer);
  }, [query]);

  // Debounce tripPlan saves to prevent blocking UI during drag-and-drop updates
  useEffect(() => {
    const saveTripPlan = setTimeout(async () => {
      try {
        if (tripPlan) {
          await AsyncStorage.setItem(STORAGE_KEYS.TRIP_PLAN, JSON.stringify(tripPlan));
        } else {
          await AsyncStorage.removeItem(STORAGE_KEYS.TRIP_PLAN);
        }
      } catch (error) {
        console.error('Failed to save trip plan:', error);
      }
    }, 500);

    return () => clearTimeout(saveTripPlan);
  }, [tripPlan]);

  // Save currentTripId and isEditing to storage whenever they change
  useEffect(() => {
    const saveEditingState = async () => {
      try {
        if (currentTripId) {
          await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_TRIP_ID, currentTripId);
        } else {
          await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_TRIP_ID);
        }
        await AsyncStorage.setItem(STORAGE_KEYS.IS_EDITING, JSON.stringify(isEditing));
      } catch (error) {
        console.error('Failed to save editing state:', error);
      }
    };
    saveEditingState();
  }, [currentTripId, isEditing]);

  const clearPlanner = useCallback(async () => {
    try {
      setQuery({ destination: '', duration: '', budget: 'Medium', interests: [], pace: 'Moderate' });
      setTripPlan(null);
      setCurrentTripId(null);
      setIsEditing(false);
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.QUERY, 
        STORAGE_KEYS.TRIP_PLAN,
        STORAGE_KEYS.CURRENT_TRIP_ID,
        STORAGE_KEYS.IS_EDITING
      ]);
    } catch (error) {
      console.error('Failed to clear planner storage:', error);
    }
  }, []);

  const startEditing = useCallback((tripId: string) => {
    setCurrentTripId(tripId);
    setIsEditing(true);
  }, []);

  const stopEditing = useCallback(() => {
    setCurrentTripId(null);
    setIsEditing(false);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({ 
      query, 
      setQuery, 
      tripPlan, 
      setTripPlan, 
      clearPlanner,
      currentTripId,
      setCurrentTripId,
      isEditing,
      startEditing,
      stopEditing,
    }),
    [query, tripPlan, clearPlanner, currentTripId, isEditing, startEditing, stopEditing]
  );

  return (
    <PlannerContext.Provider value={contextValue}>
      {children}
    </PlannerContext.Provider>
  );
};

export const usePlannerContext = () => {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error('usePlannerContext must be used within a PlannerProvider');
  }
  return context;
};
