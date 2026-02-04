import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import MapScreen from './MapScreen';
import { LocationSelection, MainStackParamList } from '../../types';

type TransportNavProp = StackNavigationProp<MainStackParamList, 'Transport'>;
type TransportRouteProp = RouteProp<MainStackParamList, 'Transport'>;

const TransportScreen = () => {
  const navigation = useNavigation<TransportNavProp>();
  const route = useRoute<TransportRouteProp>();
  const [pickup, setPickup] = useState<LocationSelection | undefined>(undefined);
  const [destination, setDestination] = useState<LocationSelection | undefined>(undefined);
  const [selectedRide, setSelectedRide] = useState<'Standard' | 'Comfort' | 'Van'>('Standard');

  useEffect(() => {
    if (route.params?.pickup) {
      setPickup(route.params.pickup);
    }
    if (route.params?.destination) {
      setDestination(route.params.destination);
    }
  }, [route.params]);

  const distanceKm = useMemo(() => {
    if (!pickup?.coordinates || !destination?.coordinates) return null;
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(destination.coordinates.latitude - pickup.coordinates.latitude);
    const dLon = toRad(destination.coordinates.longitude - pickup.coordinates.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(pickup.coordinates.latitude)) *
        Math.cos(toRad(destination.coordinates.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.max(1, Math.round(R * c));
  }, [pickup, destination]);

  const priceForType = useMemo(() => {
    const km = distanceKm ?? 5;
    return {
      Standard: Math.round(220 + km * 140),
      Comfort: Math.round(300 + km * 180),
      Van: Math.round(400 + km * 220),
    } as const;
  }, [distanceKm]);

  const fareEstimate = useMemo(() => {
    if (!pickup || !destination) return '—';
    return `LKR ${priceForType[selectedRide].toLocaleString()}`;
  }, [pickup, destination, priceForType, selectedRide]);

  return (
    <View style={styles.container}>
      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapScreen
          pickupCoordinate={
            pickup?.coordinates
              ? [pickup.coordinates.longitude, pickup.coordinates.latitude]
              : undefined
          }
          destinationCoordinate={
            destination?.coordinates
              ? [destination.coordinates.longitude, destination.coordinates.latitude]
              : undefined
          }
        />
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

        <TouchableOpacity
          style={styles.inputCard}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('TransportLocationPicker', {
              pickup,
              destination,
            })
          }
        >
          <View style={styles.inputRow}>
            <View style={styles.bullet}>
              <View style={styles.bulletInnerPickup} />
            </View>
            <View style={styles.inputColumn}>
              <Text style={styles.inputLabel}>Pickup</Text>
              <Text style={styles.inputValue} numberOfLines={1}>
                {pickup?.name || 'Choose pickup'}
              </Text>
            </View>
          </View>

          <View style={styles.connector} />

          <View style={styles.inputRow}>
            <View style={styles.bullet}>
              <View style={styles.bulletInnerDrop} />
            </View>
            <View style={styles.inputColumn}>
              <Text style={styles.inputLabel}>Destination</Text>
              <Text style={styles.inputValue} numberOfLines={1}>
                {destination?.name || 'Choose destination'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

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
                {type === 'Van'
                  ? `6 seats · LKR ${priceForType.Van.toLocaleString()}`
                  : type === 'Comfort'
                  ? `Extra legroom · LKR ${priceForType.Comfort.toLocaleString()}`
                  : `Everyday rides · LKR ${priceForType.Standard.toLocaleString()}`}
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
  inputValue: {
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


