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
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const UpdateActivity = () => {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('Sunrise Yoga & Meditation');
  const [description, setDescription] = useState(
    'Begin your day with tranquility as the sun rises over the historic ramparts of Galle Fort. This session combines gentle Hatha yoga flows with guided mindfulness meditation, designed to rejuvenate...'
  );
  const [startTime, setStartTime] = useState('06:00 AM');
  const [capacity, setCapacity] = useState('20');
  const [meetingPoint, setMeetingPoint] = useState('Galle Fort Deck');
  const [price, setPrice] = useState('$ 35.00');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={26} color="#0E5E2F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Activity</Text>
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
        {/* Cover Hero Photo */}
        <View style={styles.heroImageContainer}>
          <Image
            source={require('../../assets/Activities/Sunrise Yoga.png')}
            style={styles.heroImage}
            contentFit="cover"
          />
          <TouchableOpacity style={styles.editPhotoOverlay} activeOpacity={0.8}>
            <Feather name="edit-2" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.editPhotoText}>Edit Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Card 1: Activity Basics */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconBadge}>
              <Feather name="file-text" size={18} color="#0E5E2F" />
            </View>
            <Text style={styles.cardTitle}>Activity Basics</Text>
          </View>

          {/* Activity Title Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Activity Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Activity Title"
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
              placeholder="Describe the activity..."
              placeholderTextColor="#9CA3AF"
              style={[styles.textInput, styles.multilineInput]}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Card 2: Schedule & Logistics */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconBadge}>
              <Feather name="clock" size={18} color="#0E5E2F" />
            </View>
            <Text style={styles.cardTitle}>Schedule & Logistics</Text>
          </View>

          {/* Start Time Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Start Time</Text>
            <TextInput
              value={startTime}
              onChangeText={setStartTime}
              placeholder="e.g. 06:00 AM"
              placeholderTextColor="#9CA3AF"
              style={styles.textInput}
            />
          </View>

          {/* Duration Dropdown */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Duration</Text>
            <TouchableOpacity style={styles.dropdownBox} activeOpacity={0.7}>
              <Text style={styles.dropdownText}>1.5 Hours</Text>
              <Ionicons name="chevron-down" size={16} color="#60646C" />
            </TouchableOpacity>
          </View>

          {/* Max Capacity Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Max Capacity</Text>
            <TextInput
              value={capacity}
              onChangeText={setCapacity}
              placeholder="e.g. 20"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              style={styles.textInput}
            />
          </View>
        </View>

        {/* Card 3: Location */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconBadge}>
              <Ionicons name="location-outline" size={18} color="#0E5E2F" />
            </View>
            <Text style={styles.cardTitle}>Location</Text>
          </View>

          {/* Meeting Point Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Meeting Point</Text>
            <TextInput
              value={meetingPoint}
              onChangeText={setMeetingPoint}
              placeholder="Meeting point location"
              placeholderTextColor="#9CA3AF"
              style={styles.textInput}
            />
          </View>

          {/* Map Preview Grid */}
          <View style={styles.mapContainer}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=400&q=80',
              }}
              style={styles.mapImage}
              contentFit="cover"
            />
          </View>
        </View>

        {/* Card 4: Pricing */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconBadge}>
              <MaterialCommunityIcons name="cash-multiple" size={18} color="#0E5E2F" />
            </View>
            <Text style={styles.cardTitle}>Pricing</Text>
          </View>

          {/* Price Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Price per Guest</Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              placeholder="$ 0.00"
              placeholderTextColor="#9CA3AF"
              style={styles.textInput}
            />
            <Text style={styles.pricingHelperText}>
              Suggested price based on similar local activities.
            </Text>
          </View>
        </View>

        {/* Update Activity Action Button */}
        <TouchableOpacity style={styles.updateButton} activeOpacity={0.85}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#493D1B" style={{ marginRight: 6 }} />
          <Text style={styles.updateButtonText}>Update Activity</Text>
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
    color: '#0E5E2F',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  heroImageContainer: {
    width: '100%',
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#EAEAEA',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  editPhotoOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  editPhotoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E2EFE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C1917',
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
  mapContainer: {
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    marginTop: 6,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  pricingHelperText: {
    fontSize: 12,
    color: '#60646C',
    marginTop: 6,
    fontWeight: '500',
  },
  updateButton: {
    backgroundColor: '#EAD26B',
    borderRadius: 16,
    height: 54,
    flexDirection: 'row',
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
  updateButtonText: {
    color: '#493D1B',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default UpdateActivity;
