import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainStackParamList } from '../../types/navigation.types';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';

type BookingRouteProp = RouteProp<MainStackParamList, 'TourPackageBooking'>;

import LocationPickerModal from '../../components/LocationPickerModal';

export default function TourPackageBookingScreen() {
  const navigation = useNavigation();
  const route = useRoute<BookingRouteProp>();
  const insets = useSafeAreaInsets();
  const { tourPackage } = route.params;
  const { user } = useAuth();

  const [date, setDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [message, setMessage] = useState('');
  const [guestName, setGuestName] = useState(user?.name || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phoneNumber || '');
  const [pickupLocation, setPickupLocation] = useState('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleIncrement = () => setNumberOfPeople(prev => prev + 1);
  const handleDecrement = () => setNumberOfPeople(prev => Math.max(1, prev - 1));

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleSubmit = async () => {
    if (!date || !guestName.trim() || !guestEmail.trim() || !customerPhone.trim() || !pickupLocation.trim()) {
      Alert.alert('Missing Fields', 'Please fill out all required fields, including Phone Number and Pickup Location.');
      return;
    }

    // Strip non-numeric characters for length validation
    const digitsOnly = customerPhone.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.post('/public-tours/inquiries', {
        packageId: tourPackage.id,
        customerId: user?.id,
        date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        numberOfPeople,
        guestName,
        guestEmail,
        customerPhone,
        pickupLocation,
        specialRequests: message,
        guestAvatar: user?.profilePicture || '',
        message,
      });
      
      Alert.alert(
        'Inquiry Sent!',
        'The tour guide has received your booking request and will contact you shortly.',
        [{ text: 'OK', onPress: () => (navigation as any).navigate('TourPackages') }]
      );
    } catch (error) {
      console.error('Failed to submit inquiry', error);
      Alert.alert('Error', 'Failed to send your inquiry. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPrice = Number(tourPackage.price) * numberOfPeople;
  const heroImage = tourPackage.coverImageUrl || (tourPackage.galleryUrls && tourPackage.galleryUrls[0]) || null;
  const { width } = Dimensions.get('window');

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          bounces={false}
          contentContainerStyle={{ paddingBottom: 180 }}
        >
          {/* Immersive Hero Header */}
          <ImageBackground
            source={heroImage ? { uri: heroImage } : require('../../assets/Homepage.png')}
            style={[styles.heroHeader, { width }]}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.8)']}
              style={StyleSheet.absoluteFillObject}
            />
            
            {/* Top Navigation Bar */}
            <View style={[styles.topNavBar, { top: insets.top + 10 }]}>
              <TouchableOpacity 
                onPress={() => navigation.goBack()} 
                style={styles.glassBackBtn}
              >
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.navTitle}>Booking</Text>
              <View style={{ width: 44 }} />
            </View>

            {/* Hero Content */}
            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <Ionicons name="leaf" size={14} color="#0E5E2F" style={{ marginRight: 4 }} />
                <Text style={styles.heroBadgeText}>{tourPackage.category || 'Tour'}</Text>
              </View>
              <Text style={styles.heroTitle}>{tourPackage.name}</Text>
              <Text style={styles.heroPrice}>LKR {tourPackage.price} <Text style={styles.heroPriceSub}>/ person</Text></Text>
            </View>
          </ImageBackground>
          
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />

            <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Your Details</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              value={guestName}
              onChangeText={setGuestName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="john@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={guestEmail}
              onChangeText={setGuestEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="0771234567"
              keyboardType="phone-pad"
              maxLength={10}
              value={customerPhone}
              onChangeText={(text) => {
                // Allow only numbers
                const numericValue = text.replace(/[^0-9]/g, '');
                setCustomerPhone(numericValue);
              }}
            />
          </View>

          <Text style={styles.sectionTitle}>Trip Details</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Preferred Date</Text>
            <TouchableOpacity 
              style={styles.input}
              onPress={() => setShowDatePicker(!showDatePicker)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 16, color: date ? '#111' : '#999', fontWeight: '500' }}>
                {date ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "Select upcoming date"}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                minimumDate={new Date()}
                onChange={handleDateChange}
                style={Platform.OS === 'ios' ? styles.iosPicker : {}}
              />
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Number of People</Text>
            <View style={styles.counterRow}>
              <TouchableOpacity onPress={handleDecrement} style={styles.counterBtn}>
                <Ionicons name="remove" size={24} color="#111" />
              </TouchableOpacity>
              <Text style={styles.counterText}>{numberOfPeople}</Text>
              <TouchableOpacity onPress={handleIncrement} style={styles.counterBtn}>
                <Ionicons name="add" size={24} color="#111" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Pickup Location</Text>
            <TouchableOpacity 
              style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}
              onPress={() => setShowLocationPicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="map-outline" size={20} color="#0E5E2F" style={{ marginRight: 10 }} />
              <Text style={{ flex: 1, fontSize: 16, color: pickupLocation ? '#111' : '#999', fontWeight: pickupLocation ? '500' : '400' }}>
                {pickupLocation || "Pick location on map"}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#CCC" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Special Requests / Message (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any specific requirements or questions?"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
            />
            </View>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.bottomPriceInfo}>
          <Text style={styles.bottomPriceLabel}>Estimated Total</Text>
          <Text style={styles.bottomPrice}>LKR {totalPrice}</Text>
        </View>
        <TouchableOpacity 
          style={styles.submitBtn} 
          activeOpacity={0.9} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <LinearGradient
            colors={['#111', '#333']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Book Now</Text>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" style={{ marginLeft: 8 }} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <LocationPickerModal
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onConfirm={(address) => {
          setPickupLocation(address);
          setShowLocationPicker(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  heroHeader: {
    height: 380,
    justifyContent: 'flex-end',
    paddingBottom: 45,
  },
  topNavBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  glassBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0E5E2F',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
  },
  heroPriceSub: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  sheetContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -35,
    minHeight: 600,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  sheetHandle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 24,
  },
  formSection: {
    gap: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
    marginTop: 15,
    marginBottom: 5,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 52,
    justifyContent: 'center',
  },
  iosPicker: {
    marginTop: 10,
    alignSelf: 'center',
    width: '100%',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 20,
    padding: 6,
    alignSelf: 'flex-start',
  },
  counterBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  counterText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
    paddingHorizontal: 28,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 18,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 20,
  },
  bottomPriceInfo: {
    justifyContent: 'center',
  },
  bottomPriceLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bottomPrice: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111',
  },
  submitBtn: {
    width: 170,
    height: 58,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  submitGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  locationPill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 20,
    marginRight: 10,
  },
  locationPillActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  locationPillText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  locationPillTextActive: {
    color: '#FFF',
  },
});
