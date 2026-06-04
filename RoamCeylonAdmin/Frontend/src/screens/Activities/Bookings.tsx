import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

interface BookingItem {
  id: string;
  guestName: string;
  guestAvatar?: string;
  guestInitials: string;
  avatarBg: string;
  activityName: string;
  guestCount: number;
  dateTime: string;
  amount: string;
  status: 'CONFIRMED' | 'PENDING' | 'COMPLETED';
}

const Bookings = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'ALL' | 'CONFIRMED' | 'PENDING' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const bookingsData: BookingItem[] = [
    {
      id: 'RC-2048',
      guestName: 'Amara Perera',
      guestAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80',
      guestInitials: 'AP',
      avatarBg: '#E1EFE6',
      activityName: 'Sunrise Yoga & Meditation',
      guestCount: 2,
      dateTime: 'Oct 24, 2023 • 06:00 AM',
      amount: 'LKR 21,700',
      status: 'CONFIRMED',
    },
    {
      id: 'RC-2049',
      guestName: 'James Wilson',
      guestAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
      guestInitials: 'JW',
      avatarBg: '#EAE1DF',
      activityName: 'Estate Tea Tasting',
      guestCount: 4,
      dateTime: 'Oct 25, 2023 • 02:00 PM',
      amount: 'LKR 88,400',
      status: 'CONFIRMED',
    },
    {
      id: 'RC-2050',
      guestName: 'Lina Schneider',
      guestAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
      guestInitials: 'LS',
      avatarBg: '#E0E5F5',
      activityName: 'Private Safari Tour',
      guestCount: 6,
      dateTime: 'Oct 26, 2023 • 09:00 AM',
      amount: 'LKR 145,000',
      status: 'PENDING',
    },
    {
      id: 'RC-2035',
      guestName: 'David Clark',
      guestInitials: 'DC',
      avatarBg: '#F3E8FF',
      activityName: 'Culinary Masterclass',
      guestCount: 3,
      dateTime: 'Oct 22, 2023 • 06:30 PM',
      amount: 'LKR 54,000',
      status: 'COMPLETED',
    },
    {
      id: 'RC-2031',
      guestName: 'Sarah Jenkins',
      guestAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80',
      guestInitials: 'SJ',
      avatarBg: '#FEF3C7',
      activityName: 'Sunrise Yoga & Meditation',
      guestCount: 1,
      dateTime: 'Oct 20, 2023 • 06:00 AM',
      amount: 'LKR 10,850',
      status: 'COMPLETED',
    },
  ];

  const filteredBookings = bookingsData.filter((booking) => {
    // Filter by tab
    if (activeTab !== 'ALL' && booking.status !== activeTab) {
      return false;
    }
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        booking.guestName.toLowerCase().includes(query) ||
        booking.activityName.toLowerCase().includes(query) ||
        booking.id.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getStatusStyle = (status: BookingItem['status']) => {
    switch (status) {
      case 'CONFIRMED':
        return { bg: '#EAF7EE', text: '#0E5E2F' };
      case 'PENDING':
        return { bg: '#FFF7ED', text: '#D97706' };
      case 'COMPLETED':
        return { bg: '#F3F4F6', text: '#4B5563' };
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.menuButton} activeOpacity={0.7}>
            <Ionicons name="menu-outline" size={28} color="#172B1E" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Guest</Text>
            <Text style={styles.headerTitle}>Bookings</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={24} color="#172B1E" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton} activeOpacity={0.7}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80',
              }}
              style={styles.profileImage as any}
              contentFit="cover"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filters Section */}
      <View style={styles.topControlContainer}>
        {/* Search Input */}
        <View style={styles.searchSection}>
          <Ionicons name="search-outline" size={20} color="#7D8A82" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search guest, activity, or ID..."
            placeholderTextColor="#7D8A82"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color="#7D8A82" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.filterIconButton} activeOpacity={0.7}>
              <Feather name="sliders" size={18} color="#0E5E2F" />
            </TouchableOpacity>
          )}
        </View>

        {/* Horizontal Filters Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScrollView}
          contentContainerStyle={styles.tabsContent}
        >
          {(['ALL', 'CONFIRMED', 'PENDING', 'COMPLETED'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tabButton,
                activeTab === tab && styles.tabButtonActive,
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === tab && styles.tabButtonTextActive,
                ]}
              >
                {tab.charAt(0) + tab.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bookings List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={48} color="#7D8A82" />
            <Text style={styles.emptyTitle}>No bookings found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search filters.</Text>
          </View>
        ) : (
          filteredBookings.map((booking) => {
            const statusTheme = getStatusStyle(booking.status);
            return (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.guestInfoCol}>
                    {booking.guestAvatar ? (
                      <Image
                        source={{ uri: booking.guestAvatar }}
                        style={styles.guestAvatar as any}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.avatarFallback, { backgroundColor: booking.avatarBg }]}>
                        <Text style={styles.avatarFallbackText}>{booking.guestInitials}</Text>
                      </View>
                    )}
                    <View style={styles.guestDetails}>
                      <Text style={styles.guestName}>{booking.guestName}</Text>
                      <Text style={styles.bookingId}>ID: {booking.id}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusTheme.bg }]}>
                    <Text style={[styles.statusText, { color: statusTheme.text }]}>{booking.status}</Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.bookingDetailsRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Activity</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {booking.activityName}
                    </Text>
                  </View>
                  <View style={[styles.detailItem, { maxWidth: '25%', alignItems: 'flex-end' }]}>
                    <Text style={styles.detailLabel}>Guests</Text>
                    <Text style={styles.detailValue}>
                      {booking.guestCount} {booking.guestCount === 1 ? 'Guest' : 'Guests'}
                    </Text>
                  </View>
                </View>

                <View style={styles.bookingDetailsRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Date & Time</Text>
                    <View style={styles.dateTimeRow}>
                      <Feather name="calendar" size={14} color="#0E5E2F" style={{ marginRight: 4 }} />
                      <Text style={styles.detailValue}>{booking.dateTime}</Text>
                    </View>
                  </View>
                  <View style={[styles.detailItem, { maxWidth: '30%', alignItems: 'flex-end' }]}>
                    <Text style={styles.detailLabel}>Amount Paid</Text>
                    <Text style={[styles.detailValue, styles.amountValue]}>
                      {booking.amount}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.actionButtonOutline} activeOpacity={0.7}>
                    <Feather name="mail" size={14} color="#0E5E2F" style={{ marginRight: 4 }} />
                    <Text style={styles.actionButtonOutlineText}>Message</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButtonSolid} activeOpacity={0.7}>
                    <Text style={styles.actionButtonSolidText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
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
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F1',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitleContainer: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0E5E2F',
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#F7FAF8',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#0E5E2F',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  topControlContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EAF2EC',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAF8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAF2EC',
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#172B1E',
    fontWeight: '600',
  },
  clearButton: {
    padding: 4,
  },
  filterIconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E2EFE7',
  },
  tabsScrollView: {
    marginTop: 12,
  },
  tabsContent: {
    paddingRight: 10,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  tabButtonActive: {
    backgroundColor: '#0E5E2F',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#172B1E',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7D8A82',
    marginTop: 4,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guestInfoCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guestAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarFallbackText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0E5E2F',
  },
  guestDetails: {
    justifyContent: 'center',
  },
  guestName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#172B1E',
  },
  bookingId: {
    fontSize: 12,
    color: '#7D8A82',
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F0F3F1',
    marginVertical: 14,
  },
  bookingDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#7D8A82',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    color: '#172B1E',
    fontWeight: '700',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountValue: {
    color: '#0E5E2F',
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  actionButtonOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0E5E2F',
    borderRadius: 14,
    paddingVertical: 10,
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  actionButtonOutlineText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E5E2F',
  },
  actionButtonSolid: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E5E2F',
    borderRadius: 14,
    paddingVertical: 10,
  },
  actionButtonSolidText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default Bookings;
