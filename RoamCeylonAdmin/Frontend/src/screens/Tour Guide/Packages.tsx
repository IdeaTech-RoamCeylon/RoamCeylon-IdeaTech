import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const Packages = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Search and Category filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'culture' | 'nature' | 'coastal'>('all');

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

  const handleMenuPress = () => {
    Alert.alert('Menu', 'Hamburger menu options are coming soon!');
  };

  const handleNotificationPress = () => {
    Alert.alert('Notifications', 'No new notifications.');
  };

  const handleCreatePackagePress = () => {
    router.push('/tour-guide/addPackage' as any);
  };

  const handleEditPackagePress = (title: string) => {
    router.push('/tour-guide/editPackage' as any);
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
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.topLabel}>ADMIN INVENTORY</Text>
          <Text style={styles.title}>Tour Packages</Text>
          <Text style={styles.subtitle}>
            Curate and manage your high-end travel itineraries for the modern explorer.
          </Text>

          {/* Create New Package Button */}
          <TouchableOpacity
            style={styles.createButton}
            activeOpacity={0.8}
            onPress={handleCreatePackagePress}
          >
            <Ionicons name="add" size={18} color="#5B600A" style={{ marginRight: 4 }} />
            <Text style={styles.createButtonText}>Create New Package</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#A3A8A5" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search destinations..."
            placeholderTextColor="#A3A8A5"
            value={searchQuery}
            onChangeText={setSearchQuery}
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

                {/* Pencil Edit Icon Button (Active tours only) */}
                {pkg.isActive && (
                  <TouchableOpacity
                    style={styles.pencilEditButton}
                    activeOpacity={0.7}
                    onPress={() => handleEditPackagePress(pkg.title)}
                  >
                    <Feather name="edit-2" size={14} color="#1C1917" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Package Content */}
              <View style={styles.tourInfo}>
                <Text style={styles.durationCategoryText}>
                  {pkg.duration} • {pkg.category}
                </Text>
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
              <Ionicons name="search-outline" size={48} color="#A3A8A5" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>No packages found matching search criteria.</Text>
            </View>
          )}
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
    backgroundColor: '#1E293B', // Dark slate background for silhouette generic avatar
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 20,
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
  subtitle: {
    fontSize: 15,
    color: '#60646C',
    marginTop: 6,
    lineHeight: 22,
    fontWeight: '500',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAD26B',
    borderRadius: 18,
    height: 48,
    marginTop: 16,
    shadowColor: '#EAD26B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#5B600A',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
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
    backgroundColor: '#5B600A', // Deep gold-brown active style
  },
  pillButtonInactive: {
    backgroundColor: '#EAF2EC',
  },
  pillButtonText: {
    fontSize: 13,
  },
  pillActiveText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  pillInactiveText: {
    color: '#60646C',
    fontWeight: '700',
  },
  packagesContainer: {
    gap: 16,
    marginBottom: 20,
  },
  tourCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  tourCardDraft: {
    // Styles applied to card container in draft mode
  },
  tourImageWrapper: {
    width: '100%',
    height: 192,
    position: 'relative',
    backgroundColor: '#EAEAEA',
  },
  tourImage: {
    width: '100%',
    height: '100%',
  },
  imageDraftOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.45)', // Grayscale / dimming representation
  },
  statusTag: {
    position: 'absolute',
    top: 14,
    right: 14, // Moved to top-right to preserve edit button alignment or top-left
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  // Align status badge exactly to the left side
  statusTagActive: {
    backgroundColor: '#C2F3D0',
    position: 'absolute',
    top: 14,
    left: 14,
  },
  statusTagDraft: {
    backgroundColor: '#F3F4F6',
    position: 'absolute',
    top: 14,
    left: 14,
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
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tourInfo: {
    padding: 20,
  },
  durationCategoryText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5B600A',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  tourName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 8,
  },
  tourDescription: {
    fontSize: 14,
    color: '#60646C',
    lineHeight: 20,
    fontWeight: '500',
  },
  tourDivider: {
    height: 1,
    backgroundColor: '#F0F3F1',
    marginVertical: 16,
  },
  tourFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A3A8A5',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  priceText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1917',
  },
  priceUnit: {
    fontSize: 14,
    color: '#60646C',
    fontWeight: '500',
  },
  customSwitchContainer: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 3,
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
    color: '#60646C',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default Packages;
