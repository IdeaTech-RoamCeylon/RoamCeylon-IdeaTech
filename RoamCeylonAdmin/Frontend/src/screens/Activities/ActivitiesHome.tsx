import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotifications } from '../../utils/notificationsStore';

const ActivitiesHome = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { unreadCount } = useNotifications();

  const handleNotificationPress = () => {
    router.push({ pathname: '/notifications', params: { module: 'activity' } } as any);
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
              <Text style={styles.statValue}>14</Text>
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
              <Text style={styles.statValue}>128</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="star-outline" size={20} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.statValue}>4.9</Text>
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

        {/* Activity Card 1 */}
        <TouchableOpacity 
          style={styles.activityCard}
          activeOpacity={0.9}
        >
          <Image 
            source={require('../../assets/Activities/Sunrise Yoga.png')} 
            style={styles.activityImage} 
            contentFit="cover" 
          />
          <View style={styles.activityInfo}>
            <View style={styles.activityHeaderRow}>
              <Text style={styles.activityName} numberOfLines={1}>Sunrise Yoga & Meditation</Text>
              <View style={[styles.statusBadge, styles.statusActive]}>
                <Text style={[styles.statusText, styles.statusTextActive]}>Active</Text>
              </View>
            </View>
            <Text style={styles.activityCategory}>Wellness • 2 Hours</Text>
            <View style={styles.activityFooter}>
              <View style={styles.activityFooterItem}>
                <Ionicons name="location-outline" size={14} color="#6B7280" />
                <Text style={styles.activityFooterText} numberOfLines={1}>Galle Fort</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#D1D5DB" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Activity Card 2 */}
        <TouchableOpacity 
          style={styles.activityCard}
          activeOpacity={0.9}
        >
          <Image 
            source={require('../../assets/Activities/Estate Tea Tasting.png')} 
            style={styles.activityImage} 
            contentFit="cover" 
          />
          <View style={styles.activityInfo}>
            <View style={styles.activityHeaderRow}>
              <Text style={styles.activityName} numberOfLines={1}>Estate Tea Tasting</Text>
              <View style={[styles.statusBadge, styles.statusActive]}>
                <Text style={[styles.statusText, styles.statusTextActive]}>Active</Text>
              </View>
            </View>
            <Text style={styles.activityCategory}>Culinary • 3 Hours</Text>
            <View style={styles.activityFooter}>
              <View style={styles.activityFooterItem}>
                <Ionicons name="location-outline" size={14} color="#6B7280" />
                <Text style={styles.activityFooterText} numberOfLines={1}>Ella Highlands</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#D1D5DB" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Activity Card 3 */}
        <TouchableOpacity 
          style={styles.activityCard}
          activeOpacity={0.9}
        >
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=400&q=80' }} 
            style={styles.activityImage} 
            contentFit="cover" 
          />
          <View style={styles.activityInfo}>
            <View style={styles.activityHeaderRow}>
              <Text style={styles.activityName} numberOfLines={1}>Culinary Masterclass</Text>
              <View style={[styles.statusBadge, styles.statusDraft]}>
                <Text style={[styles.statusText, styles.statusTextDraft]}>Draft</Text>
              </View>
            </View>
            <Text style={styles.activityCategory}>Culinary • 4 Hours</Text>
            <View style={styles.activityFooter}>
              <View style={styles.activityFooterItem}>
                <Ionicons name="location-outline" size={14} color="#6B7280" />
                <Text style={styles.activityFooterText} numberOfLines={1}>Colombo</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#D1D5DB" />
            </View>
          </View>
        </TouchableOpacity>

        <View style={[styles.sectionHeader, { marginTop: 12 }]}>
          <Text style={styles.sectionTitle}>Upcoming Schedule</Text>
        </View>

        {/* Upcoming Schedule Items */}
        <TouchableOpacity style={styles.bookingsCardContainer} activeOpacity={0.7}>
          <View style={styles.bookingRow}>
            <View style={styles.bookingLeft}>
              <Text style={styles.bookingMainText}>
                Sunrise Yoga & Meditation
              </Text>
              <Text style={styles.bookingDateText}>Galle Fort Deck • 06:00 (Today)</Text>
            </View>
            <View style={styles.bookingRight}>
              <Text style={styles.bookingAmount}>15/20 Booked</Text>
              <View style={[styles.pillBadge, styles.pillBadgeSuccess, { marginTop: 6, alignSelf: 'flex-end' }]}>
                <Text style={[styles.pillBadgeText, styles.pillBadgeSuccessText]}>Confirmed</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bookingsCardContainer, { marginTop: 12 }]} activeOpacity={0.7}>
          <View style={styles.bookingRow}>
            <View style={styles.bookingLeft}>
              <Text style={styles.bookingMainText}>
                Estate Tea Tasting
              </Text>
              <Text style={styles.bookingDateText}>Ella Highlands Lodge • 14:00 (Tomorrow)</Text>
            </View>
            <View style={styles.bookingRight}>
              <Text style={styles.bookingAmount}>32/40 Booked</Text>
              <View style={[styles.pillBadge, styles.pillBadgeSuccess, { marginTop: 6, alignSelf: 'flex-end' }]}>
                <Text style={[styles.pillBadgeText, styles.pillBadgeSuccessText]}>Confirmed</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

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
