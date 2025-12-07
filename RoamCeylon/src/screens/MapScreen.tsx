import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MAPBOX_CONFIG } from '../config/mapbox.config';

// Lazy load Mapbox to prevent build errors
let MapboxGL: any = null;

try {
  MapboxGL = require('@rnmapbox/maps').default;
  if (MAPBOX_CONFIG.accessToken) {
    MapboxGL.setAccessToken(MAPBOX_CONFIG.accessToken);
  }
} catch (error) {
  console.warn('Mapbox SDK not available:', error);
}

const MapScreen = () => {
  const [isMapboxConfigured, setIsMapboxConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if Mapbox is properly configured
    const checkMapboxSetup = async () => {
      try {
        console.log('=== Mapbox Configuration Debug ===');
        console.log('MapboxGL available:', !!MapboxGL);
        console.log('Access Token:', MAPBOX_CONFIG.accessToken);
        console.log('Token length:', MAPBOX_CONFIG.accessToken?.length);
        console.log('Token starts with pk:', MAPBOX_CONFIG.accessToken?.startsWith('pk.'));
        
        if (MapboxGL && MAPBOX_CONFIG.accessToken && MAPBOX_CONFIG.accessToken.startsWith('pk.')) {
          console.log('✅ Mapbox is configured');
          setIsMapboxConfigured(true);
        } else {
          console.log('❌ Mapbox is NOT configured');
          setIsMapboxConfigured(false);
        }
      } catch (error) {
        console.error('Error checking Mapbox setup:', error);
        setIsMapboxConfigured(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkMapboxSetup();
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
  if (!isMapboxConfigured) {
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
        
        {/* Default marker at Sri Lanka center */}
        <MapboxGL.PointAnnotation
          id="sri-lanka-center"
          coordinate={[
            MAPBOX_CONFIG.defaultCenter.longitude,
            MAPBOX_CONFIG.defaultCenter.latitude,
          ]}
        >
          <View style={styles.markerContainer}>
            <Text style={styles.markerText}>📍</Text>
          </View>
        </MapboxGL.PointAnnotation>
      </MapboxGL.MapView>

      {/* Map overlay info */}
      <View style={styles.overlay}>
        <Text style={styles.overlayTitle}>Sri Lanka</Text>
        <Text style={styles.overlaySubtitle}>Explore the Island</Text>
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
  },
  markerText: {
    fontSize: 30,
  },
});

export default MapScreen;
