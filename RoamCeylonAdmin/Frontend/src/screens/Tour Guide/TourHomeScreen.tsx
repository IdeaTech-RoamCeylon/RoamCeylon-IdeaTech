import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
  Linking,
 Platform } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { useNotifications } from '../../utils/notificationsStore';

const openMap = async (address: string) => {
  // Fully RFC3986 compliant URI encoding
  const query = encodeURIComponent(address).replace(/[!'()*]/g, function(c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase();
  });
  
  // Provide universal schemes for Apple/Google Maps
  const appleMapUrl = `maps://?q=${query}`;
  const googleMapUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
  
  try {
    if (Platform.OS === 'ios') {
      const canOpenApple = await Linking.canOpenURL(appleMapUrl);
      if (canOpenApple) {
        await Linking.openURL(appleMapUrl);
        return;
      }
    }
    
    // Fallback to Google Maps Web / App Intercept
    await Linking.openURL(googleMapUrl);
  } catch (_error) {
    // Ultimate failsafe: open in an in-app browser overlay which cannot fail due to OS routing issues
    try {
      await WebBrowser.openBrowserAsync(googleMapUrl);
    } catch (_webError) {
      Alert.alert('Error', 'Could not open the map app or a web browser.');
    }
  }
};

const TourHomeScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { unreadCount } = useNotifications('guide');

  // State
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPackages: 0,
    activeBookings: 0,
    rating: '4.9',
    unreadNotifications: 0,
  });
  const [packagesList, setPackagesList] = useState<any[]>([]);
  const [bookingsList, setBookingsList] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const accessToken = await SecureStore.getItemAsync('authToken');
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';

      if (!accessToken) return;

      const headers = { Authorization: `Bearer ${accessToken}` };

      // Fetch dashboard stats
      const statsRes = await fetch(`${apiUrl}/tour-guide/dashboard`, { headers });
      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats({
          totalPackages: d.totalPackages || 0,
          activeBookings: (d.pendingBookings || 0) + (d.confirmedBookings || 0),
          rating: '4.9', // Hardcoded rating for now
          unreadNotifications: d.unreadNotifications || 0,
        });
      }

      // Fetch recent packages
      const pkgsRes = await fetch(`${apiUrl}/tour-guide/packages`, { headers });
      if (pkgsRes.ok) {
        const pkgs = await pkgsRes.json();
        setPackagesList(pkgs.slice(0, 3)); // Only show top 3
      }

      // Fetch recent bookings
      const bookingsRes = await fetch(`${apiUrl}/tour-guide/bookings`, { headers });
      if (bookingsRes.ok) {
        const b = await bookingsRes.json();
        setBookingsList(b.slice(0, 3)); // Only show top 3
      }
    } catch (error) {
      console.error('Failed to fetch tour dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const handleNotificationPress = () => {
    router.push({ pathname: '/notifications', params: { module: 'guide' } } as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Header Gradient */}
        <LinearGradient
          colors={['#0F3D26', '#145334', '#0E5E2F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGradient, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greetingText}>Welcome back,</Text>
              <Text style={styles.headerTitle}>Guide Dashboard</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={[styles.headerIconButton, { marginRight: 10 }]}
                activeOpacity={0.7}
                onPress={handleNotificationPress}
              >
                <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => router.push('/tour-guide/settings' as any)}
              >
                <View style={styles.avatarCircle}>
                  <MaterialCommunityIcons name="account" size={24} color="#0F3D26" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={styles.statCard}
              activeOpacity={0.8}
              onPress={() => router.push('/tour-guide/packages' as any)}
            >
              <View style={styles.statIconWrap}>
                <MaterialCommunityIcons name="cube-outline" size={20} color="#0E5E2F" />
              </View>
              <View>
                <Text style={styles.statValue}>{stats.totalPackages}</Text>
                <Text style={styles.statLabel}>Packages</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              activeOpacity={0.8}
              onPress={() => router.push('/tour-guide/bookings' as any)}
            >
              <View style={[styles.statIconWrap, { backgroundColor: '#FFFBEB' }]}>
                <Ionicons name="calendar-outline" size={20} color="#D97706" />
              </View>
              <View>
                <Text style={styles.statValue}>{stats.activeBookings}</Text>
                <Text style={styles.statLabel}>Bookings</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="star-outline" size={20} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.statValue}>{stats.rating}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.mainContent}>
          {/* Quick Navigation Section */}
          <View style={styles.navSection}>
            <Text style={styles.navSectionTitle}>Quick Navigation</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.navScrollContent}
          >
            <TouchableOpacity
              style={styles.navCard}
              onPress={() => router.push('/tour-guide/insights' as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.navIconBg, { backgroundColor: '#EAF7EE' }]}>
                <Ionicons name="bar-chart-outline" size={16} color="#0E5E2F" />
              </View>
              <Text style={styles.navCardText}>Insights</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navCard}
              onPress={() => router.push('/tour-guide/packages' as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.navIconBg, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="cube-outline" size={16} color="#D97706" />
              </View>
              <Text style={styles.navCardText}>Packages</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navCard}
              onPress={() => router.push('/tour-guide/revenue' as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.navIconBg, { backgroundColor: '#EAF7EE' }]}>
                <Ionicons name="cash-outline" size={16} color="#0E5E2F" />
              </View>
              <Text style={styles.navCardText}>Revenue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navCard}
              onPress={() => router.push('/tour-guide/inquiries' as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.navIconBg, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#0284C7" />
              </View>
              <Text style={styles.navCardText}>Inquiries</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Tour Packages List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Packages</Text>
          <TouchableOpacity activeOpacity={0.6} onPress={() => router.push('/tour-guide/packages' as any)}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#0E5E2F" style={{ marginTop: 40 }} />
        ) : packagesList.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#6B7280' }}>No packages available.</Text>
        ) : (
          packagesList.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.packageCard}
              activeOpacity={0.9}
              onPress={() => router.push('/tour-guide/packages' as any)}
            >
              <Image 
                source={item.coverImageUrl ? { uri: item.coverImageUrl } : require('../../assets/Tours/Cultural Triangle.png')} 
                style={styles.packageImage} 
                contentFit="cover" 
              />
              
              <View style={styles.packageInfo}>
                <View style={styles.packageHeaderRow}>
                  <Text style={styles.packageTitle} numberOfLines={1}>{item.name}</Text>
                  <View style={[
                    styles.statusBadge, 
                    item.status === 'active' ? styles.statusActive : styles.statusInactive
                  ]}>
                    <Text style={[
                      styles.statusText,
                      item.status === 'active' ? styles.statusTextActive : styles.statusTextInactive
                    ]}>
                      {item.status === 'active' ? 'Active' : 'Draft'}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.packageCategory}>{item.category} • {item.duration} Days</Text>
                
                <View style={styles.packageFooter}>
                  <View style={styles.packageFooterItem}>
                    <Ionicons name="cash-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
                    <Text style={styles.packageFooterText}>Rs. {item.price} /pp</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color="#D1D5DB" />
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Recent Bookings Section */}
        <View style={[styles.sectionHeader, { marginTop: 12 }]}>
          <Text style={styles.sectionTitle}>Upcoming Schedule</Text>
        </View>

        <View>
          {loading ? (
            <ActivityIndicator size="small" color="#0E5E2F" style={{ margin: 20 }} />
          ) : bookingsList.length === 0 ? (
            <Text style={{ textAlign: 'center', margin: 20, color: '#6B7280' }}>No upcoming bookings.</Text>
          ) : (
            bookingsList.map((booking, _index) => {
              const dateObj = new Date(booking.startDate);
              const formattedDate = `${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • ${dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
              
              const displayStatus = booking.status === 'pending' ? 'UPCOMING' : booking.status.toUpperCase();
              
              return (
                <TouchableOpacity 
                  key={booking.id}
                  style={[styles.bookingsCardContainer, { marginBottom: 12 }]} 
                  activeOpacity={0.7} 
                  onPress={() => setSelectedBooking(booking)}
                >
                  <View style={styles.bookingIconContainer}>
                    <Ionicons name="calendar-outline" size={24} color="#0E5E2F" />
                  </View>
                  
                  <View style={styles.bookingDetailsContainer}>
                    <Text style={styles.bookingTitleText} numberOfLines={1}>
                      {booking.tourName || booking.customerName || 'Unknown Tour'}
                    </Text>
                    
                    <View style={styles.bookingInfoRow}>
                      <Ionicons name="time-outline" size={14} color="#6B7280" />
                      <Text style={styles.bookingInfoText}>{formattedDate}</Text>
                    </View>
                    
                    <View style={styles.bookingInfoRow}>
                      <Ionicons name="location-outline" size={14} color="#6B7280" />
                      <Text style={styles.bookingInfoText} numberOfLines={1}>
                        {booking.pickupLocation || '111'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.bookingRightContainer}>
                    <View style={styles.pillBadgeUpcoming}>
                      <Text style={styles.pillBadgeUpcomingText}>{displayStatus}</Text>
                    </View>
                    <Text style={styles.bookingGuestsText}>
                      {booking.guests ? `${booking.guests} bookings` : 'No bookings'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { bottom: insets.bottom + 24 }]} 
        activeOpacity={0.8}
        onPress={() => router.push('/tour-guide/addPackage' as any)}
      >
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.fabGradient}
        >
          <Feather name="plus" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Booking Details Modal */}
      <Modal
        visible={!!selectedBooking}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedBooking(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Booking Details</Text>
              <TouchableOpacity onPress={() => setSelectedBooking(null)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>

            {selectedBooking && (
              <ScrollView style={styles.modalContent}>
                <View style={styles.detailGroup}>
                  <Text style={styles.detailLabel}>Customer Name</Text>
                  <Text style={styles.detailValue}>{selectedBooking.customerName}</Text>
                </View>
                
                <View style={styles.detailGroup}>
                  <Text style={styles.detailLabel}>Phone Number</Text>
                  <Text style={styles.detailValue}>{selectedBooking.customerPhone || 'Not provided'}</Text>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={styles.detailLabel}>Pickup Location</Text>
                  {selectedBooking.pickupLocation ? (
                    <TouchableOpacity 
                      style={styles.locationLinkBtn}
                      activeOpacity={0.7}
                      onPress={() => openMap(selectedBooking.pickupLocation)}
                    >
                      <Text style={[styles.detailValue, { flex: 1, color: '#0E5E2F', textDecorationLine: 'underline' }]}>
                        {selectedBooking.pickupLocation}
                      </Text>
                      <Ionicons name="map" size={18} color="#0E5E2F" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.detailValue}>Not provided</Text>
                  )}
                </View>

                <View style={styles.detailGroup}>
                  <Text style={styles.detailLabel}>Special Requests</Text>
                  <Text style={styles.detailValue}>{selectedBooking.specialRequests || 'None'}</Text>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={styles.detailLabel}>Guests</Text>
                  <Text style={styles.detailValue}>{selectedBooking.guests} People</Text>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerGradient: {
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#0E5E2F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#0F3D26',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
  },
  mainContent: {
    marginTop: -20,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 32,
    zIndex: 1,
  },
  navSection: {
    marginBottom: 24,
  },
  navSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7C8A81',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.8,
  },
  navScrollContent: {
    paddingRight: 20,
  },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAEFEA',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  navIconBg: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navCardText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1917',
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1917',
    letterSpacing: -0.3,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E5E2F',
  },
  packageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 16,
    flexDirection: 'row',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F9FAFB',
  },
  packageImage: {
    width: 90,
    height: 90,
    borderRadius: 16,
  },
  packageInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  packageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  packageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
    flex: 1,
    marginRight: 8,
  },
  packageCategory: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: { backgroundColor: '#ECFDF5' },
  statusInactive: { backgroundColor: '#FEF2F2' },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusTextActive: { color: '#059669' },
  statusTextInactive: { color: '#DC2626' },
  packageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  packageFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  packageFooterText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  bookingsCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EAEFEA',
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  bookingDetailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  bookingTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 6,
  },
  bookingInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bookingInfoText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  bookingRightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  pillBadgeUpcoming: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
  },
  pillBadgeUpcomingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#374151',
    letterSpacing: 0.5,
  },
  bookingGuestsText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  bookingDivider: {
    height: 1,
    backgroundColor: '#F2F5F3',
    marginVertical: 12,
  },
  fab: {
    position: 'absolute',
    right: 24,
    zIndex: 100,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  modalContent: {
    paddingBottom: 20,
  },
  detailGroup: {
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#111',
    fontWeight: '500',
    lineHeight: 22,
  },
  locationLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
});

export default TourHomeScreen;
