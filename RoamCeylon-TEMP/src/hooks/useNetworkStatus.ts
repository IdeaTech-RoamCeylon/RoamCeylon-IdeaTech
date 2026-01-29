import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
  details: any;
}

/**
 * Custom hook for monitoring network status
 * @returns Current network status and connection state
 */
export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: null,
    type: 'unknown',
    details: null,
  });

  useEffect(() => {
    // Fetch initial network state
    const fetchInitialState = async () => {
      const state = await NetInfo.fetch();
      updateNetworkStatus(state);
    };

    fetchInitialState();

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      updateNetworkStatus(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const updateNetworkStatus = (state: NetInfoState) => {
    const newStatus: NetworkStatus = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      details: state.details,
    };

    setNetworkStatus(newStatus);
  };

  return networkStatus;
};
