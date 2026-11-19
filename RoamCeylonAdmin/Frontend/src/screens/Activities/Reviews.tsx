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
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const Reviews = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const ratingsDistribution = [
    { stars: 5, fill: '0%', percent: '0%' },
    { stars: 4, fill: '0%', percent: '0%' },
    { stars: 3, fill: '0%', percent: '0%' },
    { stars: 2, fill: '0%', percent: '0%' },
    { stars: 1, fill: '0%', percent: '0%' },
  ] as const;

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
          <Text style={styles.headerTitle}>Reviews</Text>
        </View>

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
        {/* Overall Rating Card */}
        <View style={styles.overallRatingCard}>
          <Text style={styles.cardLabel}>OVERALL RATING</Text>
          <View style={styles.overallScoreRow}>
            <View style={styles.scoreContainer}>
              <Text style={styles.overallScoreText}>0.0</Text>
              <Text style={styles.maxScoreText}>/ 5.0</Text>
            </View>
            <View style={styles.positiveTag}>
              <Ionicons name="happy-outline" size={16} color="#0E5E2F" style={{ marginRight: 4 }} />
              <Text style={styles.positiveTagText}>0% Positive</Text>
            </View>
          </View>

          {/* Stars & Reviews Count */}
          <View style={styles.starsCountRow}>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons key={s} name="star-outline" size={18} color="#D1D5DB" style={{ marginRight: 2 }} />
              ))}
            </View>
            <Text style={styles.reviewsCountText}>(0 Reviews)</Text>
          </View>

          <View style={styles.divider} />

          {/* Distribution Bars */}
          <View style={styles.distributionContainer}>
            {ratingsDistribution.map((dist, idx) => (
              <View key={idx} style={styles.distributionRow}>
                <Text style={styles.starNumText}>{dist.stars}</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: dist.fill }]} />
                </View>
                <Text style={styles.progressPercentText}>{dist.percent}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Guest Reviews Title Row */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Guest Reviews</Text>
          <TouchableOpacity style={styles.filterIconButton} activeOpacity={0.7}>
            <Feather name="sliders" size={18} color="#1C1917" />
          </TouchableOpacity>
        </View>

        {/* Filter Selection Pills */}
        <View style={styles.filterPillsRow}>
          <TouchableOpacity style={styles.pillActive} activeOpacity={0.8}>
            <Text style={styles.pillActiveText}>Most Recent</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pillOutline} activeOpacity={0.8}>
            <Text style={styles.pillOutlineText}>Highest Rated</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pillOutline} activeOpacity={0.8}>
            <Text style={styles.pillOutlineText}>Lowest Rated</Text>
          </TouchableOpacity>
        </View>

        {/* Empty Guest Reviews State */}
        <View style={[styles.reviewCard, { alignItems: 'center', paddingVertical: 32 }]}>
          <Ionicons name="chatbubbles-outline" size={36} color="#9CA3AF" style={{ marginBottom: 8 }} />
          <Text style={[styles.authorName, { marginBottom: 4 }]}>No reviews yet</Text>
          <Text style={[styles.authorSubtitle, { textAlign: 'center' }]}>
            Guest reviews will appear here once travelers rate your activities.
          </Text>
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
    backgroundColor: '#F8FAF8',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  overallRatingCard: {
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
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#60646C',
    letterSpacing: 0.5,
  },
  overallScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  overallScoreText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#1C1917',
    lineHeight: 48,
  },
  maxScoreText: {
    fontSize: 16,
    color: '#60646C',
    marginLeft: 6,
    marginBottom: 6,
    fontWeight: '600',
  },
  positiveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C2F3D0',
    borderWidth: 1,
    borderColor: '#9BF2B5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  positiveTagText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0E5E2F',
  },
  starsCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  starsRow: {
    flexDirection: 'row',
  },
  reviewsCountText: {
    fontSize: 14,
    color: '#60646C',
    marginLeft: 8,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 18,
  },
  distributionContainer: {},
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starNumText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1C1917',
    width: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginHorizontal: 12,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#EAD26B',
    borderRadius: 3,
  },
  progressPercentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#60646C',
    width: 32,
    textAlign: 'right',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.3,
  },
  filterIconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  pillActive: {
    backgroundColor: '#EAD26B',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pillActiveText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pillOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 8,
  },
  pillOutlineText: {
    fontSize: 14,
    color: '#60646C',
    fontWeight: '700',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAEAEA',
  },
  authorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1917',
  },
  authorSubtitle: {
    fontSize: 13,
    color: '#60646C',
    marginTop: 2,
    fontWeight: '500',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  ratingBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
  },
  reviewBody: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    fontWeight: '500',
  },
  responseContainer: {
    borderLeftWidth: 3,
    borderLeftColor: '#0E5E2F',
    backgroundColor: '#FEFBF0',
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
  },
  responseLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0E5E2F',
    marginBottom: 4,
  },
  responseText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  footerDate: {
    fontSize: 13,
    color: '#60646C',
    fontWeight: '500',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E5E2F',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  replyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editButtonText: {
    color: '#0E5E2F',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default Reviews;
