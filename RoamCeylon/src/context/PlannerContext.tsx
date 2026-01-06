import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TripPlanResponse } from '../services/aiService';

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
}

const PlannerContext = createContext<PlannerContextProps | undefined>(undefined);

export const PlannerProvider = ({ children }: { children: ReactNode }) => {
  const [query, setQuery] = useState({
    destination: '',
    duration: '',
    budget: 'Medium',
  });
  const [tripPlan, setTripPlan] = useState<TripPlanResponse | null>(null);

  const clearPlanner = () => {
    setQuery({ destination: '', duration: '', budget: 'Medium' });
    setTripPlan(null);
  };

  return (
    <PlannerContext.Provider value={{ query, setQuery, tripPlan, setTripPlan, clearPlanner }}>
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
