import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Switch,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';

const CATEGORIES = [
  'Culture',
  'Nature',
  'Coastal',
  'Adventure',
  'Wellness',
  'Wildlife',
  'Other',
];

const AddPackage = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [packageName, setPackageName] = useState('');
  const [duration, setDuration] = useState('');
  const [category, setCategory] = useState('Culture');
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [highlights, setHighlights] = useState(['']);
  const [price, setPrice] = useState('');
  const [publishImmediately, setPublishImmediately] = useState(true);

  const [coverImage, setCoverImage] = useState<{ uri: string, base64: string } | null>(null);
  const [galleryImages, setGalleryImages] = useState<{ uri: string, base64: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addHighlight = () => {
    setHighlights([...highlights, '']);
  };

  const removeHighlight = (index: number) => {
    const newHighlights = [...highlights];
    newHighlights.splice(index, 1);
    setHighlights(newHighlights);
  };

  const updateHighlight = (text: string, index: number) => {
    const newHighlights = [...highlights];
    newHighlights[index] = text;
    setHighlights(newHighlights);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setCoverImage({
        uri: result.assets[0].uri,
        base64: result.assets[0].base64 || '',
      });
    }
  };

  const pickGalleryImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map((asset) => ({
        uri: asset.uri,
        base64: asset.base64 || '',
      }));
      setGalleryImages((prev) => [...prev, ...newImages]);
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreatePackage = async () => {
    if (!packageName || !duration || !price) {
      Alert.alert('Error', 'Please fill in all required fields (Name, Duration, Price).');
      return;
    }

    const durationNum = parseInt(duration, 10);
    const priceNum = parseFloat(price);

    if (isNaN(durationNum) || durationNum <= 0) {
      Alert.alert('Error', 'Duration must be a positive number.');
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Error', 'Price must be a positive number.');
      return;
    }

    try {
      setIsSubmitting(true);
      const accessToken = await SecureStore.getItemAsync('authToken');
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';

      if (!accessToken) {
        Alert.alert('Error', 'Not authenticated');
        return;
      }

      let coverImageUrl = '';

      if (coverImage?.base64) {
        const uploadRes = await fetch(`${apiUrl}/tour-guide/upload-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            base64: coverImage.base64,
            mimeType: 'image/jpeg',
          }),
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          coverImageUrl = uploadData.url; 
        } else {
          Alert.alert('Error', 'Failed to upload image. Please try again.');
          setIsSubmitting(false);
          return;
        }
      }

      // Upload gallery images
      const galleryUrls: string[] = [];
      if (galleryImages.length > 0) {
        for (const img of galleryImages) {
          if (img.base64) {
            const uploadRes = await fetch(`${apiUrl}/tour-guide/upload-image`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                base64: img.base64,
                mimeType: 'image/jpeg',
              }),
            });
            if (uploadRes.ok) {
              const uploadData = await uploadRes.json();
              galleryUrls.push(uploadData.url);
            }
          }
        }
      }

      // Prepare DTO
      const packageDto = {
        name: packageName,
        description: description || '',
        category,
        duration: parseInt(duration, 10),
        price: parseFloat(price),
        status: publishImmediately ? 'active' : 'draft',
        highlights: highlights.filter(h => h.trim() !== ''),
        coverImageUrl,
        galleryUrls,
      };

      const res = await fetch(`${apiUrl}/tour-guide/packages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(packageDto),
      });

      if (res.ok) {
        Alert.alert('Success', 'Package created successfully!');
        router.back();
      } else {
        const errorData = await res.json();
        Alert.alert('Error', errorData.message || 'Failed to create package');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Green Header Background */}
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
            <Text style={styles.headerTitle}>Create Package</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        <View style={styles.mainContent}>
          {/* Basic Details Section */}
          <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={24} color="#0E5E2F" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Basic Details</Text>
          </View>

          <Text style={styles.inputLabel}>Package Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 7-Day Cultural Triangle Heritage"
            placeholderTextColor="#A3A8A5"
            value={packageName}
            onChangeText={setPackageName}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.inputLabel}>Duration (Days)</Text>
              <TextInput
                style={styles.input}
                placeholder="7"
                placeholderTextColor="#A3A8A5"
                keyboardType="numeric"
                value={duration}
                onChangeText={(text) => setDuration(text.replace(/[^0-9]/g, ''))}
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.inputLabel}>Category</Text>
              <TouchableOpacity 
                style={styles.dropdownInput} 
                activeOpacity={0.7}
                onPress={() => setCategoryModalVisible(true)}
              >
                <Text style={styles.dropdownText}>{category}</Text>
                <Ionicons name="chevron-down" size={20} color="#60646C" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Category Selection Modal */}
        <Modal
          visible={isCategoryModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setCategoryModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity 
              style={{ flex: 1 }} 
              activeOpacity={1} 
              onPress={() => setCategoryModalVisible(false)}
            />
            <View style={styles.modalContent}>
              <View style={styles.modalHandleBar} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Category</Text>
                <TouchableOpacity 
                  onPress={() => setCategoryModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#60646C" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalListContainer}>
                {CATEGORIES.map((item, index) => {
                  const isSelected = category === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.categoryOption,
                        isSelected && styles.categoryOptionSelected,
                        index === CATEGORIES.length - 1 && { borderBottomWidth: 0 }
                      ]}
                      onPress={() => {
                        setCategory(item);
                        setCategoryModalVisible(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        isSelected && styles.categoryOptionTextSelected
                      ]}>
                        {item}
                      </Text>
                      {isSelected && (
                        <View style={styles.checkmarkContainer}>
                          <Ionicons name="checkmark-sharp" size={16} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>

        {/* Itinerary & Highlights Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="map-outline" size={24} color="#0E5E2F" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Itinerary & Highlights</Text>
          </View>

          <Text style={styles.inputLabel}>Package Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the soul of this journey..."
            placeholderTextColor="#A3A8A5"
            multiline
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.inputLabel}>Highlights</Text>
          {highlights.map((highlight, index) => (
            <View key={index} style={styles.highlightRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="e.g. Sunset climb of Sigiriya Rock"
                placeholderTextColor="#A3A8A5"
                value={highlight}
                onChangeText={(text) => updateHighlight(text, index)}
              />
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => removeHighlight(index)}
              >
                <Ionicons name="trash-outline" size={20} color="#DC3545" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addHighlightButton} onPress={addHighlight}>
            <Ionicons name="add" size={20} color="#6B7280" style={{ marginRight: 6 }} />
            <Text style={styles.addHighlightText}>Add Highlight</Text>
          </TouchableOpacity>
        </View>

        {/* Pricing & Availability Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash-outline" size={24} color="#0E5E2F" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Pricing & Availability</Text>
          </View>

          <Text style={styles.inputLabel}>Starting Price (LKR)</Text>
          <TextInput
            style={styles.input}
            placeholder="Rs. 250,000"
            placeholderTextColor="#A3A8A5"
            keyboardType="numeric"
            value={price}
            onChangeText={(text) => setPrice(text.replace(/[^0-9]/g, ''))}
          />

          <View style={styles.publishContainer}>
            <View style={{ flex: 1 }}>
              <Text style={styles.publishTitle}>Publish Immediately</Text>
              <Text style={styles.publishSubtitle}>{"Set as 'Active' on save"}</Text>
            </View>
            <Switch
              value={publishImmediately}
              onValueChange={setPublishImmediately}
              trackColor={{ false: '#E5E7EB', true: '#0E5E2F' }}
              thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
            />
          </View>
        </View>

        {/* Media Gallery Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="images-outline" size={24} color="#0E5E2F" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Media Gallery</Text>
          </View>

          <TouchableOpacity 
            style={[styles.uploadCoverContainer, coverImage && { padding: 0, borderWidth: 0, height: 200 }]} 
            activeOpacity={0.7}
            onPress={pickImage}
          >
            {coverImage ? (
              <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                <Image source={{ uri: coverImage.uri }} style={{ width: '100%', height: '100%', borderRadius: 16 }} contentFit="cover" />
                <View style={styles.editCoverBadge}>
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                  <Text style={styles.editCoverText}>Edit Cover</Text>
                </View>
              </View>
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={32} color="#60646C" style={{ marginBottom: 8 }} />
                <Text style={styles.uploadCoverTitle}>Add Cover Photo</Text>
                <Text style={styles.uploadCoverSubtitle}>Recommended size: 1920x1080px</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Gallery Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {galleryImages.map((img, index) => (
              <View key={index} style={styles.galleryImageContainer}>
                <Image source={{ uri: img.uri }} style={styles.galleryImage} contentFit="cover" />
                <TouchableOpacity
                  style={styles.removeImageBadge}
                  onPress={() => removeGalleryImage(index)}
                >
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addGalleryButton} onPress={pickGalleryImages}>
              <Ionicons name="add" size={28} color="#6B7280" />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Create Package Button */}
        <TouchableOpacity 
          style={[styles.createButton, isSubmitting && { opacity: 0.7 }]} 
          activeOpacity={0.8}
          onPress={handleCreatePackage}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#5B600A" style={{ marginRight: 8 }} />
          ) : (
            <Ionicons name="sparkles" size={20} color="#5B600A" style={{ marginRight: 8 }} />
          )}
          <Text style={styles.createButtonText}>Create Package</Text>
        </TouchableOpacity>
        
        <Text style={styles.footerNote}>
          By creating this package, it will be visible to potential travelers if set to active.
        </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    paddingTop: 0,
  },
  mainContent: {
    paddingHorizontal: 20,
    marginTop: -24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0E5E2F',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#49504B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FAFAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1C1917',
    marginBottom: 16,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
  },
  dropdownText: {
    fontSize: 15,
    color: '#1C1917',
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteButton: {
    width: 52,
    height: 52,
    backgroundColor: '#FFF5F5',
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  addHighlightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFB',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 14,
    height: 52,
    marginTop: 4,
  },
  addHighlightText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  publishContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  publishTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1917',
  },
  publishSubtitle: {
    fontSize: 12,
    color: '#60646C',
    marginTop: 2,
  },
  uploadCoverContainer: {
    borderWidth: 1.5,
    borderColor: '#D4DCD7',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#FAFAFA',
  },
  uploadCoverTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 4,
  },
  uploadCoverSubtitle: {
    fontSize: 13,
    color: '#A3A8A5',
  },
  galleryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addGalleryButton: {
    width: 86,
    height: 86,
    borderRadius: 14,
    backgroundColor: '#FAFAFB',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  galleryImageContainer: {
    width: 86,
    height: 86,
    borderRadius: 14,
    marginRight: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: '#FFFFFF',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  removeImageBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCoverBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editCoverText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F3F1',
    marginBottom: 16,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#5B600A',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 13,
    color: '#A3A8A5',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHandleBar: {
    width: 48,
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.5,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalListContainer: {
    marginBottom: 10,
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
    backgroundColor: '#F0FDF4',
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
    color: '#0E5E2F',
    fontWeight: '700',
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0E5E2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AddPackage;
