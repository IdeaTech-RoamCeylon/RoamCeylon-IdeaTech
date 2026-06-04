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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const GuestMessages = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock message threads data
  const messageThreads = [
    {
      id: '1',
      guestName: 'Elena Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      statusDot: '#855E0E', // Gold status dot
      time: '3:42 PM',
      reservationNum: '#4421',
      badgeType: 'highlight', // yellow badge
      message: 'Can we arrange an airport pickup for 3 PM?',
      isUnread: true,
    },
    {
      id: '2',
      guestName: 'Marcus Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      time: '11:15 AM',
      reservationNum: '#4388',
      badgeType: 'normal', // gray badge
      message: 'The breakfast options were incredible! Thank you for accommodating our dietary needs.',
      isUnread: false,
    },
    {
      id: '3',
      guestName: 'Sarah Jenkins',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
      time: 'Yesterday',
      reservationNum: '#4402',
      badgeType: 'normal', // gray badge
      message: "Is the spa open late tonight? I'd love to book a session after my tour.",
      isUnread: false,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
          <Ionicons name="menu-outline" size={28} color="#000000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Guest Messages</Text>

        <TouchableOpacity style={styles.avatarButton} activeOpacity={0.7}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' }}
            style={styles.headerAvatar}
            contentFit="cover"
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar Container */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Messages List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 }, // Leave room for the FAB
        ]}
        showsVerticalScrollIndicator={false}
      >
        {messageThreads.map((thread) => (
          <TouchableOpacity
            key={thread.id}
            style={styles.threadCard}
            activeOpacity={0.8}
          >
            <View style={styles.cardRow}>
              {/* Left: Avatar with optional status dot */}
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: thread.avatar }}
                  style={styles.guestAvatar}
                  contentFit="cover"
                />
                {thread.statusDot && (
                  <View style={[styles.statusDot, { backgroundColor: thread.statusDot }]} />
                )}
              </View>

              {/* Middle: Details */}
              <View style={styles.detailsContainer}>
                <View style={styles.nameTimeRow}>
                  <Text style={styles.guestName}>{thread.guestName}</Text>
                  <Text style={styles.timeText}>{thread.time}</Text>
                </View>

                {/* Reservation Badge */}
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.reservationBadge,
                      thread.badgeType === 'highlight'
                        ? styles.reservationBadgeHighlight
                        : styles.reservationBadgeNormal,
                    ]}
                  >
                    <Text
                      style={[
                        styles.reservationBadgeText,
                        thread.badgeType === 'highlight'
                          ? styles.reservationBadgeTextHighlight
                          : styles.reservationBadgeTextNormal,
                      ]}
                    >
                      RESERVATION {thread.reservationNum}
                    </Text>
                  </View>
                </View>

                {/* Message Preview */}
                <Text
                  style={[
                    styles.messagePreview,
                    thread.isUnread ? styles.messageUnread : styles.messageRead,
                  ]}
                  numberOfLines={2}
                >
                  {thread.message}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        activeOpacity={0.8}
      >
        <Ionicons name="create-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0E5E2F',
    textAlign: 'center',
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: -10,
  },
  headerAvatar: {
    width: '100%',
    height: '100%',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
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
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  threadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 16,
    shadowColor: '#0E5E2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 10,
    elevation: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
  },
  guestAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 14,
  },
  nameTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
  },
  timeText: {
    fontSize: 13,
    color: '#7C8A82',
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reservationBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  reservationBadgeHighlight: {
    backgroundColor: '#FDF2E9',
  },
  reservationBadgeNormal: {
    backgroundColor: '#F1F5F9',
  },
  reservationBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reservationBadgeTextHighlight: {
    color: '#B45309',
  },
  reservationBadgeTextNormal: {
    color: '#475569',
  },
  messagePreview: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageUnread: {
    fontWeight: '700',
    color: '#0E5E2F',
  },
  messageRead: {
    color: '#60646C',
    fontWeight: '400',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 18, // Rounded square as in screenshot
    backgroundColor: '#66BB6A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#66BB6A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
});

export default GuestMessages;
