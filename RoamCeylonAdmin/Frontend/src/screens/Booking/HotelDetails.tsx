import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { uploadImages } from '@/utils/imageUpload';
import LocationPickerModal from '@/components/LocationPickerModal';
import type { Hotel } from '@/types/booking.types';

type Coordinate = { latitude: number; longitude: number };

const CATEGORIES = [
  'Hotel',
  'Resort',
  'Villa',
  'Boutique Hotel',
  'Guest House',
  'Homestay',
  'Apartment',
];

const AMENITY_OPTIONS: { name: string; lib: 'ion' | 'mci'; icon: string }[] = [
  { name: 'High-Speed Wi-Fi', lib: 'ion', icon: 'wifi' },
  { name: 'Infinity Pool', lib: 'mci', icon: 'pool' },
  { name: 'Wellness Spa', lib: 'ion', icon: 'flower-outline' },
  { name: 'Fine Dining', lib: 'ion', icon: 'restaurant-outline' },
  { name: 'Fitness Center', lib: 'ion', icon: 'barbell-outline' },
  { name: 'Lounge Bar', lib: 'ion', icon: 'wine-outline' },
  { name: 'Room Service', lib: 'mci', icon: 'room-service-outline' },
];

const apiUrl = () =>
  process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';

const HotelDetails = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [galleryUris, setGalleryUris] = useState<string[]>([]);

  const [isMapVisible, setMapVisible] = useState(false);
  const [markerCoordinate, setMarkerCoordinate] = useState<Coordinate | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        try {
          setLoading(true);
          const accessToken = await SecureStore.getItemAsync('authToken');
          if (accessToken) {
            const res = await fetch(`${apiUrl()}/hotels/my`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (res.ok && active) {
              const hotel: Hotel | null = await res.json();
              if (hotel) {
                setName(hotel.name ?? '');
                setCategory(hotel.category ?? '');
                setStreetAddress(hotel.streetAddress ?? '');
                setSelectedAmenities(
                  Array.isArray(hotel.amenities) ? hotel.amenities : [],
                );
                setGalleryUris(
                  Array.isArray(hotel.galleryUrls) ? hotel.galleryUrls : [],
                );
                const lat =
                  hotel.latitude != null ? parseFloat(String(hotel.latitude)) : NaN;
                const lng =
                  hotel.longitude != null ? parseFloat(String(hotel.longitude)) : NaN;
                if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
                  setMarkerCoordinate({ latitude: lat, longitude: lng });
                }
              }
            }
          }
        } catch (error) {
          console.error('[HotelDetails] Failed to load hotel:', error);
        } finally {
          if (active) setLoading(false);
        }
      };
      load();
      return () => {
        active = false;
      };
    }, []),
  );

  const handleLocationConfirm = (address: string, coordinate: [number, number]) => {
    // coordinate is [longitude, latitude]
    const [lng, lat] = coordinate;
    if (lat !== 0 || lng !== 0) {
      setMarkerCoordinate({ latitude: lat, longitude: lng });
    }
    if (address) setStreetAddress(address);
    setMapVisible(false);
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity],
    );
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length) {
      setGalleryUris((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const removeImage = (uri: string) => {
    setGalleryUris((prev) => prev.filter((u) => u !== uri));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Fields', 'Please enter a hotel name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const accessToken = await SecureStore.getItemAsync('authToken');
      if (!accessToken) {
        Alert.alert('Authentication Error', 'You must be logged in to save.');
        setIsSubmitting(false);
        return;
      }

      const uploadedUrls = await uploadImages(
        galleryUris,
        '/hotels/upload-image',
        accessToken,
      );

      const response = await fetch(`${apiUrl()}/hotels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name,
          category,
          streetAddress,
          latitude: markerCoordinate?.latitude,
          longitude: markerCoordinate?.longitude,
          amenities: selectedAmenities,
          coverImageUrl: uploadedUrls[0] ?? '',
          galleryUrls: uploadedUrls,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text().catch(() => 'Unknown error');
        throw new Error(errorData);
      }

      Alert.alert('Saved', 'Your property details have been saved.');
    } catch (error: any) {
      console.error('[HotelDetails] Failed to save hotel:', error);
      Alert.alert('Error', 'Could not save property details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const featuredImage = galleryUris[0];
  const restImages = galleryUris.slice(1);

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

        <TouchableOpacity
          style={styles.headerRightButton}
          activeOpacity={0.7}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#855E0E" />
          ) : (
            <Text style={styles.headerSaveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0E5E2F" />
        </View>
      ) : (
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
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Property Category</Text>
              <TouchableOpacity
                style={styles.dropdownWrapper}
                activeOpacity={0.7}
                onPress={() => setCategoryModalVisible(true)}
              >
                <Text style={category ? styles.dropdownValue : styles.dropdownPlaceholder}>
                  {category || 'Select a category'}
                </Text>
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
                  value={streetAddress}
                  onChangeText={setStreetAddress}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.mapContainer}
              activeOpacity={0.9}
              onPress={() => setMapVisible(true)}
            >
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&auto=format&fit=crop&q=80' }} // Placeholder for map
                style={styles.mapImage}
                contentFit="cover"
              />
              {/* Greyscale overlay to make it look like the map in the design */}
              <View style={styles.mapOverlay} />
              {markerCoordinate && (
                <View style={styles.coordBadge} pointerEvents="none">
                  <Ionicons name="checkmark-circle" size={14} color="#0E5E2F" />
                  <Text style={styles.coordBadgeText}>
                    {markerCoordinate.latitude.toFixed(5)}, {markerCoordinate.longitude.toFixed(5)}
                  </Text>
                </View>
              )}
              <View style={styles.pinButton} pointerEvents="none">
                <Ionicons name="location" size={16} color="#1C1917" />
                <Text style={styles.pinButtonText}>
                  {markerCoordinate ? 'Change location' : 'Pin location'}
                </Text>
              </View>
            </TouchableOpacity>
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
              {AMENITY_OPTIONS.map((item) => {
                const selected = selectedAmenities.includes(item.name);
                return (
                  <TouchableOpacity
                    key={item.name}
                    style={[styles.pill, selected && styles.pillSelected]}
                    activeOpacity={0.7}
                    onPress={() => toggleAmenity(item.name)}
                  >
                    {item.lib === 'mci' ? (
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={18}
                        color={selected ? '#0D4F2E' : '#4A4A4A'}
                      />
                    ) : (
                      <Ionicons
                        name={item.icon as any}
                        size={18}
                        color={selected ? '#0D4F2E' : '#4A4A4A'}
                      />
                    )}
                    <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Media Gallery Section */}
          <View style={styles.mediaHeaderRow}>
            <View style={styles.mediaHeaderLeft}>
              <Ionicons name="images" size={24} color="#5B4A1E" />
              <Text style={styles.mediaTitle}>Media Gallery</Text>
            </View>
            <View style={styles.mediaBadge}>
              <Text style={styles.mediaBadgeText}>{galleryUris.length} / 10</Text>
            </View>
          </View>

          <View style={styles.mediaGrid}>
            {featuredImage ? (
              <View style={styles.featuredImageContainer}>
                <Image
                  source={{ uri: featuredImage }}
                  style={styles.featuredImage}
                  contentFit="cover"
                />
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredBadgeText}>Featured Cover</Text>
                </View>
                <TouchableOpacity
                  style={styles.removePhotoBadge}
                  onPress={() => removeImage(featuredImage)}
                >
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.featuredAddCard} activeOpacity={0.6} onPress={pickImages}>
                <Ionicons name="camera-outline" size={36} color="#4A4A4A" style={{ marginBottom: 8 }} />
                <Text style={styles.addPhotoText}>Add Featured Cover</Text>
              </TouchableOpacity>
            )}

            {/* Remaining images in rows of two */}
            {restImages.map((uri) => (
              <View key={uri} style={styles.halfRow}>
                <View style={styles.halfImageContainer}>
                  <Image source={{ uri }} style={styles.halfImage} contentFit="cover" />
                  <TouchableOpacity
                    style={styles.removePhotoBadge}
                    onPress={() => removeImage(uri)}
                  >
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }} />
              </View>
            ))}

            <TouchableOpacity style={styles.addPhotoCardFull} activeOpacity={0.6} onPress={pickImages}>
              <Ionicons name="camera-outline" size={32} color="#4A4A4A" style={{ marginBottom: 8 }} />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Map Selection Modal (Mapbox) */}
      <LocationPickerModal
        visible={isMapVisible}
        onClose={() => setMapVisible(false)}
        onConfirm={handleLocationConfirm}
        initialCoordinate={
          markerCoordinate
            ? [markerCoordinate.longitude, markerCoordinate.latitude]
            : null
        }
      />

      {/* Category Modal */}
      <Modal
        visible={isCategoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setCategoryModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Category</Text>
                {CATEGORIES.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.categoryOption,
                      category === item && styles.categoryOptionSelected,
                    ]}
                    onPress={() => {
                      setCategory(item);
                      setCategoryModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        category === item && styles.categoryOptionTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                    {category === item && <Ionicons name="checkmark" size={20} color="#0D4F2E" />}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  dropdownValue: {
    fontSize: 15,
    color: '#1C1917',
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
  pillSelected: {
    backgroundColor: '#A9F0AD',
    borderColor: '#226D27',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4A4A',
    marginLeft: 8,
  },
  pillTextSelected: {
    color: '#0D4F2E',
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
  featuredAddCard: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#DCCDAA',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
  halfRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfImageContainer: {
    flex: 1,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  halfImage: {
    width: '100%',
    height: '100%',
  },
  addPhotoCardFull: {
    width: '100%',
    height: 120,
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
  removePhotoBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#DC2626',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryOptionSelected: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginHorizontal: -16,
    borderBottomWidth: 0,
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#4A4A4A',
    fontWeight: '500',
  },
  categoryOptionTextSelected: {
    color: '#0D4F2E',
    fontWeight: '700',
  },
  coordBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  coordBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0E5E2F',
    marginLeft: 6,
  },
});

export default HotelDetails;
