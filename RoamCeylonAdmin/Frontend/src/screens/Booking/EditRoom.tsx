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
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { uploadImages } from '@/utils/imageUpload';
import type { Room } from '@/types/booking.types';

const ROOM_TYPES = [
  'Deluxe Room',
  'Standard Room',
  'Suite',
  'Villa',
  'Family Room',
  'Single Room',
];

const AMENITY_OPTIONS = [
  { id: '1', name: 'King Bed', icon: 'bed-outline' },
  { id: '2', name: 'Free Wi-Fi', icon: 'wifi' },
  { id: '3', name: 'AC', icon: 'snow' },
  { id: '4', name: 'Minibar', icon: 'wine-outline' },
  { id: '5', name: 'Balcony', icon: 'business-outline' },
  { id: '6', name: 'Smart TV', icon: 'tv-outline' },
] as const;

const apiUrl = () =>
  process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';

const EditRoom = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState('Deluxe Room');
  const [squareFootage, setSquareFootage] = useState('');
  const [adultsCount, setAdultsCount] = useState(2);
  const [availableUnits, setAvailableUnits] = useState('');
  const [nightlyRate, setNightlyRate] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [galleryUris, setGalleryUris] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTypeModalVisible, setTypeModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        if (!id) {
          setLoading(false);
          return;
        }
        try {
          setLoading(true);
          const accessToken = await SecureStore.getItemAsync('authToken');
          const res = await fetch(`${apiUrl()}/rooms/${id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (res.ok && active) {
            const room: Room = await res.json();
            setRoomName(room.name ?? '');
            setRoomType(room.roomType || 'Deluxe Room');
            setSquareFootage(room.squareFootage ? String(room.squareFootage) : '');
            setAdultsCount(room.adults ?? 2);
            setAvailableUnits(room.availableUnits ? String(room.availableUnits) : '');
            setNightlyRate(room.nightlyRate ? String(room.nightlyRate) : '');
            setSelectedAmenities(Array.isArray(room.amenities) ? room.amenities : []);
            setGalleryUris(Array.isArray(room.galleryUrls) ? room.galleryUrls : []);
          }
        } catch (error) {
          console.error('[EditRoom] Failed to load room:', error);
        } finally {
          if (active) setLoading(false);
        }
      };
      load();
      return () => {
        active = false;
      };
    }, [id]),
  );

  const toggleAmenity = (name: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name],
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
    if (!roomName.trim()) {
      Alert.alert('Missing Fields', 'Please enter a room name.');
      return;
    }
    if (!id) return;

    setIsSubmitting(true);
    try {
      const accessToken = await SecureStore.getItemAsync('authToken');
      if (!accessToken) {
        Alert.alert('Authentication Error', 'You must be logged in to edit a room.');
        setIsSubmitting(false);
        return;
      }

      const uploadedUrls = await uploadImages(
        galleryUris,
        '/rooms/upload-image',
        accessToken,
      );

      const response = await fetch(`${apiUrl()}/rooms/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: roomName,
          roomType,
          squareFootage: parseInt(squareFootage, 10) || 0,
          adults: adultsCount,
          availableUnits: parseInt(availableUnits, 10) || 1,
          nightlyRate: parseFloat(nightlyRate.replace(/,/g, '')) || 0,
          amenities: selectedAmenities,
          coverImageUrl: uploadedUrls[0] ?? '',
          galleryUrls: uploadedUrls,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text().catch(() => 'Unknown error');
        throw new Error(errorData);
      }

      router.back();
    } catch (error: any) {
      console.error('[EditRoom] Failed to update room:', error);
      Alert.alert('Error', 'Could not save changes. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#5B4A1E" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Edit Room</Text>

        <TouchableOpacity style={styles.avatarButton} activeOpacity={0.7}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' }}
            style={styles.headerAvatar}
            contentFit="cover"
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0D4F2E" />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 }, // Space for bottom bar
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Information */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="information-circle-outline" size={22} color="#0D4F2E" />
              <Text style={styles.cardTitle}>Basic Information</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Room Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Ocean View Sunset Suite"
                  placeholderTextColor="#64748B"
                  value={roomName}
                  onChangeText={setRoomName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Room Type</Text>
              <TouchableOpacity
                style={styles.dropdownWrapper}
                activeOpacity={0.7}
                onPress={() => setTypeModalVisible(true)}
              >
                <Text style={styles.dropdownText}>{roomType}</Text>
                <Ionicons name="chevron-down" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Square Footage (sq ft)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="450"
                  keyboardType="numeric"
                  placeholderTextColor="#64748B"
                  value={squareFootage}
                  onChangeText={setSquareFootage}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Number of Adults</Text>
              <View style={styles.counterWrapper}>
                <TouchableOpacity
                  style={styles.counterButtonMinus}
                  onPress={() => setAdultsCount(Math.max(1, adultsCount - 1))}
                >
                  <Ionicons name="remove" size={20} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.counterValue}>{adultsCount}</Text>
                <TouchableOpacity
                  style={styles.counterButtonPlus}
                  onPress={() => setAdultsCount(adultsCount + 1)}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Inventory & Pricing */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="cash-outline" size={22} color="#001F3F" />
              <Text style={styles.cardTitle}>Inventory & Pricing</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Available Units</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="1"
                  keyboardType="numeric"
                  placeholderTextColor="#64748B"
                  value={availableUnits}
                  onChangeText={setAvailableUnits}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nightly Rate (LKR)</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencyPrefix}>Rs. </Text>
                <TextInput
                  style={styles.input}
                  placeholder="45,000"
                  keyboardType="numeric"
                  placeholderTextColor="#64748B"
                  value={nightlyRate}
                  onChangeText={setNightlyRate}
                />
              </View>
            </View>
          </View>

          {/* Amenities */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="grid-outline" size={22} color="#001F3F" />
              <Text style={styles.cardTitle}>Amenities</Text>
            </View>

            <View style={styles.amenitiesGrid}>
              {AMENITY_OPTIONS.map((item) => {
                const selected = selectedAmenities.includes(item.name);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.amenityCard,
                      selected ? styles.amenityCardSelected : styles.amenityCardUnselected,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => toggleAmenity(item.name)}
                  >
                    <Ionicons name={item.icon as any} size={24} color="#0D4F2E" />
                    <Text
                      style={[
                        styles.amenityText,
                        selected ? styles.amenityTextSelected : styles.amenityTextUnselected,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Media Gallery */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="images-outline" size={22} color="#001F3F" />
              <Text style={styles.cardTitle}>Media Gallery</Text>
            </View>

            <TouchableOpacity style={styles.addPhotosDashedArea} activeOpacity={0.6} onPress={pickImages}>
              <Ionicons name="camera-outline" size={36} color="#64748B" style={{ marginBottom: 8 }} />
              <Text style={styles.addPhotosText}>Add Room Photos</Text>
            </TouchableOpacity>

            {galleryUris.length > 0 && (
              <View style={styles.mediaGrid}>
                {galleryUris.map((uri) => (
                  <View key={uri} style={styles.uploadedPhotoContainer}>
                    <Image source={{ uri }} style={styles.uploadedPhoto} contentFit="cover" />
                    <TouchableOpacity
                      style={styles.removePhotoBadge}
                      onPress={() => removeImage(uri)}
                    >
                      <Ionicons name="close" size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.uploadNewButton} activeOpacity={0.7} onPress={pickImages}>
              <Ionicons name="cloud-upload-outline" size={20} color="#0D4F2E" />
              <Text style={styles.uploadNewText}>Upload New</Text>
            </TouchableOpacity>

            <View style={styles.tipBox}>
              <Ionicons name="bulb-outline" size={20} color="#475569" style={{ marginTop: 2 }} />
              <Text style={styles.tipText}>
                Tip: Listings with 5+ high-quality photos get 40% more bookings on average.
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Room Type Modal */}
      <Modal
        visible={isTypeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTypeModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setTypeModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Room Type</Text>
                {ROOM_TYPES.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.typeOption,
                      roomType === item && styles.typeOptionSelected,
                    ]}
                    onPress={() => {
                      setRoomType(item);
                      setTypeModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        roomType === item && styles.typeOptionTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                    {roomType === item && <Ionicons name="checkmark" size={20} color="#0D4F2E" />}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Bottom Actions Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={styles.cancelButton} activeOpacity={0.7} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addButton, isSubmitting && styles.addButtonDisabled]}
          activeOpacity={0.7}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#6B5E05" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#5B4A1E" />
              <Text style={styles.addButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7F6',
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
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#F4F7F6',
    zIndex: 10,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#6B5E05', // Olive Gold
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  headerAvatar: {
    width: '100%',
    height: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D1321',
    marginLeft: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1E0D5',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    height: 48,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
  },
  dropdownWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1E0D5',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    height: 48,
    paddingHorizontal: 16,
  },
  dropdownText: {
    fontSize: 15,
    color: '#1E293B',
  },
  counterWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F5FA',
    borderRadius: 30,
    padding: 4,
    width: 140,
    justifyContent: 'space-between',
  },
  counterButtonMinus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  counterValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  counterButtonPlus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6B5E05',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyPrefix: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '600',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  amenityCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  amenityCardSelected: {
    backgroundColor: '#A9F0AD',
    borderColor: '#226D27',
  },
  amenityCardUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F1F5F9',
  },
  amenityText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  amenityTextSelected: {
    color: '#0D4F2E',
  },
  amenityTextUnselected: {
    color: '#475569',
  },
  addPhotosDashedArea: {
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  addPhotosText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 12,
  },
  uploadedPhotoContainer: {
    width: '47%',
    height: 120,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  uploadedPhoto: {
    width: '100%',
    height: '100%',
  },
  removePhotoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#DC2626',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0D4F2E',
    borderRadius: 8,
    paddingVertical: 14,
    marginBottom: 20,
  },
  uploadNewText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0D4F2E',
    marginLeft: 8,
  },
  tipBox: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 16,
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  cancelButton: {
    flex: 1,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0D4F2E',
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D4F2E',
  },
  addButton: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EDD35C',
    borderRadius: 8,
  },
  addButtonDisabled: {
    opacity: 0.7,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B5E05',
    marginLeft: 8,
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
  typeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  typeOptionSelected: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginHorizontal: -16,
    borderBottomWidth: 0,
  },
  typeOptionText: {
    fontSize: 16,
    color: '#4A4A4A',
    fontWeight: '500',
  },
  typeOptionTextSelected: {
    color: '#0D4F2E',
    fontWeight: '700',
  },
});

export default EditRoom;
