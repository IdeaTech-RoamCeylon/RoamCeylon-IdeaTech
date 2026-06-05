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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const ViewRooms = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Mock rooms data
  const rooms = [
    {
      id: '1',
      title: 'Ocean View Suite',
      image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=500&auto=format&fit=crop&q=80',
      status: 'Available',
      statusType: 'available', // green status pill
      roomInfo: 'Room 204 • 2 Beds • 850 sqft',
      price: '$450',
    },
    {
      id: '2',
      title: 'Deluxe Double',
      image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=500&auto=format&fit=crop&q=80',
      status: 'Booked',
      statusType: 'booked', // red status pill
      roomInfo: 'Room 112 • 2 Beds • 450 sqft',
      price: '$280',
      guest: {
        name: 'John D. (2 nights)',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      },
    },
    {
      id: '3',
      title: 'Garden Villa',
      status: 'Maintenance',
      statusType: 'maintenance', // yellow status pill
      roomInfo: 'Villa 01 • 1 King • 1200 sqft',
      price: '$600',
    },
  ];

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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {rooms.map((room) => (
          <View key={room.id} style={styles.roomCard}>
            {/* Card Image or Placeholder */}
            {room.image ? (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: room.image }}
                  style={styles.roomImage}
                  contentFit="cover"
                />
                {/* Status Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    room.statusType === 'available' ? styles.badgeAvailable : styles.badgeBooked,
                  ]}
                >
                  <View
                    style={[
                      styles.badgeDot,
                      room.statusType === 'available' ? styles.dotAvailable : styles.dotBooked,
                    ]}
                  />
                  <Text
                    style={[
                      styles.badgeText,
                      room.statusType === 'available' ? styles.badgeTextAvailable : styles.badgeTextBooked,
                    ]}
                  >
                    {room.status}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={48} color="#A3A3A3" />
                {/* Status Badge */}
                <View style={[styles.statusBadge, styles.badgeMaintenance]}>
                  <View style={[styles.badgeDot, styles.dotMaintenance]} />
                  <Text style={[styles.badgeText, styles.badgeTextMaintenance]}>
                    {room.status}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.detailsBox}>
              <View style={styles.titlePriceRow}>
                <Text style={styles.roomTitle}>{room.title}</Text>
                <Text style={styles.priceText}>
                  <Text style={styles.priceNumber}>{room.price}</Text>
                  <Text style={styles.priceLabel}>/nt</Text>
                </Text>
              </View>

              <Text style={styles.roomInfo}>{room.roomInfo}</Text>

              <View style={styles.cardDivider} />

              <View style={styles.cardFooter}>
                {/* Guest Profile Details or spacer */}
                {room.guest ? (
                  <View style={styles.guestRow}>
                    <Image
                      source={{ uri: room.guest.avatar }}
                      style={styles.guestAvatar}
                      contentFit="cover"
                    />
                    <Text style={styles.guestName}>{room.guest.name}</Text>
                  </View>
                ) : (
                  <View style={{ flex: 1 }} />
                )}

                {/* Edit Button */}
                <TouchableOpacity style={styles.editButton} onPress={() => router.push('/booking/editRoom' as any)} activeOpacity={0.7}>
                  <Ionicons name="pencil" size={16} color="#0D4F2E" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Floating Action Plus Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/booking/addRoom' as any)} activeOpacity={0.8}>
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
