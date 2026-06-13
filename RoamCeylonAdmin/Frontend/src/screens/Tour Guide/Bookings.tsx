import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';

const Bookings = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // State variables for search and active tab filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'confirmed' | 'pending' | 'completed'>('all');
  
  const [loading, setLoading] = useState(true);
  const [bookingsData, setBookingsData] = useState<any[]>([]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const accessToken = await SecureStore.getItemAsync('authToken');
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';

      if (!accessToken) return;

      const res = await fetch(`${apiUrl}/tour-guide/bookings`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setBookingsData(data);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [])
  );

  // Filtering logic
  const filteredBookings = bookingsData.filter((booking) => {
    const customerMatch = booking.customerName?.toLowerCase().includes(searchQuery.toLowerCase());
    const tourMatch = booking.tourName?.toLowerCase().includes(searchQuery.toLowerCase());
    const idMatch = booking.id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = customerMatch || tourMatch || idMatch;
    
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && booking.status.toLowerCase() === activeTab;
  });

  const handleBookingAction = async (id: string, action: string) => {
    // Alert.alert(action, `Performing ${action.toLowerCase()} action on booking #${id}...`);
    // Placeholder for actual update logic
    try {
      const accessToken = await SecureStore.getItemAsync('authToken');
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';

      const res = await fetch(`${apiUrl}/tour-guide/bookings/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: action.toLowerCase() }),
      });

      if (res.ok) {
        setBookingsData((prev) => 
          prev.map((b) => (b.id === id ? { ...b, status: action.toLowerCase() } : b))
        );
      } else {
        Alert.alert('Error', 'Failed to update booking status');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Transparent Header */}
        <View
          style={[styles.header, { paddingTop: insets.top + 16, paddingBottom: 12 }]}
        >
          <TouchableOpacity style={styles.headerButton} activeOpacity={0.7} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color="#1C1917" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#1C1917' }]}>Bookings Manager</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.mainContent}>
          {/* Subtitle / Intro */}
          <View style={styles.titleSection}>
            <Text style={styles.pageSubtitle}>
              Manage and overview all scheduled tours, client itineraries, and active trip statuses.
            </Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={20} color="#8A958E" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by ID, client, or tour package..."
              placeholderTextColor="#8A958E"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#8A958E" />
              </TouchableOpacity>
            )}
          </View>

          {/* Status Tabs Segmented Control */}
          <View style={styles.tabsContainer}>
            {['all', 'confirmed', 'pending', 'completed'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabButton,
                  activeTab === tab && styles.tabButtonActive,
                ]}
                onPress={() => setActiveTab(tab as any)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === tab && styles.tabButtonActiveText,
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bookings Count */}
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCountText}>
              Showing {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
            </Text>
          </View>

          {/* Bookings List Cards */}
          <View style={styles.bookingsList}>
            {loading ? (
              <ActivityIndicator size="large" color="#0E5E2F" style={{ marginTop: 40 }} />
            ) : filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => {
                const isConfirmed = booking.status === 'confirmed';
                const isPending = booking.status === 'pending';
                const isCompleted = booking.status === 'completed';

                const dateObj = new Date(booking.startDate);
                const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const shortId = booking.id ? booking.id.substring(0, 8).toUpperCase() : 'UNKNOWN';

                return (
                  <View
                    key={booking.id}
                    style={[
                      styles.bookingCard,
                      isConfirmed && styles.cardConfirmed,
                      isPending && styles.cardPending,
                      isCompleted && styles.cardCompleted,
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <Image source={{ uri: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(booking.customerName || 'User') + '&background=random' }} style={styles.clientAvatar} contentFit="cover" />
                      <View style={styles.clientDetails}>
                        <Text style={styles.bookingIdText}>#{shortId}</Text>
                        <Text style={styles.clientNameText}>{booking.customerName}</Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          isConfirmed && styles.badgeConfirmed,
                          isPending && styles.badgePending,
                          isCompleted && styles.badgeCompleted,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            isConfirmed && styles.badgeTextConfirmed,
                            isPending && styles.badgeTextPending,
                            isCompleted && styles.badgeTextCompleted,
                            { textTransform: 'uppercase' }
                          ]}
                        >
                          {booking.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardInfoSection}>
                      <View style={styles.infoRow}>
                        <Ionicons name="map-outline" size={15} color="#6B7280" style={{ marginRight: 6 }} />
                        <Text style={styles.infoValueText} numberOfLines={1}>{booking.tourName}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={15} color="#6B7280" style={{ marginRight: 6 }} />
                        <Text style={styles.infoValueText}>{formattedDate}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Ionicons name="people-outline" size={15} color="#6B7280" style={{ marginRight: 6 }} />
                        <Text style={styles.infoValueText}>{booking.customerName}</Text>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={styles.priceText}>Rs. {booking.amount}</Text>
                      <View style={styles.actionsRow}>
                        {isPending ? (
                          <>
                            <TouchableOpacity
                              style={[styles.actionButton, styles.btnDecline]}
                              onPress={() => handleBookingAction(booking.id, 'Decline')}
                            >
                              <Text style={styles.btnDeclineText}>Decline</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.btnConfirmWrapper}
                              onPress={() => handleBookingAction(booking.id, 'Confirm')}
                            >
                              <LinearGradient
                                colors={['#10B981', '#059669']}
                                style={styles.btnConfirmGradient}
                              >
                                <Text style={styles.btnConfirmText}>Confirm</Text>
                              </LinearGradient>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <TouchableOpacity
                            style={[styles.actionButton, styles.btnViewDetail]}
                            onPress={() => handleBookingAction(booking.id, 'Manage')}
                          >
                            <Text style={styles.btnViewDetailText}>Manage Trip</Text>
                            <Feather name="chevron-right" size={14} color="#0E5E2F" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="calendar-outline" size={48} color="#D1D5DB" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyStateTitle}>No Bookings Found</Text>
                <Text style={styles.emptyStateText}>
                  We couldn&apos;t find any bookings matching your search query or filter range.
                </Text>
              </View>
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
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
  },
  mainContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  titleSection: {
    marginBottom: 20,
  },
  pageSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    fontWeight: '500',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6EFEA',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1C1917',
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#EAEAEA',
    borderRadius: 16,
    padding: 3,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 13,
  },
  tabButtonActive: {
    backgroundColor: '#0E5E2F',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  tabButtonActiveText: {
    color: '#FFFFFF',
  },
  resultsHeader: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  resultsCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  bookingsList: {
    gap: 16,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EAEFEA',
    borderLeftWidth: 6,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
  },
  cardConfirmed: {
    borderLeftColor: '#0E5E2F',
  },
  cardPending: {
    borderLeftColor: '#D97706',
  },
  cardCompleted: {
    borderLeftColor: '#2563EB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EAEAEA',
  },
  clientDetails: {
    flex: 1,
    marginLeft: 12,
  },
  bookingIdText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8A958E',
  },
  clientNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1917',
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  badgeConfirmed: {
    backgroundColor: '#EAF7EE',
    borderColor: '#C2F3D0',
  },
  badgePending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
  },
  badgeCompleted: {
    backgroundColor: '#EFF6FF',
    borderColor: '#EFF6FF',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  badgeTextConfirmed: {
    color: '#0E5E2F',
  },
  badgeTextPending: {
    color: '#D97706',
  },
  badgeTextCompleted: {
    color: '#2563EB',
  },
  cardInfoSection: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F2F5F3',
    paddingVertical: 12,
    gap: 8,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoValueText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    borderRadius: 12,
    height: 36,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDecline: {
    backgroundColor: '#FAFBF9',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  btnDeclineText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EF4444',
  },
  btnConfirmWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  btnConfirmGradient: {
    height: 36,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnConfirmText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnViewDetail: {
    backgroundColor: '#EAF7EE',
    borderWidth: 1,
    borderColor: '#C2F3D0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  btnViewDetailText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0E5E2F',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EAEFEA',
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#8A958E',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
});

export default Bookings;
