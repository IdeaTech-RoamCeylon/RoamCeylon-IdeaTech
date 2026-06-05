import React from 'react';
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

const Inquries = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Guest requests data definition
  const guestRequests = [
    {
      name: 'Sophia Henderson',
      status: 'NEW',
      statusType: 'new', // yellow
      time: 'Today, 10:45 AM',
      icon: 'heart-outline',
      iconColor: '#5B600A',
      detail: 'Honeymoon in Ella',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      actionText: 'Reply',
      actionStyle: 'primary',
    },
    {
      name: 'Julian Thorne',
      status: 'PRIORITY',
      statusType: 'priority', // red/pink
      time: 'Yesterday, 4:20 PM',
      icon: 'map-outline',
      iconColor: '#5B600A',
      detail: 'Cultural Triangle Exclusive',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
      actionText: 'Reply',
      actionStyle: 'primary',
    },
    {
      name: 'Elena Richards',
      status: 'RESPONDED',
      statusType: 'responded', // green
      time: 'Oct 12, 11:00 AM',
      icon: 'boat-outline',
      iconColor: '#5B600A',
      detail: 'East Coast Retreat',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
      actionText: 'View Thread',
      actionStyle: 'secondary',
    },
    {
      name: 'Marcus Thorne',
      status: 'NEW',
      statusType: 'new', // yellow
      time: 'Oct 11, 2:15 PM',
      icon: 'trail-sign-outline',
      iconColor: '#5B600A',
      detail: 'Hill Country Escape',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
      actionText: 'Reply',
      actionStyle: 'primary',
    },
  ];

  const handleMenuPress = () => {
    Alert.alert('Menu', 'Hamburger menu options are coming soon!');
  };

  const handleNotificationPress = () => {
    Alert.alert('Notifications', 'No new notifications.');
  };

  const handleFilterPress = () => {
    Alert.alert('Filter', 'Filter criteria sheet opened.');
  };

  const handleNewLeadPress = () => {
    Alert.alert('New Lead', 'Redirecting to Lead Creation screen...');
  };

  const handleActionPress = (name: string, action: string) => {
    Alert.alert(action, `Opening chat/thread options for ${name}...`);
  };

  const handleArchivedPress = () => {
    Alert.alert('Archived Inquiries', 'Loading historical guest inquiries...');
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
        {/* Title Section & Action Buttons */}
        <View style={styles.titleSection}>
          <Text style={styles.topLabel}>INQUIRY MANAGEMENT</Text>
          <Text style={styles.title}>Active Inquiries</Text>
          
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={styles.filterButton}
              activeOpacity={0.7}
              onPress={handleFilterPress}
            >
              <Ionicons name="options-outline" size={16} color="#1C1917" style={{ marginRight: 6 }} />
              <Text style={styles.filterButtonText}>Filter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.newLeadButton}
              activeOpacity={0.8}
              onPress={handleNewLeadPress}
            >
              <Ionicons name="add" size={16} color="#5B600A" style={{ marginRight: 4 }} />
              <Text style={styles.newLeadButtonText}>New Lead</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* KPI Cards Stack */}
        <View style={styles.kpiContainer}>
          {/* Card 1: Active Inquiries */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiCircleAccent, styles.circleAccentYellow]} />
            <View style={styles.kpiHeader}>
              <View style={styles.iconBadge}>
                <Ionicons name="bar-chart-outline" size={18} color="#5B600A" />
              </View>
            </View>
            <Text style={styles.kpiLabel}>48 Total</Text>
            <Text style={styles.kpiValue}>Active</Text>
            <Text style={[styles.kpiTrend, styles.trendPositive]}>
              ↗ +8% from last week
            </Text>
          </View>

          {/* Card 2: Pending Inquiries */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiCircleAccent, styles.circleAccentGreen]} />
            <View style={styles.kpiHeader}>
              <View style={styles.iconBadge}>
                <Ionicons name="notifications-outline" size={18} color="#0E5E2F" />
              </View>
            </View>
            <Text style={styles.kpiLabel}>12 New</Text>
            <Text style={styles.kpiValue}>Pending</Text>
            <Text style={[styles.kpiTrend, styles.trendUrgent]}>
              ⏰ 4 requires urgent action
            </Text>
          </View>

          {/* Card 3: Potential Value */}
          <View style={[styles.kpiCard, styles.kpiCardDark]}>
            <View style={styles.kpiDarkCircleAccent} />
            <View style={styles.kpiHeader}>
              <View style={[styles.iconBadge, styles.iconBadgeDark]}>
                <Ionicons name="cash-outline" size={18} color="#EAD26B" />
              </View>
            </View>
            <Text style={styles.kpiLabelDark}>Potential Value</Text>
            <View style={styles.lkrValueRow}>
              <Text style={styles.kpiValueDark}>4.2m</Text>
              <Text style={styles.lkrSuffixText}>LKR</Text>
            </View>
            <Text style={styles.kpiTrendDark}>High conversion likelihood</Text>
          </View>
        </View>

        {/* Recent Guest Requests Section Heading */}
        <View style={styles.sectionHeadingBlock}>
          <View style={styles.headingBulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.sectionTitle}>Recent Guest Requests</Text>
          </View>
        </View>

        {/* Requests Card List */}
        <View style={styles.requestsContainer}>
          {guestRequests.map((request) => {
            const isNew = request.statusType === 'new';
            const isPriority = request.statusType === 'priority';
            const isResponded = request.statusType === 'responded';
            
            return (
              <View key={request.name} style={styles.requestCard}>
                <View style={styles.requestRow1}>
                  <Image source={{ uri: request.avatar }} style={styles.requestAvatar} contentFit="cover" />
                  
                  <View style={styles.requestDetailsCol}>
                    <View style={styles.requestNameRow}>
                      <Text style={styles.requestName}>{request.name}</Text>
                      <View
                        style={[
                          styles.pillBadge,
                          isNew && styles.pillBadgeNew,
                          isPriority && styles.pillBadgePriority,
                          isResponded && styles.pillBadgeResponded,
                        ]}
                      >
                        <Text
                          style={[
                            styles.pillBadgeText,
                            isNew && styles.pillBadgeNewText,
                            isPriority && styles.pillBadgePriorityText,
                            isResponded && styles.pillBadgeRespondedText,
                          ]}
                        >
                          {request.status}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.requestTimeRow}>
                      <Ionicons name="time-outline" size={13} color="#60646C" style={{ marginRight: 4 }} />
                      <Text style={styles.requestTimeText}>{request.time}</Text>
                    </View>

                    <View style={styles.requestInterestRow}>
                      <Ionicons name={request.icon as any} size={14} color={request.iconColor} style={{ marginRight: 6 }} />
                      <Text style={styles.requestInterestText}>{request.detail}</Text>
                    </View>
                  </View>
                </View>

                {/* Bottom Action Bar */}
                <View style={styles.requestCardFooter}>
                  <TouchableOpacity
                    style={styles.moreButton}
                    activeOpacity={0.7}
                    onPress={() => handleActionPress(request.name, 'More Actions')}
                  >
                    <Ionicons name="ellipsis-vertical" size={16} color="#1C1917" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.replyButton,
                      request.actionStyle === 'secondary' ? styles.replyButtonSecondary : styles.replyButtonPrimary,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleActionPress(request.name, request.actionText)}
                  >
                    <Text
                      style={[
                        styles.replyButtonText,
                        request.actionStyle === 'secondary' ? styles.replyButtonSecondaryText : styles.replyButtonPrimaryText,
                      ]}
                    >
                      {request.actionText}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* View Archived Link Footer */}
        <TouchableOpacity
          style={styles.archivedInquiriesButton}
          activeOpacity={0.6}
          onPress={handleArchivedPress}
        >
          <Text style={styles.archivedInquiriesText}>VIEW ARCHIVED INQUIRIES</Text>
          <Ionicons name="chevron-down" size={16} color="#5B600A" style={{ marginLeft: 6 }} />
        </TouchableOpacity>

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
  actionBar: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
  },
  newLeadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAD26B',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  newLeadButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#5B600A',
  },
  kpiContainer: {
    gap: 12,
    marginBottom: 28,
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiCardDark: {
    backgroundColor: '#07351D',
    borderColor: '#052A17',
  },
  kpiCircleAccent: {
    position: 'absolute',
    top: -24,
    right: -24,
    width: 96,
    height: 96,
    borderRadius: 48,
    opacity: 0.8,
  },
  circleAccentYellow: {
    backgroundColor: '#FEFCE8',
  },
  circleAccentGreen: {
    backgroundColor: '#EAF7EE',
  },
  kpiDarkCircleAccent: {
    position: 'absolute',
    bottom: -36,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#0A4A29',
    opacity: 0.8,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FAFBFB',
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadgeDark: {
    backgroundColor: '#0D4728',
    borderColor: '#0C4024',
  },
  kpiLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#60646C',
    marginBottom: 4,
  },
  kpiLabelDark: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EAD26B',
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  lkrValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  kpiValueDark: {
    fontSize: 36,
    fontWeight: '800',
    color: '#EAD26B',
    letterSpacing: -0.8,
    marginRight: 6,
  },
  lkrSuffixText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#EAD26B',
    marginBottom: 4,
  },
  kpiTrend: {
    fontSize: 13,
    fontWeight: '700',
  },
  trendPositive: {
    color: '#0E5E2F',
  },
  trendUrgent: {
    color: '#C2410C',
  },
  kpiTrendDark: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EAD26B',
  },
  sectionHeadingBlock: {
    marginBottom: 16,
  },
  headingBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#5B600A',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
  },
  requestsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  requestCard: {
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
  requestRow1: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  requestAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
    backgroundColor: '#EAEAEA',
  },
  requestDetailsCol: {
    flex: 1,
  },
  requestNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1917',
    flex: 1,
    marginRight: 8,
  },
  pillBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillBadgeNew: {
    backgroundColor: '#FCE788',
  },
  pillBadgePriority: {
    backgroundColor: '#FEE2E2',
  },
  pillBadgeResponded: {
    backgroundColor: '#C2F3D0',
  },
  pillBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pillBadgeNewText: {
    color: '#5B600A',
  },
  pillBadgePriorityText: {
    color: '#EF4444',
  },
  pillBadgeRespondedText: {
    color: '#0E5E2F',
  },
  requestTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestTimeText: {
    fontSize: 13,
    color: '#60646C',
    fontWeight: '500',
  },
  requestInterestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requestInterestText: {
    fontSize: 14,
    color: '#5B600A',
    fontWeight: '700',
  },
  requestCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F3F1',
    paddingTop: 16,
  },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAFBFB',
    borderWidth: 1,
    borderColor: '#EAF2EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  replyButton: {
    borderRadius: 16,
    height: 36,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  replyButtonPrimary: {
    backgroundColor: '#EAD26B',
  },
  replyButtonSecondary: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1.2,
    borderColor: '#E6DFD3',
  },
  replyButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
  replyButtonPrimaryText: {
    color: '#5B600A',
  },
  replyButtonSecondaryText: {
    color: '#5B600A',
  },
  archivedInquiriesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  archivedInquiriesText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#5B600A',
    letterSpacing: 0.5,
  },
});

export default Inquries;
