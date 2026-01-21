import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { MAPBOX_CONFIG } from '../../config/mapbox.config';
import * as Location from 'expo-location';
import { MOCK_DRIVERS } from '../../data/mockDrivers';
import Toast from 'react-native-toast-message';
import { useMapContext } from '../../context/MapContext';
import { retryWithBackoff } from '../../utils/networkUtils';

import { DriverMarker } from '../../components/DriverMarker';

// Lazy load Mapbox to prevent build errors
let MapboxGL: any = null;

try {
  MapboxGL = require('@rnmapbox/maps').default;
  if (MAPBOX_CONFIG.accessToken) {
    MapboxGL.setAccessToken(MAPBOX_CONFIG.accessToken);
  }
} catch (error) {
  // Mapbox SDK not available
}

const MapScreen = () => {
  const { 
    userLocation, setUserLocation, 
    drivers, setDrivers,
    isMapboxConfigured, setIsMapboxConfigured 
  } = useMapContext();
  const [isLoading, setIsLoading] = useState(true); // Initial Map Load
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  type TransportStatus = 'IDLE' | 'SEARCHING' | 'FOUND' | 'NO_DRIVERS' | 'ERROR';
  const [transportStatus, setTransportStatus] = useState<TransportStatus>('IDLE');

  // ... imports

  const driverMarkers = useMemo(() => {
    if (!drivers || !MapboxGL) return [];
    return drivers.map((driver) => (
      <DriverMarker key={driver.id} driver={driver} />
    ));
  }, [drivers]);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchDrivers = useCallback(async () => {
    if (!isMounted.current) return;
    setTransportStatus('SEARCHING');
    
    try {
      const result = await retryWithBackoff(
        async () => {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Randomly simulate "No Drivers" for demonstration (10% chance)
          const randomChance = Math.random();
          if (randomChance > 0.9) {
            return [];
          }
          
          return MOCK_DRIVERS;
        },
        {
          maxAttempts: 3,
          initialDelay: 1000,
        }
      );
      
      if (isMounted.current) {
        if (result.length === 0) {
          setDrivers([]);
          setTransportStatus('NO_DRIVERS');
        } else {
          setDrivers(result);
          setTransportStatus('FOUND');
        }
      }
    } catch (e) {
      console.error('[MapScreen] Driver fetch failed after retries:', e);
      if (isMounted.current) {
        setTransportStatus('ERROR');
      }
    }
  }, [setDrivers]);

  useEffect(() => {
    // Check if Mapbox is properly configured
    const checkMapboxSetup = async () => {
      try {
        if (MapboxGL && MAPBOX_CONFIG.accessToken && MAPBOX_CONFIG.accessToken.startsWith('pk.')) {
          if (isMounted.current) setIsMapboxConfigured(true);
        } else {
          if (isMounted.current) setIsMapboxConfigured(false);
        }
      } catch (error) {
        if (isMounted.current) setIsMapboxConfigured(false);
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    };

    const getLocationPermission = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted.current) setErrorMsg('Permission to access location was denied');
          Toast.show({
            type: 'error',
            text1: 'Location Permission Denied',
            text2: 'Please enable location permissions to use the map.',
          });
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        if (isMounted.current) setUserLocation(location);
      } catch (error) {
        // Handle error silently or log
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    };

    const initMap = async () => {
      // If data already exists in context, skip loading
      if (userLocation && drivers.length > 0 && isMapboxConfigured) {
        if (isMounted.current) {
          setIsLoading(false);
          setTransportStatus('FOUND');
        }
        return;
      }

      await checkMapboxSetup();
      if (isMounted.current) await getLocationPermission();
      
      if (isMounted.current) setIsLoading(false); // Map loaded, start searching drivers
      
      // Initialize mock drivers if not already set
      if (drivers.length === 0 && isMounted.current) {
        fetchDrivers();
      }
    };

    initMap();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading Map...</Text>
      </View>
    );
  }

  // Render placeholder if Mapbox is not configured
  if (!isLoading && !isMapboxConfigured) {
    return (
      <View style={styles.placeholderContainer}>
        <View style={styles.placeholderContent}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <Text style={styles.placeholderTitle}>Map Feature</Text>
          <Text style={styles.placeholderSubtitle}>Coming Soon</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              The interactive map feature is currently being configured.
            </Text>
            <Text style={styles.infoTextSmall}>
              To enable maps, add your Mapbox access token to the .env file.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Render actual Mapbox map
  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL={MAPBOX_CONFIG.defaultStyle}
        logoEnabled={false}
        compassEnabled={true}
        compassViewPosition={MAPBOX_CONFIG.settings.compassViewPosition}
        compassViewMargins={MAPBOX_CONFIG.settings.compassViewMargins}
        attributionEnabled={true}
        attributionPosition={MAPBOX_CONFIG.settings.attributionButtonPosition}
      >
        <MapboxGL.Camera
          zoomLevel={MAPBOX_CONFIG.defaultZoom}
          centerCoordinate={[
            MAPBOX_CONFIG.defaultCenter.longitude,
            MAPBOX_CONFIG.defaultCenter.latitude,
          ]}
          animationMode="flyTo"
          animationDuration={2000}
        />
        
        {/* User Location */}
        <MapboxGL.UserLocation visible={true} showsUserHeadingIndicator={true} />

        {/* Mock Drivers */}
        {driverMarkers}

        {/* Default marker at Sri Lanka center (Optional, removed for cleaner map) */}
        {/* <MapboxGL.PointAnnotation
          id="sri-lanka-center"
          coordinate={[
            MAPBOX_CONFIG.defaultCenter.longitude,
            MAPBOX_CONFIG.defaultCenter.latitude,
          ]}
        >
          <View style={styles.markerContainer}>
            <Text style={styles.markerText}>📍</Text>
          </View>
        </MapboxGL.PointAnnotation> */}
      </MapboxGL.MapView>

      {/* Map overlay info */}
      <View style={styles.overlay}>
        {transportStatus === 'SEARCHING' && (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color="#0066CC" />
            <Text style={styles.statusText}> Looking for nearby drivers...</Text>
          </View>
        )}

        {transportStatus === 'FOUND' && (
           <View>
            <Text style={styles.overlayTitle}>Sri Lanka</Text>
            <Text style={styles.overlaySubtitle}>{drivers.length} Drivers Active</Text>
           </View>
        )}

        {transportStatus === 'NO_DRIVERS' && (
           <View style={styles.statusCenter}>
            <Text style={styles.errorText}>No drivers found nearby.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchDrivers}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
           </View>
        )}

        {transportStatus === 'ERROR' && (
           <View style={styles.statusCenter}>
            <Text style={styles.errorText}>Connection Error.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchDrivers}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
           </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  // Placeholder styles
  placeholderContainer: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderContent: {
    alignItems: 'center',
    maxWidth: 400,
  },
  mapIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  placeholderTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  placeholderSubtitle: {
    fontSize: 18,
    color: '#0066CC',
    marginBottom: 30,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 24,
  },
  infoTextSmall: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Map overlay styles
  overlay: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  overlayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  overlaySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  // Marker styles
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100, // Explicit width for container
    height: 80, // Explicit height for container
  },
  markerText: {
    fontSize: 30,
  },
  driverMarker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 2,
    borderWidth: 2,
    borderColor: '#0066CC',
    // Removed elevation/shadows to debug visibility
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  driverMarkerIcon: {
    fontSize: 24,
    textAlign: 'center',
    textAlignVertical: 'center', // Android specific
    includeFontPadding: false, // Android specific
    height: 40,
    width: 40,
    marginTop: 2, // Slight adjustment for emoji centering
  },
  driverLabel: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 4,
  },
  driverLabelText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  // Status Card Styles
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 10,
    color: '#0066CC',
    fontWeight: '600',
  },
  statusCenter: {
    alignItems: 'center',
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 8,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default MapScreen;
