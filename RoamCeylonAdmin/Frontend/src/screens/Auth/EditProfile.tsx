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
import { nhost } from '@/config/nhostClient';
import { showToast } from '@/utils/toast';

const EditProfile = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Profile fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // UI state
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);

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

        const res = await fetch(`${apiUrl}/admin-users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const resJson = await res.json();
          const profileData = resJson.data || {};
          dbName = profileData.name || '';
          dbEmail = profileData.email || '';
          dbPhone = profileData.phoneNumber || '';
        } else {
          console.warn('[EditProfile] Failed to fetch profile from database, trying Nhost fallback');
        }

        // Fallback to Nhost user info if database values are empty
        const nhostUser = nhost.auth.getUser() as any;
        if (nhostUser) {
          if (!dbName) dbName = nhostUser.displayName || '';
          if (!dbEmail) dbEmail = nhostUser.email || '';
          if (!dbPhone) {
            dbPhone = nhostUser.metadata?.phoneNumber || nhostUser.phoneNumber || '';
          }
        }

        setName(dbName);
        setEmail(dbEmail);
        setPhoneNumber(dbPhone);
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

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;

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
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error('[EditProfile] Backend patch failed:', res.status, errText);
        throw new Error('Failed to update profile on backend database');
      }

      // 2. Update Nhost user auth metadata via GraphQL (optional fallback)
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
          const nhostRes = await nhost.graphql.request(UPDATE_USER_MUTATION, {
            id: nhostUser.id,
            displayName: name.trim(),
            metadata: {
              phoneNumber: phoneNumber.trim(),
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
      router.replace('/activities/settings');
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
      <StatusBar barStyle="dark-content" backgroundColor="#F6FAF6" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="arrow-back" size={26} color="#0E5E2F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Setup</Text>
        <View style={{ width: 32 }} /> {/* Balance header layout */}
      </View>

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
          {/* Top Green Tint Panel */}
          <View style={styles.topInfoContainer}>
            <Text style={styles.titleText}>Profile Setup</Text>
            <Text style={styles.subtitleText}>
              Edit your admin profile details
            </Text>
          </View>

          {/* Form Content Card */}
          <View style={styles.formCard}>
            {/* Avatar Circle Container */}
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person-outline" size={42} color="#7D8A82" />
              </View>
              <TouchableOpacity style={styles.avatarAddButton} activeOpacity={0.7}>
                <Ionicons name="add" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Inputs Block */}
            <View style={styles.formGroup}>
              {/* Full Name */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>FULL NAME</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your full name"
                    placeholderTextColor="#B5C0BC"
                  />
                </View>
              </View>

              {/* Email Address */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                <View style={[styles.inputWrapper, styles.readOnlyInput]}>
                  <TextInput
                    style={[styles.textInput, { color: '#88928E' }]}
                    value={email}
                    editable={false}
                    placeholder="hello@roamceylon.lk"
                    placeholderTextColor="#B5C0BC"
                  />
                  <Ionicons name="mail-outline" size={20} color="#8F9B96" style={{ marginLeft: 10 }} />
                </View>
              </View>

              {/* Phone Number */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>PHONE NUMBER</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="+94 77 123 4567"
                    placeholderTextColor="#B5C0BC"
                    keyboardType="phone-pad"
                  />
                  <Ionicons name="call-outline" size={20} color="#8F9B96" style={{ marginLeft: 10 }} />
                </View>
              </View>
            </View>

            {/* Submit Action Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Saving Changes...' : 'Update'}
              </Text>
            </TouchableOpacity>

            {/* Secure Portal Info */}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#F6FAF6',
    borderBottomWidth: 1,
    borderBottomColor: '#EAF2EC',
    zIndex: 10,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0E5E2F',
    letterSpacing: -0.3,
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
  topInfoContainer: {
    backgroundColor: '#F6FAF6',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 30,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0E5E2F',
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 15,
    color: '#60646C',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    paddingHorizontal: 12,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -20,
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  avatarWrapper: {
    alignSelf: 'center',
    position: 'relative',
    marginBottom: 28,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E2ECE9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarAddButton: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    backgroundColor: '#5B600A',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  formGroup: {
    gap: 18,
    marginBottom: 20,
  },
  inputSection: {
    marginBottom: 0,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#60646C',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 58,
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
  preferencesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7FAF8',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 16,
    marginTop: 10,
    marginBottom: 24,
  },
  preferencesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leafIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAF7EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  preferencesTextContainer: {
    flex: 1,
  },
  preferencesTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E5E2F',
  },
  preferencesSubtitle: {
    fontSize: 12,
    color: '#7D8A82',
    marginTop: 2,
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
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 28,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#493D1B',
    fontSize: 16,
    fontWeight: '800',
  },
  footerContainer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 20,
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
