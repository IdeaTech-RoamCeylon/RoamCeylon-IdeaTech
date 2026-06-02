import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../types';
import { hotelService, Hotel, RoomType } from '../../services/hotelService';

type HotelBookingScreenRouteProp = RouteProp<MainStackParamList, 'HotelBooking'>;
type HotelBookingScreenNavigationProp = StackNavigationProp<MainStackParamList, 'HotelBooking'>;

const HotelBookingScreen = () => {
  const navigation = useNavigation<HotelBookingScreenNavigationProp>();
  const route = useRoute<HotelBookingScreenRouteProp>();
  const params = route.params || {};

  // Core state
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(params.hotel || null);
  const [checkInState, setCheckInState] = useState<string>(
    params.checkIn || new Date().toISOString().split('T')[0]
  );
  const [checkOutState, setCheckOutState] = useState<string>(
    params.checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );

  const [selectedRoom, setSelectedRoom] = useState<RoomType>(
    params.hotel?.rooms?.[0] || { type: 'Deluxe Room', price: params.hotel?.price || 0, capacity: '2 Adults' }
  );
  const [guestName, setGuestName] = useState('');
  const [guestsCount, setGuestsCount] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  // Browse mode states
  const [allHotels, setAllHotels] = useState<Hotel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingHotels, setIsLoadingHotels] = useState(false);

  // Sync selectedRoom if selectedHotel is updated/changed from browser
  const handleSelectHotel = useCallback((hotel: Hotel) => {
    setSelectedHotel(hotel);
    setSelectedRoom(
      hotel.rooms?.[0] || { type: 'Deluxe Room', price: hotel.price || 0, capacity: '2 Adults' }
    );
  }, []);

  const handleSwitchHotel = useCallback(() => {
    setSelectedHotel(null);
  }, []);

  // Fetch hotels list if we don't have a pre-selected hotel
  useEffect(() => {
    const fetchAllHotels = async () => {
      if (!params.hotel) {
        setIsLoadingHotels(true);
        try {
          const list = await hotelService.getSuggestions('');
          setAllHotels(list);
        } catch (err) {
          console.error('Error fetching hotels in booking screen:', err);
        } finally {
          setIsLoadingHotels(false);
        }
      }
    };
    fetchAllHotels();
  }, [params.hotel]);

  // Filtered hotels in browse view
  const filteredHotels = useMemo(() => {
    if (!searchQuery.trim()) return allHotels;
    const query = searchQuery.toLowerCase();
    return allHotels.filter(
      (h) =>
        h.name.toLowerCase().includes(query) ||
        h.destination.toLowerCase().includes(query) ||
        h.description.toLowerCase().includes(query)
    );
  }, [allHotels, searchQuery]);

  // Parse dates and nights
  const nights = useMemo(() => {
    const start = new Date(checkInState);
    const end = new Date(checkOutState);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 1;
    }
    const diff = end.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [checkInState, checkOutState]);

  const formattedDates = useMemo(() => {
    const start = new Date(checkInState);
    const end = new Date(checkOutState);
    const defaultStartStr = checkInState;
    const defaultEndStr = checkOutState;

    const startStr = !isNaN(start.getTime())
      ? start.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : defaultStartStr;

    const endStr = !isNaN(end.getTime())
      ? end.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : defaultEndStr;

    return { start: startStr, end: endStr };
  }, [checkInState, checkOutState]);

  // Invoice breakdown calculations
  const invoice = useMemo(() => {
    const subtotal = selectedRoom.price * nights;
    const serviceCharge = Math.round(subtotal * 0.1); // 10%
    const localTax = Math.round(subtotal * 0.08); // 8%
    const total = subtotal + serviceCharge + localTax;
    return { subtotal, serviceCharge, localTax, total };
  }, [selectedRoom, nights]);

  const handleConfirmBooking = useCallback(async () => {
    if (!selectedHotel) {
      Alert.alert('Selection Needed', 'Please choose a hotel first.');
      return;
    }

    const start = new Date(checkInState);
    const end = new Date(checkOutState);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      Alert.alert('Invalid Dates', 'Please enter valid check-in and check-out dates in YYYY-MM-DD format.');
      return;
    }
    if (start.getTime() >= end.getTime()) {
      Alert.alert('Invalid Schedule', 'Check-out date must be after check-in date.');
      return;
    }

    if (!guestName.trim()) {
      Alert.alert('Details Needed', 'Please enter a primary guest name.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await hotelService.bookHotel({
        hotelId: selectedHotel.id,
        roomType: selectedRoom.type,
        checkIn: checkInState,
        checkOut: checkOutState,
        guests: [
          guestName.trim(),
          ...Array.from({ length: guestsCount - 1 }, (_, i) => `Guest ${i + 2}`),
        ],
      });

      setBookingDetails(response);
      setBookingConfirmed(true);
    } catch (err: any) {
      Alert.alert('Booking Failed', err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedHotel, selectedRoom, checkInState, checkOutState, guestName, guestsCount]);

  // SUCCESS VIEW
  if (bookingConfirmed && bookingDetails && selectedHotel) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successCard}>
            <View style={styles.successIconBadge}>
              <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            </View>

            <Text style={styles.successTitle}>Booking Confirmed! 🎉</Text>
            <Text style={styles.successSubtitle}>Your Sri Lankan sanctuary awaits</Text>

            <View style={styles.divider} />

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Booking Ref</Text>
              <Text style={styles.receiptValueHighlight}>{bookingDetails.id}</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Hotel</Text>
              <Text style={styles.receiptValue}>{selectedHotel.name}</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Room Type</Text>
              <Text style={styles.receiptValue}>{bookingDetails.roomType}</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Dates</Text>
              <Text style={styles.receiptValue}>
                {formattedDates.start} - {formattedDates.end}
              </Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Nights</Text>
              <Text style={styles.receiptValue}>{nights} Nights</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Guests</Text>
              <Text style={styles.receiptValue}>
                {guestName} (+{guestsCount - 1} guests)
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.receiptRow}>
              <Text style={styles.receiptTotalLabel}>Amount Paid</Text>
              <Text style={styles.receiptTotalValue}>
                LKR {bookingDetails.totalPrice.toLocaleString()}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // BROWSE / SELECT HOTEL VIEW
  if (!selectedHotel) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Premium Hotel</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchRow}>
            <View style={styles.searchIconBubble}>
              <Ionicons name="search" size={20} color="#9B7B4A" />
            </View>
            <View style={styles.searchInputContainer}>
              <TextInput
                placeholder="Search by destination or hotel name..."
                placeholderTextColor="#C7A97B"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
            </View>
          </View>
        </View>

        {isLoadingHotels ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#FFB300" />
            <Text style={styles.loadingText}>Loading Sri Lankan sanctuaries...</Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {filteredHotels.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="sad-outline" size={60} color="#888" />
                <Text style={styles.emptyText}>No premium stays found matching your search</Text>
              </View>
            ) : (
              filteredHotels.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.95}
                  style={styles.browserHotelCard}
                  onPress={() => handleSelectHotel(item)}
                >
                  <Image source={{ uri: item.image }} style={styles.browserHotelImage} />
                  <View style={styles.browserHotelOverlay}>
                    <View style={styles.browserHotelHeaderRow}>
                      <Text style={styles.browserHotelName} numberOfLines={1}>{item.name}</Text>
                      <View style={styles.browserRatingBadge}>
                        <Ionicons name="star" size={12} color="#000" />
                        <Text style={styles.browserRatingText}>{item.rating}</Text>
                      </View>
                    </View>
                    <View style={styles.browserHotelLocationRow}>
                      <Ionicons name="location" size={12} color="#FFB300" />
                      <Text style={styles.browserHotelLocation}>{item.destination}, Sri Lanka</Text>
                    </View>
                    <Text style={styles.browserHotelDesc} numberOfLines={2}>{item.description}</Text>
                    <View style={styles.browserHotelFooter}>
                      <View>
                        <Text style={styles.browserPriceLabel}>From LKR {item.price.toLocaleString()}</Text>
                        <Text style={styles.browserPriceSub}>/ night</Text>
                      </View>
                      <View style={styles.selectBtn}>
                        <Text style={styles.selectBtnText}>Book Now 🏨</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // BOOKING DETAILS VIEW (WHEN HOTEL SELECTED)
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleSwitchHotel}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hotel Booking</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hotel Preview */}
        <View style={styles.hotelCard}>
          <Image source={{ uri: selectedHotel.image }} style={styles.hotelImage} />
          <View style={styles.hotelOverlay}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.hotelName}>{selectedHotel.name}</Text>
                <View style={styles.hotelLocationRow}>
                  <Ionicons name="location" size={14} color="#FFD700" />
                  <Text style={styles.hotelLocation}>{selectedHotel.destination}, Sri Lanka</Text>
                </View>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.ratingText}>{selectedHotel.rating} • Premium Stay</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.switchHotelBtn} onPress={handleSwitchHotel}>
                <Text style={styles.switchHotelBtnText}>Switch Hotel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Selected Dates & Schedule */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📅 Stay Schedule</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>CHECK-IN</Text>
              <Text style={styles.dateValue}>{formattedDates.start}</Text>
            </View>
            <View style={styles.dateLineContainer}>
              <View style={styles.dateLine} />
              <Text style={styles.dateNightsText}>{nights} nights</Text>
            </View>
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>CHECK-OUT</Text>
              <Text style={styles.dateValue}>{formattedDates.end}</Text>
            </View>
          </View>

          <View style={styles.dateInputsRow}>
            <View style={styles.dateInputContainer}>
              <Text style={styles.inputLabel}>Check-In Date</Text>
              <TextInput
                style={styles.dateTextInput}
                value={checkInState}
                onChangeText={setCheckInState}
                placeholder="YYYY-MM-DD"
                maxLength={10}
              />
            </View>
            <View style={styles.dateInputContainer}>
              <Text style={styles.inputLabel}>Check-Out Date</Text>
              <TextInput
                style={styles.dateTextInput}
                value={checkOutState}
                onChangeText={setCheckOutState}
                placeholder="YYYY-MM-DD"
                maxLength={10}
              />
            </View>
          </View>
        </View>

        {/* Room Category Selection */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🏨 Choose Room Category</Text>
          <View style={styles.roomsList}>
            {selectedHotel.rooms.map((room: RoomType) => {
              const isSelected = selectedRoom.type === room.type;
              return (
                <TouchableOpacity
                  key={room.type}
                  style={[styles.roomCard, isSelected && styles.selectedRoomCard]}
                  onPress={() => setSelectedRoom(room)}
                >
                  <View style={styles.roomLeft}>
                    <Text style={[styles.roomName, isSelected && styles.selectedRoomName]}>
                      {room.type}
                    </Text>
                    <View style={styles.roomCapacityRow}>
                      <Ionicons name="people" size={14} color={isSelected ? '#0066CC' : '#666'} />
                      <Text style={styles.roomCapacityText}>{room.capacity}</Text>
                    </View>
                  </View>
                  <View style={styles.roomRight}>
                    <Text style={styles.roomPriceLabel}>LKR {room.price.toLocaleString()}</Text>
                    <Text style={styles.roomPriceSub}>/ night</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Guest Details Form */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>👥 Guest Information</Text>
          <Text style={styles.inputLabel}>Primary Guest Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. John Doe"
            placeholderTextColor="#888"
            value={guestName}
            onChangeText={setGuestName}
          />

          <View style={styles.guestsCounterRow}>
            <View>
              <Text style={styles.counterTitle}>Number of Guests</Text>
              <Text style={styles.counterSubtitle}>Including children</Text>
            </View>
            <View style={styles.counterButtons}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setGuestsCount(Math.max(1, guestsCount - 1))}
              >
                <Text style={styles.counterButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.counterValue}>{guestsCount}</Text>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setGuestsCount(Math.min(6, guestsCount + 1))}
              >
                <Text style={styles.counterButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Pricing Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>💳 Cost Summary</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              {selectedRoom.type} ({nights} x LKR {selectedRoom.price.toLocaleString()})
            </Text>
            <Text style={styles.priceValue}>
              LKR {(selectedRoom.price * nights).toLocaleString()}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Service Charge (10%)</Text>
            <Text style={styles.priceValue}>LKR {invoice.serviceCharge.toLocaleString()}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Local Tourism Taxes (8%)</Text>
            <Text style={styles.priceValue}>LKR {invoice.localTax.toLocaleString()}</Text>
          </View>

          <View style={styles.invoiceDivider} />

          <View style={styles.totalPriceRow}>
            <Text style={styles.totalPriceLabel}>Total Pricing</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.totalPriceValue}>LKR {invoice.total.toLocaleString()}</Text>
              <Text style={styles.taxInclusiveText}>All taxes & fees included</Text>
            </View>
          </View>
        </View>

        {/* Submit Booking */}
        <TouchableOpacity
          style={[styles.bookingButton, isLoading && styles.bookingButtonDisabled]}
          onPress={handleConfirmBooking}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.bookingButtonText}>Confirm Hotel Booking</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAF8',
    marginTop: Platform.OS === 'ios' ? 0 : 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  hotelCard: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  hotelImage: {
    width: '100%',
    height: '100%',
  },
  hotelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: 15,
  },
  hotelName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  hotelLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  hotelLocation: {
    fontSize: 13,
    color: '#EFEFEF',
    marginLeft: 5,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#FFD700',
    marginLeft: 5,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 15,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dateBlock: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginTop: 4,
  },
  dateLineContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  dateLine: {
    height: 2,
    backgroundColor: '#E0E0E0',
    width: '100%',
  },
  dateNightsText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginTop: 4,
  },
  roomsList: {
    gap: 12,
  },
  roomCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#EEEEEE',
    backgroundColor: '#FAFDFB',
  },
  selectedRoomCard: {
    borderColor: '#0066CC',
    backgroundColor: '#F4F9FF',
  },
  roomLeft: {
    flex: 1,
  },
  roomName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  selectedRoomName: {
    color: '#0066CC',
  },
  roomCapacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  roomCapacityText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  roomRight: {
    alignItems: 'flex-end',
  },
  roomPriceLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#222',
  },
  roomPriceSub: {
    fontSize: 11,
    color: '#888',
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '700',
    marginBottom: 6,
  },
  guestsCounterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  counterTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  counterSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  counterButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    padding: 4,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
  },
  counterButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  counterValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 15,
    color: '#333',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    maxWidth: '70%',
  },
  priceValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '700',
  },
  invoiceDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 15,
  },
  totalPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalPriceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  totalPriceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0066CC',
  },
  taxInclusiveText: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  bookingButton: {
    backgroundColor: '#FFB300', // Premium Gold
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  bookingButtonDisabled: {
    opacity: 0.7,
  },
  bookingButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },

  // Success view styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F0F9F4',
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 30,
    width: '100%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  successIconBadge: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#EAEAEA',
    width: '100%',
    marginVertical: 20,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  receiptLabel: {
    fontSize: 13,
    color: '#777',
    fontWeight: '500',
  },
  receiptValue: {
    fontSize: 14,
    color: '#222',
    fontWeight: '700',
    maxWidth: '65%',
    textAlign: 'right',
  },
  receiptValueHighlight: {
    fontSize: 15,
    color: '#0066CC',
    fontWeight: '800',
  },
  receiptTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  receiptTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2E7D32',
  },
  doneButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 25,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
  },
  doneButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // Browse view styles
  searchSection: {
    paddingHorizontal: 20,
    marginVertical: 15,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchIconBubble: {
    width: 40,
    height: 40,
    backgroundColor: '#FFF8F0',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInputContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    fontSize: 14,
    color: '#7F6A51',
    textAlign: 'left',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  browserHotelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  browserHotelImage: {
    width: '100%',
    height: 180,
  },
  browserHotelOverlay: {
    padding: 18,
  },
  browserHotelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  browserHotelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
    marginRight: 10,
  },
  browserRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE06B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  browserRatingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  browserHotelLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  browserHotelLocation: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
    fontWeight: '600',
  },
  browserHotelDesc: {
    fontSize: 13,
    color: '#777',
    marginTop: 10,
    lineHeight: 18,
  },
  browserHotelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  browserPriceLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#222',
  },
  browserPriceSub: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  selectBtn: {
    backgroundColor: '#FFB300',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 15,
  },
  selectBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#222',
  },
  switchHotelBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  switchHotelBtnText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dateInputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateTextInput: {
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
});

export default HotelBookingScreen;
