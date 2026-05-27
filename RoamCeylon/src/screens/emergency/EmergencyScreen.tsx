import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';

interface EmergencyService {
  id: string;
  name: string;
  number: string;
  agency: string;
  iconName: any;
  iconType: 'Ionicons' | 'MaterialCommunityIcons';
  color: string;
  bgColor: string;
}

const EMERGENCY_SERVICES: EmergencyService[] = [
  {
    id: 'police',
    name: 'Police',
    number: '119',
    agency: 'SRI LANKA POLICE',
    iconName: 'shield-outline',
    iconType: 'Ionicons',
    color: '#2F69FF',
    bgColor: '#E8EFFF',
  },
  {
    id: 'ambulance',
    name: 'Ambulance',
    number: '1990',
    agency: 'SUWA SERIYA',
    iconName: 'star-of-life',
    iconType: 'MaterialCommunityIcons',
    color: '#D32F2F',
    bgColor: '#FFEBEE',
  },
  {
    id: 'fire',
    name: 'Fire',
    number: '110',
    agency: 'FIRE SERVICE',
    iconName: 'fire-truck',
    iconType: 'MaterialCommunityIcons',
    color: '#E65100',
    bgColor: '#FFF3E0',
  },
  {
    id: 'tourist',
    name: 'Pethikola',
    number: '1331',
    agency: 'TOURIST SUPPORT',
    iconName: 'face-agent',
    iconType: 'MaterialCommunityIcons',
    color: '#2E7D32',
    bgColor: '#E8F5E9',
  },
];

const EmergencyScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [locationDetails, setLocationDetails] = useState<{
    address: string;
    coords: string;
  }>({
    address: 'Ella, Badulla District',
    coords: '6.8722° N, 81.0470° E',
  });
  const [loadingLocation, setLoadingLocation] = useState<boolean>(true);

  // Fetch live current location
  useEffect(() => {
    let isMounted = true;
    
    const fetchLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) setLoadingLocation(false);
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const { latitude, longitude } = position.coords;
        const latDir = latitude >= 0 ? 'N' : 'S';
        const lngDir = longitude >= 0 ? 'E' : 'W';
        const formattedCoords = `${Math.abs(latitude).toFixed(4)}° ${latDir}, ${Math.abs(longitude).toFixed(4)}° ${lngDir}`;

        const geocoded = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        if (geocoded && geocoded.length > 0) {
          const locationInfo = geocoded[0];
          const city = locationInfo.city || locationInfo.subregion || locationInfo.district || 'Ella';
          const district = locationInfo.region || locationInfo.subregion || 'Badulla District';
          const formattedAddress = `${city}, ${district}`;
          
          if (isMounted) {
            setLocationDetails({
              address: formattedAddress,
              coords: formattedCoords,
            });
            setLoadingLocation(false);
          }
        } else {
          if (isMounted) {
            setLocationDetails(prev => ({
              ...prev,
              coords: formattedCoords,
            }));
            setLoadingLocation(false);
          }
        }
      } catch (error) {
        console.error('Error fetching location:', error);
        if (isMounted) setLoadingLocation(false);
      }
    };

    fetchLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCall = (phoneNumber: string, name: string) => {
    Alert.alert(
      'Emergency Call',
      `Are you sure you want to dial ${name} (${phoneNumber})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          style: 'destructive',
          onPress: () => {
            Linking.openURL(`tel:${phoneNumber}`).catch(() => {
              Alert.alert('Error', 'Unable to initiate call on this device.');
            });
          },
        },
      ]
    );
  };

  const handleMenuPress = () => {
    if ((navigation as any).openDrawer) {
      (navigation as any).openDrawer();
    } else {
      Alert.alert('Menu', 'Menu navigation is not configured in this stack.');
    }
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile' as never);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Custom Header matching Mockup */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={handleMenuPress} style={styles.headerBtn}>
          <Ionicons name="menu-outline" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Roam Ceylon</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={handleProfilePress}>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
            style={styles.profilePic}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Glowing Red Emergency Icon */}
        <View style={styles.bellSection}>
          <View style={styles.glowOuter}>
            <View style={styles.glowMiddle}>
              <View style={styles.glowInner}>
                <MaterialCommunityIcons name="bell-ring" size={48} color="#FFFFFF" />
              </View>
            </View>
          </View>
          
          <Text style={styles.mainTitle}>Emergency Assistance</Text>
          <Text style={styles.subtitle}>Tap any service below for immediate connection</Text>
        </View>

        {/* 2x2 Services Grid */}
        <View style={styles.grid}>
          {EMERGENCY_SERVICES.map(service => (
            <TouchableOpacity
              key={service.id}
              activeOpacity={0.9}
              onPress={() => handleCall(service.number, service.name)}
              style={styles.card}
            >
              {/* Rounded Icon Wrapper */}
              <View style={[styles.iconWrap, { backgroundColor: service.bgColor }]}>
                {service.iconType === 'Ionicons' ? (
                  <Ionicons name={service.iconName} size={22} color={service.color} />
                ) : (
                  <MaterialCommunityIcons name={service.iconName} size={22} color={service.color} />
                )}
              </View>

              <Text style={styles.cardAgency}>{service.agency}</Text>
              <Text style={styles.cardName}>{service.name}</Text>
              <Text style={[styles.cardNumber, { color: service.color }]}>{service.number}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Location Card */}
        <View style={styles.locationCard}>
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationEyebrow}>YOUR CURRENT LOCATION</Text>
            {loadingLocation ? (
              <View style={styles.locationLoadingRow}>
                <ActivityIndicator size="small" color="#A87C00" style={{ marginRight: 6 }} />
                <Text style={styles.locationLoadingText}>Retrieving phone GPS location...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.locationAddress}>{locationDetails.address}</Text>
                <Text style={styles.locationCoords}>{locationDetails.coords}</Text>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBFAF6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerBtn: {
    padding: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#494034',
    letterSpacing: 0.5,
  },
  profilePic: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  bellSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  glowOuter: {
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: 'rgba(229, 57, 53, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowMiddle: {
    width: 114,
    height: 114,
    borderRadius: 57,
    backgroundColor: 'rgba(229, 57, 53, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    width: '47.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#FFF5D1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardAgency: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A0A0A0',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  cardNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  locationCard: {
    backgroundColor: '#FFF2C6',
    borderRadius: 24,
    padding: 20,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A87C00',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  locationAddress: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 13,
    color: '#7F6A51',
  },
  locationLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationLoadingText: {
    fontSize: 14,
    color: '#A87C00',
    fontWeight: '600',
  },
});

export default EmergencyScreen;
