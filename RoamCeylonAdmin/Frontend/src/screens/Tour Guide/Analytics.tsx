import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const Analytics = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // State to filter analytics period (30 days vs 90 days)
  const [selectedPeriod, setSelectedPeriod] = useState<'30days' | '90days'>('30days');

  // Traffic Source analytics data
  const trafficSources = [
    { source: 'Direct Traffic', percent: 45, value: '20,340 views', color: '#0E5E2F' },
    { source: 'Search Engines', percent: 30, value: '13,560 views', color: '#D97706' },
    { source: 'Social Media Referral', percent: 25, value: '11,300 views', color: '#2563EB' },
  ];

  // Guest Country Demographics analytics data
  const demographics = [
    { country: 'United Kingdom', percent: 40, color: '#0E5E2F' },
    { country: 'United States', percent: 25, color: '#D97706' },
    { country: 'Germany', percent: 15, color: '#2563EB' },
    { country: 'Australia', percent: 10, color: '#7C3AED' },
    { country: 'Others', percent: 10, color: '#6B7280' },
  ];

  // Custom Weekly Click trend mockup (representing Monday-Sunday)
  const weeklyClicks = [
    { day: 'Mon', clicks: 120, height: 40 },
    { day: 'Tue', clicks: 180, height: 60 },
    { day: 'Wed', clicks: 240, height: 80 },
    { day: 'Thu', clicks: 220, height: 73 },
    { day: 'Fri', clicks: 300, height: 100, isPeak: true },
    { day: 'Sat', clicks: 150, height: 50 },
    { day: 'Sun', clicks: 90, height: 30 },
  ];

  const handlePeriodChange = (period: '30days' | '90days') => {
    setSelectedPeriod(period);
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
          <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Performance Analytics</Text>
          <View style={{ width: 44 }} />
        </LinearGradient>

        <View style={styles.mainContent}>
          {/* Subtitle / Intro */}
          <View style={styles.titleSection}>
            <Text style={styles.pageSubtitle}>
              Thorough overview of listing reach, traffic referrals, user engagement, and customer demographic profiles.
            </Text>
          </View>

          {/* Range/Period Selector Control */}
          <View style={styles.selectorWrapper}>
            <View style={styles.selectorContainer}>
              <TouchableOpacity
                style={[
                  styles.selectorButton,
                  selectedPeriod === '30days' && styles.selectorActiveButton,
                ]}
                activeOpacity={0.8}
                onPress={() => handlePeriodChange('30days')}
              >
                <Text
                  style={[
                    styles.selectorButtonText,
                    selectedPeriod === '30days' && styles.selectorActiveButtonText,
                  ]}
                >
                  Last 30 Days
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.selectorButton,
                  selectedPeriod === '90days' && styles.selectorActiveButton,
                ]}
                activeOpacity={0.8}
                onPress={() => handlePeriodChange('90days')}
              >
                <Text
                  style={[
                    styles.selectorButtonText,
                    selectedPeriod === '90days' && styles.selectorActiveButtonText,
                  ]}
                >
                  Last 90 Days
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Performance Overview KPI summary cards */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Total Views</Text>
              <Text style={styles.kpiValue}>45.2k</Text>
              <Text style={styles.kpiSubText}>↗ +12.4% vs last mo</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Avg Conversion</Text>
              <Text style={styles.kpiValue}>2.4%</Text>
              <Text style={styles.kpiSubText}>↗ +0.5% vs last mo</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Completed Trips</Text>
              <Text style={styles.kpiValue}>148</Text>
              <Text style={styles.kpiSubText}>↗ +8% vs last mo</Text>
            </View>
          </View>

          {/* Traffic Referrals Card */}
          <View style={styles.analyticsCard}>
            <Text style={styles.cardTitle}>Traffic & User Reach Sources</Text>
            <Text style={styles.cardSubtitle}>Where your package profile views are coming from</Text>

            <View style={styles.trafficList}>
              {trafficSources.map((source) => (
                <View key={source.source} style={styles.trafficRow}>
                  <View style={styles.trafficHeader}>
                    <Text style={styles.trafficNameText}>{source.source}</Text>
                    <Text style={styles.trafficValueText}>
                      {source.percent}% ({source.value})
                    </Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${source.percent}%`, backgroundColor: source.color },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Guest Country Demographics Card */}
          <View style={styles.analyticsCard}>
            <Text style={styles.cardTitle}>Guest Origin Demographics</Text>
            <Text style={styles.cardSubtitle}>Breakdown of inquiries and tours by guest country</Text>

            <View style={styles.trafficList}>
              {demographics.map((demo) => (
                <View key={demo.country} style={styles.trafficRow}>
                  <View style={styles.trafficHeader}>
                    <Text style={styles.trafficNameText}>{demo.country}</Text>
                    <Text style={styles.trafficValueText}>{demo.percent}%</Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${demo.percent}%`, backgroundColor: demo.color },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Weekly Clicks Custom Graph Card */}
          <View style={styles.analyticsCard}>
            <Text style={styles.cardTitle}>Weekly Profile Interactions</Text>
            <Text style={styles.cardSubtitle}>Total user profile and package click tracking</Text>

            <View style={styles.chartContainer}>
              <View style={styles.chartGridLines}>
                <View style={styles.gridLine} />
                <View style={styles.gridLine} />
                <View style={styles.gridLine} />
              </View>

              <View style={styles.chartBarsRow}>
                {weeklyClicks.map((bar) => (
                  <View key={bar.day} style={styles.chartCol}>
                    <Text style={styles.clickValueBubble}>{bar.clicks}</Text>
                    <View style={styles.barTrack}>
                      {bar.isPeak ? (
                        <LinearGradient
                          colors={['#34D399', '#0E5E2F']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={[styles.barFill, { height: `${bar.height}%` }]}
                        />
                      ) : (
                        <View style={[styles.barFill, { height: `${bar.height}%` }, styles.barInactiveFill]} />
                      )}
                    </View>
                    <Text style={[styles.chartDayText, bar.isPeak && styles.chartDayTextActive]}>
                      {bar.day}
                    </Text>
                  </View>
                ))}
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
    marginBottom: 20,
  },
  pageSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    fontWeight: '500',
  },
  selectorWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  selectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#EAEAEA',
    borderRadius: 16,
    padding: 3,
    width: '100%',
  },
  selectorButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 13,
  },
  selectorActiveButton: {
    backgroundColor: '#0E5E2F',
  },
  selectorButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  selectorActiveButtonText: {
    color: '#FFFFFF',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EAEFEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#8A958E',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 2,
  },
  kpiSubText: {
    fontSize: 8.5,
    color: '#0E5E2F',
    fontWeight: '700',
  },
  analyticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EAEFEA',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#8A958E',
    fontWeight: '500',
    marginBottom: 20,
  },
  trafficList: {
    gap: 16,
  },
  trafficRow: {
    width: '100%',
  },
  trafficHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  trafficNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1917',
  },
  trafficValueText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  chartContainer: {
    height: 180,
    justifyContent: 'flex-end',
    position: 'relative',
    paddingTop: 24,
  },
  chartGridLines: {
    position: 'absolute',
    top: 24,
    bottom: 24,
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
    zIndex: 2,
  },
  chartCol: {
    alignItems: 'center',
    flex: 1,
  },
  clickValueBubble: {
    fontSize: 8,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 4,
  },
  barTrack: {
    height: 100,
    width: 16,
    backgroundColor: '#FAFBF9',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
  },
  barInactiveFill: {
    backgroundColor: '#E5E7EB',
  },
  chartDayText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A958E',
    marginTop: 8,
  },
  chartDayTextActive: {
    color: '#0E5E2F',
    fontWeight: '800',
  },
});

export default Analytics;
