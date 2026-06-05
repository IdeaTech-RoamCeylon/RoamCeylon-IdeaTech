import React from 'react';
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const HotelDetails = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#1C1917" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerStepText}>STEP 2 OF 4</Text>
          <Text style={styles.headerTitleText}>Property Details</Text>
        </View>

        <TouchableOpacity style={styles.headerRightButton} activeOpacity={0.7}>
          <Text style={styles.headerSaveText}>Save</Text>
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
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Tell us about your space</Text>
          <Text style={styles.mainSubtitle}>
            Accurate details help craft the perfect{'\n'}traveler experience.
          </Text>
        </View>

        {/* Basic Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle-outline" size={22} color="#5B4A1E" />
            <Text style={styles.cardTitle}>Basic Information</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Hotel Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="e.g. The Serene Villa"
                placeholderTextColor="#A3A3A3"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Property Category</Text>
            <TouchableOpacity style={styles.dropdownWrapper} activeOpacity={0.7}>
              <Text style={styles.dropdownPlaceholder}>Select a category</Text>
              <Ionicons name="chevron-down" size={20} color="#A3A3A3" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Location Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location-outline" size={22} color="#5B4A1E" />
            <Text style={styles.cardTitle}>Location</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Street Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="search" size={20} color="#7C8A82" style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="Start typing address..."
                placeholderTextColor="#A3A3A3"
              />
            </View>
          </View>

          <View style={styles.mapContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&auto=format&fit=crop&q=80' }} // Placeholder for map
              style={styles.mapImage}
              contentFit="cover"
            />
            {/* Greyscale overlay to make it look like the map in the design */}
            <View style={styles.mapOverlay} />
            <TouchableOpacity style={styles.pinButton} activeOpacity={0.8}>
              <Ionicons name="location" size={16} color="#1C1917" />
              <Text style={styles.pinButtonText}>Pin location</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Key Amenities Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="leaf-outline" size={22} color="#5B4A1E" />
            <Text style={styles.cardTitle}>Key Amenities</Text>
          </View>
          <View style={styles.divider} />

          <Text style={styles.amenitiesSubtitle}>
            Select the primary highlights of your property.
          </Text>

          <View style={styles.pillContainer}>
            <TouchableOpacity style={styles.pill} activeOpacity={0.7}>
              <Ionicons name="wifi" size={18} color="#4A4A4A" />
              <Text style={styles.pillText}>High-Speed Wi-Fi</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pill} activeOpacity={0.7}>
              <MaterialCommunityIcons name="pool" size={18} color="#4A4A4A" />
              <Text style={styles.pillText}>Infinity Pool</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pill} activeOpacity={0.7}>
              <Ionicons name="flower-outline" size={18} color="#4A4A4A" />
              <Text style={styles.pillText}>Wellness Spa</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pill} activeOpacity={0.7}>
              <Ionicons name="restaurant-outline" size={18} color="#4A4A4A" />
              <Text style={styles.pillText}>Fine Dining</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pill} activeOpacity={0.7}>
              <Ionicons name="barbell-outline" size={18} color="#4A4A4A" />
              <Text style={styles.pillText}>Fitness Center</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pill} activeOpacity={0.7}>
              <Ionicons name="wine-outline" size={18} color="#4A4A4A" />
              <Text style={styles.pillText}>Lounge Bar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pill} activeOpacity={0.7}>
              <MaterialCommunityIcons name="room-service-outline" size={18} color="#4A4A4A" />
              <Text style={styles.pillText}>Room Service</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Media Gallery Section */}
        <View style={styles.mediaHeaderRow}>
          <View style={styles.mediaHeaderLeft}>
            <Ionicons name="images" size={24} color="#5B4A1E" />
            <Text style={styles.mediaTitle}>Media Gallery</Text>
          </View>
          <View style={styles.mediaBadge}>
            <Text style={styles.mediaBadgeText}>4 / 10</Text>
          </View>
        </View>

        <View style={styles.mediaGrid}>
          {/* Featured Image */}
          <View style={styles.featuredImageContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&auto=format&fit=crop&q=80' }}
              style={styles.featuredImage}
              contentFit="cover"
            />
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>Featured Cover</Text>
            </View>
          </View>

          {/* Row 2: Two Images */}
          <View style={styles.imageRowRow}>
            <View style={styles.halfImageContainer}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=400&auto=format&fit=crop&q=80' }}
                style={styles.halfImage}
                contentFit="cover"
              />
            </View>
            <View style={styles.halfImageContainer}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&auto=format&fit=crop&q=80' }}
                style={styles.halfImage}
                contentFit="cover"
              />
            </View>
          </View>

          {/* Row 3: One Image + Add Photo Button */}
          <View style={styles.imageRowRow}>
            <View style={styles.halfImageContainer}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&auto=format&fit=crop&q=80' }}
                style={styles.halfImage}
                contentFit="cover"
              />
            </View>
            <TouchableOpacity style={styles.addPhotoCard} activeOpacity={0.6}>
              <Ionicons name="camera-outline" size={32} color="#4A4A4A" style={{ marginBottom: 8 }} />
              <Text style={styles.addPhotoText}>Add Photo</Text>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    zIndex: 10,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerStepText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7C8A82',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
  },
  headerRightButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  headerSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#855E0E',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 20,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0E5E2F',
    marginBottom: 10,
    textAlign: 'center',
  },
  mainSubtitle: {
    fontSize: 15,
    color: '#4A4A4A',
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D4E2D8',
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B2F0B',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F3F1',
    marginVertical: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A4A4A',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCCDAA',
    borderRadius: 12,
    backgroundColor: '#FAFAF9',
    height: 52,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1C1917',
  },
  inputIcon: {
    marginRight: 10,
  },
  inputWithIcon: {
    flex: 1,
    fontSize: 15,
    color: '#1C1917',
  },
  dropdownWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DCCDAA',
    borderRadius: 12,
    backgroundColor: '#FAFAF9',
    height: 52,
    paddingHorizontal: 16,
  },
  dropdownPlaceholder: {
    fontSize: 15,
    color: '#A3A3A3',
  },
  mapContainer: {
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 8,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.4)', // lighten the map
  },
  pinButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#66BB6A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  pinButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1917',
    marginLeft: 6,
  },
  amenitiesSubtitle: {
    fontSize: 14,
    color: '#60646C',
    marginBottom: 16,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCCDAA',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4A4A',
    marginLeft: 8,
  },
  mediaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 4,
    marginTop: 10,
  },
  mediaHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mediaTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0D1321',
    marginLeft: 10,
  },
  mediaBadge: {
    backgroundColor: '#FDF7E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  mediaBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#70530A',
  },
  mediaGrid: {
    gap: 12,
  },
  featuredImageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#726600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  featuredBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  imageRowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfImageContainer: {
    flex: 1,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
  },
  halfImage: {
    width: '100%',
    height: '100%',
  },
  addPhotoCard: {
    flex: 1,
    height: 160,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#DCCDAA',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A4A4A',
  },
});

export default HotelDetails;
