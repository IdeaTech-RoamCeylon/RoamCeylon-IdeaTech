import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const Packages = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Search and Category filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [loading, setLoading] = useState(true);
  const [packagesList, setPackagesList] = useState<any[]>([]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const accessToken = await SecureStore.getItemAsync('authToken');
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';

      if (!accessToken) return;

      const res = await fetch(`${apiUrl}/tour-guide/packages`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setPackagesList(data);
      }
    } catch (error) {
      console.error('Failed to fetch packages:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPackages();
    }, [])
  );

  const togglePackageStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'draft' : 'active';
      const accessToken = await SecureStore.getItemAsync('authToken');
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';

      const res = await fetch(`${apiUrl}/tour-guide/packages/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Optimistic UI update
        setPackagesList((prev) => 
          prev.map((pkg) => (pkg.id === id ? { ...pkg, status: newStatus } : pkg))
        );
      } else {
        Alert.alert('Error', 'Failed to update package status');
      }
    } catch (error) {
      console.error('Toggle status error:', error);
    }
  };

  // Predefined package categories
  const categories = [
    'all',
    'Culture',
    'Nature',
    'Coastal',
    'Adventure',
    'Wellness',
    'Wildlife',
    'Other',
  ];

  // Filtering Logic
  const filteredPackages = packagesList.filter((pkg) => {
    const matchesCategory =
      selectedCategory === 'all' || (pkg.category && pkg.category.toLowerCase() === selectedCategory.toLowerCase());
    const matchesSearch =
      (pkg.name && pkg.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (pkg.description && pkg.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCreatePackagePress = () => {
    router.push('/tour-guide/addPackage' as any);
  };

  const _handleEditPackagePress = (title: string) => {
    router.push('/tour-guide/editPackage' as any);
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
          <Text style={[styles.headerTitle, { color: '#1C1917' }]}>Tour Packages</Text>
          <TouchableOpacity style={styles.headerButton} activeOpacity={0.7} onPress={handleCreatePackagePress}>
            <Feather name="plus" size={26} color="#1C1917" />
          </TouchableOpacity>
        </View>

        <View style={styles.mainContent}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.pageSubtitle}>
              Curate and manage your high-end travel itineraries for the modern explorer.
            </Text>
          </View>

        {/* Search Bar */}
        <View style={[
          styles.searchContainer, 
          isSearchFocused && styles.searchContainerFocused
        ]}>
          <Ionicons 
            name="search-outline" 
            size={18} 
            color={isSearchFocused ? "#0E5E2F" : "#8A958E"} 
            style={{ marginRight: 10 }} 
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search destinations..."
            placeholderTextColor="#8A958E"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
        </View>

        {/* Categories Pills Horizontal List — dynamic from real package data */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesPillsScroll}
          contentContainerStyle={styles.categoriesPillsContainer}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.pillButton,
                selectedCategory === cat ? styles.pillButtonActive : styles.pillButtonInactive,
              ]}
              activeOpacity={0.8}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.pillButtonText,
                  selectedCategory === cat ? styles.pillActiveText : styles.pillInactiveText,
                ]}
              >
                {cat === 'all' ? 'All Packages' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Packages Cards List */}
        <View style={styles.packagesContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#0E5E2F" style={{ marginTop: 40 }} />
          ) : filteredPackages.length === 0 ? (
            <Text style={{ textAlign: 'center', marginTop: 40, color: '#6B7280' }}>
              No packages found. Try adding one!
            </Text>
          ) : (
            filteredPackages.map((pkg) => (
              <View key={pkg.id} style={[styles.tourCard, pkg.status !== 'active' && styles.tourCardDraft]}>
                {/* Image Block */}
                <View style={styles.tourImageWrapper}>
                  <Image source={pkg.coverImageUrl ? { uri: pkg.coverImageUrl } : require('../../assets/Tours/Cultural Triangle.png')} style={styles.tourImage} contentFit="cover" />
                  {pkg.status !== 'active' && <View style={styles.imageDraftOverlay} />}
                  
                  {/* Active/Draft Tag */}
                  <View style={[styles.statusTag, pkg.status === 'active' ? styles.statusTagActive : styles.statusTagDraft]}>
                    <View style={[styles.statusDot, pkg.status === 'active' ? styles.statusDotActive : styles.statusDotDraft]} />
                    <Text style={[styles.statusTagText, pkg.status === 'active' ? styles.statusTagTextActive : styles.statusTagTextDraft]}>
                      {pkg.status === 'active' ? 'ACTIVE' : 'DRAFT'}
                    </Text>
                  </View>

                  {/* Floating Pencil Edit Icon Button (Active tours only) */}
                  {pkg.status === 'active' && (
                    <TouchableOpacity
                      style={styles.pencilEditButton}
                      activeOpacity={0.7}
                      onPress={() => router.push(`/tour-guide/editPackage?id=${pkg.id}` as any)}
                    >
                      <Feather name="edit-2" size={14} color="#0E5E2F" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Package Content */}
                <View style={styles.tourInfo}>
                  <View style={styles.badgesRow}>
                    <View style={[styles.categoryBadge, pkg.status !== 'active' && styles.categoryBadgeDraft]}>
                      <Text style={[styles.categoryBadgeText, pkg.status !== 'active' && styles.badgeTextDraft]}>
                        {pkg.category?.toUpperCase()}
                      </Text>
                    </View>
                    <View style={[styles.durationBadge, pkg.status !== 'active' && styles.durationBadgeDraft]}>
                      <Ionicons 
                        name="time-outline" 
                        size={11} 
                        color={pkg.status === 'active' ? "#D97706" : "#60646C"} 
                        style={{ marginRight: 4 }} 
                      />
                      <Text style={[styles.durationText, pkg.status !== 'active' && styles.badgeTextDraft]}>
                        {pkg.duration} DAYS
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.tourName}>{pkg.name}</Text>
                  <Text style={styles.tourDescription} numberOfLines={2}>{pkg.description || 'No description provided.'}</Text>

                  <View style={styles.tourDivider} />

                  {/* Price and Toggle Switch Row */}
                  <View style={styles.tourFooter}>
                    <View>
                      <Text style={styles.priceLabel}>STARTING FROM</Text>
                      <Text style={styles.priceText}>
                        Rs. {pkg.price} <Text style={styles.priceUnit}>/pp</Text>
                      </Text>
                    </View>

                    {/* Switch Toggle */}
                    <TouchableOpacity
                      style={[
                        styles.customSwitchContainer,
                        pkg.status === 'active' ? styles.customSwitchActiveBg : styles.customSwitchInactiveBg,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => togglePackageStatus(pkg.id, pkg.status)}
                    >
                      <View
                        style={[
                          styles.customSwitchCircle,
                          pkg.status === 'active' ? styles.customSwitchCircleActive : styles.customSwitchCircleInactive,
                        ]}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
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
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEFEA',
    borderRadius: 16,
    height: 46,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  searchContainerFocused: {
    borderColor: '#0E5E2F',
    shadowColor: '#0E5E2F',
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1917',
    height: '100%',
  },
  categoriesPillsScroll: {
    marginBottom: 20,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  categoriesPillsContainer: {
    gap: 8,
    paddingRight: 40,
  },
  pillButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillButtonActive: {
    backgroundColor: '#2C3A30',
    borderWidth: 1,
    borderColor: '#2C3A30',
  },
  pillButtonInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6EFEA',
  },
  pillButtonText: {
    fontSize: 13,
  },
  pillActiveText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  pillInactiveText: {
    color: '#6B7280',
    fontWeight: '700',
  },
  packagesContainer: {
    gap: 16,
    marginBottom: 20,
  },
  tourCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
  },
  tourCardDraft: {
    shadowOpacity: 0.015,
  },
  tourImageWrapper: {
    width: '100%',
    height: 180,
    position: 'relative',
    backgroundColor: '#EAEAEA',
  },
  tourImage: {
    width: '100%',
    height: '100%',
  },
  imageDraftOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  statusTag: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statusTagActive: {
    backgroundColor: '#C2F3D0',
  },
  statusTagDraft: {
    backgroundColor: '#F3F4F6',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusDotActive: {
    backgroundColor: '#0E5E2F',
  },
  statusDotDraft: {
    backgroundColor: '#60646C',
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusTagTextActive: {
    color: '#0E5E2F',
  },
  statusTagTextDraft: {
    color: '#60646C',
  },
  pencilEditButton: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFDF59',
    borderWidth: 1,
    borderColor: '#EAD26B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  tourInfo: {
    padding: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: '#EAF7EE',
    borderWidth: 1,
    borderColor: '#C2F3D0',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryBadgeDraft: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0E5E2F',
    letterSpacing: 0.5,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  durationBadgeDraft: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  durationText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  badgeTextDraft: {
    color: '#60646C',
  },
  tourName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 8,
  },
  tourDescription: {
    fontSize: 13,
    color: '#606963',
    lineHeight: 18,
    fontWeight: '500',
  },
  tourDivider: {
    height: 1,
    backgroundColor: '#F2F5F3',
    marginVertical: 12,
  },
  tourFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8A958E',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
  },
  priceUnit: {
    fontSize: 13,
    color: '#606963',
    fontWeight: '500',
  },
  customSwitchContainer: {
    width: 48,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: 'center',
  },
  customSwitchActiveBg: {
    backgroundColor: '#0E5E2F',
  },
  customSwitchInactiveBg: {
    backgroundColor: '#E5E7EB',
  },
  customSwitchCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  customSwitchCircleActive: {
    alignSelf: 'flex-end',
  },
  customSwitchCircleInactive: {
    alignSelf: 'flex-start',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#606963',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default Packages;
