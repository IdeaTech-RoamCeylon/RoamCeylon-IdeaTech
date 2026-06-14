import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const PendingInquiries = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Search filter query
  const [searchQuery, setSearchQuery] = useState('');

  // Sample pending inquiries list
  const pendingInquiriesData: any[] = [];

  // Filtering pending requests
  const filteredPending = pendingInquiriesData.filter((inq) => {
    return (
      inq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.interest.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.message.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleDecline = (id: string) => {
    Alert.alert('Decline Request', `Are you sure you want to decline or reassign inquiry #${id}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm Decline', style: 'destructive', onPress: () => Alert.alert('Declined', 'Inquiry reassigned to support pool.') },
    ]);
  };

  const handleReplyNow = (name: string, detail: string) => {
    router.push({
      pathname: '/tour-guide/chat',
      params: { name, detail },
    } as any);
  };

  const handleQuickTemplate = (templateName: string) => {
    Alert.alert('Template Applied', `Applied "${templateName}" template to quick reply editor.`);
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
          <Text style={[styles.headerTitle, { color: '#1C1917' }]}>Pending Inquiries</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.mainContent}>
          {/* Subtitle / Intro */}
          <View style={styles.titleSection}>
            <Text style={styles.pageSubtitle}>
              New inquiries awaiting custom tailors. Reply within 2 hours to maintain your response score.
            </Text>
          </View>

          {/* Urgent summary banner */}
          <LinearGradient
            colors={['#FFFBEB', '#FEF3C7']}
            style={styles.alertBanner}
          >
            <Ionicons name="time-outline" size={20} color="#D97706" style={{ marginRight: 10 }} />
            <Text style={styles.alertText}>
              <Text style={{ fontWeight: '800' }}>4 Urgent Requests</Text> require replies soon to maintain your 98% prompt score.
            </Text>
          </LinearGradient>

          {/* Search Bar */}
          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={20} color="#8A958E" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search incoming guest requests..."
              placeholderTextColor="#8A958E"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#8A958E" />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick template triggers */}
          <View style={styles.templateSection}>
            <Text style={styles.sectionHeading}>Quick Templates</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateScroll}>
              <TouchableOpacity
                style={styles.templateButton}
                activeOpacity={0.7}
                onPress={() => handleQuickTemplate('Greeting & Intro')}
              >
                <Text style={styles.templateButtonText}>Greeting & Intro</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.templateButton}
                activeOpacity={0.7}
                onPress={() => handleQuickTemplate('Request Specific Dates')}
              >
                <Text style={styles.templateButtonText}>Request Dates</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.templateButton}
                activeOpacity={0.7}
                onPress={() => handleQuickTemplate('Custom Estimate Setup')}
              >
                <Text style={styles.templateButtonText}>Pricing Estimate</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Pending Inquiries List */}
          <View style={styles.inquiriesList}>
            {filteredPending.length > 0 ? (
              filteredPending.map((inquiry) => (
                <View
                  key={inquiry.id}
                  style={[
                    styles.inquiryCard,
                    inquiry.isUrgent && styles.cardUrgent,
                  ]}
                >
                  {/* Header info */}
                  <View style={styles.cardHeader}>
                    <Image source={{ uri: inquiry.avatar }} style={styles.avatar} contentFit="cover" />
                    <View style={styles.metaCol}>
                      <Text style={styles.guestName}>{inquiry.name}</Text>
                      <Text style={styles.timeLabel}>Received {inquiry.time}</Text>
                    </View>
                    {inquiry.isUrgent && (
                      <View style={styles.urgentBadge}>
                        <Text style={styles.urgentBadgeText}>URGENT</Text>
                      </View>
                    )}
                  </View>

                  {/* Summary grid */}
                  <View style={styles.summaryGrid}>
                    <View style={styles.summaryCell}>
                      <Text style={styles.summaryLabel}>INTEREST</Text>
                      <Text style={styles.summaryValue} numberOfLines={1}>{inquiry.interest}</Text>
                    </View>
                    <View style={styles.summaryCell}>
                      <Text style={styles.summaryLabel}>GUESTS</Text>
                      <Text style={styles.summaryValue}>{inquiry.guests}</Text>
                    </View>
                    <View style={styles.summaryCell}>
                      <Text style={styles.summaryLabel}>DURATION</Text>
                      <Text style={styles.summaryValue}>{inquiry.duration}</Text>
                    </View>
                  </View>

                  {/* Guest notes */}
                  <View style={styles.messageContainer}>
                    <Text style={styles.messageLabel}>Guest Message:</Text>
                    <Text style={styles.messageText}>&ldquo;{inquiry.message}&rdquo;</Text>
                  </View>

                  {/* Urgency countdown indicator */}
                  {inquiry.isUrgent && inquiry.timeLeft && (
                    <View style={styles.timeLeftRow}>
                      <Ionicons name="warning-outline" size={14} color="#EF4444" style={{ marginRight: 6 }} />
                      <Text style={styles.timeLeftText}>{inquiry.timeLeft}</Text>
                    </View>
                  )}

                  {/* Action Bar */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.declineButton}
                      activeOpacity={0.7}
                      onPress={() => handleDecline(inquiry.id)}
                    >
                      <Text style={styles.declineButtonText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.replyButtonWrapper}
                      activeOpacity={0.9}
                      onPress={() => handleReplyNow(inquiry.name, inquiry.interest)}
                    >
                      <LinearGradient
                        colors={['#FFDF59', '#EAD26B']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.replyButtonGradient}
                      >
                        <Text style={styles.replyButtonText}>Reply Now</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="mail-open-outline" size={48} color="#D1D5DB" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyStateTitle}>Inbox Empty</Text>
                <Text style={styles.emptyStateText}>
                  There are no pending incoming inquiries awaiting review.
                </Text>
              </View>
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
    marginBottom: 16,
  },
  pageSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    fontWeight: '500',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  alertText: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
    fontWeight: '500',
    lineHeight: 16,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6EFEA',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1C1917',
    fontWeight: '500',
  },
  templateSection: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8A958E',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  templateScroll: {
    paddingRight: 20,
  },
  templateButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6EFEA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
  },
  templateButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0E5E2F',
  },
  inquiriesList: {
    gap: 16,
  },
  inquiryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EAEFEA',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
  },
  cardUrgent: {
    borderLeftWidth: 6,
    borderLeftColor: '#EF4444',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EAEAEA',
  },
  metaCol: {
    flex: 1,
    marginLeft: 12,
  },
  guestName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1917',
  },
  timeLabel: {
    fontSize: 11,
    color: '#8A958E',
    fontWeight: '500',
    marginTop: 2,
  },
  urgentBadge: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  urgentBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#EF4444',
  },
  summaryGrid: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F0F2F0',
  },
  summaryCell: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8A958E',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1C1917',
  },
  messageContainer: {
    marginBottom: 14,
  },
  messageLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 12.5,
    color: '#4B5563',
    lineHeight: 18,
    fontWeight: '500',
  },
  timeLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  timeLeftText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F2F5F3',
    paddingTop: 14,
  },
  declineButton: {
    borderRadius: 12,
    height: 36,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFBF9',
    borderWidth: 1,
    borderColor: '#F2F5F3',
  },
  declineButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EF4444',
  },
  replyButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  replyButtonGradient: {
    height: 36,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  replyButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#3B2E05',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EAEFEA',
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#8A958E',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
});

export default PendingInquiries;
