import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { TripPlanResponse } from '../services/aiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  QUERY: 'planner_query',
  TRIP_PLAN: 'planner_trip_plan',
};

interface PlannerContextProps {
  query: {
    destination: string;
    duration: string;
    budget: string;
  };
  setQuery: React.Dispatch<React.SetStateAction<{
    destination: string;
    duration: string;
    budget: string;
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

        if (storedQuery) {
          setQuery(JSON.parse(storedQuery));
        }
        if (storedTripPlan) {
          setTripPlan(JSON.parse(storedTripPlan));
        }
      } catch (error) {
        console.error('Failed to load planner state:', error);
      }
    };
    loadState();
  }, []);

  // Save query to storage whenever it changes
  useEffect(() => {
    const saveQuery = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.QUERY, JSON.stringify(query));
      } catch (error) {
        console.error('Failed to save query:', error);
      }
    };
    saveQuery();
  }, [query]);

  // Save tripPlan to storage whenever it changes
  useEffect(() => {
    const saveTripPlan = async () => {
      try {
        if (tripPlan) {
          await AsyncStorage.setItem(STORAGE_KEYS.TRIP_PLAN, JSON.stringify(tripPlan));
        } else {
          await AsyncStorage.removeItem(STORAGE_KEYS.TRIP_PLAN);
        }
      } catch (error) {
        console.error('Failed to save trip plan:', error);
      }
    };
    saveTripPlan();
  }, [tripPlan]);

  const clearPlanner = useCallback(async () => {
    try {
      setQuery({ destination: '', duration: '', budget: 'Medium' });
      setTripPlan(null);
      setCurrentTripId(null);
      setIsEditing(false);
      await AsyncStorage.multiRemove([STORAGE_KEYS.QUERY, STORAGE_KEYS.TRIP_PLAN]);
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
