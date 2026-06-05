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

const AvailableRooms = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const roomData = [
    {
      id: '1',
      title: 'Deluxe Garden Suite',
      subtitle: 'Floor 2 (Wing A)',
      status: 'Available',
      image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: '2',
      title: 'Premium Ocean Terrace',
      subtitle: 'Floor 4 (Private Wing)',
      status: 'Maintenance',
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=150&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#1C1917" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Room Availability</Text>

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
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Available Rooms Metric */}
        <View style={styles.metricCardWhite}>
          <View style={styles.metricIconCircleGreen}>
            <Ionicons name="business-outline" size={24} color="#0E5E2F" />
          </View>
          <View style={styles.metricTextContainer}>
            <Text style={styles.metricLabel}>AVAILABLE ROOMS</Text>
            <Text style={styles.metricValueGreen}>42</Text>
          </View>
        </View>

        {/* Pending Requests Metric */}
        <View style={styles.metricCardOrange}>
          <View style={styles.metricIconCircleOrange}>
            <Ionicons name="calendar-outline" size={24} color="#5B3A1A" />
          </View>
          <View style={styles.metricTextContainer}>
            <Text style={styles.metricLabel}>PENDING REQUESTS</Text>
            <Text style={styles.metricValueBrown}>14</Text>
          </View>
        </View>

        {/* Room Availability List */}
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderTitle}>Room Availability</Text>
            <View style={styles.listHeaderActions}>
              <TouchableOpacity style={styles.iconButton} activeOpacity={0.6}>
                <Ionicons name="filter" size={16} color="#1C1917" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} activeOpacity={0.6}>
                <Ionicons name="search" size={16} color="#1C1917" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tableHeaderRow}>
            <Text style={styles.tableHeaderLabel}>ROOM TYPE</Text>
            <Text style={styles.tableHeaderLabel}>STATUS</Text>
          </View>

          {roomData.map((room, index) => (
            <View key={room.id} style={[styles.roomRow, index === roomData.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.roomInfoContainer}>
                <Image
                  source={{ uri: room.image }}
                  style={styles.roomImage}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.roomTextContainer}>
                  <Text style={styles.roomTitle}>{room.title}</Text>
                  <Text style={styles.roomSubtitle}>{room.subtitle}</Text>
                </View>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  room.status === 'Available' ? styles.statusAvailable : styles.statusMaintenance,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    room.status === 'Available' ? styles.statusTextAvailable : styles.statusTextMaintenance,
                  ]}
                >
                  {room.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
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
    borderBottomColor: '#F2F2F7',
    zIndex: 10,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0E5E2F',
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
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 16,
  },
  metricCardWhite: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#EAF2EC',
    padding: 20,
    shadowColor: '#0E5E2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  metricIconCircleGreen: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3FAF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  metricCardOrange: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF4EB',
    borderRadius: 20,
    padding: 20,
  },
  metricIconCircleOrange: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EBD8C8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  metricTextContainer: {
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C8A82',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValueGreen: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0D3823',
    lineHeight: 36,
  },
  metricValueBrown: {
    fontSize: 32,
    fontWeight: '800',
    color: '#3B2313',
    lineHeight: 36,
  },
  listContainer: {
    marginTop: 12,
    backgroundColor: '#F6FAF7',
    borderRadius: 20,
    overflow: 'hidden',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E7EFE9',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  listHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D3823',
  },
  listHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4E2D8',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EAF2EC',
  },
  tableHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5B600A',
    letterSpacing: 0.8,
  },
  roomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EAF2EC',
  },
  roomInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 16,
  },
  roomImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 14,
  },
  roomTextContainer: {
    flex: 1,
  },
  roomTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 4,
  },
  roomSubtitle: {
    fontSize: 12,
    color: '#60646C',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusAvailable: {
    backgroundColor: '#A2CBAF',
  },
  statusMaintenance: {
    backgroundColor: '#E5C158',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextAvailable: {
    color: '#0E5E2F',
  },
  statusTextMaintenance: {
    color: '#70530A',
  },
});

export default AvailableRooms;
