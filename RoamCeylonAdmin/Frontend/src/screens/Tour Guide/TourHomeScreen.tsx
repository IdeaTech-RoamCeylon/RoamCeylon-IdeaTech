import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const TourHomeScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // State for Tour Packages status toggles
  const [isCulturalActive, setIsCulturalActive] = useState(true);
  const [isHillCountryActive, setIsHillCountryActive] = useState(false);

  // Stats / Performance Overview data
  const performanceStats = [
    {
      id: 'total-packages',
      title: 'Total Packages',
      value: '124',
      trend: '↗ +12% from last month',
      isPositive: true,
      icon: 'cube-outline',
      iconColor: '#0E5E2F',
      badgeBg: '#EAF7EE',
    },
    {
      id: 'active-inquiries',
      title: 'Active Inquiries',
      value: '48',
      trend: '↗ +5 new today',
      isPositive: true,
      icon: 'chatbubble-ellipses-outline',
      iconColor: '#0E5E2F',
      badgeBg: '#EAF7EE',
    },
    {
      id: 'conversion-rate',
      title: 'Conversion Rate',
      value: '22.4%',
      trend: '↘ -1.2% from last month',
      isPositive: false,
      icon: 'analytics-outline',
      iconColor: '#D97706',
      badgeBg: '#FEF3C7',
    },
    {
      id: 'monthly-revenue',
      title: 'Monthly Revenue',
      value: '$84,500',
      trend: '↗ +18% vs target',
      isPositive: true,
      icon: 'cash-outline',
      iconColor: '#0E5E2F',
      badgeBg: '#EAF7EE',
    },
  ];

  // Guides list
  const guides = [
    {
      name: 'Kamal Perera',
      assignment: 'Cultural Triangle',
      status: 'On Tour',
      statusType: 'warning', // yellow
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      isActive: true,
    },
    {
      name: 'Nishanthi Silva',
      assignment: 'Wildlife Safari',
      status: 'Available',
      statusType: 'success', // green
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      isActive: true,
    },
    {
      name: 'Rohan Peiris',
      assignment: 'Hill Country',
      status: 'On Tour',
      statusType: 'warning', // yellow
      avatar: null, // Initial RP text avatar
      isActive: false,
    },
  ];

  // Recent Bookings data
  const bookings = [
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

  const handleNotificationPress = () => {
    Alert.alert('Notifications', 'No new notifications.');
  };

  const handleAllocateGuidePress = () => {
    Alert.alert('Guide Allocation', 'Redirecting to guide allocation manager...');
  };

  const handleMenuPress = () => {
    Alert.alert('Menu', 'Guide actions menu opened.');
  };

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
        <TouchableOpacity
          style={styles.notificationButton}
          activeOpacity={0.7}
          onPress={handleNotificationPress}
        >
          <Ionicons name="notifications-outline" size={24} color="#1C1917" />
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
        {/* Overview Header Section */}
        <View style={styles.sectionHeadingBlock}>
          <Text style={styles.mainTitle}>Overview</Text>
          <Text style={styles.mainSubtitle}>
            Welcome back. Here is your agency's performance at a glance.
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
              onPress={() => router.push('/tour-guide/insights' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="bar-chart-outline" size={20} color="#0E5E2F" />
              <Text style={styles.navCardText}>Insights</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navCard}
              onPress={() => router.push('/tour-guide/packages' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="cube-outline" size={20} color="#0E5E2F" />
              <Text style={styles.navCardText}>Packages</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navCard}
              onPress={() => router.push('/tour-guide/revenue' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="cash-outline" size={20} color="#0E5E2F" />
              <Text style={styles.navCardText}>Revenue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navCard}
              onPress={() => router.push('/tour-guide/inquiries' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#0E5E2F" />
              <Text style={styles.navCardText}>Inquiries</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Overview Stats Cards Stacked Vertically */}
        <View style={styles.statsContainer}>
          {performanceStats.map((stat) => (
            <View key={stat.id} style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <Text style={styles.statTitle}>{stat.title}</Text>
                <View style={[styles.statIconBadge, { backgroundColor: stat.badgeBg }]}>
                  <Ionicons name={stat.icon as any} size={18} color={stat.iconColor} />
                </View>
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <View style={styles.trendRow}>
                <Text
                  style={[
                    styles.trendText,
                    stat.isPositive ? styles.trendPositive : styles.trendNegative,
                  ]}
                >
                  {stat.trend}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Tour Packages Section */}
        <View style={styles.sectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Tour Packages</Text>
            <Text style={styles.sectionSubtitle}>
              Manage visibility of your top itineraries.
            </Text>
          </View>
          <TouchableOpacity activeOpacity={0.6}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Tour Card 1: 7-Day Cultural Triangle */}
        <View style={[styles.tourCard, !isCulturalActive && styles.tourCardDraft]}>
          <View style={styles.tourImageWrapper}>
            <Image
              source={require('../../assets/Tours/Cultural Triangle.png')}
              style={styles.tourImage}
              contentFit="cover"
            />
            {!isCulturalActive && <View style={styles.imageDraftOverlay} />}
            <View style={[styles.statusTag, isCulturalActive ? styles.statusTagActive : styles.statusTagDraft]}>
              <View style={[styles.statusDot, isCulturalActive ? styles.statusDotActive : styles.statusDotDraft]} />
              <Text style={[styles.statusTagText, isCulturalActive ? styles.statusTagTextActive : styles.statusTagTextDraft]}>
                {isCulturalActive ? 'Active' : 'Draft'}
              </Text>
            </View>
          </View>

          <View style={styles.tourInfo}>
            <View style={styles.tourTitleRow}>
              <Text style={styles.tourName}>7–Day Cultural Triangle</Text>
              <View style={[styles.durationBadge, isCulturalActive ? styles.durationBadgeActive : styles.durationBadgeDraft]}>
                <Ionicons
                  name="time-outline"
                  size={12}
                  color={isCulturalActive ? '#5B600A' : '#60646C'}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.durationText, isCulturalActive ? styles.durationTextActive : styles.durationTextDraft]}>
                  7 Days
                </Text>
              </View>
            </View>

            <Text style={styles.tourDescription}>
              Explore ancient ruins, sacred temples, and the majestic Sigiriya rock.
            </Text>

            <View style={styles.tourDivider} />

            <View style={styles.tourFooter}>
              <Text style={styles.priceText}>
                <Text style={styles.priceLabel}>From </Text>
                $1,200 <Text style={styles.priceUnit}>/pp</Text>
              </Text>

              {/* Custom Switch Toggle */}
              <TouchableOpacity
                style={[
                  styles.customSwitchContainer,
                  isCulturalActive ? styles.customSwitchActiveBg : styles.customSwitchInactiveBg,
                ]}
                activeOpacity={0.8}
                onPress={() => setIsCulturalActive(!isCulturalActive)}
              >
                <View
                  style={[
                    styles.customSwitchCircle,
                    isCulturalActive ? styles.customSwitchCircleActive : styles.customSwitchCircleInactive,
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Tour Card 2: Hill Country Escape */}
        <View style={[styles.tourCard, !isHillCountryActive && styles.tourCardDraft]}>
          <View style={styles.tourImageWrapper}>
            <Image
              source={require('../../assets/Tours/HillCountryEscape.png')}
              style={styles.tourImage}
              contentFit="cover"
            />
            {!isHillCountryActive && <View style={styles.imageDraftOverlay} />}
            <View style={[styles.statusTag, isHillCountryActive ? styles.statusTagActive : styles.statusTagDraft]}>
              <View style={[styles.statusDot, isHillCountryActive ? styles.statusDotActive : styles.statusDotDraft]} />
              <Text style={[styles.statusTagText, isHillCountryActive ? styles.statusTagTextActive : styles.statusTagTextDraft]}>
                {isHillCountryActive ? 'Active' : 'Draft'}
              </Text>
            </View>
          </View>

          <View style={styles.tourInfo}>
            <View style={styles.tourTitleRow}>
              <Text style={styles.tourName}>Hill Country Escape</Text>
              <View style={[styles.durationBadge, isHillCountryActive ? styles.durationBadgeActive : styles.durationBadgeDraft]}>
                <Ionicons
                  name="time-outline"
                  size={12}
                  color={isHillCountryActive ? '#5B600A' : '#60646C'}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.durationText, isHillCountryActive ? styles.durationTextActive : styles.durationTextDraft]}>
                  5 Days
                </Text>
              </View>
            </View>

            <Text style={styles.tourDescription}>
              Experience cool climates, endless tea estates, and cascading waterfalls.
            </Text>

            <View style={styles.tourDivider} />

            <View style={styles.tourFooter}>
              <Text style={styles.priceText}>
                <Text style={styles.priceLabel}>From </Text>
                $850 <Text style={styles.priceUnit}>/pp</Text>
              </Text>

              {/* Custom Switch Toggle */}
              <TouchableOpacity
                style={[
                  styles.customSwitchContainer,
                  isHillCountryActive ? styles.customSwitchActiveBg : styles.customSwitchInactiveBg,
                ]}
                activeOpacity={0.8}
                onPress={() => setIsHillCountryActive(!isHillCountryActive)}
              >
                <View
                  style={[
                    styles.customSwitchCircle,
                    isHillCountryActive ? styles.customSwitchCircleActive : styles.customSwitchCircleInactive,
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Guide Allocation Section */}
        <View style={[styles.sectionHeader, { marginTop: 12 }]}>
          <Text style={styles.sectionTitle}>Guide Allocation</Text>
          <TouchableOpacity activeOpacity={0.6} onPress={handleMenuPress}>
            <Ionicons name="ellipsis-horizontal" size={22} color="#1C1917" />
          </TouchableOpacity>
        </View>

        <View style={styles.guideCardContainer}>
          {guides.map((guide, index) => {
            const isLast = index === guides.length - 1;
            return (
              <View key={guide.name}>
                <View style={styles.guideRow}>
                  {/* Avatar block */}
                  <View style={styles.avatarWrapper}>
                    {guide.avatar ? (
                      <Image source={{ uri: guide.avatar }} style={styles.guideAvatar} contentFit="cover" />
                    ) : (
                      <View style={styles.textAvatarContainer}>
                        <Text style={styles.textAvatarText}>RP</Text>
                      </View>
                    )}
                    {guide.isActive && <View style={styles.activeIndicatorDot} />}
                  </View>

                  {/* Guide Info */}
                  <View style={styles.guideInfoCol}>
                    <Text style={styles.guideName}>{guide.name}</Text>
                    <Text style={styles.guideAssignment}>{guide.assignment}</Text>
                  </View>

                  {/* Badge */}
                  <View
                    style={[
                      styles.pillBadge,
                      guide.statusType === 'success' ? styles.pillBadgeSuccess : styles.pillBadgeWarning,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillBadgeText,
                        guide.statusType === 'success' ? styles.pillBadgeSuccessText : styles.pillBadgeWarningText,
                      ]}
                    >
                      {guide.status}
                    </Text>
                  </View>
                </View>
                {!isLast && <View style={styles.guideDivider} />}
              </View>
            );
          })}

          {/* Allocate Guide Button */}
          <TouchableOpacity
            style={styles.allocateButton}
            activeOpacity={0.7}
            onPress={handleAllocateGuidePress}
          >
            <Feather name="plus" size={16} color="#1C1917" style={{ marginRight: 6 }} />
            <Text style={styles.allocateButtonText}>Allocate Guide</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Bookings Section */}
        <View style={[styles.sectionHeader, { marginTop: 12 }]}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
        </View>

        <View style={styles.bookingsCardContainer}>
          {bookings.map((booking, index) => {
            const isLast = index === bookings.length - 1;
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
    backgroundColor: '#FAFBFB',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeadingBlock: {
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.5,
  },
  navSection: {
    marginTop: 0,
    marginBottom: 20,
    paddingHorizontal: 0,
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
  mainSubtitle: {
    fontSize: 15,
    color: '#60646C',
    marginTop: 6,
    lineHeight: 21,
    fontWeight: '500',
  },
  statsContainer: {
    marginBottom: 28,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#60646C',
  },
  statIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAFBFB',
    borderWidth: 1,
    borderColor: '#EAF2EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 13,
    fontWeight: '700',
  },
  trendPositive: {
    color: '#0E5E2F',
  },
  trendNegative: {
    color: '#C2410C',
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
  sectionSubtitle: {
    fontSize: 14,
    color: '#60646C',
    marginTop: 4,
    fontWeight: '500',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E5E2F',
  },
  tourCard: {
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
  tourCardDraft: {
    // Styles applied to card when tour is in Draft mode
  },
  tourImageWrapper: {
    width: '100%',
    height: 180,
    position: 'relative',
    backgroundColor: '#EAEAEA',
  },
  tourImage: {
    width: '100%',
    height: '100%',
  },
  imageDraftOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.45)', // Custom mockup look to dim and grayscale the image
  },
  statusTag: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusTagActive: {
    backgroundColor: '#C2F3D0',
  },
  statusTagDraft: {
    backgroundColor: '#F3F4F6',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusDotActive: {
    backgroundColor: '#0E5E2F',
  },
  statusDotDraft: {
    backgroundColor: '#60646C',
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statusTagTextActive: {
    color: '#0E5E2F',
  },
  statusTagTextDraft: {
    color: '#60646C',
  },
  tourInfo: {
    padding: 20,
  },
  tourTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tourName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
    flex: 1,
    marginRight: 8,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  durationBadgeActive: {
    backgroundColor: '#FCE788',
  },
  durationBadgeDraft: {
    backgroundColor: '#F3F4F6',
  },
  durationText: {
    fontSize: 11,
    fontWeight: '800',
  },
  durationTextActive: {
    color: '#5B600A',
  },
  durationTextDraft: {
    color: '#60646C',
  },
  tourDescription: {
    fontSize: 14,
    color: '#60646C',
    lineHeight: 20,
    fontWeight: '500',
  },
  tourDivider: {
    height: 1,
    backgroundColor: '#F0F3F1',
    marginVertical: 16,
  },
  tourFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
  },
  priceLabel: {
    fontSize: 14,
    color: '#60646C',
    fontWeight: '500',
  },
  priceUnit: {
    fontSize: 14,
    color: '#60646C',
    fontWeight: '500',
  },
  customSwitchContainer: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 3,
    justifyContent: 'center',
  },
  customSwitchActiveBg: {
    backgroundColor: '#0E5E2F',
  },
  customSwitchInactiveBg: {
    backgroundColor: '#E5E7EB',
  },
  customSwitchCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  customSwitchCircleActive: {
    alignSelf: 'flex-end',
  },
  customSwitchCircleInactive: {
    alignSelf: 'flex-start',
  },
  guideCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 20,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  guideAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EAEAEA',
  },
  textAvatarContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EAF7EE',
    borderWidth: 1.2,
    borderColor: '#C2F3D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0E5E2F',
  },
  activeIndicatorDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0E5E2F',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  guideInfoCol: {
    flex: 1,
  },
  guideName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1917',
  },
  guideAssignment: {
    fontSize: 13,
    color: '#60646C',
    marginTop: 2,
    fontWeight: '500',
  },
  pillBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillBadgeSuccess: {
    backgroundColor: '#C2F3D0',
  },
  pillBadgeWarning: {
    backgroundColor: '#FCE788',
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  pillBadgeSuccessText: {
    color: '#0E5E2F',
  },
  pillBadgeWarningText: {
    color: '#5B600A',
  },
  guideDivider: {
    height: 1,
    backgroundColor: '#F0F3F1',
    marginVertical: 14,
  },
  allocateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#A3A8A5',
    borderStyle: 'dashed',
    height: 48,
    marginTop: 16,
  },
  allocateButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1917',
  },
  bookingsCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 20,
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
    alignItems: 'flex-start',
  },
  bookingLeft: {
    flex: 1,
    marginRight: 10,
  },
  bookingMainText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1917',
  },
  bookingTourText: {
    fontSize: 13,
    color: '#60646C',
    marginTop: 4,
    fontWeight: '600',
  },
  bookingDateText: {
    fontSize: 13,
    color: '#60646C',
    marginTop: 4,
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
  bookingDivider: {
    height: 1,
    backgroundColor: '#F0F3F1',
    marginVertical: 14,
  },
});

export default TourHomeScreen;
