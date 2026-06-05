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
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const AddPackage = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [packageName, setPackageName] = useState('');
  const [duration, setDuration] = useState('');
  const [category, setCategory] = useState('Culture');
  const [description, setDescription] = useState('');
  const [highlights, setHighlights] = useState(['']);
  const [price, setPrice] = useState('');
  const [publishImmediately, setPublishImmediately] = useState(true);

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

  const handleNotificationPress = () => {
    // Add logic later
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.headerIconButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back-outline" size={28} color="#1C1917" />
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/Roam Ceylon Logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerIconButton, { marginRight: 8 }]}
            activeOpacity={0.7}
            onPress={handleNotificationPress}
          >
            <Ionicons name="notifications-outline" size={24} color="#1C1917" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileButton}
            activeOpacity={0.7}
            onPress={() => router.push('/tour-guide/settings' as any)}
          >
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
              }}
              style={styles.profileImage}
              contentFit="cover"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.mainTitle}>Create Package</Text>

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
                onChangeText={setDuration}
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.inputLabel}>Category</Text>
              <TouchableOpacity style={styles.dropdownInput} activeOpacity={0.7}>
                <Text style={styles.dropdownText}>{category}</Text>
                <Ionicons name="chevron-down" size={20} color="#60646C" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

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
            <Ionicons name="add-circle-outline" size={20} color="#0E5E2F" style={{ marginRight: 6 }} />
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
            onChangeText={setPrice}
          />

          <View style={styles.publishContainer}>
            <View style={{ flex: 1 }}>
              <Text style={styles.publishTitle}>Publish Immediately</Text>
              <Text style={styles.publishSubtitle}>Set as 'Active' on save</Text>
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

          <TouchableOpacity style={styles.uploadCoverContainer} activeOpacity={0.7}>
            <Ionicons name="cloud-upload-outline" size={32} color="#60646C" style={{ marginBottom: 8 }} />
            <Text style={styles.uploadCoverTitle}>Add Cover Photo</Text>
            <Text style={styles.uploadCoverSubtitle}>Recommended size: 1920x1080px</Text>
          </TouchableOpacity>

          <Text style={styles.inputLabel}>Gallery Photos</Text>
          <View style={styles.galleryRow}>
            <TouchableOpacity style={styles.addGalleryButton} activeOpacity={0.7}>
              <Ionicons name="add" size={28} color="#60646C" />
            </TouchableOpacity>

            <View style={styles.galleryImageContainer}>
              <Image
                source={require('../../assets/Tours/HillCountryEscape.png')}
                style={styles.galleryImage}
                contentFit="cover"
              />
              <TouchableOpacity style={styles.removeImageBadge}>
                <Ionicons name="close" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.galleryImageContainer}>
              <Image
                source={require('../../assets/Tours/Sothern Shore.png')}
                style={styles.galleryImage}
                contentFit="cover"
              />
              <TouchableOpacity style={styles.removeImageBadge}>
                <Ionicons name="close" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Create Package Button */}
        <TouchableOpacity style={styles.createButton} activeOpacity={0.8}>
          <Ionicons name="sparkles" size={20} color="#5B600A" style={{ marginRight: 8 }} />
          <Text style={styles.createButtonText}>Create Package</Text>
        </TouchableOpacity>
        
        <Text style={styles.footerNote}>
          By creating this package, it will be visible to potential travelers if set to active.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F1',
    zIndex: 10,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logo: {
    width: 140,
    height: 32,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 20,
    letterSpacing: -0.5,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4DCD7',
    borderRadius: 12,
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
    backgroundColor: '#F8FAF8',
    borderWidth: 1,
    borderColor: '#D4DCD7',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
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
    padding: 10,
    marginLeft: 8,
  },
  addHighlightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  addHighlightText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E5E2F',
  },
  publishContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8EFFF', // Light blueish background as per mockup
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
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#E8EFFF',
    borderWidth: 1,
    borderColor: '#D4DCD7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  galleryImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeImageBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#DC3545',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
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
    fontSize: 12,
    color: '#60646C',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default AddPackage;
