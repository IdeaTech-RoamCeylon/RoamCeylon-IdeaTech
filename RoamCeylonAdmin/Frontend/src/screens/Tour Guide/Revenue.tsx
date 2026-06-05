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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const Revenue = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // State to toggle between 6 Months and Yearly trend views
  const [selectedTrendRange, setSelectedTrendRange] = useState<'6months' | 'yearly'>('6months');

  // Chart data definitions
  const sixMonthsChartData = [
    { label: 'MAY', heightPercent: 35, isCurrent: false },
    { label: 'JUN', heightPercent: 55, isCurrent: false },
    { label: 'JUL', heightPercent: 70, isCurrent: false },
    { label: 'AUG', heightPercent: 60, isCurrent: false },
    { label: 'SEP', heightPercent: 82, isCurrent: false },
    { label: 'OCT', heightPercent: 100, isCurrent: true },
  ];

  const yearlyChartData = [
    { label: '2020', heightPercent: 40, isCurrent: false },
    { label: '2021', heightPercent: 65, isCurrent: false },
    { label: '2022', heightPercent: 80, isCurrent: false },
    { label: '2023', heightPercent: 100, isCurrent: true },
  ];

  const currentChartData = selectedTrendRange === '6months' ? sixMonthsChartData : yearlyChartData;

  // Breakdown metrics
  const breakdowns = [
    {
      title: 'Package Sales',
      amount: '$56,200',
      percentage: '66.5% of total revenue',
      icon: 'cube-outline',
      iconColor: '#0E5E2F',
      bgCircleColor: '#EAF7EE',
    },
    {
      title: 'Add-ons',
      amount: '$18,450',
      percentage: '21.8% of total revenue',
      icon: 'notifications-outline',
      iconColor: '#0E5E2F',
      bgCircleColor: '#EAF7EE',
    },
    {
      title: 'Guide Fees',
      amount: '$9,850',
      percentage: '11.7% of total revenue',
      icon: 'card-outline',
      iconColor: '#0E5E2F',
      bgCircleColor: '#EAF7EE',
    },
  ];

  // High-value bookings list
  const highValueBookings = [
    {
      id: 'RC-8872',
      customer: 'Eleanor Richards',
      tour: '7-Day Cultural Triangle',
      amount: '$3,400',
      status: 'CONFIRMED',
      statusType: 'success',
      avatar: 'https://images.unsplash.com/photo-1542856391-010fb87dcfed?auto=format&fit=crop&w=150&q=80',
    },
    {
      id: 'RC-8891',
      customer: 'Marcus Thorne',
      tour: 'East Coast Safari Retreat',
      amount: '$5,850',
      status: 'PENDING',
      statusType: 'warning',
      avatar: 'https://images.unsplash.com/photo-1575550959106-5a7defe28b56?auto=format&fit=crop&w=150&q=80',
    },
    {
      id: 'RC-8904',
      customer: 'Sophia Chen',
      tour: 'Hill Country Luxury Escape',
      amount: '$2,950',
      status: 'CONFIRMED',
      statusType: 'success',
      avatar: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=150&q=80',
    },
  ];

  const handleMenuPress = () => {
    Alert.alert('Menu', 'Hamburger menu options are coming soon!');
  };

  const handleNotificationPress = () => {
    Alert.alert('Notifications', 'No new notifications.');
  };

  const handleViewAllBookingsPress = () => {
    Alert.alert('Recent Bookings', 'Redirecting to booking manager...');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.headerIconButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back-outline" size={28} color="#1C1917" />
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/Roam Ceylon Logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerIconButton, { marginRight: 8 }]}
            activeOpacity={0.7}
            onPress={handleNotificationPress}
          >
            <Ionicons name="notifications-outline" size={24} color="#1C1917" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileButton}
            activeOpacity={0.7}
            onPress={() => router.push('/tour-guide/settings' as any)}
          >
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
              }}
              style={styles.profileImage}
              contentFit="cover"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.topLabel}>FINANCIAL PERFORMANCE</Text>
          <Text style={styles.title}>Revenue Overview</Text>
          <Text style={styles.subtitle}>
            Detailed earnings and financial breakdown for October 2023.
          </Text>
        </View>

        {/* Total Revenue Card with background graphic accent */}
        <View style={styles.revenueCard}>
          {/* Faint circle graphic inside card */}
          <View style={styles.revenueCardCircleAccent} />
          
          <Text style={styles.revenueCardTitle}>TOTAL REVENUE (OCT)</Text>
          <View style={styles.revenueValueRow}>
            <Text style={styles.revenueValue}>$84,500</Text>
            <View style={styles.trendBadge}>
              <Ionicons name="trending-up-outline" size={14} color="#0E5E2F" style={{ marginRight: 4 }} />
              <Text style={styles.trendBadgeText}>+18%</Text>
            </View>
          </View>
        </View>

        {/* Earnings Trend Card with Custom Bar Chart */}
        <View style={styles.trendCard}>
          <View style={styles.trendCardHeader}>
            <Text style={styles.trendCardTitle}>Earnings Trend</Text>
            <View style={styles.selectorContainer}>
              <TouchableOpacity
                style={[
                  styles.selectorButton,
                  selectedTrendRange === '6months' && styles.selectorActiveButton,
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedTrendRange('6months')}
              >
                <Text
                  style={[
                    styles.selectorButtonText,
                    selectedTrendRange === '6months' && styles.selectorActiveButtonText,
                  ]}
                >
                  6 Months
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.selectorButton,
                  selectedTrendRange === 'yearly' && styles.selectorActiveButton,
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedTrendRange('yearly')}
              >
                <Text
                  style={[
                    styles.selectorButtonText,
                    selectedTrendRange === 'yearly' && styles.selectorActiveButtonText,
                  ]}
                >
                  Yearly
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Custom Bar Chart Canvas */}
          <View style={styles.chartContainer}>
            <View style={styles.chartBarsRow}>
              {currentChartData.map((data) => (
                <View key={data.label} style={styles.chartBarCol}>
                  <View style={styles.barBackgroundTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${data.heightPercent}%` },
                        data.isCurrent ? styles.barFillActive : styles.barFillInactive,
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.chartLabelText,
                      data.isCurrent && styles.chartLabelTextActive,
                    ]}
                  >
                    {data.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Breakdown Cards Stacked Vertically */}
        <View style={styles.breakdownContainer}>
          {breakdowns.map((breakdown) => (
            <View key={breakdown.title} style={styles.breakdownCard}>
              <View style={[styles.breakdownIconCircle, { backgroundColor: breakdown.bgCircleColor }]}>
                <Ionicons name={breakdown.icon as any} size={20} color={breakdown.iconColor} />
              </View>
              <View style={styles.breakdownInfoCol}>
                <Text style={styles.breakdownTitleText}>{breakdown.title}</Text>
                <Text style={styles.breakdownValueText}>{breakdown.amount}</Text>
                <Text style={styles.breakdownPercentageText}>{breakdown.percentage}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Recent High-Value Bookings Section */}
        <View style={[styles.sectionHeader, { marginTop: 12 }]}>
          <Text style={styles.sectionTitle}>Recent High-Value Bookings</Text>
          <TouchableOpacity activeOpacity={0.6} onPress={handleViewAllBookingsPress}>
            <Text style={styles.viewAllLinkText}>VIEW BOOKINGS</Text>
          </TouchableOpacity>
        </View>

        {/* High-value Booking Cards with colored left borders */}
        <View style={styles.bookingsList}>
          {highValueBookings.map((booking) => {
            const isSuccess = booking.statusType === 'success';
            return (
              <View
                key={booking.id}
                style={[
                  styles.bookingCard,
                  isSuccess ? styles.bookingCardSuccess : styles.bookingCardWarning,
                ]}
              >
                {/* Image Avatar */}
                <Image source={{ uri: booking.avatar }} style={styles.bookingAvatar} contentFit="cover" />

                {/* Booking Info */}
                <View style={styles.bookingDetailsCol}>
                  <Text style={styles.bookingHeaderName}>
                    #{booking.id} • {booking.customer}
                  </Text>
                  <View style={styles.bookingLocationRow}>
                    <Ionicons name="location-outline" size={14} color="#60646C" style={{ marginRight: 4 }} />
                    <Text style={styles.bookingTourNameText}>{booking.tour}</Text>
                  </View>
                </View>

                {/* Pricing & Status Badge */}
                <View style={styles.bookingBadgeCol}>
                  <Text style={styles.bookingPrice}>{booking.amount}</Text>
                  <View
                    style={[
                      styles.pillBadge,
                      isSuccess ? styles.pillBadgeSuccess : styles.pillBadgeWarning,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillBadgeText,
                        isSuccess ? styles.pillBadgeSuccessText : styles.pillBadgeWarningText,
                      ]}
                    >
                      {booking.status}
                    </Text>
                  </View>
                </View>
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
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F1',
    zIndex: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logo: {
    width: 140,
    height: 32,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#EAF2EC',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
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
    marginBottom: 24,
  },
  topLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0E5E2F',
    letterSpacing: 0.8,
    marginBottom: 6,
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
    lineHeight: 22,
    fontWeight: '500',
  },
  revenueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 24,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  revenueCardCircleAccent: {
    position: 'absolute',
    top: -24,
    right: -24,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EAF7EE',
    opacity: 0.8,
  },
  revenueCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#60646C',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  revenueValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  revenueValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.8,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C2F3D0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 14,
  },
  trendBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0E5E2F',
  },
  trendCard: {
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
  trendCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  trendCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
  },
  selectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 3,
  },
  selectorButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 11,
  },
  selectorActiveButton: {
    backgroundColor: '#EAD26B',
  },
  selectorButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#60646C',
  },
  selectorActiveButtonText: {
    color: '#5B600A',
    fontWeight: '800',
  },
  chartContainer: {
    height: 180,
    justifyContent: 'flex-end',
    paddingTop: 10,
  },
  chartBarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
  },
  chartBarCol: {
    alignItems: 'center',
    flex: 1,
  },
  barBackgroundTrack: {
    height: 130,
    width: 28,
    backgroundColor: '#FAFBFB',
    borderRadius: 14,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  barFillActive: {
    backgroundColor: '#5CBA7A', // Highlighting the current month
  },
  barFillInactive: {
    backgroundColor: '#E5E7EB',
  },
  chartLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A3A8A5',
    marginTop: 8,
  },
  chartLabelTextActive: {
    color: '#1C1917',
    fontWeight: '800',
  },
  breakdownContainer: {
    marginBottom: 24,
    gap: 12,
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  breakdownIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  breakdownInfoCol: {
    flex: 1,
  },
  breakdownTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#60646C',
    marginBottom: 4,
  },
  breakdownValueText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 4,
  },
  breakdownPercentageText: {
    fontSize: 13,
    color: '#A3A8A5',
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.3,
  },
  viewAllLinkText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5B600A',
    letterSpacing: 0.5,
  },
  bookingsList: {
    gap: 12,
  },
  bookingCard: {
    borderRadius: 24,
    borderWidth: 1.2,
    borderLeftWidth: 6,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingCardSuccess: {
    backgroundColor: '#F4FBF7',
    borderColor: '#EAF2EC',
    borderLeftColor: '#0E5E2F',
  },
  bookingCardWarning: {
    backgroundColor: '#FFFDF0',
    borderColor: '#FDFBE7',
    borderLeftColor: '#5B600A',
  },
  bookingAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
    backgroundColor: '#EAEAEA',
  },
  bookingDetailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  bookingHeaderName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1917',
  },
  bookingLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  bookingTourNameText: {
    fontSize: 13,
    color: '#60646C',
    fontWeight: '600',
  },
  bookingBadgeCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  bookingPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 6,
  },
  pillBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
    fontSize: 10,
    fontWeight: '800',
  },
  pillBadgeSuccessText: {
    color: '#0E5E2F',
  },
  pillBadgeWarningText: {
    color: '#5B600A',
  },
});

export default Revenue;
