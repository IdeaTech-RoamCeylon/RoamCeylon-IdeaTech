import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MapScreen from './MapScreen';

const TransportScreen = () => {
  const navigation = useNavigation();
  const [pickup, setPickup] = useState('Current location');
  const [destination, setDestination] = useState('');
  const [selectedRide, setSelectedRide] = useState<'Standard' | 'Comfort' | 'Van'>('Standard');

  const fareEstimate = useMemo(() => {
    if (!destination.trim()) return '—';
    const base = selectedRide === 'Van' ? 1800 : selectedRide === 'Comfort' ? 1400 : 1000;
    return `LKR ${base.toLocaleString()}`;
  }, [destination, selectedRide]);

  return (
    <View style={styles.container}>
      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapScreen />
      </View>

      {/* Ride Sheet */}
      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Where to?</Text>
              <Text style={styles.subtitle}>Book rides and plan your journey</Text>
            </View>
            <TouchableOpacity
              style={styles.statusButton}
              onPress={() => navigation.navigate('TransportStatus' as never)}
            >
              <Text style={styles.statusButtonText}>Active Ride</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputCard}>
          <View style={styles.inputRow}>
            <View style={styles.bullet}>
              <View style={styles.bulletInnerPickup} />
            </View>
            <View style={styles.inputColumn}>
              <Text style={styles.inputLabel}>Pickup</Text>
              <TextInput
                style={styles.input}
                value={pickup}
                onChangeText={setPickup}
                placeholder="Enter pickup"
                placeholderTextColor="#9aa0a6"
              />
            </View>
          </View>

          <View style={styles.connector} />

          <View style={styles.inputRow}>
            <View style={styles.bullet}>
              <View style={styles.bulletInnerDrop} />
            </View>
            <View style={styles.inputColumn}>
              <Text style={styles.inputLabel}>Destination</Text>
              <TextInput
                style={styles.input}
                value={destination}
                onChangeText={setDestination}
                placeholder="Where are you going?"
                placeholderTextColor="#9aa0a6"
              />
            </View>
          </View>
        </View>

        <View style={styles.fareCard}>
          <View>
            <Text style={styles.fareLabel}>Estimated fare</Text>
            <Text style={styles.fareValue}>{fareEstimate}</Text>
          </View>
          <View style={styles.etaPill}>
            <Text style={styles.etaText}>ETA 5-8 min</Text>
          </View>
        </View>

        <View style={styles.rideOptions}>
          {(['Standard', 'Comfort', 'Van'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.rideOption,
                selectedRide === type && styles.rideOptionSelected,
              ]}
              onPress={() => setSelectedRide(type)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.rideType,
                  selectedRide === type && styles.rideTypeSelected,
                ]}
              >
                {type}
              </Text>
              <Text
                style={[
                  styles.rideSub,
                  selectedRide === type && styles.rideSubSelected,
                ]}
              >
                {type === 'Van' ? '6 seats' : type === 'Comfort' ? 'Extra legroom' : 'Everyday rides'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.scheduleButton} activeOpacity={0.8}>
            <Text style={styles.scheduleButtonText}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.requestButton} activeOpacity={0.8}>
            <Text style={styles.requestButtonText}>Request Ride</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0b',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },
  subtitle: {
    fontSize: 12,
    color: '#5f6368',
    marginTop: 4,
  },
  mapContainer: {
    flex: 1,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  sheetHeader: {
    marginBottom: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#e0e0e0',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusButton: {
    backgroundColor: '#111',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  inputCard: {
    backgroundColor: '#f6f7f9',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  inputColumn: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    color: '#7a7f87',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111',
  },
  bullet: {
    width: 20,
    alignItems: 'center',
    marginRight: 10,
    paddingTop: 16,
  },
  bulletInnerPickup: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1a73e8',
  },
  bulletInnerDrop: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef6c00',
  },
  connector: {
    height: 16,
    borderLeftWidth: 2,
    borderLeftColor: '#d3d7dd',
    marginLeft: 9,
    marginVertical: 8,
  },
  fareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  fareLabel: {
    color: '#a9afb7',
    fontSize: 11,
    marginBottom: 4,
    fontWeight: '600',
  },
  fareValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  etaPill: {
    backgroundColor: '#2b2f36',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  etaText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  rideOptions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  rideOption: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  rideOptionSelected: {
    borderColor: '#111',
    backgroundColor: '#f2f2f2',
  },
  rideType: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  rideTypeSelected: {
    color: '#111',
  },
  rideSub: {
    fontSize: 11,
    color: '#6b7280',
  },
  rideSubSelected: {
    color: '#4b5563',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  scheduleButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  scheduleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  requestButton: {
    flex: 1.2,
    backgroundColor: '#111',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  requestButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});

export default React.memo(TransportScreen);


