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
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const DATA = [
  {
    id: '1',
    title: 'Ceylon Spices & Tea',
    category: 'Artisan Goods',
    status: 'Active',
    image: require('../../assets/Shopping/Ceylon Spices.png'),
    badges: [
      { text: 'SP', color: '#D9C55C', bgColor: '#EAD26B' },
      { text: 'TEA', color: '#1B5E20', bgColor: '#9DEB9A' },
    ],
  },
  {
    id: '2',
    title: 'Galle Gem Artisans',
    category: 'Jewelry & Gems',
    status: 'Under Review',
    image: require('../../assets/Shopping/Galle Gems.png'),
    badges: [
      { text: 'GEM', color: '#374151', bgColor: '#D1E0DA' },
    ],
  },
  {
    id: '3',
    title: 'Lanka Handloom Co.',
    category: 'Textiles & Apparel',
    status: 'Active',
    image: require('../../assets/Shopping/Lanka Handloom.png'),
    badges: [
      { text: 'TEX', color: '#1B5E20', bgColor: '#9DEB9A' },
      { text: 'ECO', color: '#7E691A', bgColor: '#E0CC5C' },
    ],
  },
  {
    id: '4',
    title: 'Sigiriya Pottery',
    category: 'Home & Decor',
    status: 'Active',
    image: require('../../assets/Shopping/Pottery.png'),
    badges: [
      { text: 'POT', color: '#374151', bgColor: '#D1E0DA' },
    ],
  },
];

const ShoppingHomeScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
          <Feather name="menu" size={24} color="#103B2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Shops</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.searchButton} activeOpacity={0.7}>
            <Ionicons name="search-outline" size={22} color="#103B2E" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/shopping/settings' as any)}>
            <Image
              source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Partner{'\n'}Network</Text>
        <Text style={styles.pageSubtitle}>Curating premium Sri Lankan{'\n'}experiences</Text>

        <TouchableOpacity style={styles.addButton} activeOpacity={0.85} onPress={() => router.push('/shopping/add' as any)}>
          <Feather name="plus" size={18} color="#493D1B" style={styles.addIcon} />
          <Text style={styles.addButtonText}>Add New Shop</Text>
        </TouchableOpacity>

        {/* Stats Cards */}
        <View style={styles.statCard}>
          <View>
            <Text style={styles.statLabel}>Total Shops</Text>
            <Text style={styles.statValue}>124</Text>
          </View>
          <MaterialCommunityIcons name="storefront-outline" size={24} color="#4F7962" />
        </View>

        <View style={styles.statCard}>
          <View>
            <Text style={styles.statLabel}>Pending Reviews</Text>
            <Text style={styles.statValue}>12</Text>
          </View>
          <Ionicons name="notifications-outline" size={22} color="#4F7962" />
        </View>

        <View style={styles.growthCard}>
          <View>
            <Text style={styles.growthLabel}>Network Growth</Text>
            <View style={styles.growthValueContainer}>
              <Text style={styles.growthValue}>+8.4%</Text>
              <Text style={styles.growthSubtext}>this month</Text>
            </View>
          </View>
          <Feather name="trending-up" size={24} color="#FFFFFF" />
        </View>

        {/* Shop List */}
        {DATA.map((item) => (
          <View key={item.id} style={styles.shopCard}>
            <View style={styles.imageContainer}>
              <Image source={item.image} style={styles.shopImage} contentFit="cover" />
              <View
                style={[
                  styles.statusBadge,
                  item.status === 'Active' ? styles.statusActive : styles.statusReview,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    item.status === 'Active' ? styles.dotActive : styles.dotReview,
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    item.status === 'Active' ? styles.statusTextActive : styles.statusTextReview,
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </View>

            <View style={styles.shopInfo}>
              <Text style={styles.shopTitle}>{item.title}</Text>
              <Text style={styles.shopCategory}>{item.category}</Text>

              <View style={styles.shopFooter}>
                <View style={styles.badgesContainer}>
                  {item.badges.map((badge, index) => (
                    <View
                      key={index}
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: badge.bgColor, marginLeft: index > 0 ? -6 : 0, zIndex: 10 - index },
                      ]}
                    >
                      <Text style={[styles.categoryBadgeText, { color: badge.color }]}>
                        {badge.text}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.actionIcon} activeOpacity={0.7} onPress={() => router.push('/shopping/edit' as any)}>
                    <Ionicons name="pencil" size={20} color="#4A4A4A" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionIcon} activeOpacity={0.7}>
                    <Ionicons name="trash-outline" size={20} color="#4A4A4A" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))}
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
    zIndex: 10,
  },
  iconButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#103B2E',
    marginLeft: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  searchButton: {
    padding: 8,
    marginRight: 12,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#EAD26B',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  pageTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: '#1A1A1A',
    lineHeight: 46,
    marginBottom: 8,
    letterSpacing: -1,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#4A4A4A',
    lineHeight: 24,
    marginBottom: 24,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#EAD26B',
    borderRadius: 100,
    flexDirection: 'row',
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  addIcon: {
    marginRight: 8,
  },
  addButtonText: {
    color: '#493D1B',
    fontSize: 16,
    fontWeight: '600',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  statLabel: {
    fontSize: 14,
    color: '#4A4A4A',
    fontWeight: '600',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  growthCard: {
    backgroundColor: '#0F3D26',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  growthLabel: {
    fontSize: 14,
    color: '#A0B4AA',
    fontWeight: '600',
    marginBottom: 16,
  },
  growthValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  growthValue: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  growthSubtext: {
    fontSize: 14,
    color: '#A0B4AA',
  },
  shopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  shopImage: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  statusActive: {
    backgroundColor: '#A7F3D0',
  },
  statusReview: {
    backgroundColor: '#FDE047',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dotActive: {
    backgroundColor: '#059669',
  },
  dotReview: {
    backgroundColor: '#B45309',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#065F46',
  },
  statusTextReview: {
    color: '#854D0E',
  },
  shopInfo: {
    padding: 20,
  },
  shopTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  shopCategory: {
    fontSize: 14,
    color: '#4A4A4A',
    marginBottom: 16,
  },
  shopFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionIcon: {
    marginLeft: 16,
  },
});

export default ShoppingHomeScreen;
