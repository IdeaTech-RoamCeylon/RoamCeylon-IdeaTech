import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';


const CATEGORIES = [
  'Artisan Goods',
  'Clothing & Apparel',
  'Jewelry & Accessories',
  'Food & Beverages',
  'Souvenirs & Gifts',
  'Health & Wellness',
  'Other',
];

const AddShop = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [shopName, setShopName] = useState('');
  const [category, setCategory] = useState('Artisan Goods');
  const [description, setDescription] = useState('');
  const [hoursEnabled, setHoursEnabled] = useState(true);
  const [hoursList, setHoursList] = useState([
    { day: 'Monday', hours: '9 AM - 6 PM' },
    { day: 'Tuesday', hours: '9 AM - 6 PM' },
    { day: 'Wednesday', hours: '9 AM - 6 PM' },
    { day: 'Thursday', hours: '9 AM - 6 PM' },
    { day: 'Friday', hours: '9 AM - 6 PM' },
    { day: 'Saturday', hours: '9 AM - 6 PM' },
    { day: 'Sunday', hours: 'Closed' }
  ]);
  const [coverImageUrl, setCoverImageUrl] = useState('');

  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [location, setLocation] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setCoverImageUrl(result.assets[0].uri);
    }
  };

  const updateHour = (index: number, newHours: string) => {
    const updatedList = [...hoursList];
    updatedList[index].hours = newHours;
    setHoursList(updatedList);
  };

  const handleSave = async () => {
    if (!shopName.trim() || !category.trim()) {
      Alert.alert('Missing Fields', 'Please enter a shop name and category.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const accessToken = await SecureStore.getItemAsync('authToken');
      if (!accessToken) {
        Alert.alert('Authentication Error', 'You must be logged in to add a shop.');
        setIsSubmitting(false);
        return;
      }

      let finalCoverImageUrl = coverImageUrl;

      if (coverImageUrl && !coverImageUrl.startsWith('http')) {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';

        // Convert local file URI to base64 and send to our backend.
        // The backend uploads to Nhost Storage using the admin secret,
        // bypassing the frontend storage permission issues.
        const fileRes = await fetch(coverImageUrl);
        const blob = await fileRes.blob();
        const base64: string = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); // strip data:image/jpeg;base64, prefix
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        const uploadRes = await fetch(`${apiUrl}/shops/upload-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ base64, mimeType: 'image/jpeg' }),
        });

        if (!uploadRes.ok) {
          const errText = await uploadRes.text();
          throw new Error(`Image upload failed: ${errText}`);
        }

        const { url } = await uploadRes.json();
        finalCoverImageUrl = url;
      }


      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';
      const response = await fetch(`${apiUrl}/shops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: shopName,
          category,
          description,
          hoursEnabled,
          hoursText: JSON.stringify(hoursList),
          coverImageUrl: finalCoverImageUrl,
          website,
          instagram,
          facebook,
          tiktok,
          location,
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

      // Automatically go back to the home screen after success
      router.back();
    } catch (error: any) {
      console.error('[AddShop] Failed to create shop:', error);
      Alert.alert('Error', 'Could not create shop. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          bounces={true}
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
              <Text style={styles.headerTitle}>Create Shop</Text>
              
              <View style={{ width: 40 }} />
            </View>
          </LinearGradient>
          <View style={styles.formContainer}>
            {/* Basic Info Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="info" size={22} color="#0E5E2F" />
                <Text style={styles.cardTitle}>Basic Details</Text>
              </View>
              <View style={styles.cardDivider} />
              <Text style={styles.inputLabel}>Cover Photo</Text>
              <TouchableOpacity style={styles.imagePickerCard} onPress={pickImage} activeOpacity={0.8}>
                {coverImageUrl ? (
                  <Image source={{ uri: coverImageUrl }} style={styles.previewImage} contentFit="cover" />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <View style={styles.cameraIconContainer}>
                      <Feather name="camera" size={24} color="#0E5E2F" />
                    </View>
                    <Text style={styles.imagePlaceholderText}>Tap to upload a high-quality cover photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Shop Name</Text>
            <TextInput
              style={styles.textInput}
              value={shopName}
              onChangeText={setShopName}
              placeholder="e.g. Ceylon Spices & Tea"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Business Category</Text>
            <TouchableOpacity 
              style={styles.dropdownInput} 
              activeOpacity={0.7}
              onPress={() => setCategoryModalVisible(true)}
            >
              <Text style={styles.dropdownText}>{category}</Text>
              <Feather name="chevron-down" size={20} color="#60646C" />
            </TouchableOpacity>
          </View>

          {/* Category Selection Modal */}
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
                          category === item && styles.categoryOptionSelected
                        ]}
                        onPress={() => {
                          setCategory(item);
                          setCategoryModalVisible(false);
                        }}
                      >
                        <Text style={[
                          styles.categoryOptionText,
                          category === item && styles.categoryOptionTextSelected
                        ]}>
                          {item}
                        </Text>
                        {category === item && (
                          <Feather name="check" size={20} color="#0E5E2F" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Short Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your shop"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={styles.textInput}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Colombo, Sri Lanka"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.switchCardContainer}>
            <View style={styles.switchCard}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchTitle}>Business Hours</Text>
                <Text style={styles.switchSubtitle}>Display opening hours on your shop page</Text>
              </View>
              <Switch
                value={hoursEnabled}
                onValueChange={setHoursEnabled}
                trackColor={{ false: '#E5E7EB', true: '#0E5E2F' }}
                thumbColor="#FFFFFF"
              />
            </View>
            
            {hoursEnabled && (
              <View style={styles.hoursInputContainer}>
                {hoursList.map((item, index) => (
                  <View key={item.day} style={styles.dayRow}>
                    <Text style={styles.dayText}>{item.day}</Text>
                    <TextInput
                      style={styles.dayInput}
                      value={item.hours}
                      onChangeText={(text) => updateHour(index, text)}
                      placeholder="e.g. 9 AM - 6 PM or Closed"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* External Integrations Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="link-2" size={22} color="#0E5E2F" />
            <Text style={styles.cardTitle}>External Integrations</Text>
          </View>
          <View style={styles.cardDivider} />

          <Text style={styles.integrationDesc}>
            Connect your digital presence to direct{'\n'}travelers to your booking or content{'\n'}platforms.
          </Text>

          {/* Website Input */}
          <View style={styles.integrationInputContainer}>
            <View style={styles.integrationPrefix}>
              <Feather name="globe" size={18} color="#4A4A4A" />
              <Text style={styles.prefixText}>https://</Text>
            </View>
            <TextInput
              style={styles.integrationInput}
              value={website}
              onChangeText={setWebsite}
              placeholder="yourwebsite.com"
              placeholderTextColor="#D1D5DB"
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          {/* Instagram Input */}
          <View style={styles.integrationInputContainer}>
            <View style={styles.integrationPrefix}>
              <Feather name="instagram" size={18} color="#4A4A4A" />
              <Text style={styles.prefixText}>instagram.com/</Text>
            </View>
            <TextInput
              style={styles.integrationInput}
              value={instagram}
              onChangeText={setInstagram}
              placeholder="username"
              placeholderTextColor="#D1D5DB"
              autoCapitalize="none"
            />
          </View>

          {/* Facebook Input */}
          <View style={styles.integrationInputContainer}>
            <View style={styles.integrationPrefix}>
              <Feather name="facebook" size={18} color="#4A4A4A" />
              <Text style={styles.prefixText}>facebook.com/</Text>
            </View>
            <TextInput
              style={styles.integrationInput}
              value={facebook}
              onChangeText={setFacebook}
              placeholder="page"
              placeholderTextColor="#D1D5DB"
              autoCapitalize="none"
            />
          </View>

          {/* TikTok Input */}
          <View style={styles.integrationInputContainer}>
            <View style={styles.integrationPrefix}>
              <MaterialCommunityIcons name="play-circle-outline" size={20} color="#4A4A4A" />
              <Text style={styles.prefixText}>tiktok.com/@</Text>
            </View>
            <TextInput
              style={styles.integrationInput}
              value={tiktok}
              onChangeText={setTiktok}
              placeholder="username"
              placeholderTextColor="#E5E7EB"
              autoCapitalize="none"
            />
          </View>
            <View style={{ marginTop: 24, marginBottom: 40 }}>
              <TouchableOpacity 
                style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]} 
                activeOpacity={0.8} 
                onPress={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Create Shop</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerSaveButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#0E5E2F',
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  formContainer: {
    paddingHorizontal: 20,
    marginTop: -24,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 24,
    fontWeight: '500',
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
  imagePickerCard: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 24,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cameraIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  imagePlaceholderText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
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
  textArea: {
    height: 100,
    paddingTop: 16,
    paddingBottom: 16,
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
  switchCardContainer: {
    marginBottom: 8,
  },
  hoursInputContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayText: {
    width: 100,
    fontSize: 15,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  dayInput: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1C1917',
    backgroundColor: '#F3F4F6',
  },
  switchCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: 16,
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 4,
  },
  switchSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  integrationDesc: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 20,
  },
  integrationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0,
    borderRadius: 16,
    height: 56,
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  integrationPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 4,
  },
  prefixText: {
    fontSize: 15,
    color: '#6B7280',
    marginLeft: 10,
    fontWeight: '500',
  },
  integrationInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#1C1917',
    paddingRight: 20,
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
    color: '#059669',
    fontWeight: '700',
  },
});

export default AddShop;
