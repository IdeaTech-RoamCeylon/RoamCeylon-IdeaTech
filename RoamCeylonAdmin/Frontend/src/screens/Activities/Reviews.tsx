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
    { stars: 5, fill: '85%', percent: '85%' },
    { stars: 4, fill: '12%', percent: '12%' },
    { stars: 3, fill: '2%', percent: '2%' },
    { stars: 2, fill: '1%', percent: '1%' },
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
              <Text style={styles.overallScoreText}>4.9</Text>
              <Text style={styles.maxScoreText}>/ 5.0</Text>
            </View>
            <View style={styles.positiveTag}>
              <Ionicons name="happy-outline" size={16} color="#0E5E2F" style={{ marginRight: 4 }} />
              <Text style={styles.positiveTagText}>98% Positive</Text>
            </View>
          </View>

          {/* Stars & Reviews Count */}
          <View style={styles.starsCountRow}>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons key={s} name="star" size={18} color="#F59E0B" style={{ marginRight: 2 }} />
              ))}
            </View>
            <Text style={styles.reviewsCountText}>(248 Reviews)</Text>
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

        {/* Guest Review Cards */}
        {/* Card 1: Amara Perera */}
        <View style={styles.reviewCard}>
          <View style={styles.cardHeader}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
              }}
              style={styles.avatarImage}
              contentFit="cover"
            />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>Amara Perera</Text>
              <Text style={styles.authorSubtitle}>Stayed Oct 12–14, 2023</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#D97706" style={{ marginRight: 2 }} />
              <Text style={styles.ratingBadgeText}>5.0</Text>
            </View>
          </View>

          <Text style={styles.reviewBody}>
            {"\"The tea tasting experience was magical! The staff at Roam Ceylon truly went above and\nbeyond to make our anniversary special.\""}
          </Text>

          <View style={styles.cardFooter}>
            <Text style={styles.footerDate}>Yesterday at 14:20</Text>
            <TouchableOpacity style={styles.replyButton} activeOpacity={0.7}>
              <MaterialCommunityIcons name="reply" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.replyButtonText}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card 2: James Wilson */}
        <View style={styles.reviewCard}>
          <View style={styles.cardHeader}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
              }}
              style={styles.avatarImage}
              contentFit="cover"
            />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>James Wilson</Text>
              <Text style={styles.authorSubtitle}>Stayed Oct 08–11, 2023</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#D97706" style={{ marginRight: 2 }} />
              <Text style={styles.ratingBadgeText}>4.0</Text>
            </View>
          </View>

          <Text style={styles.reviewBody}>
            {"\"Incredible views and the pool is world-class. Would have appreciated a few more vegetarian\noptions for breakfast, but everything else was flawless.\""}
          </Text>

          <View style={styles.cardFooter}>
            <Text style={styles.footerDate}>Oct 12, 2023</Text>
            <TouchableOpacity style={styles.replyButton} activeOpacity={0.7}>
              <MaterialCommunityIcons name="reply" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.replyButtonText}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card 3: Lina Schneider */}
        <View style={styles.reviewCard}>
          <View style={styles.cardHeader}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
              }}
              style={styles.avatarImage}
              contentFit="cover"
            />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>Lina Schneider</Text>
              <Text style={styles.authorSubtitle}>Stayed Oct 05–07, 2023</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#D97706" style={{ marginRight: 2 }} />
              <Text style={styles.ratingBadgeText}>5.0</Text>
            </View>
          </View>

          <Text style={styles.reviewBody}>
            {"\"The sunrise from our balcony was worth the flight alone. Pristine cleanliness and\nexcellent service.\""}
          </Text>

          {/* Nested Responder sub-container */}
          <View style={styles.responseContainer}>
            <Text style={styles.responseLabel}>YOUR RESPONSE:</Text>
            <Text style={styles.responseText}>
              {"\"Thank you Lina! We're so glad you enjoyed the sunrise. We hope to welcome you back\nsoon.\""}
            </Text>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.footerDate}>Oct 09, 2023</Text>
            <TouchableOpacity style={styles.editButton} activeOpacity={0.7}>
              <Feather name="edit-2" size={13} color="#0E5E2F" style={{ marginRight: 4 }} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
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
