import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const DailySchedule = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const scheduleItems = [
    {
      time: '09:00',
      timeColor: '#0E5E2F',
      borderColor: '#0E5E2F',
      status: 'PENDING',
      statusBg: '#C2F3D0',
      statusColor: '#0E5E2F',
      icon: 'leaf',
      iconType: 'MaterialCommunityIcons',
      title: 'Private Safari Tour',
      location: 'Yala National Park Entrance',
      extraInfo: '6 Guests (Villa 4 & 7)',
      extraIcon: 'people-outline',
    },
    {
      time: '14:00',
      timeColor: '#5B600A',
      borderColor: '#5B600A',
      status: 'ACTIVE',
      statusBg: '#FCE788',
      statusColor: '#5B600A',
      icon: 'coffee',
      iconType: 'Feather',
      title: 'Estate Tea Tasting',
      location: 'Heritage Tea Lounge',
      extraInfo: 'Aruni Jayawardena',
      extraIcon: 'person-outline',
      hasPreferencesLink: true,
    },
    {
      time: '18:30',
      timeColor: '#60646C',
      borderColor: '#7D8A82',
      status: 'SCHEDULED',
      statusBg: '#E5E7EB',
      statusColor: '#4B5563',
      icon: 'silverware-fork-knife',
      iconType: 'MaterialCommunityIcons',
      title: 'Culinary Masterclass',
      location: 'The Spice Garden Kitchen',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.menuButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back-outline" size={28} color="#172B1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Schedule</Text>
        <TouchableOpacity
          style={styles.profileButton}
          activeOpacity={0.7}
          onPress={() => router.push('/activities/settings' as any)}
        >
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
            }}
            style={styles.profileImage}
            contentFit="cover"
          />
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
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.topLabel}>TODAY&apos;S OVERVIEW</Text>
          <Text style={styles.title}>Activity Management</Text>

          {/* Date Picker Pill */}
          <TouchableOpacity style={styles.datePickerPill} activeOpacity={0.8}>
            <Ionicons name="calendar-outline" size={18} color="#0E5E2F" style={{ marginRight: 6 }} />
            <Text style={styles.datePickerText}>October 24, 2023</Text>
          </TouchableOpacity>
        </View>

        {/* Timeline List */}
        <View style={styles.timelineContainer}>
          {scheduleItems.map((item, index) => {
            const isLast = index === scheduleItems.length - 1;
            return (
              <View key={index} style={styles.timelineRow}>
                {/* Left Column (Time & Connecting Line) */}
                <View style={styles.leftTimeline}>
                  <Text style={[styles.timeLabel, { color: item.timeColor }]}>{item.time}</Text>
                  {!isLast && <View style={styles.connectorLine} />}
                </View>

                {/* Right Column (Card content) */}
                <View style={styles.rightTimeline}>
                  <View style={[styles.card, { borderLeftColor: item.borderColor }]}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.statusBadge, { backgroundColor: item.statusBg }]}>
                        <Text style={[styles.statusText, { color: item.statusColor }]}>
                          {item.status}
                        </Text>
                      </View>
                      {item.icon === 'leaf' ? (
                        <MaterialCommunityIcons name="leaf" size={20} color="#0E5E2F" />
                      ) : item.icon === 'coffee' ? (
                        <Ionicons name="cafe-outline" size={20} color="#5B600A" />
                      ) : (
                        <MaterialCommunityIcons name="silverware-fork-knife" size={18} color="#7D8A82" />
                      )}
                    </View>

                    <Text style={styles.cardTitle}>{item.title}</Text>

                    <View style={styles.detailRow}>
                      <Ionicons name="location-outline" size={16} color="#7D8A82" />
                      <Text style={styles.detailText}>{item.location}</Text>
                    </View>

                    {item.extraInfo && (
                      <View style={styles.detailRow}>
                        <Ionicons name={item.extraIcon as any} size={16} color="#7D8A82" />
                        <Text style={[styles.detailText, { fontWeight: '600', color: '#49504B' }]}>
                          {item.extraInfo}
                        </Text>
                      </View>
                    )}

                    {item.hasPreferencesLink && (
                      <View style={styles.linkContainer}>
                        <View style={styles.cardDivider} />
                        <TouchableOpacity activeOpacity={0.6}>
                          <Text style={styles.preferencesLinkText}>
                            View Guest Preferences →
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
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
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F1',
    zIndex: 10,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0E5E2F',
    letterSpacing: -0.3,
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
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  titleSection: {
    marginBottom: 28,
  },
  topLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0E5E2F',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1917',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  datePickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D7EDE0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 14,
    alignSelf: 'flex-start',
  },
  datePickerText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0E5E2F',
  },
  timelineContainer: {
    marginTop: 10,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  leftTimeline: {
    width: 55,
    alignItems: 'center',
    position: 'relative',
    paddingTop: 8,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  connectorLine: {
    position: 'absolute',
    top: 32,
    bottom: -28,
    width: 2,
    backgroundColor: '#EAEAEA',
  },
  rightTimeline: {
    flex: 1,
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    borderLeftWidth: 6,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#60646C',
    marginLeft: 6,
    fontWeight: '500',
  },
  linkContainer: {
    marginTop: 14,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
  },
  preferencesLinkText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#5B600A',
  },
});

export default DailySchedule;
