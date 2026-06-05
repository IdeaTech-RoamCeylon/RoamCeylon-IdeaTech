import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const Analytics = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Metrics data
  const metrics = [
    {
      title: 'RevPAR',
      value: 'LKR 18,450',
      trend: '↑ 8.4% vs last mo',
      trendColor: '#22C55E',
      borderColor: '#0E5E2F',
      icon: 'cash-multiple',
      iconColor: '#0E5E2F',
    },
    {
      title: 'Average Daily Rate',
      value: 'LKR 22,100',
      trend: '↑ 3.2% vs last mo',
      trendColor: '#22C55E',
      borderColor: '#0E5E2F',
      icon: 'bed-outline',
      iconColor: '#0E5E2F',
    },
    {
      title: 'Direct Bookings %',
      value: '64.2%',
      trend: '↓ 1.5% vs last mo',
      trendColor: '#EF4444',
      borderColor: '#7D8A82',
      icon: 'flash-outline',
      iconColor: '#0E5E2F',
    },
  ];

  // Revenue Trends Bar Chart Data
  const revenueBars = [42, 68, 52, 85, 96, 78, 102, 70, 88, 75, 94];

  // Occupancy Wave Chart Data
  const occupancyWave = [
    30, 34, 40, 48, 54, 58, 60, 58, 54, 48, 44, 42, 44, 48, 56, 68, 82, 96, 108, 114, 114, 108, 98, 84, 68, 52, 42, 38, 40, 46, 56, 70, 84, 94, 98
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.menuButton}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back-outline" size={28} color="#172B1E" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Analytics</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.profileButton}
            activeOpacity={0.7}
            onPress={() => router.push('/activities/settings' as any)}
          >
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80',
              }}
              style={styles.profileImage as any}
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
        {/* Sub-Header Badges */}
        <View style={styles.badgesRow}>
          <View style={styles.badgeOutline}>
            <MaterialCommunityIcons name="trending-up" size={16} color="#0E5E2F" style={{ marginRight: 4 }} />
            <Text style={styles.badgeOutlineText}>Growth +12%</Text>
          </View>
          <View style={styles.badgeSolid}>
            <Ionicons name="checkmark-circle" size={16} color="#0E5E2F" style={{ marginRight: 4 }} />
            <Text style={styles.badgeSolidText}>Peak Season Status</Text>
          </View>
        </View>

        {/* Metric Cards List */}
        <View style={styles.metricsList}>
          {metrics.map((metric, index) => (
            <View key={index} style={[styles.metricCard, { borderLeftColor: metric.borderColor }]}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricTitle}>{metric.title}</Text>
                {metric.icon === 'cash-multiple' ? (
                  <MaterialCommunityIcons name="cash-multiple" size={22} color={metric.iconColor} />
                ) : metric.icon === 'bed-outline' ? (
                  <MaterialCommunityIcons name="bed-outline" size={22} color={metric.iconColor} />
                ) : (
                  <MaterialCommunityIcons name="flash-outline" size={22} color={metric.iconColor} />
                )}
              </View>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={[styles.metricTrend, { color: metric.trendColor }]}>{metric.trend}</Text>
            </View>
          ))}
        </View>

        {/* Revenue Trends Chart Card */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Revenue Trends</Text>
              <Text style={styles.chartSubtitle}>Last 30 Days</Text>
            </View>
            <TouchableOpacity style={styles.moreButton} activeOpacity={0.6}>
              <Feather name="more-vertical" size={20} color="#60646C" />
            </TouchableOpacity>
          </View>

          {/* Bar Chart Grid */}
          <View style={styles.barChartContainer}>
            <View style={styles.barsRow}>
              {revenueBars.map((h, i) => (
                <View key={i} style={[styles.barColumn, { height: h }]} />
              ))}
            </View>

            {/* X-Axis labels */}
            <View style={styles.chartLabelsRow}>
              <Text style={styles.xAxisLabel}>Oct 01</Text>
              <Text style={styles.xAxisLabel}>Oct 15</Text>
              <Text style={styles.xAxisLabel}>Oct 30</Text>
            </View>
          </View>
        </View>

        {/* Occupancy Rates Chart Card */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Occupancy Rates</Text>
              <Text style={styles.chartSubtitle}>Daily Average: 78%</Text>
            </View>
            <TouchableOpacity style={styles.moreButton} activeOpacity={0.6}>
              <Feather name="download" size={20} color="#60646C" />
            </TouchableOpacity>
          </View>

          {/* Line Chart Grid */}
          <View style={styles.lineChartContainer}>
            {/* Draw curve via customized rows of bars */}
            <View style={styles.waveContainer}>
              {occupancyWave.map((h, i) => (
                <View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      height: h,
                    },
                  ]}
                />
              ))}

              {/* Node Indicator Dots absolute positioned */}
              <View style={[styles.waveNode, { left: '16%', bottom: 60 }]} />
              <View style={[styles.waveNode, { left: '30%', bottom: 40 }]} />
              <View style={[styles.waveNode, { left: '56%', bottom: 114 }]} />
              <View style={[styles.waveNode, { left: '78%', bottom: 60 }]} />
            </View>

            {/* X-Axis labels */}
            <View style={styles.chartLabelsRow}>
              <Text style={styles.xAxisLabel}>Week 1</Text>
              <Text style={styles.xAxisLabel}>Week 2</Text>
              <Text style={styles.xAxisLabel}>Week 3</Text>
              <Text style={styles.xAxisLabel}>Week 4</Text>
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
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F1',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitleContainer: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0E5E2F',
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#F7FAF8',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#0E5E2F',
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
    paddingTop: 20,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2EFE7',
    borderWidth: 1,
    borderColor: '#C2DDC7',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
  },
  badgeOutlineText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E5E2F',
  },
  badgeSolid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9BF2B5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeSolidText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#08401A',
  },
  metricsList: {
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    borderLeftWidth: 6,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#60646C',
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 4,
  },
  metricTrend: {
    fontSize: 13,
    fontWeight: '700',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1917',
  },
  chartSubtitle: {
    fontSize: 13,
    color: '#60646C',
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  barChartContainer: {
    marginTop: 10,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  barColumn: {
    width: 16,
    backgroundColor: '#E1E7E3',
    borderRadius: 4,
  },
  chartLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  xAxisLabel: {
    fontSize: 12,
    color: '#60646C',
    fontWeight: '600',
  },
  lineChartContainer: {
    marginTop: 10,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 130,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    position: 'relative',
    paddingHorizontal: 2,
  },
  waveBar: {
    flex: 1,
    backgroundColor: 'rgba(14, 94, 47, 0.06)',
    borderTopWidth: 2,
    borderTopColor: '#0E5E2F',
  },
  waveNode: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0E5E2F',
    transform: [{ translateX: -4 }, { translateY: 4 }],
  },
});

export default Analytics;
