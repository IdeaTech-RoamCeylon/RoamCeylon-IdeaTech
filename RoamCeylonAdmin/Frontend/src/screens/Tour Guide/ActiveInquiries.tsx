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

const ActiveInquiries = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Search query and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'responded' | 'priority'>('all');

  // Detailed active inquiries list
  const activeInquiriesData: any[] = [];

  // Search and status filter logic
  const filteredInquiries = activeInquiriesData.filter((inquiry) => {
    const matchesSearch =
      inquiry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.detail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'all') return matchesSearch;
    return matchesSearch && inquiry.statusType === activeFilter;
  });

  const handleInquiryPress = (name: string, detail: string) => {
    router.push({
      pathname: '/tour-guide/chat',
      params: { name, detail },
    } as any);
  };

  const handleItineraryPress = (name: string) => {
    Alert.alert('Tailor Itinerary', `Opening Interactive Itinerary Planner for ${name}...`);
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
          <Text style={[styles.headerTitle, { color: '#1C1917' }]}>Active Inquiries</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.mainContent}>
          {/* Subtitle / Intro */}
          <View style={styles.titleSection}>
            <Text style={styles.pageSubtitle}>
              Tailor customized itineraries, negotiate details, and convert active guest inquiries into bookings.
            </Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={20} color="#8A958E" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search active guest negotiations..."
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

          {/* Filter Chips row */}
          <View style={styles.filtersWrapper}>
            {[
              { id: 'all', label: 'All Inquiries' },
              { id: 'new', label: 'New' },
              { id: 'responded', label: 'Responded' },
              { id: 'priority', label: 'Priority' },
            ].map((chip) => (
              <TouchableOpacity
                key={chip.id}
                style={[
                  styles.filterChip,
                  activeFilter === chip.id && styles.filterChipActive,
                ]}
                onPress={() => setActiveFilter(chip.id as any)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    activeFilter === chip.id && styles.filterChipActiveText,
                  ]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Inquiries List */}
          <View style={styles.inquiriesList}>
            {filteredInquiries.length > 0 ? (
              filteredInquiries.map((inquiry) => {
                const isNew = inquiry.statusType === 'new';
                const isPriority = inquiry.statusType === 'priority';
                const isResponded = inquiry.statusType === 'responded';

                return (
                  <View key={inquiry.name} style={styles.inquiryCard}>
                    {/* Header Row */}
                    <View style={styles.cardHeader}>
                      <View style={styles.avatarContainer}>
                        <Image source={{ uri: inquiry.avatar }} style={styles.avatar} contentFit="cover" />
                        {isNew && <View style={styles.avatarNewDot} />}
                      </View>

                      <View style={styles.metaCol}>
                        <Text style={styles.guestNameText}>{inquiry.name}</Text>
                        <View style={styles.timeRow}>
                          <Ionicons name="time-outline" size={12} color="#8A958E" style={{ marginRight: 4 }} />
                          <Text style={styles.timeText}>{inquiry.time}</Text>
                        </View>
                      </View>

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
                          {inquiry.status}
                        </Text>
                      </View>
                    </View>

                    {/* Interest / Tour package info */}
                    <View style={styles.interestRow}>
                      <View style={styles.interestIconBg}>
                        <Ionicons name={inquiry.icon as any} size={13} color={inquiry.iconColor} />
                      </View>
                      <Text style={styles.interestText}>{inquiry.detail}</Text>
                    </View>

                    {/* Last Message preview */}
                    <View style={styles.messageBox}>
                      <Text style={styles.messageText} numberOfLines={2}>
                        &ldquo;{inquiry.lastMessage}&rdquo;
                      </Text>
                    </View>

                    {/* Process Status Progress indicator */}
                    <View style={styles.progressSection}>
                      <View style={styles.progressLabelRow}>
                        <Text style={styles.progressLabelText}>Negotiation Progress</Text>
                        <Text style={styles.progressValueText}>
                          {Math.round(inquiry.progress * 100)}%
                        </Text>
                      </View>
                      <View style={styles.progressBarTrack}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { width: `${inquiry.progress * 100}%` },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Action buttons */}
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={[styles.btnAction, styles.btnItinerary]}
                        onPress={() => handleItineraryPress(inquiry.name)}
                      >
                        <Ionicons name="create-outline" size={14} color="#0E5E2F" style={{ marginRight: 4 }} />
                        <Text style={styles.btnItineraryText}>Tailor Plan</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubble-ellipses-outline" size={48} color="#D1D5DB" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyStateTitle}>No Active Inquiries</Text>
                <Text style={styles.emptyStateText}>
                  There are no ongoing itineraries or conversations found matching your search.
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
    marginBottom: 20,
  },
  pageSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    fontWeight: '500',
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
  filtersWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6EFEA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: '#0E5E2F',
    borderColor: '#0E5E2F',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  filterChipActiveText: {
    color: '#FFFFFF',
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EAEAEA',
  },
  avatarNewDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#FFDF59',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  metaCol: {
    flex: 1,
    marginLeft: 12,
  },
  guestNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1917',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timeText: {
    fontSize: 11,
    color: '#8A958E',
    fontWeight: '500',
  },
  pillBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 0.5,
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
  interestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  interestIconBg: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#FAFBF9',
    borderWidth: 1,
    borderColor: '#E6EFEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  interestText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C3A30',
  },
  messageBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  messageText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#6B7280',
    lineHeight: 16,
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: 14,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabelText: {
    fontSize: 11,
    color: '#8A958E',
    fontWeight: '700',
  },
  progressValueText: {
    fontSize: 11,
    color: '#0E5E2F',
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: '#F3F4F6',
    borderRadius: 2.5,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2.5,
    backgroundColor: '#0E5E2F',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  btnAction: {
    borderRadius: 12,
    height: 36,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  btnItinerary: {
    backgroundColor: '#EAF7EE',
    borderWidth: 1,
    borderColor: '#C2F3D0',
  },
  btnItineraryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0E5E2F',
  },
  btnChat: {
    backgroundColor: '#0E5E2F',
  },
  btnChatText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
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

export default ActiveInquiries;
