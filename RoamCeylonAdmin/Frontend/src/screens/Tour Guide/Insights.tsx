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
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';

const Insights = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // State to toggle between 30 Days and 90 Days conversion trends
  const [selectedTrendPeriod, setSelectedTrendPeriod] = useState<'30days' | '90days'>('30days');

  // State for Global Conversion Card
  const [globalConversionRate, setGlobalConversionRate] = useState(0);
  const [globalConversionTrend, setGlobalConversionTrend] = useState('');
  const [sparklineData, setSparklineData] = useState<number[]>([
    5, 6, 7, 9, 11, 14, 17, 20, 22, 24, 25, 25, 24, 23, 21, 18, 16, 14, 13, 12,
    12, 13, 14, 16, 18, 21, 25, 30, 36, 43, 52, 62, 73, 85, 94, 99, 100, 95, 80, 50, 20, 0
  ]);


  // Funnel steps data
  const [funnelSteps, setFunnelSteps] = useState([
    {
      label: 'Website Visits',
      value: '0',
      fillPercent: 0,
      icon: 'eye-outline',
      color: '#0E5E2F',
      bgColor: '#EAF7EE',
      conversionRate: null,
    },
    {
      label: 'Inquiries',
      value: '0',
      fillPercent: 0,
      icon: 'chatbubble-ellipses-outline',
      color: '#D97706',
      bgColor: '#FFFBEB',
      conversionRate: '0% Inquiry Rate',
    },
    {
      label: 'Confirmed',
      value: '0',
      fillPercent: 0,
      icon: 'wallet-outline',
      color: '#2563EB',
      bgColor: '#EFF6FF',
      conversionRate: '0% Booking Rate',
    },
    {
      label: 'Completed',
      value: '0',
      fillPercent: 0,
      icon: 'checkmark-circle-outline',
      color: '#10B981',
      bgColor: '#ECFDF5',
      conversionRate: '0% Trip Completion',
    },
  ]);

  const [topPackages, setTopPackages] = useState<any[]>([]);
  const [trendData30Days, setTrendData30Days] = useState(Array(10).fill({ heightPercent: 0, isActive: false }));
  const [trendData90Days, setTrendData90Days] = useState(Array(10).fill({ heightPercent: 0, isActive: false }));
  const [_loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const fetchInsights = async () => {
        try {
          setLoading(true);
          const token = await SecureStore.getItemAsync('authToken');
          const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';
          if (!token) return;

          const res = await fetch(`${apiUrl}/tour-guide/insights`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (res.ok && isActive) {
            const data = await res.json();
            setFunnelSteps(data.funnelSteps || []);
            setTrendData30Days(data.conversionTrend30Days || []);
            setTrendData90Days(data.conversionTrend90Days || []);
            setTopPackages(data.topPackages || []);
            if (data.globalConversionRate !== undefined) setGlobalConversionRate(data.globalConversionRate);
            if (data.globalConversionTrend) setGlobalConversionTrend(data.globalConversionTrend);
            if (data.sparklineData) setSparklineData(data.sparklineData);
          }
        } catch (error) {
          console.error('[Insights] Fetch error:', error);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchInsights();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const currentTrendData = selectedTrendPeriod === '30days' ? trendData30Days : trendData90Days;

  const handleViewAllAnalyticsPress = () => {
    router.push('/tour-guide/analytics' as any);
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
          <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Conversion Insights</Text>
          <View style={{ width: 44 }} />
        </LinearGradient>

        <View style={styles.mainContent}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.pageSubtitle}>
              Real-time analysis of your booking ecosystem and guest journey.
            </Text>
          </View>

        {/* Global Conversion Card with custom wave sparkline */}
        <LinearGradient
          colors={['#0F3D26', '#0E5E2F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.conversionCard}
        >
          <View style={styles.kpiRing1} />
          <View style={styles.kpiRing2} />
          
          <Text style={styles.conversionLabel}>Global Conversion</Text>
          <Text style={styles.conversionValue}>{globalConversionRate}%</Text>
          <View style={styles.trendRow}>
            <Ionicons name="trending-up-outline" size={14} color="#FFDF59" style={{ marginRight: 4 }} />
            <Text style={styles.trendText}>{globalConversionTrend}</Text>
          </View>

          {/* Sparkline Curve Chart (Continuous glowing waveform) */}
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
        </LinearGradient>

        {/* Conversion Trend Card */}
        <View style={styles.trendCard}>
          <View style={styles.trendCardHeader}>
            <Text style={styles.trendCardTitle}>Conversion Trend</Text>
            
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
                  30 Days
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
                  90 Days
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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Booking Pipeline & Funnel</Text>
        </View>

        {/* Vertical Pipeline timeline funnel layout */}
        <View style={styles.funnelPipeline}>
          <View style={styles.pipelineVerticalLine} />

          {funnelSteps.map((step, idx) => {
            const isLast = idx === funnelSteps.length - 1;
            return (
              <View key={step.label} style={styles.pipelineStepContainer}>
                {/* Node with Icon */}
                <View style={[styles.pipelineNode, { backgroundColor: step.bgColor }]}>
                  <Ionicons name={step.icon as any} size={18} color={step.color} />
                </View>

                {/* Step Content Card */}
                <View style={styles.pipelineCard}>
                  <View style={styles.pipelineCardHeader}>
                    <Text style={styles.pipelineLabelText}>{step.label}</Text>
                    <Text style={styles.pipelineValue}>{step.value}</Text>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${step.fillPercent * 100}%`,
                          backgroundColor: step.color,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Conversion Rate Connector Line & Badge */}
                {!isLast && funnelSteps[idx + 1].conversionRate && (
                  <View style={styles.conversionConnector}>
                    <View style={styles.conversionBadge}>
                      <Ionicons name="arrow-down-outline" size={12} color="#0E5E2F" style={{ marginRight: 4 }} />
                      <Text style={styles.conversionBadgeText}>
                        {funnelSteps[idx + 1].conversionRate}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Top Converting Packages Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Converting Packages</Text>
          <TouchableOpacity activeOpacity={0.6} onPress={handleViewAllAnalyticsPress}>
            <Text style={styles.viewAllLinkText}>View Analytics</Text>
          </TouchableOpacity>
        </View>

        {topPackages.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#6B7280', marginVertical: 20 }}>
            No packages available.
          </Text>
        ) : (
          topPackages.map((pkg, idx) => (
            <View key={idx} style={styles.horizontalPackageCard}>
              <View style={styles.horizontalPackageInfo}>
                <View style={styles.horizontalCardHeader}>
                  <Text style={styles.packageNameText} numberOfLines={1}>{pkg.name}</Text>
                  <View style={styles.convBadgeOutline}>
                    <Text style={styles.convBadgeText}>{pkg.conversionRate}% Conv.</Text>
                  </View>
                </View>
                <Text style={styles.packageSubtitleText}>{pkg.duration} Days</Text>
                
                <View style={styles.horizontalStatsRow}>
                  <View style={styles.miniStatCol}>
                    <Text style={styles.miniStatLabel}>INQUIRIES</Text>
                    <Text style={styles.miniStatValue}>{pkg.inquiriesCount}</Text>
                  </View>
                  <View style={styles.miniStatDivider} />
                  <View style={styles.miniStatCol}>
                    <Text style={styles.miniStatLabel}>BOOKINGS</Text>
                    <Text style={[styles.miniStatValue, { color: '#0E5E2F' }]}>{pkg.bookingsCount}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
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
  conversionCard: {
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
  conversionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  conversionValue: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
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
    color: '#FFDF59',
  },
  sparklineContainer: {
    height: 60,
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
    width: 2,
    backgroundColor: '#FFDF59',
    borderRadius: 1,
    shadowColor: '#FFDF59',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
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
    marginBottom: 20,
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
    backgroundColor: '#EAD26B',
  },
  selectorButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  selectorActiveButtonText: {
    color: '#3B2E05',
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
    width: 14,
    backgroundColor: '#FAFBF9',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  trendBarFill: {
    width: '100%',
    borderRadius: 8,
  },
  trendBarFillActive: {
    backgroundColor: '#0E5E2F',
  },
  trendBarFillInactive: {
    backgroundColor: '#E5E7EB',
  },
  funnelPipeline: {
    paddingLeft: 44,
    position: 'relative',
    marginVertical: 12,
    marginBottom: 28,
  },
  pipelineVerticalLine: {
    position: 'absolute',
    left: 17,
    top: 24,
    bottom: 24,
    width: 2,
    backgroundColor: '#E5E7EB',
  },
  pipelineStepContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  pipelineNode: {
    position: 'absolute',
    left: -44,
    top: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F3F4F6',
    zIndex: 10,
  },
  pipelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F3F1',
  },
  pipelineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pipelineLabelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  pipelineValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.4,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  conversionConnector: {
    height: 36,
    justifyContent: 'center',
    marginLeft: 16,
    marginTop: 8,
    marginBottom: -8,
  },
  conversionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF7EE',
    borderWidth: 1,
    borderColor: '#C2F3D0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  conversionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0E5E2F',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
    letterSpacing: -0.3,
  },
  viewAllLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E5E2F',
  },
  horizontalPackageCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F3F1',
    alignItems: 'center',
  },
  horizontalPackageImage: {
    width: 90,
    height: 90,
    borderRadius: 16,
    backgroundColor: '#EAEAEA',
  },
  horizontalPackageInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
  },
  horizontalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  packageNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1917',
    flex: 1,
    marginRight: 8,
  },
  convBadgeOutline: {
    backgroundColor: '#EAF7EE',
    borderWidth: 1,
    borderColor: '#C2F3D0',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  convBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0E5E2F',
  },
  packageSubtitleText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  horizontalStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  miniStatCol: {
    flex: 1,
  },
  miniStatLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8A958E',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  miniStatValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1C1917',
  },
  miniStatDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 12,
  },
});

export default Insights;
