import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useNotifications } from '../../utils/notificationsStore';
import type { Room, RoomStatus } from '@/types/booking.types';

const { width: _width } = Dimensions.get('window');

const apiUrl = () =>
  process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';

const QUICK_NAV = [
  { label: 'Manage Bookings', icon: 'list-outline', route: '/booking/management' },
  { label: 'Available Rooms', icon: 'archive-outline', route: '/booking/availableRooms' },
  { label: 'View Calendar', icon: 'calendar-outline', route: '/booking/calendar' },
  { label: 'Guest Messages', icon: 'chatbubble-ellipses-outline', route: '/booking/messages' },
  { label: 'Manage Rooms', icon: 'bed-outline', route: '/booking/rooms' },
  { label: 'Hotel Details', icon: 'business-outline', route: '/booking/hotelDetails' },
] as const;

const STATUS_LABEL: Record<RoomStatus, string> = {
  available: 'Available',
  booked: 'Booked',
  maintenance: 'Maintenance',
};

const formatPrice = (rate: number | string) => {
  const num = typeof rate === 'string' ? parseFloat(rate) : rate;
  if (!num || Number.isNaN(num)) return 'Rs. 0';
  return `Rs. ${Math.round(num).toLocaleString('en-US')}`;
};

const getStatusStyle = (status: RoomStatus) => {
  if (status === 'available') return { text: '#059669', label: STATUS_LABEL.available };
  if (status === 'booked') return { text: '#DC2626', label: STATUS_LABEL.booked };
  return { text: '#D97706', label: STATUS_LABEL.maintenance };
};

const BookingHomeScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { unreadCount } = useNotifications('booking');

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const fetchData = async () => {
        try {
          setLoading(true);
          const accessToken = await SecureStore.getItemAsync('authToken');
          if (accessToken) {
            const res = await fetch(`${apiUrl()}/rooms/my`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (res.ok && active) {
              setRooms(await res.json());
            }
          }
        } catch (error) {
          console.error('[BookingHome] Failed to load rooms:', error);
        } finally {
          if (active) setLoading(false);
        }
      };
      fetchData();
      return () => {
        active = false;
      };
    }, []),
  );

  const availableCount = rooms.filter((r) => r.status === 'available').length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
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
              <Text style={styles.headerTitle}>Grand Emerald Resort</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={[styles.headerIconButton, { marginRight: 10 }]}
                activeOpacity={0.7}
                onPress={() => router.push({ pathname: '/notifications', params: { module: 'booking' } } as any)}
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
                onPress={() => router.push('/booking/settings' as any)}
              >
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80' }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={styles.statCard}
              activeOpacity={0.8}
              onPress={() => router.push('/booking/rooms' as any)}
            >
              <View style={styles.statIconWrap}>
                <Ionicons name="bed-outline" size={20} color="#0E5E2F" />
              </View>
              <View>
                <Text style={styles.statValue}>{rooms.length}</Text>
                <Text style={styles.statLabel}>Rooms</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#059669" />
              </View>
              <View>
                <Text style={styles.statValue}>{availableCount}</Text>
                <Text style={styles.statLabel}>Available</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="cash-outline" size={20} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.statValue}>$2.4k</Text>
                <Text style={styles.statLabel}>Revenue</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.scrollContent}>
          {/* Quick Navigation */}
          <Text style={styles.navSectionTitle}>Quick Navigation</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.navScrollContent}
          >
            {QUICK_NAV.map((item) => (
              <TouchableOpacity
                key={item.route}
                style={styles.navCard}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.85}
              >
                <View style={styles.navIconWrap}>
                  <Ionicons name={item.icon as any} size={20} color="#0E5E2F" />
                </View>
                <Text style={styles.navCardText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Rooms Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Rooms</Text>
            <TouchableOpacity activeOpacity={0.6} onPress={() => router.push('/booking/rooms' as any)}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#0E5E2F" style={{ marginTop: 40 }} />
          ) : rooms.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <MaterialCommunityIcons name="bed-empty" size={36} color="#0E5E2F" />
              </View>
              <Text style={styles.emptyTitle}>No rooms yet</Text>
              <Text style={styles.emptySubtitle}>Add your first room to start{'\n'}managing bookings and availability</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                activeOpacity={0.8}
                onPress={() => router.push('/booking/addRoom' as any)}
              >
                <Feather name="plus" size={16} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>Add Room</Text>
              </TouchableOpacity>
            </View>
          ) : (
            rooms.map((room) => {
              const statusInfo = getStatusStyle(room.status);
              return (
                <TouchableOpacity
                  key={room.id}
                  style={styles.roomCard}
                  activeOpacity={0.95}
                  onPress={() => router.push({ pathname: '/booking/editRoom', params: { id: room.id } } as any)}
                >
                  {/* Image Section */}
                  <View style={styles.cardImageContainer}>
                    {room.coverImageUrl ? (
                      <Image
                        source={{ uri: room.coverImageUrl }}
                        style={styles.roomImage}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <LinearGradient
                        colors={['#E8F5E9', '#C8E6C9']}
                        style={[styles.roomImage, styles.roomImagePlaceholder]}
                      >
                        <MaterialCommunityIcons name="image-area" size={30} color="#81C784" />
                      </LinearGradient>
                    )}
                    <LinearGradient
                      colors={['rgba(0,0,0,0.25)', 'transparent', 'rgba(0,0,0,0.35)']}
                      locations={[0, 0.4, 1]}
                      style={styles.imageOverlay}
                    />
                    {/* Status pill */}
                    <View style={styles.statusBadge}>
                      <View style={[styles.statusDot, { backgroundColor: statusInfo.text }]} />
                      <Text style={[styles.statusText, { color: statusInfo.text }]}>{statusInfo.label}</Text>
                    </View>
                    {/* Bottom image info */}
                    <View style={styles.imageBottomRow}>
                      {!!room.roomType && (
                        <View style={styles.imageBadge}>
                          <Ionicons name="bed-outline" size={11} color="#FFFFFF" />
                          <Text style={styles.imageBadgeText}>{room.roomType}</Text>
                        </View>
                      )}
                      {!!room.adults && (
                        <View style={styles.imageBadge}>
                          <Ionicons name="people" size={11} color="#FFFFFF" />
                          <Text style={styles.imageBadgeText}>{room.adults} Adults</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Content Section */}
                  <View style={styles.cardContent}>
                    <View style={styles.cardTopRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.roomName} numberOfLines={1}>{room.name}</Text>
                        <View style={styles.categoryRow}>
                          <View style={styles.categoryDot} />
                          <Text style={styles.categoryText}>
                            {room.squareFootage ? `${room.squareFootage} sqft` : 'Standard'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.priceContainer}>
                        <Text style={styles.priceText}>{formatPrice(room.nightlyRate)}</Text>
                        <Text style={styles.priceUnit}>/night</Text>
                      </View>
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.cardActionRow}>
                      <View style={styles.unitsChip}>
                        <Ionicons name="cube-outline" size={13} color="#0E5E2F" />
                        <Text style={styles.unitsText}>{room.availableUnits || 1} units</Text>
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
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        activeOpacity={0.8}
        onPress={() => router.push('/booking/addRoom' as any)}
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
  scrollView: {
    flex: 1,
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
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    maxWidth: 220,
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
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
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
  scrollContent: {
    marginTop: -20,
    paddingTop: 40,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  navSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7D8A82',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 0.8,
  },
  navScrollContent: {
    paddingRight: 24,
    paddingVertical: 4,
    paddingLeft: 4,
    marginBottom: 24,
  },
  navCard: {
    width: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0F3F1',
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginRight: 12,
    shadowColor: '#0E5E2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  navIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  navCardText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1917',
    letterSpacing: -0.2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  roomCard: {
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
  roomImage: {
    width: '100%',
    height: '100%',
  },
  roomImagePlaceholder: {
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
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
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
  roomName: {
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
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unitsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  unitsText: {
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

export default BookingHomeScreen;
