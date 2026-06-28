import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';

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

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const accessToken = await SecureStore.getItemAsync('authToken');
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.222.107:3001';

      if (!accessToken) return;

      const res = await fetch(`${apiUrl}/tour-guide/notifications`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          description: n.message,
          time: new Date(n.createdAt).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', month: 'short', day: 'numeric' }),
          isUnread: !n.isRead,
        }));
        setNotifications(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const handleMarkAllRead = async () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, isUnread: false }))
    );
    try {
      const accessToken = await SecureStore.getItemAsync('authToken');
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.222.107:3001';
      if (accessToken) {
        await fetch(`${apiUrl}/tour-guide/notifications/read-all`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
    } catch (err) {
      console.error(err);
    }
    Alert.alert('Notifications', 'All notifications marked as read.');
  };

  const handleNotificationPress = async (item: NotificationItem) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === item.id ? { ...notif, isUnread: false } : notif))
    );

    if (item.isUnread) {
      try {
        const accessToken = await SecureStore.getItemAsync('authToken');
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.222.107:3001';
        if (accessToken) {
          await fetch(`${apiUrl}/tour-guide/notifications/${item.id}/read`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Simply mark the notification as read, no need to navigate away

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
        {/* Premium Header Gradient */}
        <LinearGradient
          colors={['#0F3D26', '#145334', '#0E5E2F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 16, paddingBottom: 24 }]}
        >
          <TouchableOpacity style={styles.headerButton} activeOpacity={0.7} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Notifications</Text>
          <TouchableOpacity style={styles.headerButton} activeOpacity={0.7} onPress={handleMarkAllRead}>
            <Ionicons name="checkmark-done" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.mainContent}>
          {/* Subtitle / Intro */}
          <View style={styles.titleSection}>
            <Text style={styles.pageSubtitle}>
              Stay updated on trip requests, booking status amendments, payments, and system alerts.
            </Text>
          </View>

          {/* List of Notification cards */}
          <View style={styles.notificationList}>
            {loading ? (
              <ActivityIndicator size="large" color="#0E5E2F" style={{ marginTop: 40 }} />
            ) : notifications.length > 0 ? (
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
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
