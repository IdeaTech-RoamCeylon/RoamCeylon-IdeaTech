import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

interface DriverInfo {
  name: string;
  photo: string;
  rating: number;
  totalRides: number;
  vehicle: {
    make: string;
    model: string;
    color: string;
    plate: string;
  };
  phone: string;
}

interface DriverInfoCardProps {
  driver: DriverInfo;
}

const DriverInfoCard: React.FC<DriverInfoCardProps> = ({ driver }) => {
  const handleCall = () => {
    Linking.openURL(`tel:${driver.phone}`);
  };

  const handleMessage = () => {
    Linking.openURL(`sms:${driver.phone}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Driver</Text>
      
      <View style={styles.driverCard}>
        <View style={styles.driverHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>{driver.photo}</Text>
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{driver.name}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingStars}>⭐</Text>
              <Text style={styles.ratingText}>
                {driver.rating.toFixed(1)} ({driver.totalRides} rides)
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.vehicleInfo}>
          <View style={styles.vehicleRow}>
            <Text style={styles.vehicleIcon}>🚗</Text>
            <Text style={styles.vehicleText}>
              {driver.vehicle.color} {driver.vehicle.make} {driver.vehicle.model}
            </Text>
          </View>
          <View style={styles.vehicleRow}>
            <Text style={styles.vehicleIcon}>🔢</Text>
            <Text style={styles.vehicleText}>{driver.vehicle.plate}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Text style={styles.actionIcon}>📞</Text>
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionText}>Message</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  driverCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    borderWidth: 3,
    borderColor: '#0066CC',
  },
  avatar: {
    fontSize: 32,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStars: {
    fontSize: 14,
    marginRight: 5,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  vehicleInfo: {
    marginBottom: 15,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleIcon: {
    fontSize: 18,
    marginRight: 10,
    width: 25,
  },
  vehicleText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066CC',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  actionText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
});

export default React.memo(DriverInfoCard);
