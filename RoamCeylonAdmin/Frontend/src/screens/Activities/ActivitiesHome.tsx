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
        
        const bookingsList = (sched.bookings || []).map((b: any) => ({
          ...b,
          type: 'booking',
          sortDate: b.scheduledDate,
        }));
        
        const actsList = (sched.upcomingActivities || []).map((a: any) => ({
          id: 'act_' + a.id,
          activity: a,
          type: 'activity',
          status: 'upcoming',
          scheduledDate: a.date,
          sortDate: a.date,
        }));
        
        const combined = [...bookingsList, ...actsList]
          .sort((a, b) => new Date(a.sortDate).getTime() - new Date(b.sortDate).getTime())
          .slice(0, 5);
          
        setScheduledBookings(combined);
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
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
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
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
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
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="hiking" size={36} color="#0E5E2F" />
            </View>
            <Text style={styles.emptyTitle}>No activities yet</Text>
            <Text style={styles.emptySubtitle}>Create your first activity to start{'\n'}managing bookings and schedules</Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              activeOpacity={0.8}
              onPress={() => router.push('/activities/new' as any)}
            >
              <Feather name="plus" size={16} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Create Activity</Text>
            </TouchableOpacity>
          </View>
        ) : (
          activitiesList.map((activity) => {
            const statusInfo = getStatusStyle(activity.status);
            const formattedPrice = activity.price > 0 
              ? `LKR ${Number(activity.price).toLocaleString()}` 
              : 'Free';
            return (
              <TouchableOpacity 
                key={activity.id}
                style={styles.activityCard}
                activeOpacity={0.95}
                onPress={() => router.push({ pathname: '/activities/update', params: { id: activity.id } } as any)}
              >
                {/* Image Section */}
                <View style={styles.cardImageContainer}>
                  {activity.coverImageUrl ? (
                    <Image 
                      source={{ uri: activity.coverImageUrl }} 
                      style={styles.activityImage} 
                      contentFit="cover" 
                      transition={200}
                    />
                  ) : (
                    <LinearGradient
                      colors={['#E8F5E9', '#C8E6C9']}
                      style={[styles.activityImage, styles.activityImagePlaceholder]}
                    >
                      <MaterialCommunityIcons name="image-area" size={30} color="#81C784" />
                    </LinearGradient>
                  )}
                  {/* Gradient overlay for contrast */}
                  <LinearGradient
                    colors={['rgba(0,0,0,0.25)', 'transparent', 'rgba(0,0,0,0.4)']}
                    locations={[0, 0.4, 1]}
                    style={styles.imageOverlay}
                  />
                  {/* Status pill */}
                  <View style={[styles.statusBadge, statusInfo.badge]}>
                    <View style={[styles.statusDot, { backgroundColor: statusInfo.text.color }]} />
                    <Text style={[styles.statusText, statusInfo.text]}>{statusInfo.label}</Text>
                  </View>
                  {/* Bottom image info */}
                  <View style={styles.imageBottomRow}>
                    <View style={styles.imageBadge}>
                      <MaterialCommunityIcons 
                        name={activity.difficulty === 'hard' ? 'fire' : activity.difficulty === 'medium' ? 'signal-cellular-2' : 'leaf'} 
                        size={11} 
                        color="#FFFFFF" 
                      />
                      <Text style={styles.imageBadgeText}>
                        {(activity.difficulty || 'easy').charAt(0).toUpperCase() + (activity.difficulty || 'easy').slice(1)}
                      </Text>
                    </View>
                    {activity._count?.bookings > 0 && (
                      <View style={styles.imageBadge}>
                        <Ionicons name="people" size={11} color="#FFFFFF" />
                        <Text style={styles.imageBadgeText}>{activity._count.bookings} booked</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Content Section */}
                <View style={styles.cardContent}>
                  <View style={styles.cardTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.activityName} numberOfLines={1}>{activity.name}</Text>
                      <View style={styles.categoryRow}>
                        <View style={styles.categoryDot} />
                        <Text style={styles.categoryText}>{activity.category}</Text>
                      </View>
                    </View>
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceText}>{formattedPrice}</Text>
                      {activity.price > 0 && <Text style={styles.priceUnit}>/person</Text>}
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.cardBottomRow}>
                    <View style={styles.infoItem}>
                      <Ionicons name="location-outline" size={13} color="#6B7280" />
                      <Text style={styles.infoItemText} numberOfLines={1}>{activity.location || 'No location set'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Ionicons name="time-outline" size={13} color="#6B7280" />
                      <Text style={styles.infoItemText}>
                        {activity.date ? `${new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ` : ''}
                        {activity.startTime && activity.endTime 
                          ? `${activity.startTime} – ${activity.endTime}` 
                          : 'Flexible timing'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardActionRow}>
                    <View style={styles.participantsChip}>
                      <Ionicons name="people-outline" size={13} color="#0E5E2F" />
                      <Text style={styles.participantsText}>{activity.maxParticipants || 20} spots</Text>
                    </View>
                    <View style={styles.editHint}>
                      <Text style={styles.editHintText}>Edit</Text>
                      <Feather name="chevron-right" size={14} color="#0E5E2F" />
                    </View>
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
          scheduledBookings.map((item) => {
            const dateObj = new Date(item.scheduledDate);
            const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const isBooking = item.type === 'booking';
            const isConfirmed = item.status === 'confirmed';
            
            return (
              <TouchableOpacity 
                key={item.id}
                style={styles.scheduleCard} 
                activeOpacity={0.7}
              >
                <View style={styles.scheduleIconWrap}>
                  <Ionicons name={isBooking ? "ticket-outline" : "calendar-outline"} size={22} color="#0E5E2F" />
                </View>
                
                <View style={styles.scheduleContent}>
                  <Text style={styles.scheduleTitle} numberOfLines={1}>
                    {item.activity?.name || 'Activity'}
                  </Text>
                  
                  <View style={styles.scheduleInfoRow}>
                    <Ionicons name="time-outline" size={12} color="#6B7280" />
                    <Text style={styles.scheduleInfoText}>
                      {formattedDate} • {item.activity?.startTime || ''}
                    </Text>
                  </View>
                  
                  <View style={styles.scheduleInfoRow}>
                    <Ionicons name="location-outline" size={12} color="#6B7280" />
                    <Text style={styles.scheduleInfoText} numberOfLines={1}>
                      {item.activity?.location || 'No location specified'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.scheduleRight}>
                  <View style={[
                    styles.scheduleStatusBadge, 
                    isConfirmed ? styles.badgeSuccess : (isBooking ? styles.badgeWarning : styles.badgeNeutral)
                  ]}>
                    <Text style={[
                      styles.scheduleStatusText, 
                      isConfirmed ? styles.badgeSuccessText : (isBooking ? styles.badgeWarningText : styles.badgeNeutralText)
                    ]}>
                      {isBooking ? (isConfirmed ? 'Confirmed' : 'Pending') : 'Upcoming'}
                    </Text>
                  </View>
                  
                  {isBooking ? (
                    <Text style={styles.scheduleSpots}>
                      {item.guests}/{item.activity?.maxParticipants || 20} spots
                    </Text>
                  ) : (
                    <Text style={styles.scheduleSpotsEmpty}>
                      No bookings
                    </Text>
                  )}
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
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E5E2F',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 16,
    shadowColor: '#0E5E2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F3F1',
  },
  cardImageContainer: {
    position: 'relative',
    height: 148,
  },
  activityImage: {
    width: '100%',
    height: '100%',
  },
  activityImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusActive: { backgroundColor: 'rgba(255, 255, 255, 0.92)' },
  statusInactive: { backgroundColor: 'rgba(255, 255, 255, 0.92)' },
  statusDraft: { backgroundColor: 'rgba(255, 255, 255, 0.92)' },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statusTextActive: { color: '#059669' },
  statusTextInactive: { color: '#DC2626' },
  statusTextDraft: { color: '#6B7280' },
  imageBottomRow: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    gap: 6,
  },
  imageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  imageBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardContent: {
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  activityName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0E5E2F',
  },
  categoryText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  priceContainer: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0E5E2F',
  },
  priceUnit: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 10,
  },
  cardBottomRow: {
    gap: 6,
    marginBottom: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoItemText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  participantsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  participantsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0E5E2F',
  },
  editHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  editHintText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0E5E2F',
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  scheduleIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  scheduleContent: {
    flex: 1,
    marginRight: 10,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  scheduleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  scheduleInfoText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  scheduleRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  scheduleStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 8,
  },
  scheduleStatusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  badgeSuccess: { backgroundColor: '#ECFDF5' },
  badgeSuccessText: { color: '#059669' },
  badgeWarning: { backgroundColor: '#FFFBEB' },
  badgeWarningText: { color: '#D97706' },
  badgeNeutral: { backgroundColor: '#F3F4F6' },
  badgeNeutralText: { color: '#4B5563' },
  scheduleSpots: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0E5E2F',
  },
  scheduleSpotsEmpty: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
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
