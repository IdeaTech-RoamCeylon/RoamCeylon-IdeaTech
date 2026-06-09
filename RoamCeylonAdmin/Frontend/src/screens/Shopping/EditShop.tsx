import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  StatusBar,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';

import { nhost } from '../../config/nhostClient';

const EditShop = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [shopName, setShopName] = useState('');
  const [category, setCategory] = useState('');
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
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewVisible, setPreviewVisible] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      if (result.assets[0].base64) {
        setCoverImageUrl(`data:image/jpeg;base64,${result.assets[0].base64}`);
      } else {
        setCoverImageUrl(result.assets[0].uri);
      }
    }
  };

  useEffect(() => {
    if (!id) return;

    const fetchShop = async () => {
      try {
        const accessToken = await SecureStore.getItemAsync('authToken');
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';
        
        const response = await fetch(`${apiUrl}/shops/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        
        if (response.ok) {
          const shop = await response.json();
          setShopName(shop.name || '');
          setCategory(shop.category || '');
          setDescription(shop.description || '');
          setHoursEnabled(shop.hoursEnabled !== false);
          
          if (shop.hoursText) {
            try {
              const parsed = JSON.parse(shop.hoursText);
              if (Array.isArray(parsed)) {
                setHoursList(parsed);
              }
            } catch (e) {
              // Ignore parse error, keep default
            }
          }
          
          setCoverImageUrl(shop.coverImageUrl || '');
          setWebsite(shop.website || '');
          setInstagram(shop.instagram || '');
          setFacebook(shop.facebook || '');
          setTiktok(shop.tiktok || '');
        }
      } catch (error) {
        console.error('Failed to fetch shop details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
  }, [id]);

  const handleSave = async () => {
    if (!id || !shopName.trim() || !category.trim()) return;
    
    setIsSubmitting(true);
    try {
      const accessToken = await SecureStore.getItemAsync('authToken');
      
      let finalCoverImageUrl = coverImageUrl;
      // Image is already base64 string, so we just pass it to the backend as is!

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';
      
      const response = await fetch(`${apiUrl}/shops/${id}`, {
        method: 'PUT',
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
        }),
      });

      if (response.ok) {
        router.back();
      }
    } catch (error) {
      console.error('Failed to update shop:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#0E5E2F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#0E5E2F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Shop</Text>
        <TouchableOpacity style={styles.profileImageContainer} activeOpacity={0.7} onPress={() => router.push('/shopping/settings' as any)}>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }}
            style={styles.profileImage}
            contentFit="cover"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Partner Settings</Text>
        <Text style={styles.pageSubtitle}>Manage your shop profile and digital{'\n'}presence.</Text>

        <TouchableOpacity style={styles.previewButton} activeOpacity={0.85} onPress={() => setPreviewVisible(true)}>
          <Ionicons name="eye-outline" size={20} color="#493D1B" style={{ marginRight: 8 }} />
          <Text style={styles.previewButtonText}>View Shop Preview</Text>
        </TouchableOpacity>

        {/* Separator / Drag Handle */}
        <View style={styles.separatorContainer}>
          <View style={styles.dragHandle} />
        </View>

        {/* Shop Profile Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="storefront" size={22} color="#0E5E2F" />
            <Text style={styles.cardTitle}>Shop Profile</Text>
          </View>
          <View style={styles.cardDivider} />

          <Text style={styles.inputLabel}>Cover Photo</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
            {coverImageUrl ? (
              <Image source={{ uri: coverImageUrl }} style={styles.previewImage} contentFit="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Feather name="camera" size={24} color="#9CA3AF" />
                <Text style={styles.imagePlaceholderText}>Tap to add a photo</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Shop Name</Text>
            <TextInput
              style={styles.textInput}
              value={shopName}
              onChangeText={setShopName}
              placeholder="Enter shop name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Business Category</Text>
            <TouchableOpacity style={styles.dropdownInput} activeOpacity={0.7}>
              <Text style={styles.dropdownText}>{category}</Text>
              <Feather name="chevron-down" size={20} color="#60646C" />
            </TouchableOpacity>
          </View>

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
                      onChangeText={(text) => {
                        const updatedList = [...hoursList];
                        updatedList[index].hours = text;
                        setHoursList(updatedList);
                      }}
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

        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]} 
          activeOpacity={0.85} 
          onPress={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Premium Shop Preview Modal */}
      <Modal
        visible={isPreviewVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View style={styles.previewModalOverlay}>
          <View style={[styles.previewModalContent, { paddingBottom: insets.bottom }]}>
            
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              
              {/* Hero Image Section */}
              <View style={styles.previewHeroContainer}>
                <Image 
                  source={{ uri: coverImageUrl || 'https://images.unsplash.com/photo-1590426189955-46733ec6b1d4?auto=format&fit=crop&q=80&w=800' }} 
                  style={styles.previewModalImage} 
                  contentFit="cover" 
                />
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.8)', '#FFFFFF']}
                  style={styles.previewGradientOverlay}
                />
                
                {/* Floating Close Button */}
                <TouchableOpacity onPress={() => setPreviewVisible(false)} style={styles.previewFloatingClose}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.previewModalBody}>
                {/* Header Information */}
                <View style={styles.previewHeaderInfo}>
                  <View style={styles.previewCategoryBadge}>
                    <Text style={styles.previewCategoryText}>{category || 'Category'}</Text>
                  </View>
                  <Text style={styles.previewShopName}>{shopName || 'Your Shop Name'}</Text>
                  
                  <View style={styles.previewRatingRow}>
                    <Ionicons name="star" size={18} color="#FBBF24" />
                    <Text style={styles.previewRatingText}>New Shop</Text>
                    <Text style={styles.previewRatingDot}>•</Text>
                    <Ionicons name="location" size={16} color="#6B7280" style={{ marginRight: 4 }} />
                    <Text style={styles.previewLocationText}>Colombo, Sri Lanka</Text>
                  </View>
                </View>

                {/* About Section */}
                <View style={styles.previewSection}>
                  <Text style={styles.previewSectionTitle}>About</Text>
                  <Text style={styles.previewDescriptionText}>
                    {description || 'Welcome to our shop! Your premium description will appear here, telling travelers exactly what makes your experience special.'}
                  </Text>
                </View>

                {/* Hours Section */}
                {hoursEnabled && (
                  <View style={styles.previewSection}>
                    <Text style={styles.previewSectionTitle}>Opening Hours</Text>
                    <View style={styles.previewHoursContainer}>
                      {hoursList.map((item, index) => (
                        <View key={item.day} style={[styles.previewHourRow, index === hoursList.length - 1 && { borderBottomWidth: 0 }]}>
                          <Text style={styles.previewHourDay}>{item.day}</Text>
                          <Text style={[styles.previewHourTime, item.hours === 'Closed' && { color: '#EF4444' }]}>{item.hours}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Integrations Section */}
                {(website || instagram || facebook || tiktok) && (
                  <View style={styles.previewSection}>
                    <Text style={styles.previewSectionTitle}>Connect with us</Text>
                    <View style={styles.previewLinksContainer}>
                      {website ? (
                        <View style={styles.previewLinkCard}>
                          <View style={[styles.previewLinkIconWrap, { backgroundColor: '#F3F4F6' }]}>
                            <Feather name="globe" size={20} color="#1C1917" />
                          </View>
                          <View style={styles.previewLinkCardContent}>
                            <Text style={styles.previewLinkCardTitle}>Website</Text>
                            <Text style={styles.previewLinkCardSubtitle}>{website}</Text>
                          </View>
                          <Feather name="chevron-right" size={20} color="#D1D5DB" />
                        </View>
                      ) : null}
                      
                      {instagram ? (
                        <View style={styles.previewLinkCard}>
                          <View style={[styles.previewLinkIconWrap, { backgroundColor: '#FDF2F8' }]}>
                            <Feather name="instagram" size={20} color="#DB2777" />
                          </View>
                          <View style={styles.previewLinkCardContent}>
                            <Text style={styles.previewLinkCardTitle}>Instagram</Text>
                            <Text style={styles.previewLinkCardSubtitle}>@{instagram}</Text>
                          </View>
                          <Feather name="chevron-right" size={20} color="#D1D5DB" />
                        </View>
                      ) : null}

                      {facebook ? (
                        <View style={styles.previewLinkCard}>
                          <View style={[styles.previewLinkIconWrap, { backgroundColor: '#EFF6FF' }]}>
                            <Feather name="facebook" size={20} color="#2563EB" />
                          </View>
                          <View style={styles.previewLinkCardContent}>
                            <Text style={styles.previewLinkCardTitle}>Facebook</Text>
                            <Text style={styles.previewLinkCardSubtitle}>{facebook}</Text>
                          </View>
                          <Feather name="chevron-right" size={20} color="#D1D5DB" />
                        </View>
                      ) : null}

                      {tiktok ? (
                        <View style={styles.previewLinkCard}>
                          <View style={[styles.previewLinkIconWrap, { backgroundColor: '#F3F4F6' }]}>
                            <MaterialCommunityIcons name="music-note" size={20} color="#000000" />
                          </View>
                          <View style={styles.previewLinkCardContent}>
                            <Text style={styles.previewLinkCardTitle}>TikTok</Text>
                            <Text style={styles.previewLinkCardSubtitle}>@{tiktok}</Text>
                          </View>
                          <Feather name="chevron-right" size={20} color="#D1D5DB" />
                        </View>
                      ) : null}
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFCFB',
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0E5E2F',
    flex: 1,
    marginLeft: 12,
  },
  profileImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#A7F3D0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#0F3D26',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 15,
    color: '#60646C',
    lineHeight: 22,
    marginBottom: 20,
    fontWeight: '500',
  },
  previewButton: {
    backgroundColor: '#EAD26B',
    borderRadius: 100,
    flexDirection: 'row',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  previewButtonText: {
    color: '#493D1B',
    fontSize: 15,
    fontWeight: '700',
  },
  separatorContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  dragHandle: {
    width: 32,
    height: 4,
    backgroundColor: '#F472B6',
    borderRadius: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F0F3F1',
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1917',
    marginLeft: 12,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 16,
  },
  imagePicker: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  previewImage: {
    width: '100%',
    height: 200,
  },
  imagePlaceholder: {
    width: '100%',
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A4A4A',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1C1917',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 90,
    paddingTop: 14,
    paddingBottom: 14,
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  dropdownText: {
    fontSize: 15,
    color: '#1C1917',
  },
  switchCardContainer: {
    marginBottom: 24,
  },
  hoursInputContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayText: {
    width: 100,
    fontSize: 15,
    fontWeight: '500',
    color: '#4A4A4A',
  },
  dayInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1C1917',
    backgroundColor: '#FFFFFF',
  },
  switchCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1917',
    marginBottom: 4,
  },
  switchSubtitle: {
    fontSize: 13,
    color: '#60646C',
    lineHeight: 18,
  },
  integrationDesc: {
    fontSize: 15,
    color: '#60646C',
    lineHeight: 22,
    marginBottom: 24,
  },
  integrationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    height: 52,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
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
  },
  integrationInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#1C1917',
    paddingRight: 16,
  },
  saveButton: {
    backgroundColor: '#0E5E2F',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
    marginHorizontal: 20,
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
  previewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  previewModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '92%',
    overflow: 'hidden',
  },
  previewHeroContainer: {
    position: 'relative',
    height: 320,
    width: '100%',
  },
  previewModalImage: {
    width: '100%',
    height: '100%',
  },
  previewGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  previewFloatingClose: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  previewModalBody: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
  },
  previewHeaderInfo: {
    marginBottom: 32,
  },
  previewCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  previewCategoryText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  previewShopName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  previewRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewRatingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1917',
    marginLeft: 6,
  },
  previewRatingDot: {
    fontSize: 15,
    color: '#D1D5DB',
    marginHorizontal: 12,
  },
  previewLocationText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  previewSection: {
    marginBottom: 32,
  },
  previewSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  previewDescriptionText: {
    fontSize: 16,
    color: '#4A4A4A',
    lineHeight: 26,
  },
  previewHoursContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  previewHourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  previewHourDay: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  previewHourTime: {
    fontSize: 15,
    color: '#1C1917',
    fontWeight: '700',
  },
  previewLinksContainer: {
    gap: 12,
  },
  previewLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  previewLinkIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  previewLinkCardContent: {
    flex: 1,
  },
  previewLinkCardTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  previewLinkCardSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1917',
  },
});

export default EditShop;
