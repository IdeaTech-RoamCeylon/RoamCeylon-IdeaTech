import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { showToast } from '@/utils/toast';

interface Role {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

// Keep in sync with the role list on the email/password partner screen (patner.tsx).
const ROLES: Role[] = [
  {
    id: 'hotel_manager',
    title: 'Hotel Manager',
    description: 'Manage room inventory, pricing, and guest bookings for your property.',
    icon: 'bed-outline',
  },
  {
    id: 'activity_provider',
    title: 'Activity Provider',
    description: 'List water sports, hiking, and specialized local experiences.',
    icon: 'rowing',
  },
  {
    id: 'shop_partner',
    title: 'Shop Partner',
    description: 'Showcase local crafts, souvenirs, and specialty goods to travelers.',
    icon: 'storefront-outline',
  },
  {
    id: 'tour_guide',
    title: 'Tour Guide',
    description: 'Offer personal guided tours and specialized local knowledge.',
    icon: 'compass-outline',
  },
  // {
  //   id: 'event_organizer',
  //   title: 'Event Organizer',
  //   description: 'Host retreats, cultural festivals, or unique pop-up experiences.',
  //   icon: 'ticket-outline',
  // },
];

/**
 * Shown after a first-time Google sign-in. Google can't supply a phone number
 * or a partner role, so we collect them here and only THEN create the admin
 * user record in the backend (via /admin-users/sync). Returning Google users
 * never reach this screen — GoogleSignInScreen routes them straight home.
 */
const CompleteProfileScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ name?: string; email?: string }>();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const routeByRole = (role: string) => {
    if (role === 'activity_provider' || role === 'activity_manager') {
      router.replace('/activities/home' as any);
    } else if (role === 'hotel_manager') {
      router.replace('/booking/home' as any);
    } else if (role === 'tour_guide') {
      router.replace('/tour-guide/home' as any);
    } else if (role === 'shop_partner') {
      router.replace('/shopping/home' as any);
    } else {
      router.replace('/home');
    }
  };

  const handleContinue = async () => {
    const e: Record<string, string> = {};
    if (!phoneNumber.trim()) {
      e.phoneNumber = 'Phone number is required';
    } else if (phoneNumber.trim().length < 10) {
      e.phoneNumber = 'Please enter a valid phone number';
    }
    if (!selectedRole) e.role = 'Please select a role';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/admin-users/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: params.name || '',
          email: params.email || '',
          phoneNumber: phoneNumber.trim(),
          role: selectedRole,
        }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(msg || 'Failed to complete your profile. Please try again.');
      }

      // Persist locally for instant/offline access, mirroring the login flow.
      await SecureStore.setItemAsync(
        'userProfile',
        JSON.stringify({
          name: params.name || '',
          email: params.email || '',
          phoneNumber: phoneNumber.trim(),
        }),
      );

      routeByRole(selectedRole as string);
    } catch (err: any) {
      console.error('Complete profile error:', err);
      showToast.error(
        err?.message || 'Something went wrong. Please try again.',
        'Setup Failed',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Complete your profile</Text>
          <Text style={styles.subtitle}>
            {params.name ? `Welcome, ${params.name}! ` : ''}
            Add your phone number and choose your business role to get started.
          </Text>
        </View>

        {/* Phone number */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>PHONE NUMBER</Text>
          <View style={[styles.inputWrapper, errors.phoneNumber ? styles.inputError : null]}>
            <TextInput
              style={styles.textInput}
              placeholder="+94 77 123 4567"
              placeholderTextColor="#B5C0BC"
              value={phoneNumber}
              onChangeText={(t) => {
                setPhoneNumber(t);
                if (errors.phoneNumber) setErrors((e) => ({ ...e, phoneNumber: '' }));
              }}
              keyboardType="phone-pad"
              editable={!loading}
            />
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="phone-outline" size={20} color="#8F9B96" />
            </View>
          </View>
          {errors.phoneNumber ? <Text style={styles.errorText}>{errors.phoneNumber}</Text> : null}
        </View>

        {/* Role selection */}
        <Text style={[styles.inputLabel, styles.roleHeading]}>SELECT YOUR ROLE</Text>
        <View style={styles.rolesContainer}>
          {ROLES.map((role) => {
            const isSelected = selectedRole === role.id;
            return (
              <TouchableOpacity
                key={role.id}
                style={[styles.card, isSelected ? styles.cardSelected : null]}
                onPress={() => {
                  setSelectedRole(role.id);
                  if (errors.role) setErrors((e) => ({ ...e, role: '' }));
                }}
                activeOpacity={0.8}
                disabled={loading}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconCircle, isSelected ? styles.iconCircleSelected : null]}>
                    <MaterialCommunityIcons name={role.icon} size={24} color="#0E5E2F" />
                  </View>
                  <View style={[styles.radioOuter, isSelected ? styles.radioOuterSelected : null]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </View>
                <Text style={styles.cardTitle}>{role.title}</Text>
                <Text style={styles.cardDescription}>{role.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {errors.role ? <Text style={[styles.errorText, styles.roleError]}>{errors.role}</Text> : null}

        {/* Continue */}
        <TouchableOpacity
          style={[styles.buttonWrapper, loading && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#FFDF59', '#FFC83C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Finishing setup...' : 'Finish Setup'}
            </Text>
          </LinearGradient>
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0E5E2F',
    textAlign: 'center',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    color: '#494034',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#494034',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  roleHeading: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 58,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D8E5E0',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#494034',
    height: '100%',
  },
  iconContainer: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  },
  roleError: {
    marginTop: -20,
    marginBottom: 20,
  },
  rolesContainer: {
    gap: 16,
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D8E5E0',
    borderRadius: 24,
    padding: 20,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardSelected: {
    borderColor: '#0E5E2F',
    backgroundColor: '#F4FAF6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F3F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleSelected: {
    backgroundColor: '#E2ECE9',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D8E5E0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioOuterSelected: {
    borderColor: '#0E5E2F',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0E5E2F',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1917',
    marginTop: 16,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: '#60646C',
    lineHeight: 20,
  },
  buttonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FFC83C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 'auto',
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  button: {
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3D3008',
    letterSpacing: 0.5,
  },
});

export default CompleteProfileScreen;
