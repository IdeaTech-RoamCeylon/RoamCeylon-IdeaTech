import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import RideTimeline, { RideStatus } from '../../components/RideTimeline';
import DriverInfoCard from '../../components/DriverInfoCard';

// Mock driver data
const MOCK_DRIVER = {
  name: 'Rajesh Kumar',
  photo: '👨',
  rating: 4.8,
  totalRides: 1247,
  vehicle: {
    make: 'Toyota',
    model: 'Prius',
    color: 'Silver',
    plate: 'CAB-1234',
  },
  phone: '+94771234567',
};

const TransportStatusScreen = () => {
  const navigation = useNavigation();
  const [rideStatus, setRideStatus] = useState<RideStatus>('enroute');
  const [estimatedArrival, setEstimatedArrival] = useState(8);

  const handleCancelRide = () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Ride Cancelled', 'Your ride has been cancelled');
            navigation.goBack();
          },
        },
      ]
    );
  };

  const getStatusMessage = () => {
    switch (rideStatus) {
      case 'requested':
        return 'Looking for a driver...';
      case 'assigned':
        return 'Driver has been assigned';
      case 'enroute':
        return `Driver is ${estimatedArrival} minutes away`;
      case 'arrived':
        return 'Driver has arrived at your location';
      case 'inprogress':
        return 'Trip in progress';
      case 'completed':
        return 'Trip completed';
      default:
        return '';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride Status</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Status Banner */}
        <View style={styles.statusBanner}>
          <Text style={styles.statusEmoji}>🚗</Text>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>{getStatusMessage()}</Text>
            {rideStatus === 'enroute' && (
              <Text style={styles.statusSubtitle}>
                Estimated arrival: {estimatedArrival} min
              </Text>
            )}
          </View>
        </View>

        {/* Driver Info */}
        {(rideStatus === 'assigned' || rideStatus === 'enroute' || rideStatus === 'arrived' || rideStatus === 'inprogress') && (
          <DriverInfoCard driver={MOCK_DRIVER} />
        )}

        {/* Timeline */}
        <RideTimeline currentStatus={rideStatus} />

        {/* Trip Details */}
        <View style={styles.tripDetails}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Pickup</Text>
              <Text style={styles.detailText}>Galle Face Hotel, Colombo</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🎯</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Destination</Text>
              <Text style={styles.detailText}>Bandaranaike International Airport</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>💰</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Fare</Text>
              <Text style={styles.detailText}>LKR 2,500</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        {rideStatus !== 'completed' && rideStatus !== 'inprogress' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelRide}
          >
            <Text style={styles.cancelButtonText}>Cancel Ride</Text>
          </TouchableOpacity>
        )}

        {/* Demo Controls */}
        <View style={styles.demoControls}>
          <Text style={styles.demoTitle}>Demo Controls</Text>
          <View style={styles.demoButtons}>
            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => setRideStatus('requested')}
            >
              <Text style={styles.demoButtonText}>Requested</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => setRideStatus('assigned')}
            >
              <Text style={styles.demoButtonText}>Assigned</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => setRideStatus('enroute')}
            >
              <Text style={styles.demoButtonText}>En Route</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => setRideStatus('arrived')}
            >
              <Text style={styles.demoButtonText}>Arrived</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => setRideStatus('inprogress')}
            >
              <Text style={styles.demoButtonText}>In Progress</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => setRideStatus('completed')}
            >
              <Text style={styles.demoButtonText}>Completed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    fontSize: 16,
    color: '#0066CC',
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  statusBanner: {
    backgroundColor: '#0066CC',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statusEmoji: {
    fontSize: 40,
    marginRight: 15,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#e3f2fd',
  },
  tripDetails: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  detailIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ff4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff4444',
  },
  demoControls: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  demoButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  demoButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    margin: 4,
  },
  demoButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
});

export default React.memo(TransportStatusScreen);
