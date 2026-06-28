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
  KeyboardAvoidingView,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';


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
  const [location, setLocation] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPreviewVisible, setPreviewVisible] = useState(false);

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

  useEffect(() => {
    if (!id) return;

    const fetchShop = async () => {
      try {
        const accessToken = await SecureStore.getItemAsync('authToken');
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.222.107:3001';
        
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
            } catch (_e) {
              // Ignore parse error, keep default
            }
          }
          
          setCoverImageUrl(shop.coverImageUrl || '');
          setWebsite(shop.website || '');
          setInstagram(shop.instagram || '');
          setFacebook(shop.facebook || '');
          setTiktok(shop.tiktok || '');
          setLocation(shop.location || '');
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
      
      if (coverImageUrl && !coverImageUrl.startsWith('http')) {
        const formData = new FormData();
        formData.append('bucket-id', 'Shops');
        formData.append('file', {
          name: `shop_${Date.now()}.jpg`,
          type: 'image/jpeg',
          uri: coverImageUrl,
        } as any);

        const subdomain = process.env.EXPO_PUBLIC_NHOST_SUBDOMAIN;
        const region = process.env.EXPO_PUBLIC_NHOST_REGION;
        const storageUrl = `https://${subdomain}.storage.${region}.nhost.run/v1/files`;
        const uploadRes = await fetch(storageUrl, {
          method: 'POST',
          body: formData,
          headers: {
            Authorization: `Bearer ${accessToken}`,
          }
        });

        if (!uploadRes.ok) {
          const errText = await uploadRes.text();
          throw new Error(`Image upload failed: ${errText}`);
        }

        const data = await uploadRes.json();
        // data could be { id: '...' } or { processedFiles: [{ id: '...' }] }
        const fileId = data.id || data.processedFiles?.[0]?.id || data[0]?.id;
        
        finalCoverImageUrl = `${storageUrl}/${fileId}`;
      }

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.222.107:3001';
      
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
          location,
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

  const handleDelete = () => {
    Alert.alert(
      "Delete Shop",
      "Are you sure you want to delete this shop? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              const accessToken = await SecureStore.getItemAsync('authToken');
              const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.222.107:3001';
              
              const response = await fetch(`${apiUrl}/shops/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              
              if (response.ok) {
                router.back();
              } else {
                Alert.alert("Error", "Could not delete shop. Please try again.");
              }
            } catch (error) {
              console.error('Failed to delete shop:', error);
              Alert.alert("Error", "Could not delete shop. Please try again.");
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  const handleLinkPress = async (type: string, value: string) => {
    if (!value) return;
    let url = value.trim();
    
    if (type === 'website') {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }
    } else if (type === 'instagram') {
      url = `https://instagram.com/${url.replace(/^@/, '')}`;
    } else if (type === 'facebook') {
      if (!url.startsWith('http')) {
        url = `https://facebook.com/${url}`;
      }
    } else if (type === 'tiktok') {
      url = `https://tiktok.com/@${url.replace(/^@/, '')}`;
    }

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Failed to open link:', error);
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
              <Text style={styles.headerTitle}>Edit Shop</Text>
              
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
              
              {/* Cover Photo Label + Preview Button Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={[styles.inputLabel, { marginBottom: 0 }]}>Cover Photo</Text>
                <TouchableOpacity style={styles.inlinePreviewButton} activeOpacity={0.8} onPress={() => setPreviewVisible(true)}>
                  <Ionicons name="eye" size={16} color="#0E5E2F" style={{ marginRight: 4 }} />
                  <Text style={styles.inlinePreviewButtonText}>Preview</Text>
                </TouchableOpacity>
              </View>

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

            <View style={{ marginTop: 24, marginBottom: 16 }}>
              <TouchableOpacity 
                style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]} 
                activeOpacity={0.8} 
                onPress={handleSave}
                disabled={isSubmitting || isDeleting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 40 }}>
              <TouchableOpacity 
                style={styles.deleteButton} 
                activeOpacity={0.8} 
                onPress={handleDelete}
                disabled={isSubmitting || isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete Shop</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
                        <TouchableOpacity style={styles.previewLinkCard} activeOpacity={0.7} onPress={() => handleLinkPress('website', website)}>
                          <View style={[styles.previewLinkIconWrap, { backgroundColor: '#F3F4F6' }]}>
                            <Feather name="globe" size={20} color="#1C1917" />
                          </View>
                          <View style={styles.previewLinkCardContent}>
                            <Text style={styles.previewLinkCardTitle}>Website</Text>
                            <Text style={styles.previewLinkCardSubtitle}>{website}</Text>
                          </View>
                          <Feather name="chevron-right" size={20} color="#D1D5DB" />
                        </TouchableOpacity>
                      ) : null}
                      
                      {instagram ? (
                        <TouchableOpacity style={styles.previewLinkCard} activeOpacity={0.7} onPress={() => handleLinkPress('instagram', instagram)}>
                          <View style={[styles.previewLinkIconWrap, { backgroundColor: '#FDF2F8' }]}>
                            <Feather name="instagram" size={20} color="#DB2777" />
                          </View>
                          <View style={styles.previewLinkCardContent}>
                            <Text style={styles.previewLinkCardTitle}>Instagram</Text>
                            <Text style={styles.previewLinkCardSubtitle}>{instagram.startsWith('@') ? instagram : `@${instagram}`}</Text>
                          </View>
                          <Feather name="chevron-right" size={20} color="#D1D5DB" />
                        </TouchableOpacity>
                      ) : null}

                      {facebook ? (
                        <TouchableOpacity style={styles.previewLinkCard} activeOpacity={0.7} onPress={() => handleLinkPress('facebook', facebook)}>
                          <View style={[styles.previewLinkIconWrap, { backgroundColor: '#EFF6FF' }]}>
                            <Feather name="facebook" size={20} color="#2563EB" />
                          </View>
                          <View style={styles.previewLinkCardContent}>
                            <Text style={styles.previewLinkCardTitle}>Facebook</Text>
                            <Text style={styles.previewLinkCardSubtitle}>{facebook}</Text>
                          </View>
                          <Feather name="chevron-right" size={20} color="#D1D5DB" />
                        </TouchableOpacity>
                      ) : null}

                      {tiktok ? (
                        <TouchableOpacity style={styles.previewLinkCard} activeOpacity={0.7} onPress={() => handleLinkPress('tiktok', tiktok)}>
                          <View style={[styles.previewLinkIconWrap, { backgroundColor: '#F3F4F6' }]}>
                            <MaterialCommunityIcons name="music-note" size={20} color="#000000" />
                          </View>
                          <View style={styles.previewLinkCardContent}>
                            <Text style={styles.previewLinkCardTitle}>TikTok</Text>
                            <Text style={styles.previewLinkCardSubtitle}>{tiktok.startsWith('@') ? tiktok : `@${tiktok}`}</Text>
                          </View>
                          <Feather name="chevron-right" size={20} color="#D1D5DB" />
                        </TouchableOpacity>
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
  deleteButton: {
    backgroundColor: '#FEF2F2',
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  inlinePreviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  inlinePreviewButtonText: {
    color: '#0E5E2F',
    fontSize: 13,
    fontWeight: '600',
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
  previewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  previewModalContent: {
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    height: '96%',
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
    paddingTop: 32,
    paddingBottom: 40,
    marginTop: -32,
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
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
    fontSize: 36,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 12,
    letterSpacing: -1,
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
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  previewDescriptionText: {
    fontSize: 16,
    color: '#4A4A4A',
    lineHeight: 26,
  },
  previewHoursContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
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
    padding: 20,
    borderRadius: 24,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
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
