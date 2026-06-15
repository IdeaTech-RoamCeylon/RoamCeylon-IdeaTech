import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
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
import { nhost } from '@/config/nhostClient';
import { showToast } from '@/utils/toast';

const EditProfile = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Profile fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profilePicture, setProfilePicture] = useState('');

  // UI state
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast.error('Gallery permission is required to choose a profile picture.', 'Permission Denied');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfilePicture(result.assets[0].uri);
    }
  };

  // Fetch current user details from backend
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = await SecureStore.getItemAsync('authToken');
        const apiUrl = process.env.EXPO_PUBLIC_API_URL;

        if (!token) {
          showToast.error('You are not authenticated', 'Error');
          router.replace('/login');
          return;
        }

        let dbName = '';
        let dbEmail = '';
        let dbPhone = '';
        let dbProfilePic = '';

        // 1. Read from locally cached profile (set during login) — instant, no network
        try {
          const cachedProfile = await SecureStore.getItemAsync('userProfile');
          if (cachedProfile) {
            const parsed = JSON.parse(cachedProfile);
            dbName = parsed.name || '';
            dbEmail = parsed.email || '';
            dbPhone = parsed.phoneNumber || '';
            dbProfilePic = parsed.profile_picture || '';
          }
        } catch (cacheErr) {
          console.warn('[EditProfile] Cache read failed:', cacheErr);
        }

        // 2. Enrich from backend DB (has latest phone updates)
        try {
          const res = await fetch(`${apiUrl}/admin-users/me`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (res.ok) {
            const resJson = await res.json();
            const profileData = resJson.data || {};
            if (profileData.name) dbName = profileData.name;
            if (profileData.email) dbEmail = profileData.email;
            if (profileData.phoneNumber) dbPhone = profileData.phoneNumber;
            if (profileData.profile_picture) dbProfilePic = profileData.profile_picture;
          }
        } catch (dbErr) {
          console.warn('[EditProfile] DB fetch failed (non-critical):', dbErr);
        }

        setName(dbName);
        setEmail(dbEmail);
        setPhoneNumber(dbPhone);
        setProfilePicture(dbProfilePic);
      } catch (err) {
        console.error('[EditProfile] Error loading user profile:', err);
        showToast.error('Network error. Failed to load profile.', 'Error');
      } finally {
        setFetching(false);
      }
    };

    loadProfile();
  }, []);

  // Update profile handler
  const handleSave = async () => {
    if (!name.trim()) {
      showToast.error('Full name is required', 'Validation Error');
      return;
    }
    if (!phoneNumber.trim()) {
      showToast.error('Phone number is required', 'Validation Error');
      return;
    }
    if (phoneNumber.trim().length !== 10) {
      showToast.error('Phone number must be exactly 10 digits', 'Validation Error');
      return;
    }

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;

      let finalProfilePicUrl = profilePicture;

      // If the image is a local URI (selected from gallery), upload it to Nhost Storage
      if (profilePicture && !profilePicture.startsWith('http')) {
        const formData = new FormData();
        const filename = profilePicture.split('/').pop() || `profile-${Date.now()}.jpg`;
        
        formData.append('file', {
          uri: profilePicture,
          name: filename,
          type: 'image/jpeg',
        } as any);

        const { fileMetadata, error: uploadError } = await nhost.storage.upload({ formData });
        
        if (uploadError) {
          console.error('[EditProfile] Nhost upload error:', uploadError);
          throw new Error('Failed to upload profile picture');
        }
        
        if (fileMetadata && fileMetadata.id) {
          finalProfilePicUrl = nhost.storage.getPublicUrl({ fileId: fileMetadata.id });
        }
      }

      // 1. Update backend PostgreSQL DB
      const res = await fetch(`${apiUrl}/admin-users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          phoneNumber: phoneNumber.trim(),
          profile_picture: finalProfilePicUrl,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error('[EditProfile] Backend patch failed:', res.status, errText);
        throw new Error('Failed to update profile on backend database');
      }

      // 2. Cache updated profile in SecureStore for instant UI synchronization
      try {
        await SecureStore.setItemAsync('userProfile', JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim(),
          profile_picture: finalProfilePicUrl,
        }));
      } catch (cacheErr) {
        console.warn('[EditProfile] SecureStore userProfile caching failed:', cacheErr);
      }

      // 3. Update Nhost user auth metadata via GraphQL (optional fallback)
      try {
        const UPDATE_USER_MUTATION = `
          mutation($id: uuid!, $displayName: String!, $metadata: jsonb!) {
            updateUser(pk_columns: { id: $id }, _set: { displayName: $displayName, metadata: $metadata }) {
              id
            }
          }
        `;
        const nhostUser = nhost.auth.getUser() as any;
        if (nhostUser && nhostUser.id) {
          const nhostRes = await nhost.graphql.request({
            query: UPDATE_USER_MUTATION,
            variables: {
              id: nhostUser.id,
              displayName: name.trim(),
              metadata: {
                phoneNumber: phoneNumber.trim(),
              },
            },
          }) as any;
          if (nhostRes.error) {
            console.warn('[EditProfile] Nhost update via GraphQL warning:', nhostRes.error);
          }
        }
      } catch (nhostErr) {
        console.warn('[EditProfile] Nhost update exception (non-critical):', nhostErr);
      }

      showToast.success('Profile updated successfully!', 'Success ✓');
      router.back();
    } catch (err: any) {
      console.error('[EditProfile] Save profile error:', err);
      showToast.error(err.message || 'Failed to update profile.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0E5E2F" />
        <Text style={styles.loadingText}>Fetching profile details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Elegant Gradient Hero Banner */}
          <LinearGradient
            colors={['#0F3D26', '#145334']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroBanner, { paddingTop: insets.top + 20 }]}
          >
            {/* Header Row */}
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.backButton}
                activeOpacity={0.7}
                onPress={() => router.back()}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.avatarWrapper}>
              <TouchableOpacity
                style={styles.avatarCircle}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                {profilePicture ? (
                  <Image
                    source={{ uri: profilePicture }}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.avatarInitial}>
                    <Text style={styles.avatarInitialText}>
                      {name ? name.charAt(0).toUpperCase() : '?'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.avatarAddButton}
                activeOpacity={0.7}
                onPress={pickImage}
              >
                <Ionicons name="camera" size={16} color="#493D1B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.heroName}>{name || 'Admin User'}</Text>
            <Text style={styles.heroEmail}>{email || 'Not verified'}</Text>
          </LinearGradient>

          {/* Form Card */}
          <View style={styles.formCard}>
            <View style={styles.formGroup}>
              {/* Full Name Section */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>FULL NAME</Text>
                <View style={[styles.inputWrapper, styles.readOnlyInput]}>
                  <Feather name="user" size={18} color="#8F9B96" style={{ marginRight: 12 }} />
                  <TextInput
                    style={[styles.textInput, { color: '#7D8A82' }]}
                    value={name}
                    editable={false}
                    placeholder="No name provided"
                    placeholderTextColor="#B5C0BC"
                  />
                  <Feather name="lock" size={14} color="#B5C0BC" style={{ marginLeft: 10 }} />
                </View>
              </View>

              {/* Email Address Section */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                <View style={[styles.inputWrapper, styles.readOnlyInput]}>
                  <Feather name="mail" size={18} color="#8F9B96" style={{ marginRight: 12 }} />
                  <TextInput
                    style={[styles.textInput, { color: '#7D8A82' }]}
                    value={email}
                    editable={false}
                    placeholder="hello@roamceylon.lk"
                    placeholderTextColor="#B5C0BC"
                  />
                  <Feather name="lock" size={14} color="#B5C0BC" style={{ marginLeft: 10 }} />
                </View>
              </View>

              {/* Phone Number Section */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>PHONE NUMBER</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="phone" size={18} color="#0E5E2F" style={{ marginRight: 12 }} />
                  <TextInput
                    style={styles.textInput}
                    value={phoneNumber}
                    onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, ''))}
                    maxLength={10}
                    placeholder="0771234567"
                    placeholderTextColor="#B5C0BC"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </View>

            {/* Save Changes Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Saving Changes...' : 'Update Details'}
              </Text>
            </TouchableOpacity>

            {/* Safe/Secure Badge Footer */}
            <View style={styles.footerContainer}>
              <View style={styles.badgeContainer}>
                <MaterialCommunityIcons name="shield-check" size={14} color="#0E5E2F" />
                <Text style={styles.badgeText}>SECURE PORTAL ACTIVE</Text>
              </View>
              <Text style={styles.footerText}>
                INNOVATED BY IDEATECH
              </Text>
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
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    width: '100%',
    marginBottom: 8,
  },
  backButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#60646C',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
  },
  heroBanner: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 64,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#0E5E2F',
    borderWidth: 3,
    borderColor: '#EAD26B',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarInitial: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#0E5E2F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitialText: {
    fontSize: 44,
    fontWeight: 'bold',
    color: '#EAD26B',
  },
  avatarAddButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#EAD26B',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0F3D26',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  heroEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
    marginTop: 4,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },
  formGroup: {
    gap: 20,
    marginBottom: 24,
  },
  inputSection: {
    marginBottom: 0,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0E5E2F',
    letterSpacing: 1.0,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16,
    borderWidth: 1.2,
    borderColor: '#D8E5E0',
  },
  readOnlyInput: {
    backgroundColor: '#F7FAF8',
    borderColor: '#EAF2EC',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#1C1917',
    height: '100%',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#EAD26B',
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EAD26B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#493D1B',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  footerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF7EE',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0E5E2F',
    letterSpacing: 0.8,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7D8A82',
    textAlign: 'center',
    letterSpacing: 1.2,
  },
});

export default EditProfile;
