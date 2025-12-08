import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapScreen from './MapScreen';

const TransportScreen = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Transport</Text>
        <Text style={styles.subtitle}>Book rides and plan your journey</Text>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapScreen />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  mapContainer: {
    flex: 1,
  },
});

export default TransportScreen;

