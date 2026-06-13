import React, { useState, useEffect } from 'react';
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
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';

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
      iconColor: '#D97706',
      bgCircleColor: '#FFFBEB',
    },
    {
      title: 'Guide Fees',
      amount: '$9,850',
      percentage: '11.7% of total revenue',
      icon: 'card-outline',
      iconColor: '#2563EB',
      bgCircleColor: '#EFF6FF',
    },
  ];

  const [loading, setLoading] = useState(true);
  const [highValueBookings, setHighValueBookings] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const accessToken = await SecureStore.getItemAsync('authToken');
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';

        if (!accessToken) return;

        const res = await fetch(`${apiUrl}/tour-guide/dashboard`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          setTotalRevenue(data.totalRevenue || 0);
          setHighValueBookings(data.recentBookings?.slice(0, 5) || []);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const handleViewAllBookingsPress = () => {
    router.push('/tour-guide/bookings' as any);
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
          <Text style={[styles.headerTitle, { color: '#1C1917' }]}>Revenue Overview</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.mainContent}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.pageSubtitle}>
              Detailed earnings and financial breakdown for October 2023.
            </Text>
          </View>

        {/* Total Revenue Card (Linear Gradient Emerald) */}
        <LinearGradient
          colors={['#0F3D26', '#0E5E2F', '#064E3B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.revenueCard}
        >
          {/* Subtle Decorative Background Renders */}
          <View style={styles.kpiRing1} />
          <View style={styles.kpiRing2} />
          <View style={styles.kpiGlowBlob} />
          
          {/* Card Header Row */}
          <View style={styles.revenueCardHeaderRow}>
            <Text style={styles.revenueCardTitle}>TOTAL ESTIMATED REVENUE</Text>
            <View style={styles.periodBadge}>
              <Ionicons name="calendar-outline" size={12} color="rgba(255, 255, 255, 0.8)" style={{ marginRight: 4 }} />
              <Text style={styles.periodBadgeText}>Oct 2023</Text>
            </View>
          </View>

          {/* Main Figure & Trend Badge */}
          <View style={styles.revenueValueRow}>
            <Text style={styles.revenueValue}>Rs. {totalRevenue.toLocaleString()}</Text>
            
            <View style={styles.trendBadgeGlass}>
              <Ionicons name="trending-up" size={13} color="#34D399" style={{ marginRight: 4 }} />
              <Text style={styles.trendBadgeGlassText}>+14.2%</Text>
            </View>
          </View>

          {/* Thin Glassmorphism Divider */}
          <View style={styles.cardDividerGlass} />

          {/* Target Progress Section */}
          <View style={styles.targetProgressContainer}>
            <View style={styles.targetProgressLabelRow}>
              <Text style={styles.targetProgressLabel}>Monthly Goal Progress</Text>
              <Text style={styles.targetProgressValue}>$84,500 / $100,000</Text>
            </View>
            
            {/* Progress Bar Track */}
            <View style={styles.progressBarTrack}>
              <LinearGradient
                colors={['#34D399', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: '84.5%' }]}
              />
            </View>
            
            {/* Target Progress Context Footnote */}
            <Text style={styles.targetProgressFootnote}>
              On track to exceed target by $2,900
            </Text>
          </View>
        </LinearGradient>

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
            {/* Background Chart Grid lines */}
            <View style={styles.chartGridLines}>
              <View style={styles.gridLine} />
              <View style={styles.gridLine} />
              <View style={styles.gridLine} />
              <View style={styles.gridLine} />
            </View>

            <View style={styles.chartBarsRow}>
              {currentChartData.map((data) => (
                <View key={data.label} style={styles.chartBarCol}>
                  <View style={styles.barBackgroundTrack}>
                    {data.isCurrent ? (
                      <LinearGradient
                        colors={['#34D399', '#0E5E2F']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={[styles.barFill, { height: `${data.heightPercent}%` }]}
                      />
                    ) : (
                      <View
                        style={[
                          styles.barFill,
                          { height: `${data.heightPercent}%` },
                          styles.barFillInactive,
                        ]}
                      />
                    )}
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

        {/* Consolidated Revenue Breakdown Card */}
        <View style={styles.breakdownSectionCard}>
          <Text style={styles.breakdownCardTitle}>Revenue Breakdown</Text>
          
          {/* Segmented Progress Bar */}
          <View style={styles.segmentedBarContainer}>
            <View style={[styles.barSegment, { flex: 66.5, backgroundColor: '#0E5E2F', borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }]} />
            <View style={[styles.barSegment, { flex: 21.8, backgroundColor: '#D97706' }]} />
            <View style={[styles.barSegment, { flex: 11.7, backgroundColor: '#2563EB', borderTopRightRadius: 6, borderBottomRightRadius: 6 }]} />
          </View>

          {/* Breakdown Items List */}
          <View style={styles.breakdownGrid}>
            {breakdowns.map((breakdown, idx) => {
              const dotColors = ['#0E5E2F', '#D97706', '#2563EB'];
              const activeColor = dotColors[idx % dotColors.length];
              return (
                <View key={breakdown.title} style={styles.breakdownGridItem}>
                  <View style={styles.breakdownItemHeader}>
                    <View style={[styles.legendDot, { backgroundColor: activeColor }]} />
                    <Text style={styles.breakdownItemTitle}>{breakdown.title}</Text>
                  </View>
                  <Text style={styles.breakdownItemValue}>{breakdown.amount}</Text>
                  <Text style={styles.breakdownItemPercentage}>
                    {breakdown.percentage.split('%')[0]}% of total
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Recent High-Value Bookings Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent High-Value Bookings</Text>
          <TouchableOpacity activeOpacity={0.6} onPress={handleViewAllBookingsPress}>
            <Text style={styles.viewAllLinkText}>View Bookings</Text>
          </TouchableOpacity>
        </View>

        {/* High-value Booking Cards with colored left borders */}
        <View style={styles.bookingsList}>
            {loading ? (
              <ActivityIndicator size="large" color="#0E5E2F" style={{ marginVertical: 20 }} />
            ) : highValueBookings.length > 0 ? (
              highValueBookings.map((booking) => {
                const shortId = booking.id ? booking.id.substring(0, 8).toUpperCase() : 'UNKNOWN';
                const isSuccess = booking.status === 'confirmed' || booking.status === 'completed';
                const isWarning = booking.status === 'pending';

                return (
                  <View
                    key={booking.id}
                    style={[
                      styles.bookingCard,
                      isSuccess ? styles.bookingCardSuccess : isWarning ? styles.bookingCardWarning : undefined,
                    ]}
                  >
                    {/* Image Avatar */}
                    <Image source={{ uri: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(booking.customerName || 'User') + '&background=random' }} style={styles.bookingAvatar} contentFit="cover" />

                    {/* Booking Info */}
                    <View style={styles.bookingDetailsCol}>
                      <Text style={styles.bookingHeaderName}>
                        #{shortId} • {booking.customerName}
                      </Text>
                      <View style={styles.bookingLocationRow}>
                        <Ionicons name="location-outline" size={14} color="#8A958E" style={{ marginRight: 4 }} />
                        <Text style={styles.bookingTourNameText} numberOfLines={1}>{booking.tourName}</Text>
                      </View>
                    </View>

                    {/* Pricing & Status Badge */}
                    <View style={styles.bookingBadgeCol}>
                      <Text style={styles.bookingPrice}>Rs. {booking.amount}</Text>
                      <View
                        style={[
                          styles.pillBadge,
                          isSuccess ? styles.pillBadgeSuccess : isWarning ? styles.pillBadgeWarning : undefined,
                        ]}
                      >
                        <Text
                          style={[
                            styles.pillBadgeText,
                            isSuccess ? styles.pillBadgeSuccessText : isWarning ? styles.pillBadgeWarningText : undefined,
                            { textTransform: 'uppercase' }
                          ]}
                        >
                          {booking.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={{ textAlign: 'center', marginVertical: 20, color: '#6B7280' }}>
                No recent bookings found.
              </Text>
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
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
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
  revenueCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#0E5E2F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  kpiRing1: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  kpiRing2: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 12,
    borderColor: 'rgba(255, 255, 255, 0.025)',
  },
  kpiGlowBlob: {
    position: 'absolute',
    left: -30,
    bottom: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(52, 211, 153, 0.04)',
  },
  revenueCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  revenueCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 1,
  },
  periodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  periodBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  revenueValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  trendBadgeGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.18)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 14,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  trendBadgeGlassText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#34D399',
  },
  cardDividerGlass: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginVertical: 18,
  },
  targetProgressContainer: {
    width: '100%',
  },
  targetProgressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  targetProgressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  targetProgressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  targetProgressFootnote: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  trendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 0,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  trendCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  trendCardTitle: {
    fontSize: 16,
    fontWeight: '700',
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
    backgroundColor: '#0E5E2F',
  },
  selectorButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  selectorActiveButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  chartContainer: {
    height: 180,
    justifyContent: 'flex-end',
    paddingTop: 10,
    position: 'relative',
  },
  chartGridLines: {
    position: 'absolute',
    top: 10,
    bottom: 28,
    left: 0,
    right: 0,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#F3F4F6',
    width: '100%',
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
    width: 24,
    backgroundColor: '#FAFBFB',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  barFill: {
    width: '100%',
    borderRadius: 12,
  },
  barFillActive: {
    backgroundColor: '#0E5E2F', // Highlighting active period in emerald green
  },
  barFillInactive: {
    backgroundColor: '#E5E7EB',
  },
  chartLabelText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8A958E',
    marginTop: 8,
  },
  chartLabelTextActive: {
    color: '#0E5E2F',
    fontWeight: '800',
  },
  breakdownSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F0F3F1',
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  breakdownCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 16,
  },
  segmentedBarContainer: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    marginBottom: 20,
  },
  barSegment: {
    height: '100%',
  },
  breakdownGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  breakdownGridItem: {
    flex: 1,
  },
  breakdownItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  breakdownItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  breakdownItemValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 2,
  },
  breakdownItemPercentage: {
    fontSize: 10,
    color: '#8A958E',
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1917',
    letterSpacing: -0.3,
  },
  viewAllLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0E5E2F',
  },
  bookingsList: {
    gap: 12,
  },
  bookingCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EAEFEA',
    borderLeftWidth: 6,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
    backgroundColor: '#FFFFFF',
  },
  bookingCardSuccess: {
    borderLeftColor: '#0E5E2F',
  },
  bookingCardWarning: {
    borderLeftColor: '#D97706',
  },
  bookingAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    marginRight: 14,
    backgroundColor: '#EAEAEA',
  },
  bookingDetailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  bookingHeaderName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1917',
  },
  bookingLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  bookingTourNameText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  bookingBadgeCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  bookingPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 6,
  },
  pillBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  pillBadgeSuccess: {
    backgroundColor: '#EAF7EE',
    borderColor: '#C2F3D0',
  },
  pillBadgeWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
  },
  pillBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  pillBadgeSuccessText: {
    color: '#0E5E2F',
  },
  pillBadgeWarningText: {
    color: '#D97706',
  },
});

export default Revenue;
