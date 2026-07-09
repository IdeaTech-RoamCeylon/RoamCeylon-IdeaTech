import React, { useState } from 'react';
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
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { uploadImages } from '@/utils/imageUpload';

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

const AddRoom = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState('Deluxe Room');
  const [squareFootage, setSquareFootage] = useState('');
  const [adultsCount, setAdultsCount] = useState(2);
  const [availableUnits, setAvailableUnits] = useState('');
  const [nightlyRate, setNightlyRate] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'King Bed',
    'Free Wi-Fi',
    'AC',
  ]);
  const [galleryUris, setGalleryUris] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTypeModalVisible, setTypeModalVisible] = useState(false);

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

    setIsSubmitting(true);
    try {
      const accessToken = await SecureStore.getItemAsync('authToken');
      if (!accessToken) {
        Alert.alert('Authentication Error', 'You must be logged in to add a room.');
        setIsSubmitting(false);
        return;
      }

      // Upload any local images to the Hotels bucket via the backend proxy.
      const uploadedUrls = await uploadImages(
        galleryUris,
        '/rooms/upload-image',
        accessToken,
      );

      const response = await fetch(`${apiUrl()}/rooms`, {
        method: 'POST',
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
        if (response.status === 403 && errorData.includes('BUSINESS_NOT_VERIFIED')) {
          Alert.alert(
            'Verification Required',
            'Please verify your business in Settings before adding listings.',
          );
          return;
        }
        throw new Error(errorData);
      }

      router.back();
    } catch (error: any) {
      console.error('[AddRoom] Failed to create room:', error);
      Alert.alert('Error', 'Could not create room. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
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
              <Text style={styles.headerTitle}>Add New Room</Text>
              <View style={{ width: 44 }} />
            </View>
          </LinearGradient>

          <View style={styles.formContainer}>
            {/* Basic Information */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="info" size={22} color="#0E5E2F" />
                <Text style={styles.cardTitle}>Basic Information</Text>
              </View>
              <View style={styles.cardDivider} />

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Room Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Ocean View Sunset Suite"
                  placeholderTextColor="#9CA3AF"
                  value={roomName}
                  onChangeText={setRoomName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Room Type</Text>
                <TouchableOpacity
                  style={styles.dropdownInput}
                  activeOpacity={0.7}
                  onPress={() => setTypeModalVisible(true)}
                >
                  <Text style={styles.dropdownText}>{roomType}</Text>
                  <Feather name="chevron-down" size={20} color="#60646C" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Square Footage (sq ft)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="450"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                  value={squareFootage}
                  onChangeText={setSquareFootage}
                />
              </View>

              <View style={[styles.inputGroup, { marginBottom: 0 }]}>
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
                <Feather name="dollar-sign" size={22} color="#0E5E2F" />
                <Text style={styles.cardTitle}>Inventory & Pricing</Text>
              </View>
              <View style={styles.cardDivider} />

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Available Units</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="1"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                  value={availableUnits}
                  onChangeText={setAvailableUnits}
                />
              </View>

              <View style={[styles.inputGroup, { marginBottom: 0 }]}>
                <Text style={styles.inputLabel}>Nightly Rate (LKR)</Text>
                <View style={[styles.iconInputBox, { paddingHorizontal: 20 }]}>
                  <Text style={styles.currencyPrefix}>Rs. </Text>
                  <TextInput
                    style={styles.iconTextInput}
                    placeholder="45,000"
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                    value={nightlyRate}
                    onChangeText={setNightlyRate}
                  />
                </View>
              </View>
            </View>

            {/* Amenities */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="grid" size={22} color="#0E5E2F" />
                <Text style={styles.cardTitle}>Amenities</Text>
              </View>
              <View style={styles.cardDivider} />

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
                      <Ionicons name={item.icon as any} size={24} color={selected ? '#FFFFFF' : '#6B7280'} />
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
                <Feather name="image" size={22} color="#0E5E2F" />
                <Text style={styles.cardTitle}>Media Gallery</Text>
              </View>
              <View style={styles.cardDivider} />

              <TouchableOpacity style={styles.imagePickerCard} activeOpacity={0.8} onPress={pickImages}>
                <View style={styles.cameraIconContainer}>
                  <Feather name="camera" size={24} color="#0E5E2F" />
                </View>
                <Text style={styles.imagePlaceholderText}>Tap to add room photos</Text>
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

              <View style={styles.tipBox}>
                <Ionicons name="bulb-outline" size={20} color="#0E5E2F" style={{ marginTop: 2 }} />
                <Text style={styles.tipText}>
                  Tip: Listings with 5+ high-quality photos get 40% more bookings on average.
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
              activeOpacity={0.8}
              onPress={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Add Room</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} activeOpacity={0.8} onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
                    {roomType === item && <Feather name="check" size={20} color="#FFFFFF" />}
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
  },
  currencyPrefix: {
    fontSize: 15,
    color: '#1C1917',
    fontWeight: '600',
  },
  counterWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 6,
    width: 150,
    justifyContent: 'space-between',
  },
  counterButtonMinus: {
    width: 40,
    height: 40,
    borderRadius: 12,
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
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#0E5E2F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  amenityCard: {
    width: '47%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenityCardSelected: {
    backgroundColor: '#0E5E2F',
  },
  amenityCardUnselected: {
    backgroundColor: '#F3F4F6',
  },
  amenityText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  amenityTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  amenityTextUnselected: {
    color: '#4A4A4A',
  },
  imagePickerCard: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
  imagePlaceholderText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 12,
  },
  uploadedPhotoContainer: {
    width: '47%',
    height: 120,
    borderRadius: 16,
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
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipBox: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#4A4A4A',
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: '#0E5E2F',
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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
  cancelButton: {
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginBottom: 10,
  },
  cancelButtonText: {
    color: '#4A4A4A',
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
  typeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  typeOptionSelected: {
    backgroundColor: '#10B981',
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
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default AddRoom;
