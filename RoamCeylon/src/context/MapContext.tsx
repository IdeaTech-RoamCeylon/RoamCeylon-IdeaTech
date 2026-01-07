import React, { createContext, useContext, useState, ReactNode } from 'react';
import * as Location from 'expo-location';
import { Driver } from '../data/mockDrivers';

interface MapContextProps {
  userLocation: Location.LocationObject | null;
  setUserLocation: React.Dispatch<React.SetStateAction<Location.LocationObject | null>>;
  drivers: Driver[];
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
  isMapboxConfigured: boolean;
  setIsMapboxConfigured: React.Dispatch<React.SetStateAction<boolean>>;
}

const MapContext = createContext<MapContextProps | undefined>(undefined);

export const MapProvider = ({ children }: { children: ReactNode }) => {
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isMapboxConfigured, setIsMapboxConfigured] = useState(false);

  return (
    <MapContext.Provider value={{
      userLocation,
      setUserLocation,
      drivers,
      setDrivers,
      isMapboxConfigured,
      setIsMapboxConfigured
    }}>
      {children}
    </MapContext.Provider>
  );
};

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
};
