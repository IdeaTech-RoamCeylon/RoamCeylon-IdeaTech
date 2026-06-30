import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useNotifications } from '../../utils/notificationsStore';
import * as SecureStore from 'expo-secure-store';

const ActivitiesHome = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { unreadCount } = useNotifications();

  // State
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeActivities: 0,
    totalBookings: 0,
    rating: '4.9',
  });
  const [activitiesList, setActivitiesList] = useState<any[]>([]);
  const [scheduledBookings, setScheduledBookings] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const accessToken = await SecureStore.getItemAsync('authToken');
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';

      if (!accessToken) return;

      const headers = { Authorization: `Bearer ${accessToken}` };

      // Fetch dashboard stats
      const statsRes = await fetch(`${apiUrl}/activities/dashboard`, { headers });
      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats({
          activeActivities: d.activeActivities || 0,
          totalBookings: d.totalBookings || 0,
          rating: d.rating || '4.9',
        });
      }

      // Fetch recent activities
      const activitiesRes = await fetch(`${apiUrl}/activities/list`, { headers });
      if (activitiesRes.ok) {
        const acts = await activitiesRes.json();
        setActivitiesList(acts.slice(0, 3)); // Only show top 3
      }

      // Fetch upcoming schedule
      const scheduleRes = await fetch(`${apiUrl}/activities/schedule`, { headers });
      if (scheduleRes.ok) {
        const sched = await scheduleRes.json();
        setScheduledBookings(sched.slice(0, 3));
      }
    } catch (error) {
      console.error('Failed to fetch activity dashboard data:', error);
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
    router.push({ pathname: '/notifications', params: { module: 'activity' } } as any);
  };

  const getStatusStyle = (status: string) => {
    if (status === 'active') return { badge: styles.statusActive, text: styles.statusTextActive, label: 'Active' };
    if (status === 'inactive') return { badge: styles.statusInactive, text: styles.statusTextInactive, label: 'Inactive' };
    return { badge: styles.statusDraft, text: styles.statusTextDraft, label: 'Draft' };
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
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
            <Text style={styles.headerTitle}>Activity Dashboard</Text>
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
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={() => router.push('/activities/settings' as any)}
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
            onPress={() => router.push('/activities/active' as any)}
          >
            <View style={styles.statIconWrap}>
              <MaterialCommunityIcons name="ticket-outline" size={20} color="#0E5E2F" />
            </View>
            <View>
              <Text style={styles.statValue}>{stats.activeActivities}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.statCard}
            activeOpacity={0.8}
            onPress={() => router.push('/activities/bookings' as any)}
          >
            <View style={[styles.statIconWrap, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="calendar-outline" size={20} color="#D97706" />
            </View>
            <View>
              <Text style={styles.statValue}>{stats.totalBookings}</Text>
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

      <View style={styles.scrollContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Activities</Text>
          <TouchableOpacity 
            activeOpacity={0.6}
            onPress={() => router.push('/activities/active' as any)}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#0E5E2F" style={{ marginTop: 40 }} />
        ) : activitiesList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="ticket-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No activities yet</Text>
            <Text style={styles.emptySubtitle}>Tap the + button to create your first activity</Text>
          </View>
        ) : (
          activitiesList.map((activity) => {
            const statusInfo = getStatusStyle(activity.status);
            return (
              <TouchableOpacity 
                key={activity.id}
                style={styles.activityCard}
                activeOpacity={0.9}
                onPress={() => router.push({ pathname: '/activities/update', params: { id: activity.id } } as any)}
              >
                {activity.coverImageUrl ? (
                  <Image 
                    source={{ uri: activity.coverImageUrl }} 
                    style={styles.activityImage} 
                    contentFit="cover" 
                  />
                ) : (
                  <View style={[styles.activityImage, { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }]}>
                    <MaterialCommunityIcons name="image-outline" size={32} color="#9CA3AF" />
                  </View>
                )}
                <View style={styles.activityInfo}>
                  <View style={styles.activityHeaderRow}>
                    <Text style={styles.activityName} numberOfLines={1}>{activity.name}</Text>
                    <View style={[styles.statusBadge, statusInfo.badge]}>
                      <Text style={[styles.statusText, statusInfo.text]}>{statusInfo.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.activityCategory} numberOfLines={1}>
                    {activity.category} • {activity.startTime && activity.endTime ? `${activity.startTime} - ${activity.endTime}` : activity.difficulty}
                  </Text>
                  <View style={styles.activityFooter}>
                    <View style={styles.activityFooterItem}>
                      <Ionicons name="location-outline" size={14} color="#6B7280" />
                      <Text style={styles.activityFooterText} numberOfLines={1}>{activity.location || 'No location'}</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#D1D5DB" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={[styles.sectionHeader, { marginTop: 12 }]}>
          <Text style={styles.sectionTitle}>Upcoming Schedule</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#0E5E2F" style={{ margin: 20 }} />
        ) : scheduledBookings.length === 0 ? (
          <Text style={{ textAlign: 'center', margin: 20, color: '#6B7280' }}>No upcoming bookings.</Text>
        ) : (
          scheduledBookings.map((booking) => {
            const dateObj = new Date(booking.scheduledDate);
            const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const isConfirmed = booking.status === 'confirmed';
            return (
              <TouchableOpacity 
                key={booking.id}
                style={[styles.bookingsCardContainer, { marginBottom: 12 }]} 
                activeOpacity={0.7}
              >
                <View style={styles.bookingRow}>
                  <View style={styles.bookingLeft}>
                    <Text style={styles.bookingMainText}>
                      {booking.activity?.name || 'Activity'}
                    </Text>
                    <Text style={styles.bookingDateText}>
                      {booking.activity?.location || ''} • {booking.activity?.startTime || ''} ({formattedDate})
                    </Text>
                  </View>
                  <View style={styles.bookingRight}>
                    <Text style={styles.bookingAmount}>
                      {booking.guests}/{booking.activity?.maxParticipants || 20} Booked
                    </Text>
                    <View style={[styles.pillBadge, isConfirmed ? styles.pillBadgeSuccess : styles.pillBadgeWarning, { marginTop: 6, alignSelf: 'flex-end' }]}>
                      <Text style={[styles.pillBadgeText, isConfirmed ? styles.pillBadgeSuccessText : styles.pillBadgeWarningText]}>
                        {booking.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

      </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { bottom: insets.bottom + 24 }]} 
        activeOpacity={0.8}
        onPress={() => router.push('/activities/new' as any)}
      >
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.fabGradient}
        >
          <Feather name="plus" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
    paddingHorizontal: 20,
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
    marginTop: -20,
    paddingTop: 40,
    paddingHorizontal: 20,
    zIndex: 1,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#172B1E',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 20,
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
  activityImage: {
    width: 90,
    height: 90,
    borderRadius: 16,
  },
  activityInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  activityHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
    flex: 1,
    marginRight: 8,
  },
  activityCategory: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: { backgroundColor: '#ECFDF5' },
  statusInactive: { backgroundColor: '#FEF2F2' },
  statusDraft: { backgroundColor: '#F3F4F6' },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusTextActive: { color: '#059669' },
  statusTextInactive: { color: '#DC2626' },
  statusTextDraft: { color: '#4B5563' },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  activityFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  activityFooterText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  bookingsCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EAEFEA',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingLeft: {
    flex: 1,
    marginRight: 10,
  },
  bookingMainText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1917',
  },
  bookingDateText: {
    fontSize: 11,
    color: '#8A958E',
    marginTop: 2,
    fontWeight: '500',
  },
  bookingRight: {
    alignItems: 'flex-end',
  },
  bookingAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1917',
  },
  pillBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillBadgeSuccess: {
    backgroundColor: '#EAF7EE',
    borderWidth: 0.5,
    borderColor: '#C2F3D0',
  },
  pillBadgeWarning: {
    backgroundColor: '#FFFBEB',
    borderWidth: 0.5,
    borderColor: '#FEF3C7',
  },
  pillBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  pillBadgeSuccessText: {
    color: '#0E5E2F',
  },
  pillBadgeWarningText: {
    color: '#D97706',
  },
  fab: {
    position: 'absolute',
    right: 24,
    zIndex: 100,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ActivitiesHome;
