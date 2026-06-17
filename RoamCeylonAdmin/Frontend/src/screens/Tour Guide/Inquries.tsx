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
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';

const Inquries = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);



  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const accessToken = await SecureStore.getItemAsync('authToken');
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';
        if (!accessToken) return;

        const headers = { Authorization: `Bearer ${accessToken}` };
        const [inqRes, statsRes] = await Promise.all([
          fetch(`${apiUrl}/tour-guide/inquiries`, { headers }),
          fetch(`${apiUrl}/tour-guide/inquiries/stats`, { headers }),
        ]);

        if (inqRes.ok) setInquiries(await inqRes.json());
        if (statsRes.ok) setStats(await statsRes.json());
      } catch (error) {
        console.error('Failed to fetch inquiries:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFilterPress = () => {
    Alert.alert('Filter', 'Filter criteria sheet opened.');
  };

  const handleNewLeadPress = () => {
    Alert.alert('New Lead', 'Redirecting to Lead Creation screen...');
  };

  const _handleActionPress = (name: string, action: string, detail: string) => {
    if (action === 'Reply' || action === 'View Thread') {
      router.push({
        pathname: '/tour-guide/chat',
        params: { name, detail },
      } as any);
    } else {
      Alert.alert(action, `Opening options for ${name}...`);
    }
  };

  const _handleArchivedPress = () => {
    Alert.alert('Archived Inquiries', 'Loading historical guest inquiries...');
  };

  // Map API status to display values
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'new': return { label: 'NEW', type: 'new' };
      case 'priority': return { label: 'PRIORITY', type: 'priority' };
      case 'responded': return { label: 'RESPONDED', type: 'responded' };
      case 'closed': return { label: 'CLOSED', type: 'responded' };
      default: return { label: status.toUpperCase(), type: 'new' };
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays === 1) return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
          <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Active Inquiries</Text>
          <TouchableOpacity style={styles.headerButton} activeOpacity={0.7} onPress={handleNewLeadPress}>
            <Feather name="plus" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.mainContent}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.pageSubtitle}>
              Review guest inquiries, tailor customized itineraries, and close bookings.
            </Text>
          
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={styles.filterButton}
              activeOpacity={0.7}
              onPress={handleFilterPress}
            >
              <Ionicons name="options-outline" size={15} color="#1C1917" style={{ marginRight: 6 }} />
              <Text style={styles.filterButtonText}>Filter Inquiries</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transition Banner */}
        <TouchableOpacity 
          style={styles.transitionBanner}
          activeOpacity={0.8}
          onPress={() => router.push('/tour-guide/bookings' as any)}
        >
          <View style={styles.bannerIconWrap}>
            <Ionicons name="calendar" size={24} color="#FFF" />
          </View>
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerTitle}>Manage Bookings</Text>
            <Text style={styles.bannerDesc}>All new guest requests are now routed directly to your Bookings Dashboard.</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color="#0E5E2F" />
        </TouchableOpacity>

        {/* KPI Cards Grid */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiGridRow}>
            {/* Card 1: Active Inquiries */}
            <View style={styles.kpiCardHalf}>
              <View style={styles.kpiRing1} />
              <View style={styles.kpiRing2} />
              <View style={styles.kpiHeader}>
                <View style={styles.iconBadge}>
                  <Ionicons name="bar-chart-outline" size={16} color="#0E5E2F" />
                </View>
                <Text style={styles.kpiLabel}>{stats ? `${stats.active} Total` : '—'}</Text>
              </View>
              <Text style={styles.kpiValue}>Active</Text>
              <Text style={[styles.kpiTrend, styles.trendPositive]}>
                ↗ {stats?.responded ?? 0} responded
              </Text>
            </View>

            {/* Card 2: Pending Inquiries */}
            <View style={styles.kpiCardHalf}>
              <View style={styles.kpiRing1} />
              <View style={styles.kpiRing2} />
              <View style={styles.kpiHeader}>
                <View style={[styles.iconBadge, { borderColor: '#FEF3C7', backgroundColor: '#FFFBEB' }]}>
                  <Ionicons name="notifications-outline" size={16} color="#D97706" />
                </View>
                <Text style={styles.kpiLabel}>{stats ? `${stats.pending} New` : '—'}</Text>
              </View>
              <Text style={styles.kpiValue}>Pending</Text>
              <Text style={[styles.kpiTrend, styles.trendUrgent]}>
                ⏰ {stats?.priority ?? 0} urgent
              </Text>
            </View>
          </View>

          {/* Card 3: Potential Value (Dark Emerald) */}
          <LinearGradient
            colors={['#0E5E2F', '#093D1E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.kpiCardFull}
          >
            <View style={styles.kpiDarkRing1} />
            <View style={styles.kpiDarkRing2} />
            <View style={styles.kpiFullContentRow}>
              <View style={styles.kpiFullLeft}>
                <View style={[styles.iconBadge, styles.iconBadgeDark, { marginBottom: 6 }]}>
                  <Ionicons name="cash-outline" size={18} color="#FFDF59" />
                </View>
                <Text style={styles.kpiLabelDark}>Potential Pipeline Value</Text>
              </View>
              <View style={styles.kpiFullRight}>
                <View style={styles.lkrValueRow}>
                  <Text style={styles.kpiValueDark}>
                    {stats ? (stats.pipelineValue >= 1000000
                      ? `${(stats.pipelineValue / 1000000).toFixed(1)}m`
                      : stats.pipelineValue >= 1000
                      ? `${(stats.pipelineValue / 1000).toFixed(0)}k`
                      : stats.pipelineValue.toLocaleString()) : '0'}
                  </Text>
                  <Text style={styles.lkrSuffixText}>LKR</Text>
                </View>
                <Text style={styles.kpiTrendDark}>High conversion likelihood</Text>
              </View>
            </View>
          </LinearGradient>
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
          {loading ? (
            <ActivityIndicator size="large" color="#0E5E2F" style={{ marginVertical: 24 }} />
          ) : inquiries.length > 0 ? (
            inquiries.slice(0, 6).map((request) => {
              const { label: statusLabel, type: statusType } = getStatusDisplay(request.status);
              const isNew = statusType === 'new';
              const isPriority = statusType === 'priority';
              const isResponded = statusType === 'responded';
              const _actionText = isResponded ? 'View Thread' : 'Reply';
              const avatarUrl = request.guestAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.guestName)}&background=random`;

              return (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestRow1}>
                    <View style={styles.avatarContainer}>
                      <Image source={{ uri: avatarUrl }} style={styles.requestAvatar} contentFit="cover" />
                      {isNew && <View style={styles.avatarNewDot} />}
                    </View>
                    
                    <View style={styles.requestDetailsCol}>
                      <View style={styles.requestNameRow}>
                        <Text style={styles.requestName}>{request.guestName}</Text>
                        <View
                          style={[
                            styles.pillBadge,
                            isNew && styles.pillBadgeNew,
                            isPriority && styles.pillBadgePriority,
                            isResponded && styles.pillBadgeResponded,
                          ]}
                        >
                          <View style={[
                            styles.statusBadgeDot,
                            isNew && { backgroundColor: '#D97706' },
                            isPriority && { backgroundColor: '#EF4444' },
                            isResponded && { backgroundColor: '#0E5E2F' }
                          ]} />
                          <Text
                            style={[
                              styles.pillBadgeText,
                              isNew && styles.pillBadgeNewText,
                              isPriority && styles.pillBadgePriorityText,
                              isResponded && styles.pillBadgeRespondedText,
                            ]}
                          >
                            {statusLabel}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.requestTimeRow}>
                        <Ionicons name="time-outline" size={13} color="#8A958E" style={{ marginRight: 4 }} />
                        <Text style={styles.requestTimeText}>{formatDate(request.createdAt)}</Text>
                      </View>

                      <View style={styles.requestInterestRow}>
                        <View style={styles.interestIconContainer}>
                          <Ionicons name="map-outline" size={13} color="#0E5E2F" />
                        </View>
                        <Text style={styles.requestInterestText}>{request.tourInterest || request.subject || 'General Inquiry'}</Text>
                      </View>
                    </View>
                  </View>


                </View>
              );
            })
          ) : (
            <Text style={{ textAlign: 'center', color: '#6B7280', paddingVertical: 24 }}>No inquiries yet.</Text>
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
    backgroundColor: '#F3F4F6',
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
  actionBar: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 8,
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6EFEA',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1917',
  },
  kpiGrid: {
    marginBottom: 24,
    gap: 12,
  },
  kpiGridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  kpiCardHalf: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAF2EC',
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiCardFull: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#0E5E2F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  kpiFullContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  kpiFullLeft: {
    justifyContent: 'center',
  },
  kpiFullRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  kpiRing1: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 6,
    borderColor: 'rgba(14, 94, 47, 0.03)',
  },
  kpiRing2: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: 'rgba(14, 94, 47, 0.015)',
  },
  kpiDarkRing1: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 10,
    borderColor: 'rgba(255, 223, 89, 0.04)',
  },
  kpiDarkRing2: {
    position: 'absolute',
    right: -50,
    bottom: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 15,
    borderColor: 'rgba(255, 223, 89, 0.015)',
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EAF7EE',
    borderWidth: 1,
    borderColor: '#C2F3D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadgeDark: {
    backgroundColor: '#0D4728',
    borderColor: '#0C4024',
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A958E',
  },
  kpiLabelDark: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EAD26B',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  lkrValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  kpiValueDark: {
    fontSize: 30,
    fontWeight: '800',
    color: '#EAD26B',
    letterSpacing: -0.8,
    marginRight: 4,
  },
  lkrSuffixText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EAD26B',
    marginBottom: 3,
  },
  kpiTrend: {
    fontSize: 11,
    fontWeight: '700',
  },
  trendPositive: {
    color: '#0E5E2F',
  },
  trendUrgent: {
    color: '#C2410C',
  },
  kpiTrendDark: {
    fontSize: 11,
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
    backgroundColor: '#0E5E2F',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
  },
  requestsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EAEFEA',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
  },
  requestRow1: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  requestAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#EAEAEA',
  },
  avatarNewDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFDF59',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
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
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  pillBadgeNew: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
  },
  pillBadgePriority: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  pillBadgeResponded: {
    backgroundColor: '#EAF7EE',
    borderColor: '#C2F3D0',
  },
  pillBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pillBadgeNewText: {
    color: '#D97706',
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
    fontSize: 12,
    color: '#8A958E',
    fontWeight: '500',
  },
  requestInterestRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  interestIconContainer: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#FAFBF9',
    borderWidth: 1,
    borderColor: '#E6EFEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  requestInterestText: {
    fontSize: 13,
    color: '#2C3A30',
    fontWeight: '700',
  },
  requestCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F5F3',
    paddingTop: 16,
  },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F3F5F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  replyButton: {
    borderRadius: 12,
  },
  transitionBanner: {
    backgroundColor: '#EAF7EE',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C2F3D0',
  },
  bannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0E5E2F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  bannerTextCol: {
    flex: 1,
    marginRight: 10,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0E5E2F',
    marginBottom: 4,
  },
  bannerDesc: {
    fontSize: 12,
    color: '#145334',
    fontWeight: '500',
    lineHeight: 16,
  },
  replyButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#EAD26B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  replyButtonGradient: {
    height: 36,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  replyButtonSecondary: {
    backgroundColor: '#FAFBF9',
    borderWidth: 1,
    borderColor: '#C2D1C8',
  },
  replyButtonTextPrimary: {
    fontSize: 13,
    fontWeight: '800',
    color: '#3B2E05',
  },
  replyButtonSecondaryText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0E5E2F',
  },
  archivedInquiriesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  archivedInquiriesText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0E5E2F',
    letterSpacing: 0.8,
    marginLeft: 6,
  },
  convertButton: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
    borderWidth: 1,
  },
  convertButtonText: {
    color: '#B45309',
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1917',
  },
  modalBody: {
    gap: 12,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: -4,
  },
  textInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1C1917',
  },
  submitModalButton: {
    backgroundColor: '#0E5E2F',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  submitModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Inquries;
