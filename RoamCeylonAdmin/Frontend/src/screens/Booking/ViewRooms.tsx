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
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { ensureVerified } from '@/utils/verification';
import type { Room, RoomStatus } from '@/types/booking.types';

const { width: _width } = Dimensions.get('window');

const apiUrl = () =>
  process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';

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

const buildRoomInfo = (room: Room) => {
  const parts: string[] = [];
  if (room.roomType) parts.push(room.roomType);
  if (room.adults) parts.push(`${room.adults} Adults`);
  if (room.squareFootage) parts.push(`${room.squareFootage} sqft`);
  return parts.join(' • ');
};

const ViewRooms = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
          console.error('[ViewRooms] Failed to load rooms:', error);
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        {/* Back Button */}
        <TouchableOpacity style={styles.headerIconButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={28} color="#1C1917" />
        </TouchableOpacity>

        {/* Center Title */}
        <Text style={styles.headerTitle}>Manage Rooms</Text>

        {/* Right Avatar Button */}
        <TouchableOpacity style={styles.avatarButton} activeOpacity={0.7} onPress={() => router.push('/booking/settings' as any)}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' }}
            style={styles.headerAvatar}
            contentFit="cover"
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#0E5E2F" />
        </View>
      ) : rooms.length === 0 ? (
        <View style={styles.centerState}>
          <Ionicons name="bed-outline" size={56} color="#B7C4BC" />
          <Text style={styles.emptyTitle}>No rooms yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the + button to add your first room.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {rooms.map((room) => {
            const isAvailable = room.status === 'available';
            const isBooked = room.status === 'booked';
            return (
              <View key={room.id} style={styles.roomCard}>
                {/* Card Image or Placeholder */}
                {room.coverImageUrl ? (
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: room.coverImageUrl }}
                      style={styles.roomImage}
                      contentFit="cover"
                    />
                    {/* Status Badge */}
                    <View
                      style={[
                        styles.statusBadge,
                        isAvailable
                          ? styles.badgeAvailable
                          : isBooked
                            ? styles.badgeBooked
                            : styles.badgeMaintenance,
                      ]}
                    >
                      <View
                        style={[
                          styles.badgeDot,
                          isAvailable
                            ? styles.dotAvailable
                            : isBooked
                              ? styles.dotBooked
                              : styles.dotMaintenance,
                        ]}
                      />
                      <Text
                        style={[
                          styles.badgeText,
                          isAvailable
                            ? styles.badgeTextAvailable
                            : isBooked
                              ? styles.badgeTextBooked
                              : styles.badgeTextMaintenance,
                        ]}
                      >
                        {STATUS_LABEL[room.status] ?? room.status}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={48} color="#A3A3A3" />
                    {/* Status Badge */}
                    <View
                      style={[
                        styles.statusBadge,
                        isAvailable
                          ? styles.badgeAvailable
                          : isBooked
                            ? styles.badgeBooked
                            : styles.badgeMaintenance,
                      ]}
                    >
                      <View
                        style={[
                          styles.badgeDot,
                          isAvailable
                            ? styles.dotAvailable
                            : isBooked
                              ? styles.dotBooked
                              : styles.dotMaintenance,
                        ]}
                      />
                      <Text
                        style={[
                          styles.badgeText,
                          isAvailable
                            ? styles.badgeTextAvailable
                            : isBooked
                              ? styles.badgeTextBooked
                              : styles.badgeTextMaintenance,
                        ]}
                      >
                        {STATUS_LABEL[room.status] ?? room.status}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.detailsBox}>
                  <View style={styles.titlePriceRow}>
                    <Text style={styles.roomTitle}>{room.name}</Text>
                    <Text style={styles.priceText}>
                      <Text style={styles.priceNumber}>{formatPrice(room.nightlyRate)}</Text>
                      <Text style={styles.priceLabel}>/nt</Text>
                    </Text>
                  </View>

                  <Text style={styles.roomInfo}>{buildRoomInfo(room)}</Text>

                  <View style={styles.cardDivider} />

                  <View style={styles.cardFooter}>
                    <View style={{ flex: 1 }} />

                    {/* Edit Button */}
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() =>
                        router.push({
                          pathname: '/booking/editRoom' as any,
                          params: { id: room.id },
                        })
                      }
                      activeOpacity={0.7}
                    >
                      <Ionicons name="pencil" size={16} color="#0D4F2E" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Floating Action Plus Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() =>
            ensureVerified(router, '/booking/businessVerification').then(
              (ok) => ok && router.push('/booking/addRoom' as any),
            )
          }
          activeOpacity={0.8}
        >
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
  logoCircleButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -10,
  },
  logoDarkCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#072416',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#5B600A',
    textAlign: 'center',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -10,
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  headerAvatar: {
    width: '100%',
    height: '100%',
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAF8',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7C8A82',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 20,
  },
  roomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    overflow: 'hidden',
    shadowColor: '#0E5E2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  imageContainer: {
    height: 200,
    position: 'relative',
  },
  roomImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeAvailable: {
    backgroundColor: '#EAF7EE',
  },
  badgeBooked: {
    backgroundColor: '#FEE2E2',
  },
  badgeMaintenance: {
    backgroundColor: '#FEF3C7',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dotAvailable: {
    backgroundColor: '#0E5E2F',
  },
  dotBooked: {
    backgroundColor: '#DC2626',
  },
  dotMaintenance: {
    backgroundColor: '#D97706',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  badgeTextAvailable: {
    color: '#0E5E2F',
  },
  badgeTextBooked: {
    color: '#DC2626',
  },
  badgeTextMaintenance: {
    color: '#D97706',
  },
  detailsBox: {
    padding: 16,
  },
  titlePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  roomTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
    flex: 1,
    marginRight: 8,
  },
  priceText: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#5B600A',
  },
  priceLabel: {
    fontSize: 13,
    color: '#7C8A82',
    fontWeight: '600',
  },
  roomInfo: {
    fontSize: 13,
    color: '#7C8A82',
    fontWeight: '500',
    marginBottom: 12,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F0F3F1',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 36,
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guestAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CCCCCC',
  },
  guestName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1917',
    marginLeft: 8,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EAF7EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
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
    backgroundColor: '#855E0E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#855E0E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
});

export default ViewRooms;
