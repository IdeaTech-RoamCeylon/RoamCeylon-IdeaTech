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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width: _width } = Dimensions.get('window');

const Calender = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Mock Calendar days grid data (October 2026 starts on Thursday, Oct 1st)
  // We represent each day cell with: day number, isCurrentMonth, statusLineColor
  const calendarDays = [
    // Sept days
    { day: 29, isCurrentMonth: false },
    { day: 30, isCurrentMonth: false },
    // Oct days
    { day: 1, isCurrentMonth: true, statusLineColor: '#0E5E2F' }, // Green line
    { day: 2, isCurrentMonth: true, statusLineColor: '#0E5E2F' }, // Green line
    { day: 3, isCurrentMonth: true, statusLineColor: '#E5C158' }, // Yellow line
    { day: 4, isCurrentMonth: true },
    { day: 5, isCurrentMonth: true },
    { day: 6, isCurrentMonth: true },
    { day: 7, isCurrentMonth: true },
    { day: 8, isCurrentMonth: true },
    { day: 9, isCurrentMonth: true },
    { day: 10, isCurrentMonth: true },
    { day: 11, isCurrentMonth: true },
    { day: 12, isCurrentMonth: true, isSelected: true }, // Highlighted selected day
    { day: 13, isCurrentMonth: true },
    { day: 14, isCurrentMonth: true },
    { day: 15, isCurrentMonth: true, statusLineColor: '#DC2626' }, // Red line
    { day: 16, isCurrentMonth: true },
    { day: 17, isCurrentMonth: true },
    { day: 18, isCurrentMonth: true },
    { day: 19, isCurrentMonth: true },
    { day: 20, isCurrentMonth: true },
    { day: 21, isCurrentMonth: true },
    { day: 22, isCurrentMonth: true },
    { day: 23, isCurrentMonth: true },
    { day: 24, isCurrentMonth: true },
    { day: 25, isCurrentMonth: true },
    { day: 26, isCurrentMonth: true },
    { day: 27, isCurrentMonth: true },
    { day: 28, isCurrentMonth: true },
    { day: 29, isCurrentMonth: true },
    { day: 30, isCurrentMonth: true },
    { day: 31, isCurrentMonth: true },
    // Nov days
    { day: 1, isCurrentMonth: false },
    { day: 2, isCurrentMonth: false },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={28} color="#1C1917" />
        </TouchableOpacity>

        {/* Center Logo */}
        <Text style={styles.logoText}>Booking Calendar</Text>

        {/* Right Bell & Avatar */}
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.bellButton} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={24} color="#5B600A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarButton} activeOpacity={0.7} onPress={() => router.push('/booking/settings' as any)}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' }}
              style={styles.headerAvatar}
              contentFit="cover"
            />
          </TouchableOpacity>
        </View>
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
          <Text style={styles.subtitle}>
            Manage room availability and guest itineraries.
          </Text>
        </View>

        {/* Switcher Tab */}
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tabButton, styles.tabButtonActive]} activeOpacity={0.8}>
            <Text style={styles.tabTextActive}>Month</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabButton} activeOpacity={0.8}>
            <Text style={styles.tabText}>Week</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabButton} activeOpacity={0.8}>
            <Text style={styles.tabText}>Day</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Card */}
        <View style={styles.calendarCard}>
          {/* Calendar Header */}
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarTitle}>October 2026</Text>
            <View style={styles.calendarControls}>
              <TouchableOpacity style={styles.controlButton} activeOpacity={0.6}>
                <Ionicons name="chevron-back" size={20} color="#1C1917" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} activeOpacity={0.6}>
                <Ionicons name="chevron-forward" size={20} color="#1C1917" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Weekday headers */}
          <View style={styles.weekdaysRow}>
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((w) => (
              <Text key={w} style={styles.weekdayLabel}>
                {w}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.gridContainer}>
            {calendarDays.map((item, index) => {
              const isFirstRow = index < 7;
              const isFirstCol = index % 7 === 0;

              return (
                <View
                  key={index}
                  style={[
                    styles.dayCell,
                    item.isSelected && styles.dayCellSelected,
                    {
                      borderTopWidth: isFirstRow ? 0 : 0.5,
                      borderLeftWidth: isFirstCol ? 0 : 0.5,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !item.isCurrentMonth && styles.dayTextOffMonth,
                      item.isSelected && styles.dayTextSelected,
                    ]}
                  >
                    {item.day}
                  </Text>

                  {/* Colored status line at bottom */}
                  {item.statusLineColor && !item.isSelected && (
                    <View
                      style={[styles.statusLine, { backgroundColor: item.statusLineColor }]}
                    />
                  )}

                  {/* Selected date double lines */}
                  {item.isSelected && (
                    <View style={styles.selectedLinesContainer}>
                      <View style={styles.selectedDoubleLine} />
                      <View style={[styles.selectedDoubleLine, { marginTop: 2 }]} />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Monthly Occupancy Card */}
        <View style={styles.metricsCard}>
          <View style={styles.metricsLeft}>
            <Text style={styles.metricsHeaderTitle}>MONTHLY OCCUPANCY</Text>
            <Text style={styles.metricsStat}>84%</Text>
          </View>
          {/* Custom Progress Ring */}
          <View style={styles.progressRing}>
            <Text style={styles.progressText}>84%</Text>
          </View>
        </View>

        {/* New Leads Card */}
        <View style={styles.metricsCard}>
          <View style={styles.metricsLeft}>
            <Text style={styles.metricsHeaderTitle}>NEW LEADS</Text>
            <Text style={styles.metricsStatGold}>12</Text>
          </View>
          {/* Trend Icon in orange background box */}
          <View style={styles.trendIconBox}>
            <Ionicons name="trending-up" size={24} color="#DC2626" />
          </View>
        </View>

        {/* Daily Agenda Card */}
        <View style={styles.agendaCard}>
          <View style={styles.agendaHeaderRow}>
            <Text style={styles.agendaTitle}>Daily Agenda</Text>
            <Text style={styles.agendaDate}>SAT, OCT 12</Text>
          </View>

          {/* Event 1: Deluxe Room 401 */}
          <View style={[styles.eventCard, styles.eventCardGreen]}>
            <View style={[styles.eventLeftLine, styles.eventLeftLineGreen]} />
            <View style={styles.eventMain}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventTitle}>Deluxe Room 401</Text>
                <View style={styles.eventBadgeGreen}>
                  <Text style={styles.eventBadgeTextGreen}>Confirmed</Text>
                </View>
              </View>
              <Text style={styles.eventGuest}>Guest: Mr. & Mrs. Anderson</Text>
              <View style={styles.eventDivider} />
              <View style={styles.eventFooter}>
                <View style={styles.footerRow}>
                  <Ionicons name="time-outline" size={16} color="#7C8A82" />
                  <Text style={styles.footerText}>14:00</Text>
                </View>
                <View style={[styles.footerRow, { marginLeft: 16 }]}>
                  <Ionicons name="notifications-outline" size={16} color="#7C8A82" />
                  <Text style={styles.footerText}>Check-In</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Event 2: Garden Suite 102 */}
          <View style={[styles.eventCard, styles.eventCardYellow]}>
            <View style={[styles.eventLeftLine, styles.eventLeftLineYellow]} />
            <View style={styles.eventMain}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventTitle}>Garden Suite 102</Text>
                <View style={styles.eventBadgeYellow}>
                  <Text style={styles.eventBadgeTextYellow}>Checking Out</Text>
                </View>
              </View>
              <Text style={styles.eventGuest}>Guest: Silva Family</Text>
              <View style={styles.eventDivider} />
              <View style={styles.eventFooter}>
                <View style={styles.footerRow}>
                  <Ionicons name="time-outline" size={16} color="#7C8A82" />
                  <Text style={styles.footerText}>11:00</Text>
                </View>
                <View style={[styles.footerRow, { marginLeft: 16 }]}>
                  <Ionicons name="log-out-outline" size={16} color="#7C8A82" />
                  <Text style={styles.footerText}>Key Return</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Empty Event Dotted State */}
          <View style={styles.emptyStateContainer}>
            <Ionicons name="calendar-outline" size={24} color="#7C8A82" style={{ marginBottom: 6 }} />
            <Text style={styles.emptyStateText}>No more events for today</Text>
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
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    zIndex: 10,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0E5E2F',
    letterSpacing: -0.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bellButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  headerAvatar: {
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
    gap: 16,
  },
  titleSection: {
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0E5E2F',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#60646C',
    marginTop: 6,
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  tabButton: {
    width: '31%',
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E5C158',
  },
  tabButtonActive: {
    backgroundColor: '#E5C158',
    borderColor: '#E5C158',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5B600A',
  },
  tabTextActive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 18,
    shadowColor: '#0E5E2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1D3B2B',
  },
  calendarControls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0F3F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekdayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: '#7C8A82',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderColor: '#F2F2F2',
    borderBottomWidth: 0.5,
    borderRightWidth: 0.5,
  },
  dayCell: {
    width: '14.28%',
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#F2F2F2',
    position: 'relative',
  },
  dayCellSelected: {
    backgroundColor: '#E5C158',
    borderRadius: 12,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1917',
  },
  dayTextOffMonth: {
    color: '#CCCCCC',
  },
  dayTextSelected: {
    color: '#0E5E2F',
    fontWeight: '800',
  },
  statusLine: {
    position: 'absolute',
    bottom: 6,
    left: '25%',
    right: '25%',
    height: 3,
    borderRadius: 1.5,
  },
  selectedLinesContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  selectedDoubleLine: {
    width: 14,
    height: 2,
    backgroundColor: '#0E5E2F',
    borderRadius: 1,
  },
  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#0E5E2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  metricsLeft: {
    flex: 1,
  },
  metricsHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7C8A82',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  metricsStat: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1917',
  },
  metricsStatGold: {
    fontSize: 28,
    fontWeight: '800',
    color: '#855E0E',
  },
  progressRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 4,
    borderColor: '#66BB6A',
    borderTopColor: '#66BB6A',
    borderRightColor: '#EAF2EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1C1917',
  },
  trendIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FDF2E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  agendaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 20,
    gap: 16,
    shadowColor: '#0E5E2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  agendaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  agendaTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0E5E2F',
  },
  agendaDate: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7C8A82',
    letterSpacing: 0.5,
  },
  eventCard: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  eventCardGreen: {
    backgroundColor: '#F5FAF6',
  },
  eventCardYellow: {
    backgroundColor: '#FFFDF2',
  },
  eventLeftLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  eventLeftLineGreen: {
    backgroundColor: '#66BB6A',
  },
  eventLeftLineYellow: {
    backgroundColor: '#E5C158',
  },
  eventMain: {
    padding: 16,
    paddingLeft: 20,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1917',
  },
  eventBadgeGreen: {
    backgroundColor: '#66BB6A',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  eventBadgeTextGreen: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  eventBadgeYellow: {
    backgroundColor: '#E5C158',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  eventBadgeTextYellow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  eventGuest: {
    fontSize: 13,
    color: '#7C8A82',
    fontWeight: '500',
  },
  eventDivider: {
    height: 1,
    backgroundColor: '#EAF2EC',
    marginVertical: 12,
    opacity: 0.5,
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A4A4A',
    marginLeft: 6,
  },
  emptyStateContainer: {
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C8A82',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#855E0E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#855E0E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
});

export default Calender;
