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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const Insights = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // State to toggle between 30 Days and 90 Days conversion trends
  const [selectedTrendPeriod, setSelectedTrendPeriod] = useState<'30days' | '90days'>('30days');

  // Custom Sparkline Data (representing a smooth bezier-like curve wave)
  const sparklineData = [
    5, 6, 7, 9, 11, 14, 17, 20, 22, 24, 25, 25, 24, 23, 21, 18, 16, 14, 13, 12,
    12, 13, 14, 16, 18, 21, 25, 30, 36, 43, 52, 62, 73, 85, 94, 99, 100, 95, 80, 50, 20, 0
  ];

  // Mocked trend data for the 30 Days vs 90 Days bar chart
  const trendData30Days = [
    { heightPercent: 35, isActive: false },
    { heightPercent: 55, isActive: false },
    { heightPercent: 82, isActive: true }, // Highlighted active day
    { heightPercent: 48, isActive: false },
    { heightPercent: 70, isActive: false },
    { heightPercent: 30, isActive: false },
    { heightPercent: 88, isActive: true }, // Highlighted active day
    { heightPercent: 55, isActive: false },
    { heightPercent: 25, isActive: false },
    { heightPercent: 42, isActive: false },
  ];

  const trendData90Days = [
    { heightPercent: 45, isActive: false },
    { heightPercent: 75, isActive: true }, // Highlighted active day
    { heightPercent: 30, isActive: false },
    { heightPercent: 62, isActive: false },
    { heightPercent: 88, isActive: true }, // Highlighted active day
    { heightPercent: 40, isActive: false },
    { heightPercent: 55, isActive: false },
    { heightPercent: 70, isActive: true }, // Highlighted active day
    { heightPercent: 32, isActive: false },
    { heightPercent: 50, isActive: false },
  ];

  const currentTrendData = selectedTrendPeriod === '30days' ? trendData30Days : trendData90Days;

  // Funnel steps data
  const funnelSteps = [
    {
      label: 'WEBSITE VISITS',
      value: '12,400',
      fillPercent: 1.0, // 100%
    },
    {
      label: 'INQUIRIES',
      value: '2,840',
      fillPercent: 0.229, // 22.9%
    },
    {
      label: 'CONFIRMED',
      value: '636',
      fillPercent: 0.051, // 5.1%
    },
    {
      label: 'COMPLETED',
      value: '482',
      fillPercent: 0.039, // 3.9%
    },
  ];

  const handleMenuPress = () => {
    Alert.alert('Menu', 'Hamburger menu options are coming soon!');
  };

  const handleNotificationPress = () => {
    Alert.alert('Notifications', 'No new notifications.');
  };

  const handleViewAllAnalyticsPress = () => {
    Alert.alert('Analytics', 'Opening full analytics dashboard...');
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
          <Text style={styles.title}>Conversion Insights</Text>
          <Text style={styles.subtitle}>
            Real-time analysis of your booking ecosystem and guest journey.
          </Text>
        </View>

        {/* Global Conversion Card with custom wave sparkline */}
        <View style={styles.conversionCard}>
          <Text style={styles.conversionLabel}>GLOBAL CONVERSION</Text>
          <Text style={styles.conversionValue}>22.4%</Text>
          <View style={styles.trendRow}>
            <Ionicons name="trending-up-outline" size={14} color="#0E5E2F" style={{ marginRight: 4 }} />
            <Text style={styles.trendText}>+3.2% from last month</Text>
          </View>

          {/* Sparkline Curve Chart */}
          <View style={styles.sparklineContainer}>
            <View style={styles.sparklineBarsRow}>
              {sparklineData.map((heightPercent, idx) => (
                <View key={idx} style={styles.sparklineBarCol}>
                  <View
                    style={[
                      styles.sparklineBarFill,
                      { height: `${heightPercent}%` },
                    ]}
                  />
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Conversion Trend Card */}
        <View style={styles.trendCard}>
          <View style={styles.trendCardHeader}>
            <Text style={styles.trendCardTitle}>CONVERSION TREND</Text>
            
            {/* Range Selector */}
            <View style={styles.selectorContainer}>
              <TouchableOpacity
                style={[
                  styles.selectorButton,
                  selectedTrendPeriod === '30days' && styles.selectorActiveButton,
                ]}
                activeOpacity={0.85}
                onPress={() => setSelectedTrendPeriod('30days')}
              >
                <Text
                  style={[
                    styles.selectorButtonText,
                    selectedTrendPeriod === '30days' && styles.selectorActiveButtonText,
                  ]}
                >
                  30 DAYS
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.selectorButton,
                  selectedTrendPeriod === '90days' && styles.selectorActiveButton,
                ]}
                activeOpacity={0.85}
                onPress={() => setSelectedTrendPeriod('90days')}
              >
                <Text
                  style={[
                    styles.selectorButtonText,
                    selectedTrendPeriod === '90days' && styles.selectorActiveButtonText,
                  ]}
                >
                  90 DAYS
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Custom Trend Bars Chart */}
          <View style={styles.trendChartContainer}>
            <View style={styles.trendChartBarsRow}>
              {currentTrendData.map((data, idx) => (
                <View key={idx} style={styles.trendBarCol}>
                  <View style={styles.trendBarTrack}>
                    <View
                      style={[
                        styles.trendBarFill,
                        { height: `${data.heightPercent}%` },
                        data.isActive ? styles.trendBarFillActive : styles.trendBarFillInactive,
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* The Booking Funnel Section */}
        <View style={styles.sectionHeadingBlock}>
          <Text style={styles.funnelTitle}>THE BOOKING FUNNEL</Text>
        </View>

        {/* Funnel Progress Cards */}
        <View style={styles.funnelContainer}>
          {funnelSteps.map((step) => (
            <View key={step.label} style={styles.funnelCard}>
              <Text style={styles.funnelValue}>{step.value}</Text>
              <Text style={styles.funnelLabel}>{step.label}</Text>
              
              {/* Progress Bar */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${step.fillPercent * 100}%` },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Top Converting Packages Section */}
        <View style={[styles.sectionHeader, { marginTop: 16 }]}>
          <Text style={styles.sectionTitle}>TOP CONVERTING PACKAGES</Text>
          <TouchableOpacity activeOpacity={0.6} onPress={handleViewAllAnalyticsPress}>
            <Text style={styles.viewAllLinkText}>VIEW ALL ANALYTICS</Text>
          </TouchableOpacity>
        </View>

        {/* Package Card 1 */}
        <View style={styles.packageCard}>
          <View style={styles.imageContainer}>
            <Image
              source={require('../../assets/Tours/Cultural Triangle.png')}
              style={styles.packageImage}
              contentFit="cover"
            />
            <View style={styles.convBadge}>
              <Text style={styles.convBadgeText}>32% Conv.</Text>
            </View>
          </View>
          
          <View style={styles.packageInfo}>
            <Text style={styles.packageName}>Cultural Triangle Explorer</Text>
            <Text style={styles.packageSubtitle}>7 Days • Boutique Stays</Text>
            
            <View style={styles.packageDivider} />
            
            <View style={styles.packageStatsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>INQUIRIES</Text>
                <Text style={styles.statVal}>1,240</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>BOOKINGS</Text>
                <Text style={[styles.statVal, styles.statValHighlight]}>396</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Package Card 2 */}
        <View style={styles.packageCard}>
          <View style={styles.imageContainer}>
            <Image
              source={require('../../assets/Tours/Tea Country.png')}
              style={styles.packageImage}
              contentFit="cover"
            />
            <View style={styles.convBadge}>
              <Text style={styles.convBadgeText}>28% Conv.</Text>
            </View>
          </View>
          
          <View style={styles.packageInfo}>
            <Text style={styles.packageName}>Tea Country Retreat</Text>
            <Text style={styles.packageSubtitle}>5 Days • Estate Living</Text>
            
            <View style={styles.packageDivider} />
            
            <View style={styles.packageStatsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>INQUIRIES</Text>
                <Text style={styles.statVal}>985</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>BOOKINGS</Text>
                <Text style={[styles.statVal, styles.statValHighlight]}>275</Text>
              </View>
            </View>
          </View>
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
  conversionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  conversionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#A3A8A5',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  conversionValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 6,
    letterSpacing: -0.8,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E5E2F',
  },
  sparklineContainer: {
    height: 80,
    width: '100%',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginTop: 6,
  },
  sparklineBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '100%',
    width: '100%',
  },
  sparklineBarCol: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  sparklineBarFill: {
    width: '100%',
    backgroundColor: '#FDF9E2', // Soft beige/gold fill
    borderTopWidth: 2,
    borderTopColor: '#EAD26B', // Smooth golden top line
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
    marginBottom: 20,
  },
  trendCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: 0.5,
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
    fontSize: 12,
    fontWeight: '700',
    color: '#60646C',
  },
  selectorActiveButtonText: {
    color: '#5B600A',
    fontWeight: '800',
  },
  trendChartContainer: {
    height: 120,
    justifyContent: 'flex-end',
  },
  trendChartBarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
  },
  trendBarCol: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 3,
  },
  trendBarTrack: {
    height: 100,
    width: 16,
    backgroundColor: '#FAFBFB',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  trendBarFill: {
    width: '100%',
    borderRadius: 8,
  },
  trendBarFillActive: {
    backgroundColor: '#FCE788',
  },
  trendBarFillInactive: {
    backgroundColor: '#E5E7EB',
  },
  sectionHeadingBlock: {
    marginTop: 12,
    marginBottom: 16,
  },
  funnelTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#5B600A',
    letterSpacing: 0.5,
  },
  funnelContainer: {
    gap: 12,
    marginBottom: 20,
  },
  funnelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    borderLeftWidth: 6,
    borderLeftColor: '#5B600A',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  funnelValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  funnelLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#60646C',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#5B600A',
    borderRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: 0.5,
  },
  viewAllLinkText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5B600A',
    letterSpacing: 0.5,
  },
  packageCard: {
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
    height: 192,
    position: 'relative',
    backgroundColor: '#EAEAEA',
  },
  packageImage: {
    width: '100%',
    height: '100%',
  },
  convBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#C2F3D0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  convBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0E5E2F',
  },
  packageInfo: {
    padding: 20,
  },
  packageName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 6,
  },
  packageSubtitle: {
    fontSize: 13,
    color: '#60646C',
    fontWeight: '500',
  },
  packageDivider: {
    height: 1,
    backgroundColor: '#F0F3F1',
    marginVertical: 14,
  },
  packageStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A3A8A5',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1917',
  },
  statValHighlight: {
    color: '#0E5E2F',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#F0F3F1',
    marginHorizontal: 16,
  },
});

export default Insights;
