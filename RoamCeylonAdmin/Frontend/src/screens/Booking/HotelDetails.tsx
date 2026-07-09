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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
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
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Premium Header Gradient */}
          <LinearGradient
            colors={['#0F3D26', '#145334', '#0E5E2F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.headerGradient, { paddingTop: insets.top + 16, paddingBottom: 50 }]}
          >
            <View style={styles.header}>
              <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Property Details</Text>
              <View style={{ width: 44 }} />
            </View>
          </LinearGradient>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0E5E2F" />
            </View>
          ) : (
            <View style={styles.formContainer}>
              {/* Basic Information Card */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Feather name="info" size={22} color="#0E5E2F" />
                  <Text style={styles.cardTitle}>Basic Information</Text>
                </View>
                <View style={styles.cardDivider} />

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Hotel Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. The Serene Villa"
                    placeholderTextColor="#9CA3AF"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View style={[styles.inputGroup, { marginBottom: 0 }]}>
                  <Text style={styles.inputLabel}>Property Category</Text>
                  <TouchableOpacity
                    style={styles.dropdownInput}
                    activeOpacity={0.7}
                    onPress={() => setCategoryModalVisible(true)}
                  >
                    <Text style={category ? styles.dropdownText : styles.dropdownPlaceholder}>
                      {category || 'Select a category'}
                    </Text>
                    <Feather name="chevron-down" size={20} color="#60646C" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Location Card */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Feather name="map-pin" size={22} color="#0E5E2F" />
                  <Text style={styles.cardTitle}>Location</Text>
                </View>
                <View style={styles.cardDivider} />

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Street Address</Text>
                  <View style={styles.iconInputBox}>
                    <Ionicons name="search" size={20} color="#60646C" style={{ marginRight: 8, paddingLeft: 20 }} />
                    <TextInput
                      style={styles.iconTextInput}
                      placeholder="Start typing address..."
                      placeholderTextColor="#9CA3AF"
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
                    source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&auto=format&fit=crop&q=80' }}
                    style={styles.mapImage}
                    contentFit="cover"
                  />
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
                    <Ionicons name="location" size={16} color="#FFFFFF" />
                    <Text style={styles.pinButtonText}>
                      {markerCoordinate ? 'Change location' : 'Pin location'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Key Amenities Card */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Feather name="grid" size={22} color="#0E5E2F" />
                  <Text style={styles.cardTitle}>Key Amenities</Text>
                </View>
                <View style={styles.cardDivider} />

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
                            color={selected ? '#FFFFFF' : '#6B7280'}
                          />
                        ) : (
                          <Ionicons
                            name={item.icon as any}
                            size={18}
                            color={selected ? '#FFFFFF' : '#6B7280'}
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

              {/* Media Gallery Card */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Feather name="image" size={22} color="#0E5E2F" />
                  <Text style={styles.cardTitle}>Media Gallery</Text>
                  <View style={styles.mediaBadge}>
                    <Text style={styles.mediaBadgeText}>{galleryUris.length} / 10</Text>
                  </View>
                </View>
                <View style={styles.cardDivider} />

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
                    <TouchableOpacity style={styles.featuredAddCard} activeOpacity={0.8} onPress={pickImages}>
                      <View style={styles.cameraIconContainer}>
                        <Feather name="camera" size={24} color="#0E5E2F" />
                      </View>
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

                  <TouchableOpacity style={styles.addPhotoCardFull} activeOpacity={0.8} onPress={pickImages}>
                    <Feather name="plus" size={24} color="#0E5E2F" />
                    <Text style={styles.addPhotoText}>Add Photo</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
                activeOpacity={0.8}
                onPress={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Property Details</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

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
                    {category === item && <Feather name="check" size={20} color="#FFFFFF" />}
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
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    paddingVertical: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGradient: {
    width: '100%',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  formContainer: {
    paddingHorizontal: 20,
    marginTop: -24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 0,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1917',
    marginLeft: 12,
    letterSpacing: -0.3,
    flex: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A4A4A',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 0,
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 20,
    fontSize: 15,
    color: '#1C1917',
    backgroundColor: '#F3F4F6',
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0,
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
  },
  dropdownText: {
    fontSize: 15,
    color: '#1C1917',
  },
  dropdownPlaceholder: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  iconInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0,
    borderRadius: 16,
    height: 56,
    backgroundColor: '#F3F4F6',
  },
  iconTextInput: {
    flex: 1,
    fontSize: 15,
    color: '#1C1917',
    height: '100%',
    paddingRight: 16,
  },
  mapContainer: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  pinButton: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E5E2F',
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
    color: '#FFFFFF',
    marginLeft: 6,
  },
  amenitiesSubtitle: {
    fontSize: 14,
    color: '#6B7280',
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
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
  },
  pillSelected: {
    backgroundColor: '#0E5E2F',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4A4A',
    marginLeft: 8,
  },
  pillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  mediaBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  mediaBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E5E2F',
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
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  cameraIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featuredBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#0E5E2F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  featuredBadgeText: {
    fontSize: 12,
    fontWeight: '700',
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
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    gap: 8,
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
  saveButton: {
    backgroundColor: '#0E5E2F',
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
    shadowColor: '#0E5E2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
    backgroundColor: '#10B981',
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
    color: '#FFFFFF',
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
