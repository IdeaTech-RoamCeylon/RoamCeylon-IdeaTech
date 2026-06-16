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
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const NewActivity = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'moderate' | 'hard'>('easy');
  const [startTime, _setStartTime] = useState('09:00 AM');
  const [endTime, _setEndTime] = useState('10:00 AM');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [participants, setParticipants] = useState('');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.7}
          onPress={() => router.replace('/activities/home' as any)}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="arrow-back-outline" size={26} color="#1C1917" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Activity</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Activity Essentials Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Activity Essentials</Text>
          <Text style={styles.cardSubtitle}>Define the core experience for your travelers.</Text>

          {/* Activity Title Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Activity Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Sunrise Yoga by the Coast"
              placeholderTextColor="#9CA3AF"
              style={styles.textInput}
            />
          </View>

          {/* Description Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the atmosphere, key highlights, and what travelers can expect..."
              placeholderTextColor="#9CA3AF"
              style={[styles.textInput, styles.multilineInput]}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Logistics & Requirements Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Schedule and Details</Text>

          {/* Difficulty Level Segment Selector */}
          <View style={styles.inputContainer}>
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

          {/* Start & End Time Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputLabel}>Start Time</Text>
              <TouchableOpacity style={styles.dropdownBox} activeOpacity={0.7}>
                <Ionicons name="time-outline" size={18} color="#0E5E2F" style={{ marginRight: 8 }} />
                <Text style={styles.dropdownText}>{startTime}</Text>
                <Ionicons name="chevron-down" size={16} color="#60646C" />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.inputLabel}>End Time</Text>
              <TouchableOpacity style={styles.dropdownBox} activeOpacity={0.7}>
                <Ionicons name="time-outline" size={18} color="#0E5E2F" style={{ marginRight: 8 }} />
                <Text style={styles.dropdownText}>{endTime}</Text>
                <Ionicons name="chevron-down" size={16} color="#60646C" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Location Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Location</Text>
            <View style={styles.iconInputBox}>
              <Ionicons name="location-outline" size={18} color="#0E5E2F" style={{ marginRight: 8 }} />
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="e.g., Galle Fort Deck"
                placeholderTextColor="#9CA3AF"
                style={styles.iconTextInput}
              />
            </View>
          </View>

          {/* Price Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Price (LKR)</Text>
            <View style={styles.iconInputBox}>
              <Ionicons name="cash-outline" size={18} color="#0E5E2F" style={{ marginRight: 8 }} />
              <TextInput
                value={price}
                onChangeText={setPrice}
                placeholder="e.g., 5000"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                style={styles.iconTextInput}
              />
            </View>
          </View>

          {/* Max Participants Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Max Participants</Text>
            <View style={styles.iconInputBox}>
              <Ionicons name="people-outline" size={18} color="#0E5E2F" style={{ marginRight: 8 }} />
              <TextInput
                value={participants}
                onChangeText={setParticipants}
                placeholder="Max participants count"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                style={styles.iconTextInput}
              />
            </View>
          </View>
        </View>

        {/* Media Gallery Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Media Gallery</Text>

          {/* Dashed Upload Dropzone Area */}
          <TouchableOpacity style={styles.uploadBox} activeOpacity={0.7}>
            <View style={styles.cloudIconBg}>
              <Ionicons name="cloud-upload-outline" size={22} color="#0E5E2F" />
            </View>
            <Text style={styles.uploadMainText}>Tap to upload or drag media here</Text>
            <Text style={styles.uploadSubText}>JPG, PNG, or MP4 (Max 20MB)</Text>
          </TouchableOpacity>

          {/* Image Previews Row */}
          <View style={styles.previewRow}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=150&q=80',
              }}
              style={styles.previewImage}
              contentFit="cover"
            />
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=150&q=80',
              }}
              style={styles.previewImage}
              contentFit="cover"
            />
            {/* Dashed add button block */}
            <TouchableOpacity style={styles.dashedAddButton} activeOpacity={0.6}>
              <AntDesign name="plus" size={18} color="#60646C" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Create Activity Action Button */}
        <TouchableOpacity style={styles.createButton} activeOpacity={0.85}>
          <Text style={styles.createButtonText}>Create Activity</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F1',
    zIndex: 10,
  },
  iconButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.3,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#5B600A',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C1917',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#60646C',
    marginTop: 4,
    marginBottom: 16,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#60646C',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#1C1917',
    fontWeight: '500',
    backgroundColor: '#FFFFFF',
  },
  multilineInput: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 4,
    height: 48,
  },
  segmentButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    color: '#60646C',
    fontWeight: '700',
  },
  segmentActiveText: {
    color: '#5B600A',
    fontWeight: '800',
  },
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  dropdownText: {
    fontSize: 14,
    color: '#1C1917',
    fontWeight: '500',
    flex: 1,
  },
  iconInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  iconTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#1C1917',
    fontWeight: '500',
    height: '100%',
  },
  uploadBox: {
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: '#A3A8A5',
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    backgroundColor: '#FAFBFB',
    marginBottom: 16,
  },
  cloudIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#D7EDE0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadMainText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1917',
    marginTop: 12,
  },
  uploadSubText: {
    fontSize: 11,
    color: '#60646C',
    marginTop: 4,
    fontWeight: '500',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: '#EAEAEA',
  },
  dashedAddButton: {
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: '#C2C8C4',
    borderRadius: 12,
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFBFB',
  },
  createButton: {
    backgroundColor: '#EAD26B',
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
    shadowColor: '#EAD26B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  createButtonText: {
    color: '#493D1B',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default NewActivity;
