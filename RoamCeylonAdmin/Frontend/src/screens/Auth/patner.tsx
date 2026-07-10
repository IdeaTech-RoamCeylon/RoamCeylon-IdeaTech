import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { nhost } from '@/config/nhostClient';

interface Role {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

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

const PartnerScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    email: string;
    password: string;
    name: string;
    phoneNumber: string;
  }>();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedRole) return;
    if (!params.email || !params.password) {
      Alert.alert('Error', 'Registration data is missing. Please go back and register again.');
      return;
    }

    setLoading(true);
    try {
      // Create account in Nhost with role in metadata
      const signUpResponse = await nhost.auth.signUpEmailPassword({
        email: params.email,
        password: params.password,
        options: {
          displayName: params.name,
          redirectTo: 'roamceylonadmin://login',
          metadata: {
            phoneNumber: params.phoneNumber,
            role: selectedRole,
            isAdmin: true,
          },
        },
      }) as any;

      const authError = signUpResponse.error || signUpResponse.body?.error;
      if (authError) {
        throw new Error(
          authError.message || 'Registration failed. Please try again.',
        );
      }

      // Store registration details locally so they can be synced
      // to the NestJS database when the user successfully logs in.
      const tempData = {
        name: params.name,
        email: params.email,
        phoneNumber: params.phoneNumber,
        role: selectedRole,
      };
      await SecureStore.setItemAsync('tempAdminRegistrationData', JSON.stringify(tempData));

      // Navigate to email verification screen
      router.push({
        pathname: '/emailVerification',
        params: { email: params.email },
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      const isEmailInUse = error?.message && error.message.toLowerCase().includes('email already in use');
      if (isEmailInUse) {
        Alert.alert(
          'Email Already in Use',
          'An account with this email address already exists. Would you like to log in instead?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Log In',
              onPress: () => router.push('/login'),
            },
          ]
        );
      } else {
        Alert.alert(
          'Registration Failed',
          error?.message || 'Registration failed. Please try again.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Partner with RoamCeylon</Text>
          <Text style={styles.subtitle}>
            Select your business role to begin. One account per role.
          </Text>
        </View>

        {/* Roles List */}
        <View style={styles.rolesContainer}>
          {ROLES.map((role) => {
            const isSelected = selectedRole === role.id;
            return (
              <TouchableOpacity
                key={role.id}
                style={[
                  styles.card,
                  isSelected ? styles.cardSelected : null,
                ]}
                onPress={() => setSelectedRole(role.id)}
                activeOpacity={0.8}
                disabled={loading}
              >
                {/* Card Top Row */}
                <View style={styles.cardHeader}>
                  {/* Icon Container */}
                  <View style={[
                    styles.iconCircle,
                    isSelected ? styles.iconCircleSelected : null
                  ]}>
                    <MaterialCommunityIcons 
                      name={role.icon} 
                      size={24} 
                      color="#0E5E2F" 
                    />
                  </View>

                  {/* Radio Indicator */}
                  <View style={[
                    styles.radioOuter,
                    isSelected ? styles.radioOuterSelected : null
                  ]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </View>

                {/* Card Content */}
                <Text style={styles.cardTitle}>{role.title}</Text>
                <Text style={styles.cardDescription}>{role.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.buttonWrapper, (!selectedRole || loading) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!selectedRole || loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#FFDF59', '#FFC83C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating Account...' : 'Continue'}
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
    })
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

export default PartnerScreen;
