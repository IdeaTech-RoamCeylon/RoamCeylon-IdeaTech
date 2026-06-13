import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface NotificationItem {
  id: string;
  type: 'booking' | 'chat' | 'alert' | 'payment';
  title: string;
  description: string;
  time: string;
  isUnread: boolean;
}

const Notifications = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Notification items mock data list
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n1',
      type: 'booking',
      title: 'New Booking Confirmed',
      description: 'Eleanor Richards successfully booked the "7-Day Cultural Triangle" tour package.',
      time: 'Today, 11:30 AM',
      isUnread: true,
    },
    {
      id: 'n2',
      type: 'chat',
      title: 'New Message from Sophia',
      description: 'Sophia Henderson: "Awaiting your custom hotel bookings proposal for 98 Acres..."',
      time: 'Today, 10:45 AM',
      isUnread: true,
    },
    {
      id: 'n3',
      type: 'alert',
      title: 'Urgent Action Required',
      description: 'You have 4 pending guest requests that will expire soon. Please review and reply.',
      time: 'Yesterday, 6:00 PM',
      isUnread: false,
    },
    {
      id: 'n4',
      type: 'chat',
      title: 'Itinerary Revision Requested',
      description: 'Marcus Thorne requested changes to include whale watching in Mirissa on Day 4.',
      time: 'Yesterday, 2:15 PM',
      isUnread: false,
    },
    {
      id: 'n5',
      type: 'payment',
      title: 'Deposit Payment Received',
      description: 'Received deposit payment of $1,000 for itinerary #RC-8872 (Eleanor Richards).',
      time: 'Oct 11, 4:30 PM',
      isUnread: false,
    },
  ]);

  const handleMarkAllRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, isUnread: false }))
    );
    Alert.alert('Notifications', 'All notifications marked as read.');
  };

  const handleNotificationPress = (item: NotificationItem) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === item.id ? { ...notif, isUnread: false } : notif))
    );

    // Redirect to correct sub-pages based on type
    if (item.type === 'booking') {
      router.push('/tour-guide/bookings');
    } else if (item.type === 'chat') {
      router.push({
        pathname: '/tour-guide/chat',
        params: { name: item.title.includes('Sophia') ? 'Sophia Henderson' : 'Marcus Thorne' },
      } as any);
    } else if (item.type === 'alert') {
      router.push('/tour-guide/pendingInquiries');
    } else if (item.type === 'payment') {
      router.push('/tour-guide/revenue');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return { name: 'calendar', color: '#0E5E2F', bg: '#EAF7EE' };
      case 'chat':
        return { name: 'chatbubble-ellipses', color: '#D97706', bg: '#FFFBEB' };
      case 'payment':
        return { name: 'cash', color: '#2563EB', bg: '#EFF6FF' };
      case 'alert':
      default:
        return { name: 'warning', color: '#EF4444', bg: '#FFF5F5' };
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Transparent Header */}
        <View
          style={[styles.header, { paddingTop: insets.top + 16, paddingBottom: 12 }]}
        >
          <TouchableOpacity style={styles.headerButton} activeOpacity={0.7} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color="#1C1917" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#1C1917' }]}>Notifications</Text>
          <TouchableOpacity style={styles.headerButton} activeOpacity={0.7} onPress={handleMarkAllRead}>
            <Ionicons name="checkmark-done" size={22} color="#0E5E2F" />
          </TouchableOpacity>
        </View>

        <View style={styles.mainContent}>
          {/* Subtitle / Intro */}
          <View style={styles.titleSection}>
            <Text style={styles.pageSubtitle}>
              Stay updated on trip requests, booking status amendments, payments, and system alerts.
            </Text>
          </View>

          {/* List of Notification cards */}
          <View style={styles.notificationList}>
            {notifications.length > 0 ? (
              notifications.map((item) => {
                const iconDetails = getNotificationIcon(item.type);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.notificationCard,
                      item.isUnread && styles.cardUnread,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleNotificationPress(item)}
                  >
                    {/* Left unread indicator dot */}
                    {item.isUnread && <View style={styles.unreadDot} />}

                    {/* Icon Container */}
                    <View style={[styles.iconContainer, { backgroundColor: iconDetails.bg }]}>
                      <Ionicons name={iconDetails.name as any} size={20} color={iconDetails.color} />
                    </View>

                    {/* Notification Copy Details */}
                    <View style={styles.copyCol}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitleText} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.cardTimeText}>{item.time}</Text>
                      </View>
                      <Text style={styles.cardDescText}>
                        {item.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="notifications-off-outline" size={48} color="#D1D5DB" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyStateTitle}>All Clear!</Text>
                <Text style={styles.emptyStateText}>
                  You have no notifications or alerts at this moment.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
  },
  mainContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  titleSection: {
    marginBottom: 24,
  },
  pageSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    fontWeight: '500',
  },
  notificationList: {
    gap: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAEFEA',
    padding: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  cardUnread: {
    borderColor: '#C2F3D0',
    backgroundColor: '#FAFDFB',
  },
  unreadDot: {
    position: 'absolute',
    top: 18,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0E5E2F',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginLeft: 4,
  },
  copyCol: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1917',
    flex: 1,
    marginRight: 8,
  },
  cardTimeText: {
    fontSize: 10,
    color: '#8A958E',
    fontWeight: '600',
  },
  cardDescText: {
    fontSize: 12.5,
    color: '#6B7280',
    lineHeight: 18,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EAEFEA',
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#8A958E',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
});

export default Notifications;
