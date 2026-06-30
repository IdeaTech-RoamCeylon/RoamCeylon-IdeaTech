import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import DateTimePicker from '@react-native-community/datetimepicker';
import { showToast } from '@/utils/toast';

const CATEGORIES = [
  'Adventure',
  'Cultural',
  'Nature & Wildlife',
  'Water Sports',
  'Wellness & Spa',
  'City Tour',
  'Other',
];

const NewActivity = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Adventure');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'moderate' | 'hard'>('easy');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('10:00 AM');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [participants, setParticipants] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [coverImage, setCoverImage] = useState<{ uri: string, base64: string } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  
  const [isTimeModalVisible, setTimeModalVisible] = useState(false);
  const [timeSelectorMode, setTimeSelectorMode] = useState<'start' | 'end'>('start');

  const TIMES = Array.from({ length: 48 }, (_, i) => {
    const hours = Math.floor(i / 2);
    const minutes = i % 2 === 0 ? '00' : '30';
    const ampm = hours < 12 ? 'AM' : 'PM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedHours = displayHours < 10 ? `0${displayHours}` : displayHours;
    return `${formattedHours}:${minutes} ${ampm}`;
  });

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        let base64 = result.assets[0].base64;
        if (!base64) {
          base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: 'base64' });
        }
        setCoverImage({
          uri: result.assets[0].uri,
          base64: base64 || '',
        });
      }
    } catch (e) {
      showToast.error('Failed to process image');
      console.error(e);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showToast.error('Please enter an activity title', 'Missing Title');
      return;
    }

    setIsSubmitting(true);
    try {
      const accessToken = await SecureStore.getItemAsync('authToken');
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';

      if (!accessToken) {
        showToast.error('Please log in again', 'Not Authenticated');
        return;
      }

      // Upload cover image if selected
      let uploadedImageUrl = '';
      if (coverImage?.base64) {
        try {
          const uploadRes = await fetch(`${apiUrl}/activities/upload-image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ base64: coverImage.base64, mimeType: 'image/jpeg' }),
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            uploadedImageUrl = uploadData.url || '';
          } else {
            showToast.error('Failed to upload image to server');
            setIsSubmitting(false);
            return;
          }
        } catch (uploadErr) {
          console.error('Image upload failed (network):', uploadErr);
          showToast.error('Network error during image upload');
          setIsSubmitting(false);
          return;
        }
      }

      // Create activity
      const res = await fetch(`${apiUrl}/activities/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: title.trim(),
          category,
          description: description.trim(),
          difficulty,
          date: date.toISOString(),
          startTime,
          endTime,
          location: location.trim(),
          price: price ? Number(price) : 0,
          maxParticipants: participants ? Number(participants) : 20,
          coverImageUrl: uploadedImageUrl,
          publishImmediately: true,
        }),
      });

      if (res.ok) {
        showToast.success('Activity created successfully!', 'Success');
        router.back();
      } else {
        const errorData = await res.text().catch(() => 'Unknown error');
        console.error('Create activity failed:', res.status, errorData);
        showToast.error('Failed to create activity. Please try again.', 'Error');
      }
    } catch (error) {
      console.error('Create activity error:', error);
      showToast.error('Network error. Please check your connection.', 'Error');
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
              <Text style={styles.headerTitle}>Create Activity</Text>
              
              <View style={{ width: 44 }} />
            </View>
          </LinearGradient>

          <View style={styles.formContainer}>
            {/* Basic Info Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="info" size={22} color="#0E5E2F" />
                <Text style={styles.cardTitle}>Activity Essentials</Text>
              </View>
              <View style={styles.cardDivider} />

              <Text style={styles.inputLabel}>Cover Photo</Text>
              <TouchableOpacity style={styles.imagePickerCard} onPress={pickImage} activeOpacity={0.8}>
                {coverImage ? (
                  <Image source={{ uri: coverImage.uri }} style={styles.previewImage} contentFit="cover" />
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
                <Text style={styles.inputLabel}>Activity Title</Text>
                <TextInput
                  style={styles.textInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Sunrise Yoga by the Coast"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Activity Category</Text>
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
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe the atmosphere and key highlights..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Logistics & Requirements Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="clock" size={22} color="#0E5E2F" />
                <Text style={styles.cardTitle}>Schedule and Details</Text>
              </View>
              <View style={styles.cardDivider} />

              {/* Difficulty Level Segment Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Difficulty Level</Text>
                <View style={styles.segmentContainer}>
                  <TouchableOpacity
                    style={[styles.segmentButton, difficulty === 'easy' && styles.segmentActive]}
                    onPress={() => setDifficulty('easy')}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={[styles.segmentText, difficulty === 'easy' && styles.segmentActiveText]}
                    >
                      Easy
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.segmentButton, difficulty === 'moderate' && styles.segmentActive]}
                    onPress={() => setDifficulty('moderate')}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={[styles.segmentText, difficulty === 'moderate' && styles.segmentActiveText]}
                    >
                      Moderate
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.segmentButton, difficulty === 'hard' && styles.segmentActive]}
                    onPress={() => setDifficulty('hard')}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={[styles.segmentText, difficulty === 'hard' && styles.segmentActiveText]}
                    >
                      Hard
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Scheduled Date</Text>
                <TouchableOpacity 
                  style={styles.iconInputBox}
                  activeOpacity={0.8}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Feather name="calendar" size={20} color="#60646C" style={{ marginRight: 8 }} />
                  <Text style={[styles.iconTextInput, { paddingTop: 18 }]}>
                    {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (selectedDate) setDate(selectedDate);
                    }}
                  />
                )}
              </View>

              {/* Start & End Time Row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Start Time</Text>
                  <TouchableOpacity 
                    style={styles.iconInputBox}
                    activeOpacity={0.7}
                    onPress={() => { setTimeSelectorMode('start'); setTimeModalVisible(true); }}
                  >
                    <Feather name="clock" size={18} color="#60646C" style={{ marginRight: 8 }} />
                    <Text style={[styles.iconTextInput, { paddingTop: 18 }]}>{startTime}</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>End Time</Text>
                  <TouchableOpacity 
                    style={styles.iconInputBox}
                    activeOpacity={0.7}
                    onPress={() => { setTimeSelectorMode('end'); setTimeModalVisible(true); }}
                  >
                    <Feather name="clock" size={18} color="#60646C" style={{ marginRight: 8 }} />
                    <Text style={[styles.iconTextInput, { paddingTop: 18 }]}>{endTime}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Time Selection Modal */}
              <Modal
                visible={isTimeModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setTimeModalVisible(false)}
              >
                <TouchableWithoutFeedback onPress={() => setTimeModalVisible(false)}>
                  <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback>
                      <View style={[styles.modalContent, { height: '50%' }]}>
                        <Text style={styles.modalTitle}>
                          Select {timeSelectorMode === 'start' ? 'Start Time' : 'End Time'}
                        </Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                          {TIMES.filter(t => {
                            if (timeSelectorMode === 'end') {
                              const startIndex = TIMES.indexOf(startTime);
                              return TIMES.indexOf(t) > startIndex;
                            }
                            return true;
                          }).map((t) => {
                            const isSelected = (timeSelectorMode === 'start' ? startTime : endTime) === t;
                            return (
                              <TouchableOpacity
                                key={t}
                                style={[
                                  styles.categoryOption,
                                  isSelected && styles.categoryOptionSelected
                                ]}
                                onPress={() => {
                                  if (timeSelectorMode === 'start') {
                                    setStartTime(t);
                                    // Auto-adjust end time if it is now before or equal to the new start time
                                    const newStartIndex = TIMES.indexOf(t);
                                    const currentEndIndex = TIMES.indexOf(endTime);
                                    if (currentEndIndex <= newStartIndex) {
                                      setEndTime(TIMES[Math.min(newStartIndex + 1, TIMES.length - 1)]);
                                    }
                                  } else {
                                    setEndTime(t);
                                  }
                                  setTimeModalVisible(false);
                                }}
                              >
                                <Text style={[
                                  styles.categoryOptionText,
                                  isSelected && styles.categoryOptionTextSelected
                                ]}>
                                  {t}
                                </Text>
                                {isSelected && (
                                  <Feather name="check" size={20} color="#0E5E2F" />
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    </TouchableWithoutFeedback>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Location</Text>
                <View style={styles.iconInputBox}>
                  <Ionicons name="location-outline" size={20} color="#60646C" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.iconTextInput}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="e.g. Galle Fort Deck"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Price (LKR)</Text>
                <View style={styles.iconInputBox}>
                  <Ionicons name="cash-outline" size={20} color="#60646C" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.iconTextInput}
                    value={price}
                    onChangeText={(t) => setPrice(t.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 5000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Max Participants</Text>
                <View style={styles.iconInputBox}>
                  <Ionicons name="people-outline" size={20} color="#60646C" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.iconTextInput}
                    value={participants}
                    onChangeText={setParticipants}
                    placeholder="e.g. 15"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
              </View>
              
              <View style={{ marginTop: 24, marginBottom: 10 }}>
                <TouchableOpacity 
                  style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]} 
                  activeOpacity={0.8} 
                  onPress={handleSave}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Create Activity</Text>
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
  iconInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0,
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
  },
  iconTextInput: {
    flex: 1,
    fontSize: 15,
    color: '#1C1917',
    height: '100%',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 4,
    height: 56,
  },
  segmentButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  segmentActiveText: {
    color: '#0E5E2F',
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

export default NewActivity;
