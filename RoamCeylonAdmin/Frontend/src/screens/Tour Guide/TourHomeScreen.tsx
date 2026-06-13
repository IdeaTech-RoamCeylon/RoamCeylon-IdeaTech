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
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const TourHomeScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // State for Tour Packages status toggles (mock)
  const [isCulturalActive, setIsCulturalActive] = useState(true);
  const [isHillCountryActive, setIsHillCountryActive] = useState(false);
  const [isSouthernActive, setIsSouthernActive] = useState(true);

  // Stats / Performance Overview data
  const stats = {
    totalPackages: 3,
    activeBookings: 12,
    rating: '4.9',
  };

  // Recent Bookings data for the guide's schedule
  const bookingsList = [
    {
      id: 'RC-8892',
      customer: 'Eleanor Richards',
      tour: '7-Day Cultural Triangle',
      date: 'Oct 12, 2023',
      amount: '$2,400',
      status: 'Confirmed',
      statusType: 'success', // green
    },
    {
      id: 'RC-8891',
      customer: 'Marcus Thorne',
      tour: 'East Coast Retreat',
      date: 'Oct 18, 2023',
      amount: '$1,850',
      status: 'Pending',
      statusType: 'warning', // yellow
    },
  ];

  // Packages list formatted like shops
  const packagesList = [
    {
      id: 'cultural',
      title: '7-Day Cultural Triangle',
      category: 'CULTURE',
      duration: '7 Days',
      price: '$1,250',
      image: require('../../assets/Tours/Cultural Triangle.png'),
      isActive: isCulturalActive,
      toggleActive: () => setIsCulturalActive(!isCulturalActive),
    },
    {
      id: 'hillcountry',
      title: 'Hill Country Escape',
      category: 'NATURE',
      duration: '5 Days',
      price: '$850',
      image: require('../../assets/Tours/HillCountryEscape.png'),
      isActive: isHillCountryActive,
      toggleActive: () => setIsHillCountryActive(!isHillCountryActive),
    },
    {
      id: 'southern',
      title: 'Southern Shore luxury',
      category: 'COASTAL',
      duration: '10 Days',
      price: '$2,400',
      image: require('../../assets/Tours/Sothern Shore.png'),
      isActive: isSouthernActive,
      toggleActive: () => setIsSouthernActive(!isSouthernActive),
    },
  ];

  const handleNotificationPress = () => {
    router.push('/tour-guide/notifications' as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
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
              <Text style={styles.headerTitle}>Guide Dashboard</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={[styles.headerIconButton, { marginRight: 10 }]}
                activeOpacity={0.7}
                onPress={handleNotificationPress}
              >
                <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => router.push('/tour-guide/settings' as any)}
              >
                <View style={styles.avatarCircle}>
                  <MaterialCommunityIcons name="account" size={24} color="#0F3D26" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconWrap}>
                <MaterialCommunityIcons name="cube-outline" size={20} color="#0E5E2F" />
              </View>
              <View>
                <Text style={styles.statValue}>{stats.totalPackages}</Text>
                <Text style={styles.statLabel}>Packages</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: '#FFFBEB' }]}>
                <Ionicons name="calendar-outline" size={20} color="#D97706" />
              </View>
              <View>
                <Text style={styles.statValue}>{stats.activeBookings}</Text>
                <Text style={styles.statLabel}>Bookings</Text>
              </View>
            </View>

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

        <View style={styles.mainContent}>
          {/* Quick Navigation Section */}
          <View style={styles.navSection}>
            <Text style={styles.navSectionTitle}>Quick Navigation</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.navScrollContent}
          >
            <TouchableOpacity
              style={styles.navCard}
              onPress={() => router.push('/tour-guide/insights' as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.navIconBg, { backgroundColor: '#EAF7EE' }]}>
                <Ionicons name="bar-chart-outline" size={16} color="#0E5E2F" />
              </View>
              <Text style={styles.navCardText}>Insights</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navCard}
              onPress={() => router.push('/tour-guide/packages' as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.navIconBg, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="cube-outline" size={16} color="#D97706" />
              </View>
              <Text style={styles.navCardText}>Packages</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navCard}
              onPress={() => router.push('/tour-guide/revenue' as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.navIconBg, { backgroundColor: '#EAF7EE' }]}>
                <Ionicons name="cash-outline" size={16} color="#0E5E2F" />
              </View>
              <Text style={styles.navCardText}>Revenue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navCard}
              onPress={() => router.push('/tour-guide/inquiries' as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.navIconBg, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#0284C7" />
              </View>
              <Text style={styles.navCardText}>Inquiries</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Tour Packages List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Packages</Text>
          <TouchableOpacity activeOpacity={0.6} onPress={() => router.push('/tour-guide/packages' as any)}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {packagesList.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.packageCard}
            activeOpacity={0.9}
            onPress={() => router.push('/tour-guide/packages' as any)}
          >
            <Image 
              source={item.image} 
              style={styles.packageImage} 
              contentFit="cover" 
            />
            
            <View style={styles.packageInfo}>
              <View style={styles.packageHeaderRow}>
                <Text style={styles.packageTitle} numberOfLines={1}>{item.title}</Text>
                <View style={[
                  styles.statusBadge, 
                  item.isActive ? styles.statusActive : styles.statusInactive
                ]}>
                  <Text style={[
                    styles.statusText,
                    item.isActive ? styles.statusTextActive : styles.statusTextInactive
                  ]}>
                    {item.isActive ? 'Active' : 'Draft'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.packageCategory}>{item.category} • {item.duration}</Text>
              
              <View style={styles.packageFooter}>
                <View style={styles.packageFooterItem}>
                  <Ionicons name="cash-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
                  <Text style={styles.packageFooterText}>From {item.price} /pp</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#D1D5DB" />
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Recent Bookings Section */}
        <View style={[styles.sectionHeader, { marginTop: 12 }]}>
          <Text style={styles.sectionTitle}>Upcoming Schedule</Text>
        </View>

        <View style={styles.bookingsCardContainer}>
          {bookingsList.map((booking, index) => {
            const isLast = index === bookingsList.length - 1;
            return (
              <View key={booking.id}>
                <View style={styles.bookingRow}>
                  <View style={styles.bookingLeft}>
                    <Text style={styles.bookingMainText}>
                      #{booking.id} • {booking.customer}
                    </Text>
                    <Text style={styles.bookingTourText}>{booking.tour}</Text>
                    <Text style={styles.bookingDateText}>{booking.date}</Text>
                  </View>

                  <View style={styles.bookingRight}>
                    <Text style={styles.bookingAmount}>{booking.amount}</Text>
                    <View
                      style={[
                        styles.pillBadge,
                        booking.statusType === 'success' ? styles.pillBadgeSuccess : styles.pillBadgeWarning,
                        { marginTop: 6, alignSelf: 'flex-end' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillBadgeText,
                          booking.statusType === 'success' ? styles.pillBadgeSuccessText : styles.pillBadgeWarningText,
                        ]}
                      >
                        {booking.status}
                      </Text>
                    </View>
                  </View>
                </View>
                {!isLast && <View style={styles.bookingDivider} />}
              </View>
            );
          })}
        </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { bottom: insets.bottom + 24 }]} 
        activeOpacity={0.8}
        onPress={() => router.push('/tour-guide/addPackage' as any)}
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
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
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
    paddingHorizontal: 24,
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
    paddingTop: 0,
  },
  mainContent: {
    marginTop: -20,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 32,
    zIndex: 1,
  },
  navSection: {
    marginBottom: 24,
  },
  navSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7C8A81',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.8,
  },
  navScrollContent: {
    paddingRight: 20,
  },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAEFEA',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  navIconBg: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navCardText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1917',
    marginLeft: 8,
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
  packageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 16,
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
  packageImage: {
    width: 90,
    height: 90,
    borderRadius: 16,
  },
  packageInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  packageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  packageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
    flex: 1,
    marginRight: 8,
  },
  packageCategory: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: { backgroundColor: '#ECFDF5' },
  statusInactive: { backgroundColor: '#FEF2F2' },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusTextActive: { color: '#059669' },
  statusTextInactive: { color: '#DC2626' },
  packageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  packageFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  packageFooterText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  bookingsCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EAEFEA',
    padding: 16,
    marginBottom: 20,
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
  bookingTourText: {
    fontSize: 12,
    color: '#606963',
    marginTop: 2,
    fontWeight: '500',
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
  bookingDivider: {
    height: 1,
    backgroundColor: '#F2F5F3',
    marginVertical: 12,
  },
  fab: {
    position: 'absolute',
    right: 24,
    zIndex: 100,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TourHomeScreen;
