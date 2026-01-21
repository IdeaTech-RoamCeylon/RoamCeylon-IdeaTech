import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
// Lazy load Mapbox to prevent build errors if likely to occur, but usually components importtypes/components directly.
// Assuming @rnmapbox/maps is available as we are in the app.
import MapboxGL from '@rnmapbox/maps';

interface Driver {
  id: string;
  name: string;
  coordinate: [number, number];
  vehicleType: 'TukTuk' | 'Car' | 'Van' | 'Bike';
}

interface DriverMarkerProps {
    driver: Driver;
}

export const DriverMarker = React.memo(({ driver }: DriverMarkerProps) => {
  return (
    <MapboxGL.PointAnnotation
      id={driver.id}
      coordinate={driver.coordinate}
    >
      <View style={styles.markerContainer}>
        <View style={styles.driverMarker}>
          <Text style={styles.driverMarkerIcon}>
            {driver.vehicleType === 'TukTuk' ? '🛺' : 
             driver.vehicleType === 'Van' ? '🚐' : 
             driver.vehicleType === 'Bike' ? '🏍️' : '🚗'}
          </Text>
        </View>
        <View style={styles.driverLabel}>
          <Text style={styles.driverLabelText}>{driver.name}</Text>
        </View>
      </View>
    </MapboxGL.PointAnnotation>
  );
});

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 80,
  },
  driverMarker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 2,
    borderWidth: 2,
    borderColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  driverMarkerIcon: {
    fontSize: 24,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    height: 40,
    width: 40,
    marginTop: 2,
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
});
