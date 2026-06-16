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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const AddRoom = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [adultsCount, setAdultsCount] = useState(2);

  const amenities = [
    { id: '1', name: 'King Bed', icon: 'bed-outline', selected: true },
    { id: '2', name: 'Free Wi-Fi', icon: 'wifi', selected: true },
    { id: '3', name: 'AC', icon: 'snow', selected: true },
    { id: '4', name: 'Minibar', icon: 'wine-outline', selected: false },
    { id: '5', name: 'Balcony', icon: 'business-outline', selected: false },
    { id: '6', name: 'Smart TV', icon: 'tv-outline', selected: false },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#5B4A1E" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Add New Room</Text>

        <TouchableOpacity style={styles.avatarButton} activeOpacity={0.7}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' }}
            style={styles.headerAvatar}
            contentFit="cover"
          />
        </TouchableOpacity>
      </View>

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
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Room Type</Text>
            <TouchableOpacity style={styles.dropdownWrapper} activeOpacity={0.7}>
              <Text style={styles.dropdownText}>Deluxe Room</Text>
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
            {amenities.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.amenityCard,
                  item.selected ? styles.amenityCardSelected : styles.amenityCardUnselected,
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={item.selected ? '#0D4F2E' : '#0D4F2E'}
                />
                <Text
                  style={[
                    styles.amenityText,
                    item.selected ? styles.amenityTextSelected : styles.amenityTextUnselected,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Media Gallery */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="images-outline" size={22} color="#001F3F" />
            <Text style={styles.cardTitle}>Media Gallery</Text>
          </View>

          <TouchableOpacity style={styles.addPhotosDashedArea} activeOpacity={0.6}>
            <Ionicons name="camera-outline" size={36} color="#64748B" style={{ marginBottom: 8 }} />
            <Text style={styles.addPhotosText}>Add Room Photos</Text>
          </TouchableOpacity>

          <View style={styles.mediaGrid}>
            <View style={styles.uploadedPhotoContainer}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&auto=format&fit=crop&q=80' }}
                style={styles.uploadedPhoto}
                contentFit="cover"
              />
              <TouchableOpacity style={styles.removePhotoBadge}>
                <Ionicons name="close" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.uploadedPhotoContainer}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&auto=format&fit=crop&q=80' }}
                style={styles.uploadedPhoto}
                contentFit="cover"
              />
              <TouchableOpacity style={styles.removePhotoBadge}>
                <Ionicons name="close" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.uploadNewButton} activeOpacity={0.7}>
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

      {/* Bottom Actions Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={styles.cancelButton} activeOpacity={0.7}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.addButton} activeOpacity={0.7}>
          <Ionicons name="checkmark-circle" size={20} color="#5B4A1E" />
          <Text style={styles.addButtonText}>Add Room</Text>
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
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  uploadedPhotoContainer: {
    flex: 1,
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
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B5E05',
    marginLeft: 8,
  },
});

export default AddRoom;
