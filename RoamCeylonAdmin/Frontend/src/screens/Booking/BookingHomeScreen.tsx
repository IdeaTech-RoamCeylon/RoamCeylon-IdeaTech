import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

const BookingHomeScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('nhostRefreshToken');
      router.replace('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Mock data for check-ins
  const checkIns = [
    {
      id: '1',
      name: 'Eleanor Richards',
      room: 'Ocean View Suite',
      status: 'Arriving Soon',
      statusType: 'success', // green badge
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: '2',
      name: 'Marcus Chen',
      room: 'Deluxe double',
      status: 'ETA: 2:00 PM',
      statusType: 'info', // beige badge
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: '3',
      name: 'Sarah Jenkins',
      room: 'Standard King',
      status: 'ETA: 4:30 PM',
      statusType: 'info', // beige badge
      initials: 'SJ',
    },
  ];

  // Quick Action list
  const quickActions = [
    {
      id: 'update_inventory',
      title: 'Update Inventory',
      icon: 'archive-outline',
      route: '/booking/rooms',
    },
    {
      id: 'view_calendar',
      title: 'View Calendar',
      icon: 'calendar-outline',
      route: '/booking/calendar',
    },
    {
      id: 'guest_messages',
      title: 'Guest Messages',
      icon: 'chatbubble-ellipses-outline',
      route: '/booking/messages',
    },
    {
      id: 'manage_rooms',
      title: 'Manage Rooms',
      icon: 'bed-outline',
      route: '/booking/rooms',
    },
    {
      id: 'view_hotel_details',
      title: 'View Hotel Details',
      icon: 'business-outline',
      route: '/booking/details',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        {/* Left Custom Globe + Search Icon */}
        <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
          <View style={styles.globeIconContainer}>
            <Ionicons name="earth-outline" size={24} color="#5B600A" />
            <View style={styles.searchOverlay}>
              <Ionicons name="search" size={10} color="#5B600A" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Center Logo Text */}
        <Text style={styles.logoText}>RoamCeylon</Text>

        {/* Right Notification Bell */}
        <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={24} color="#5B600A" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome back, Grand Emerald Resort</Text>
          <Text style={styles.welcomeSubtitle}>
            Here is what's happening at your property today.
          </Text>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          {/* Card 1: Occupancy */}
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="bed-outline" size={20} color="#5C605D" />
              </View>
              <View style={styles.trendBadge}>
                <Text style={styles.trendText}>+4% vs last week</Text>
              </View>
            </View>
            <Text style={styles.metricLabel}>Occupancy</Text>
            <Text style={styles.metricValue}>88%</Text>
          </View>

          {/* Card 2: Today's Check-ins */}
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="briefcase-outline" size={20} color="#5C605D" />
              </View>
            </View>
            <Text style={styles.metricLabel}>Today's Check-ins</Text>
            <Text style={styles.metricValue}>14</Text>
          </View>

          {/* Card 3: Revenue Today (Forest Green Background) */}
          <View style={[styles.metricCard, styles.revenueCard]}>
            {/* Background Circles Decoration */}
            <View style={styles.bgCircle1} />
            <View style={styles.bgCircle2} />

            <View style={styles.metricHeader}>
              <View style={[styles.iconCircle, styles.revenueIconCircle]}>
                <Ionicons name="cash-outline" size={20} color="#E5C158" />
              </View>
              <View style={styles.revenueTrendBadge}>
                <Text style={styles.revenueTrendText}>+12%</Text>
              </View>
            </View>
            <Text style={styles.revenueLabel}>Revenue Today</Text>
            <Text style={styles.revenueValue}>$2.4k</Text>
          </View>
        </View>

        {/* Upcoming Check-ins Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Check-ins</Text>
          <TouchableOpacity activeOpacity={0.6}>
            <Text style={styles.viewAllButton}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.checkInsCard}>
          {checkIns.map((item, index) => (
            <View key={item.id}>
              <TouchableOpacity
                style={styles.checkInRow}
                onPress={() => router.push('/booking/details' as any)}
                activeOpacity={0.7}
              >
                {/* Guest Avatar */}
                {item.avatar ? (
                  <Image
                    source={{ uri: item.avatar }}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.initialsAvatar}>
                    <Text style={styles.initialsText}>{item.initials}</Text>
                  </View>
                )}

                {/* Guest Details */}
                <View style={styles.guestInfo}>
                  <Text style={styles.guestName}>{item.name}</Text>
                  <Text style={styles.roomType}>{item.room}</Text>
                </View>

                {/* Status Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    item.statusType === 'success' ? styles.statusBadgeSuccess : styles.statusBadgeInfo,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      item.statusType === 'success' ? styles.statusTextSuccess : styles.statusTextInfo,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Divider */}
              {index < checkIns.length - 1 && <View style={styles.rowDivider} />}
            </View>
          ))}
        </View>

        {/* Quick Actions Section */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsContainer}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name={action.icon as any} size={22} color="#0E5E2F" />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Ionicons name="chevron-forward-outline" size={18} color="#A3A3A3" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#dc3545" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F1',
    zIndex: 10,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  globeIconContainer: {
    width: 28,
    height: 28,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchOverlay: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 1,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#5B600A',
    letterSpacing: -0.2,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#dc3545',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  welcomeSection: {
    marginBottom: 28,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0E5E2F',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#60646C',
    marginTop: 8,
    lineHeight: 20,
  },
  metricsGrid: {
    marginBottom: 32,
    gap: 16,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 20,
    shadowColor: '#0E5E2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 10,
    elevation: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F5F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    backgroundColor: '#EAF7EE',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0E5E2F',
  },
  metricLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A4A4A',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1C1917',
  },
  revenueCard: {
    backgroundColor: '#01261B',
    borderColor: '#01261B',
    overflow: 'hidden',
    position: 'relative',
  },
  revenueIconCircle: {
    backgroundColor: 'rgba(229, 193, 88, 0.15)',
  },
  revenueTrendBadge: {
    backgroundColor: 'rgba(229, 193, 88, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  revenueTrendText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E5C158',
  },
  revenueLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E5C158',
    marginBottom: 6,
    opacity: 0.9,
  },
  revenueValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#E5C158',
  },
  bgCircle1: {
    position: 'absolute',
    right: -20,
    bottom: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(229, 193, 88, 0.05)',
  },
  bgCircle2: {
    position: 'absolute',
    right: 40,
    bottom: -60,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(229, 193, 88, 0.03)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  viewAllButton: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5B600A',
  },
  checkInsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 16,
    marginBottom: 32,
  },
  checkInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
  },
  initialsAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EAF7EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E5E2F',
  },
  guestInfo: {
    flex: 1,
    marginLeft: 14,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 4,
  },
  roomType: {
    fontSize: 14,
    color: '#7C8A82',
    fontWeight: '500',
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusBadgeSuccess: {
    backgroundColor: '#CDE5D8',
  },
  statusBadgeInfo: {
    backgroundColor: '#F3F4ED',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusTextSuccess: {
    color: '#0A4D26',
  },
  statusTextInfo: {
    color: '#494D3E',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F2',
  },
  quickActionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 16,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F5F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
    marginLeft: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#dc3545',
    height: 52,
    marginTop: 24,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc3545',
  },
});

export default BookingHomeScreen;
