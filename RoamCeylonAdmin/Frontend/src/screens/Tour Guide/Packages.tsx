import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const Packages = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Search and Category filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'culture' | 'nature' | 'coastal'>('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Package Active/Draft toggles
  const [isCulturalActive, setIsCulturalActive] = useState(true);
  const [isHillCountryActive, setIsHillCountryActive] = useState(false);
  const [isSouthernActive, setIsSouthernActive] = useState(true);

  // Package Data Array
  const packagesList = [
    {
      id: 'cultural',
      title: '7-Day Cultural Triangle',
      category: 'CULTURE',
      duration: '7 DAYS',
      description: 'Explore ancient ruins, sacred temples, and the majestic Sigiriya rock on this...',
      price: '$1,250',
      image: require('../../assets/Tours/Cultural Triangle.png'),
      isActive: isCulturalActive,
      toggleActive: () => setIsCulturalActive(!isCulturalActive),
    },
    {
      id: 'hillcountry',
      title: 'Hill Country Escape',
      category: 'NATURE',
      duration: '5 DAYS',
      description: 'Experience cool climates, endless tea estates, and cascading waterfalls in the...',
      price: '$850',
      image: require('../../assets/Tours/HillCountryEscape.png'),
      isActive: isHillCountryActive,
      toggleActive: () => setIsHillCountryActive(!isHillCountryActive),
    },
    {
      id: 'southern',
      title: 'Southern Shore luxury',
      category: 'COASTAL',
      duration: '10 DAYS',
      description: 'Indulge in private beach villas and bespoke whale watching tours along the...',
      price: '$2,400',
      image: require('../../assets/Tours/Sothern Shore.png'),
      isActive: isSouthernActive,
      toggleActive: () => setIsSouthernActive(!isSouthernActive),
    },
  ];

  // Filtering Logic
  const filteredPackages = packagesList.filter((pkg) => {
    const matchesCategory =
      selectedCategory === 'all' || pkg.category.toLowerCase() === selectedCategory;
    const matchesSearch =
      pkg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreatePackagePress = () => {
    router.push('/tour-guide/addPackage' as any);
  };

  const handleEditPackagePress = (title: string) => {
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

        {/* Categories Pills Horizontal List */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesPillsScroll}
          contentContainerStyle={styles.categoriesPillsContainer}
        >
          <TouchableOpacity
            style={[
              styles.pillButton,
              selectedCategory === 'all' ? styles.pillButtonActive : styles.pillButtonInactive,
            ]}
            activeOpacity={0.8}
            onPress={() => setSelectedCategory('all')}
          >
            <Text
              style={[
                styles.pillButtonText,
                selectedCategory === 'all' ? styles.pillActiveText : styles.pillInactiveText,
              ]}
            >
              All Packages
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.pillButton,
              selectedCategory === 'culture' ? styles.pillButtonActive : styles.pillButtonInactive,
            ]}
            activeOpacity={0.8}
            onPress={() => setSelectedCategory('culture')}
          >
            <Text
              style={[
                styles.pillButtonText,
                selectedCategory === 'culture' ? styles.pillActiveText : styles.pillInactiveText,
              ]}
            >
              Culture
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.pillButton,
              selectedCategory === 'nature' ? styles.pillButtonActive : styles.pillButtonInactive,
            ]}
            activeOpacity={0.8}
            onPress={() => setSelectedCategory('nature')}
          >
            <Text
              style={[
                styles.pillButtonText,
                selectedCategory === 'nature' ? styles.pillActiveText : styles.pillInactiveText,
              ]}
            >
              Nature
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.pillButton,
              selectedCategory === 'coastal' ? styles.pillButtonActive : styles.pillButtonInactive,
            ]}
            activeOpacity={0.8}
            onPress={() => setSelectedCategory('coastal')}
          >
            <Text
              style={[
                styles.pillButtonText,
                selectedCategory === 'coastal' ? styles.pillActiveText : styles.pillInactiveText,
              ]}
            >
              Coastal
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Packages Cards List */}
        <View style={styles.packagesContainer}>
          {filteredPackages.map((pkg) => (
            <View key={pkg.id} style={[styles.tourCard, !pkg.isActive && styles.tourCardDraft]}>
              {/* Image Block */}
              <View style={styles.tourImageWrapper}>
                <Image source={pkg.image} style={styles.tourImage} contentFit="cover" />
                {!pkg.isActive && <View style={styles.imageDraftOverlay} />}
                
                {/* Active/Draft Tag */}
                <View style={[styles.statusTag, pkg.isActive ? styles.statusTagActive : styles.statusTagDraft]}>
                  <View style={[styles.statusDot, pkg.isActive ? styles.statusDotActive : styles.statusDotDraft]} />
                  <Text style={[styles.statusTagText, pkg.isActive ? styles.statusTagTextActive : styles.statusTagTextDraft]}>
                    {pkg.isActive ? 'ACTIVE' : 'DRAFT'}
                  </Text>
                </View>

                {/* Floating Pencil Edit Icon Button (Active tours only) */}
                {pkg.isActive && (
                  <TouchableOpacity
                    style={styles.pencilEditButton}
                    activeOpacity={0.7}
                    onPress={() => handleEditPackagePress(pkg.title)}
                  >
                    <Feather name="edit-2" size={14} color="#0E5E2F" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Package Content */}
              <View style={styles.tourInfo}>
                {/* New Premium Badges Row */}
                <View style={styles.badgesRow}>
                  <View style={[styles.categoryBadge, !pkg.isActive && styles.categoryBadgeDraft]}>
                    <Text style={[styles.categoryBadgeText, !pkg.isActive && styles.badgeTextDraft]}>
                      {pkg.category}
                    </Text>
                  </View>
                  <View style={[styles.durationBadge, !pkg.isActive && styles.durationBadgeDraft]}>
                    <Ionicons 
                      name="time-outline" 
                      size={11} 
                      color={pkg.isActive ? "#D97706" : "#60646C"} 
                      style={{ marginRight: 4 }} 
                    />
                    <Text style={[styles.durationText, !pkg.isActive && styles.badgeTextDraft]}>
                      {pkg.duration}
                    </Text>
                  </View>
                </View>

                <Text style={styles.tourName}>{pkg.title}</Text>
                <Text style={styles.tourDescription}>{pkg.description}</Text>

                <View style={styles.tourDivider} />

                {/* Price and Toggle Switch Row */}
                <View style={styles.tourFooter}>
                  <View>
                    <Text style={styles.priceLabel}>STARTING FROM</Text>
                    <Text style={styles.priceText}>
                      {pkg.price} <Text style={styles.priceUnit}>/pp</Text>
                    </Text>
                  </View>

                  {/* Switch Toggle */}
                  <TouchableOpacity
                    style={[
                      styles.customSwitchContainer,
                      pkg.isActive ? styles.customSwitchActiveBg : styles.customSwitchInactiveBg,
                    ]}
                    activeOpacity={0.8}
                    onPress={pkg.toggleActive}
                  >
                    <View
                      style={[
                        styles.customSwitchCircle,
                        pkg.isActive ? styles.customSwitchCircleActive : styles.customSwitchCircleInactive,
                      ]}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
          
          {filteredPackages.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color="#8A958E" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>No packages found matching search criteria.</Text>
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
