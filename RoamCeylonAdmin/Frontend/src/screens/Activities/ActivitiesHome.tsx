import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather, AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const ActivitiesHome = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Metrics details
  const metrics = [
    {
      title: 'Active',
      value: '14',
      trend: '↗ +2 this week',
      isPositive: true,
      icon: 'ticket-outline',
      iconType: 'MaterialCommunityIcons',
      badgeBg: '#EAF7EE',
      iconColor: '#0E5E2F',
    },
    {
      title: 'Bookings',
      value: '128',
      trend: 'This month',
      isPositive: false,
      icon: 'calendar-check-outline',
      iconType: 'MaterialCommunityIcons',
      badgeBg: '#F3F4F6',
      iconColor: '#4B5563',
    },
    {
      title: 'Revenue',
      value: '$4.2k',
      trend: '↗ +12%',
      isPositive: true,
      icon: 'cash-outline',
      iconType: 'Ionicons',
      badgeBg: '#EAF7EE',
      iconColor: '#0E5E2F',
    },
    {
      title: 'Rating',
      value: '4.9',
      trend: 'From 450 reviews',
      isPositive: false,
      icon: 'star-outline',
      iconType: 'Ionicons',
      badgeBg: '#FEF3C7',
      iconColor: '#D97706',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/Roam Ceylon Logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>
        <TouchableOpacity style={styles.notificationButton} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={24} color="#0E5E2F" />
          <View style={styles.notificationBadge} />
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
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Overview</Text>
          <Text style={styles.subtitle}>
            Manage your luxury experiences and schedule.
          </Text>
        </View>

        {/* Quick Navigation / Preview Section */}
        <View style={styles.navSection}>
          <Text style={styles.navSectionTitle}>Quick Navigation</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.navScrollContent}
          >
            <TouchableOpacity
              style={styles.navCard}
              onPress={() => router.push('/activities/schedule' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={20} color="#0E5E2F" />
              <Text style={styles.navCardText}>Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navCard}
              onPress={() => router.push('/activities/analytics' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="bar-chart-outline" size={20} color="#0E5E2F" />
              <Text style={styles.navCardText}>Analytics</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navCard}
              onPress={() => router.push('/activities/bookings' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="book-outline" size={20} color="#0E5E2F" />
              <Text style={styles.navCardText}>Bookings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navCard}
              onPress={() => router.push('/activities/finance' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="cash-outline" size={20} color="#0E5E2F" />
              <Text style={styles.navCardText}>Finance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navCard}
              onPress={() => router.push('/activities/reviews' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="star-outline" size={20} color="#0E5E2F" />
              <Text style={styles.navCardText}>Reviews</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navCard}
              onPress={() => router.push('/activities/new' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={20} color="#0E5E2F" />
              <Text style={styles.navCardText}>New Act.</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navCard}
              onPress={() => router.push('/activities/update' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={20} color="#0E5E2F" />
              <Text style={styles.navCardText}>Edit Act.</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          {metrics.map((metric, index) => (
            <View key={index} style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <Text style={styles.metricTitle}>{metric.title}</Text>
                <View style={[styles.iconBadge, { backgroundColor: metric.badgeBg }]}>
                  {metric.iconType === 'MaterialCommunityIcons' ? (
                    <MaterialCommunityIcons
                      name={metric.icon as any}
                      size={20}
                      color={metric.iconColor}
                    />
                  ) : (
                    <Ionicons name={metric.icon as any} size={18} color={metric.iconColor} />
                  )}
                </View>
              </View>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text
                style={[
                  styles.metricTrend,
                  metric.isPositive ? styles.trendPositive : styles.trendNeutral,
                ]}
              >
                {metric.trend}
              </Text>
            </View>
          ))}
        </View>

        {/* Your Activities Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Activities</Text>
          <TouchableOpacity activeOpacity={0.6}>
            <Text style={styles.viewAllButton}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Activity Cards */}
        {/* Card 1: Sunrise Yoga */}
        <View style={styles.activityCard}>
          <View style={styles.imageContainer}>
            <Image
              source={require('../../assets/Activities/Sunrise Yoga.png')}
              style={styles.activityImage}
              contentFit="cover"
            />
            <View style={styles.activeTag}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Active</Text>
            </View>
          </View>
          <View style={styles.activityInfo}>
            <Text style={styles.activityName}>Sunrise Yoga & Meditation</Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={16} color="#7D8A82" />
              <Text style={styles.locationText}>Galle Fort</Text>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.cardFooter}>
              <View style={styles.footerStat}>
                <Ionicons name="people-outline" size={18} color="#7D8A82" />
                <Text style={styles.footerStatText}>18 Upcoming</Text>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                activeOpacity={0.6}
                onPress={() => router.push('/activities/update' as any)}
              >
                <Text style={styles.editButtonText}>Edit</Text>
                <Feather name="edit-2" size={14} color="#5B600A" style={styles.editIcon} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Card 2: Estate Tea Tasting */}
        <View style={styles.activityCard}>
          <View style={styles.imageContainer}>
            <Image
              source={require('../../assets/Activities/Estate Tea Tasting.png')}
              style={styles.activityImage}
              contentFit="cover"
            />
            <View style={styles.activeTag}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Active</Text>
            </View>
          </View>
          <View style={styles.activityInfo}>
            <Text style={styles.activityName}>Estate Tea Tasting</Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={16} color="#7D8A82" />
              <Text style={styles.locationText}>Ella Highlands</Text>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.cardFooter}>
              <View style={styles.footerStat}>
                <Ionicons name="people-outline" size={18} color="#7D8A82" />
                <Text style={styles.footerStatText}>32 Upcoming</Text>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                activeOpacity={0.6}
                onPress={() => router.push('/activities/update' as any)}
              >
                <Text style={styles.editButtonText}>Edit</Text>
                <Feather name="edit-2" size={14} color="#5B600A" style={styles.editIcon} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Upcoming Schedule Section */}
        <Text style={styles.sectionTitle}>Upcoming Schedule</Text>
        <View style={styles.scheduleCard}>
          {/* Schedule Item 1 */}
          <View style={styles.scheduleItem}>
            <View style={styles.scheduleTimeCol}>
              <Text style={[styles.dayLabel, { color: '#0E5E2F' }]}>TODAY</Text>
              <Text style={styles.timeLabel}>06:00</Text>
            </View>
            <View style={styles.scheduleDetailsCol}>
              <Text style={styles.scheduleItemName}>Sunrise Yoga & Meditation</Text>
              <Text style={styles.scheduleItemLocation}>Galle Fort Deck</Text>

              {/* Booking Stats Box */}
              <View style={styles.bookingBox}>
                <View style={styles.avatarGroup}>
                  <View style={[styles.avatarCircle, { backgroundColor: '#E1EFE6', zIndex: 3 }]}>
                    <Ionicons name="person" size={12} color="#0E5E2F" />
                  </View>
                  <View style={[styles.avatarCircle, { backgroundColor: '#EAE1DF', zIndex: 2, marginLeft: -10 }]}>
                    <Ionicons name="person" size={12} color="#8A5A52" />
                  </View>
                  <View style={[styles.avatarCircle, { backgroundColor: '#E0E5F5', zIndex: 1, marginLeft: -10 }]}>
                    <Text style={styles.avatarMoreText}>+13</Text>
                  </View>
                </View>
                <Text style={styles.bookingStatusText}>15/20 Booked</Text>

                <View style={styles.confirmedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#0E5E2F" style={{ marginRight: 3 }} />
                  <Text style={styles.confirmedBadgeText}>Confirmed</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.scheduleDivider} />

          {/* Schedule Item 2 */}
          <View style={styles.scheduleItem}>
            <View style={styles.scheduleTimeCol}>
              <Text style={[styles.dayLabel, { color: '#60646C' }]}>TOMORROW</Text>
              <Text style={styles.timeLabel}>14:00</Text>
            </View>
            <View style={styles.scheduleDetailsCol}>
              <Text style={styles.scheduleItemName}>Estate Tea Tasting</Text>
              <Text style={styles.scheduleItemLocation}>Ella Highlands Lodge</Text>

              {/* Booking Stats Box */}
              <View style={styles.bookingBox}>
                <View style={styles.avatarGroup}>
                  <View style={[styles.avatarCircle, { backgroundColor: '#E5E7EB', zIndex: 1 }]}>
                    <Text style={styles.avatarMoreText}>+32</Text>
                  </View>
                </View>
                <Text style={styles.bookingStatusText}>32/40 Booked</Text>
              </View>
            </View>
          </View>

          <View style={styles.scheduleDivider} />

          {/* Schedule Item 3 */}
          <View style={styles.scheduleItem}>
            <View style={styles.scheduleTimeCol}>
              <Text style={[styles.dayLabel, { color: '#60646C' }]}>OCT 24</Text>
              <Text style={styles.timeLabel}>09:00</Text>
            </View>
            <View style={styles.scheduleDetailsCol}>
              <Text style={styles.scheduleItemName}>Private Safari Tour</Text>
              <Text style={styles.scheduleItemLocation}>Yala National Park</Text>

              {/* Booking Stats Box */}
              <View style={styles.bookingBox}>
                <Text style={[styles.bookingStatusText, { marginLeft: 0 }]}>2/6 Booked</Text>

                <View style={styles.pendingBadge}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color="#60646C" style={{ marginRight: 3 }} />
                  <Text style={styles.pendingBadgeText}>Pending minimum</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        activeOpacity={0.8}
        onPress={() => router.push('/activities/new' as any)}
      >
        <AntDesign name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  navSection: {
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  navSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7D8A82',
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 0.8,
  },
  navScrollContent: {
    paddingRight: 24,
    paddingVertical: 4,
  },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  navCardText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#172B1E',
    marginLeft: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F1',
    zIndex: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 32,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7FAF8',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#dc3545',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#60646C',
    marginTop: 6,
    lineHeight: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    shadowColor: '#0E5E2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  metricCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#49504B',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 6,
  },
  metricTrend: {
    fontSize: 12,
    fontWeight: '600',
  },
  trendPositive: {
    color: '#22C55E',
  },
  trendNeutral: {
    color: '#60646C',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.3,
  },
  viewAllButton: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5B600A',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
    backgroundColor: '#EAEAEA',
  },
  activityImage: {
    width: '100%',
    height: '100%',
  },
  activeTag: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E5E2F',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  activeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  activityInfo: {
    padding: 18,
  },
  activityName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#60646C',
    marginLeft: 4,
    fontWeight: '500',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerStatText: {
    fontSize: 14,
    color: '#1C1917',
    fontWeight: '700',
    marginLeft: 6,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5B600A',
  },
  editIcon: {
    marginLeft: 4,
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  scheduleTimeCol: {
    width: 75,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1917',
  },
  scheduleDetailsCol: {
    flex: 1,
  },
  scheduleItemName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1917',
  },
  scheduleItemLocation: {
    fontSize: 14,
    color: '#60646C',
    marginTop: 2,
    fontWeight: '500',
  },
  bookingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  avatarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#F8FAF8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMoreText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4B5563',
  },
  bookingStatusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1917',
    marginLeft: 8,
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF7EE',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 'auto',
  },
  confirmedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0E5E2F',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 'auto',
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#60646C',
  },
  scheduleDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 18,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5B600A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5B600A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
});

export default ActivitiesHome;
