import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MAPBOX_CONFIG } from '../../config/mapbox.config';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { useMapContext } from '../../context/MapContext';

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

type MapScreenProps = {
  pickupCoordinate?: [number, number];
  destinationCoordinate?: [number, number];
};

const MapScreen = ({ pickupCoordinate, destinationCoordinate }: MapScreenProps) => {
  const { 
    userLocation, setUserLocation, 
    isMapboxConfigured, setIsMapboxConfigured 
  } = useMapContext();
  const [isLoading, setIsLoading] = useState(true); // Initial Map Load
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const userCoordinate = userLocation?.coords
    ? [userLocation.coords.longitude, userLocation.coords.latitude]
    : null;

  const hasPickup = Boolean(pickupCoordinate);
  const hasDestination = Boolean(destinationCoordinate);
  const hasBoth = hasPickup && hasDestination;

  const routeFeature = useMemo(() => {
    if (!pickupCoordinate || !destinationCoordinate) return null;
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [pickupCoordinate, destinationCoordinate],
          },
        },
      ],
    };
  }, [pickupCoordinate, destinationCoordinate]);

  const mapCenterCoordinate =
    pickupCoordinate ?? destinationCoordinate ?? userCoordinate ?? [
      MAPBOX_CONFIG.defaultCenter.longitude,
      MAPBOX_CONFIG.defaultCenter.latitude,
    ];

  const cameraPadding = {
    paddingTop: 0,
    paddingBottom: 260,
    paddingLeft: 40,
    paddingRight: 40,
  };

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

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
      await checkMapboxSetup();
      if (isMounted.current) await getLocationPermission();
      
      if (isMounted.current) setIsLoading(false); // Map loaded, start searching drivers
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
          {...(hasBoth
            ? {
                bounds: {
                  ne: [
                    Math.max(pickupCoordinate![0], destinationCoordinate![0]),
                    Math.max(pickupCoordinate![1], destinationCoordinate![1]),
                  ],
                  sw: [
                    Math.min(pickupCoordinate![0], destinationCoordinate![0]),
                    Math.min(pickupCoordinate![1], destinationCoordinate![1]),
                  ],
                  ...cameraPadding,
                },
              }
            : {
                zoomLevel: hasPickup || hasDestination ? 14 : userCoordinate ? 14 : MAPBOX_CONFIG.defaultZoom,
                centerCoordinate: mapCenterCoordinate,
                padding: cameraPadding,
              })}
          animationMode="flyTo"
          animationDuration={2000}
        />
        
        {/* User Location */}
        <MapboxGL.UserLocation visible={true} showsUserHeadingIndicator={true} />

        {pickupCoordinate && (
          <MapboxGL.PointAnnotation id="pickup-location" coordinate={pickupCoordinate}>
            <View style={styles.markerWrapper}>
              <View style={styles.pickupMarker} />
              <View style={styles.markerLabel}>
                <Text style={styles.markerLabelText}>Pickup</Text>
              </View>
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {destinationCoordinate && (
          <MapboxGL.PointAnnotation id="destination-location" coordinate={destinationCoordinate}>
            <View style={styles.markerWrapper}>
              <View style={styles.destinationMarker} />
              <View style={styles.markerLabel}>
                <Text style={styles.markerLabelText}>Destination</Text>
              </View>
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {routeFeature && (
          <MapboxGL.ShapeSource id="routeSource" shape={routeFeature}>
            <MapboxGL.LineLayer
              id="routeLine"
              style={{
                lineColor: '#111',
                lineWidth: 4,
                lineCap: 'round',
                lineJoin: 'round',
                lineOpacity: 0.8,
              }}
            />
          </MapboxGL.ShapeSource>
        )}

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
  pickupMarker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1a73e8',
    borderWidth: 3,
    borderColor: '#000000',
  },
  destinationMarker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ef6c00',
    borderWidth: 3,
    borderColor: '#070000',
  },
  markerWrapper: {
    alignItems: 'center',
  },
  markerLabel: {
    marginTop: 6,
    backgroundColor: '#111',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  markerLabelText: {
    fontSize: 10,
    color: '#111',
    fontWeight: '600',
  },
});

export default MapScreen;
