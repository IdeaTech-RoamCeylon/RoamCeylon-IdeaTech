import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const BookingManagement = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('All');

  // Mock reservations data
  const reservations = [
    {
      id: '1',
      guestName: 'Amara Perera',
      bookingId: '#BK-882212',
      status: 'CONFIRMED',
      statusType: 'confirmed',
      avatarType: 'person',
      room: 'Ocean Deluxe Suite',
      duration: '4 Nights, Oct 12-16',
      guests: '2 Adults, 1 Child',
      footerType: 'details',
      footerIcon: 'ellipsis-vertical',
    },
    {
      id: '2',
      guestName: 'James Wilson',
      bookingId: '#BK-991045',
      status: 'PENDING',
      statusType: 'pending',
      avatarType: 'person',
      room: 'Jungle View Pavilion',
      duration: '2 Nights, Oct 14-16',
      guests: '2 Adults',
      footerType: 'approve_reject',
    },
    {
      id: '3',
      guestName: 'Sarah Connor',
      bookingId: '#BK-775621',
      status: 'CHECKED-IN',
      statusType: 'checked_in',
      avatarType: 'key',
      room: 'Garden Terrace',
      duration: '5 Nights, Oct 08-13',
      guests: '1 Adult',
      footerType: 'manage_stay',
      footerIcon: 'notifications-outline',
    },
    {
      id: '4',
      guestName: 'Li Wei',
      bookingId: '#BK-552901',
      status: 'CONFIRMED',
      statusType: 'confirmed',
      avatarType: 'person',
      room: 'Grand Presidential Loft',
      duration: '7 Nights, Nov 01-08',
      guests: '2 Adults',
      footerType: 'details',
      footerIcon: 'pencil',
    },
  ];

  const filteredReservations = reservations.filter((res) => {
    // Basic tab filtering
    if (selectedTab === 'Confirmed' && res.statusType !== 'confirmed') return false;
    if (selectedTab === 'Checked-in' && res.statusType !== 'checked_in') return false;

    // Search query filtering
    if (searchQuery.trim() === '') return true;
    return (
      res.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.bookingId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={28} color="#1C1917" />
        </TouchableOpacity>

        {/* Center Logo Text */}
        <Text style={styles.logoText}>Roam Ceylon</Text>

        {/* Right User Avatar */}
        <TouchableOpacity style={styles.avatarButton} activeOpacity={0.7} onPress={() => router.push('/booking/settings' as any)}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' }}
            style={styles.headerAvatar}
            contentFit="cover"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Manage Bookings</Text>
          <Text style={styles.subtitle}>
            Oversee your upcoming guest stays and availability.
          </Text>
        </View>

        {/* Search & Filter Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#8E8E93" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search guests or ID..."
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.filterIconButton} activeOpacity={0.7}>
            <Ionicons name="options-outline" size={22} color="#1C1917" />
          </TouchableOpacity>
        </View>

        {/* Segmented Filter Pills */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'All' && styles.tabButtonActive]}
            onPress={() => setSelectedTab('All')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, selectedTab === 'All' && styles.tabTextActive]}>
              All Reservations
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'Confirmed' && styles.tabButtonActive]}
            onPress={() => setSelectedTab('Confirmed')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, selectedTab === 'Confirmed' && styles.tabTextActive]}>
              Confirmed (24)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'Checked-in' && styles.tabButtonActive]}
            onPress={() => setSelectedTab('Checked-in')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, selectedTab === 'Checked-in' && styles.tabTextActive]}>
              Checked-in (12)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Booking Cards List */}
        <View style={styles.cardsList}>
          {filteredReservations.map((res) => (
            <View key={res.id} style={styles.bookingCard}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.avatarIconContainer}>
                  <Ionicons
                    name={res.avatarType === 'key' ? 'key-outline' : 'person-outline'}
                    size={22}
                    color="#0E5E2F"
                  />
                </View>

                <View style={styles.guestMeta}>
                  <Text style={styles.guestName}>{res.guestName}</Text>
                  <Text style={styles.bookingId}>{res.bookingId}</Text>
                </View>

                {/* Status Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    res.statusType === 'confirmed' && styles.statusBadgeConfirmed,
                    res.statusType === 'pending' && styles.statusBadgePending,
                    res.statusType === 'checked_in' && styles.statusBadgeCheckedIn,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      res.statusType === 'confirmed' && styles.statusTextConfirmed,
                      res.statusType === 'pending' && styles.statusTextPending,
                      res.statusType === 'checked_in' && styles.statusTextCheckedIn,
                    ]}
                  >
                    {res.status}
                  </Text>
                </View>
              </View>

              {/* Card Body Details */}
              <View style={styles.cardBody}>
                {/* Room row */}
                <View style={styles.detailRow}>
                  <Ionicons
                    name={res.room.includes('Pavilion') ? 'home-outline' : (res.room.includes('Terrace') ? 'business-outline' : 'bed-outline')}
                    size={18}
                    color="#5B600A"
                    style={styles.detailIcon}
                  />
                  <Text style={styles.detailText}>{res.room}</Text>
                </View>

                {/* Duration row */}
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={18} color="#5B600A" style={styles.detailIcon} />
                  <Text style={styles.detailText}>{res.duration}</Text>
                </View>

                {/* Guests count row */}
                <View style={styles.detailRow}>
                  <Ionicons name="people-outline" size={18} color="#5B600A" style={styles.detailIcon} />
                  <Text style={styles.detailText}>{res.guests}</Text>
                </View>
              </View>

              {/* Card Footer Actions */}
              <View style={styles.cardFooter}>
                {res.footerType === 'details' && (
                  <>
                    <TouchableOpacity
                      style={styles.largeButtonOutline}
                      onPress={() => router.push('/booking/details' as any)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.largeButtonTextOutline}>Details</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.circleActionButton} activeOpacity={0.7}>
                      <Ionicons name={res.footerIcon as any} size={20} color="#1C1917" />
                    </TouchableOpacity>
                  </>
                )}

                {res.footerType === 'manage_stay' && (
                  <>
                    <TouchableOpacity
                      style={styles.largeButtonOutline}
                      onPress={() => router.push('/booking/details' as any)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.largeButtonTextOutline}>Manage Stay</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.circleActionButton} activeOpacity={0.7}>
                      <Ionicons name={res.footerIcon as any} size={20} color="#1C1917" />
                    </TouchableOpacity>
                  </>
                )}

                {res.footerType === 'approve_reject' && (
                  <View style={styles.buttonGroup}>
                    <TouchableOpacity style={styles.approveButton} activeOpacity={0.8}>
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.rejectButton} activeOpacity={0.8}>
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    zIndex: 10,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -10,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0E5E2F',
    letterSpacing: -0.2,
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: -10,
  },
  headerAvatar: {
    width: '100%',
    height: '100%',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 20,
  },
  titleSection: {
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0D3823',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#60646C',
    marginTop: 6,
    lineHeight: 20,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    shadowColor: '#0E5E2F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1C1917',
    height: '100%',
    padding: 0,
  },
  filterIconButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0E5E2F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  tabButton: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E5C158',
  },
  tabButtonActive: {
    backgroundColor: '#E5C158',
    borderColor: '#E5C158',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5B600A',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  cardsList: {
    gap: 16,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 20,
    shadowColor: '#0E5E2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EAF7EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestMeta: {
    flex: 1,
    marginLeft: 14,
  },
  guestName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 4,
  },
  bookingId: {
    fontSize: 13,
    color: '#7C8A82',
    fontWeight: '600',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeConfirmed: {
    backgroundColor: '#CDE5D8',
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeCheckedIn: {
    backgroundColor: '#E2ECE9',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTextConfirmed: {
    color: '#0E5E2F',
  },
  statusTextPending: {
    color: '#D97706',
  },
  statusTextCheckedIn: {
    color: '#475569',
  },
  cardBody: {
    gap: 10,
    marginBottom: 20,
    paddingLeft: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 12,
  },
  detailText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#494D49',
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  largeButtonOutline: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#0E5E2F',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  largeButtonTextOutline: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E5E2F',
  },
  circleActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F5F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  approveButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#E5C158',
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rejectButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#D8E5E0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  rejectButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7C8A82',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5B600A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5B600A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
});

export default BookingManagement;
