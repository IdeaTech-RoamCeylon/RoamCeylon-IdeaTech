import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { nhost } from '@/config/nhostClient';
import * as SecureStore from 'expo-secure-store';

// Lazy-load Google Sign-In to prevent crash when native module isn't available
let GoogleSignin: any = null;
let statusCodes: any = {};

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const gsModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = gsModule.GoogleSignin;
  statusCodes = gsModule.statusCodes;

  // Configure Google Sign-In
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    scopes: ['profile', 'email'],
  });
} catch (_e) {
  console.warn('Google Sign-In native module not available. Requires a development build.');
}

// Nhost hands back system roles (e.g. 'user', 'me') for accounts that haven't
// been assigned a real partner role yet. Those never count as a real role.
const SYSTEM_ROLES = ['user', 'me', 'anonymous', 'public'];
const isRealRole = (role?: string): role is string =>
  !!role && !SYSTEM_ROLES.includes(role);

const GoogleSignInScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Route an authenticated partner to their role-specific home. Mirrors the
  // switch used by the email/password login flow in LoginScreen.
  const routeByRole = (role?: string) => {
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

  useEffect(() => {
    if (!GoogleSignin) {
      Alert.alert(
        'Google Sign-In Unavailable',
        'Google Sign-In requires a development build. Please run "npx expo prebuild" and rebuild the app.',
        [{ text: 'Go Back', onPress: () => router.canGoBack() ? router.back() : router.push('/login') }],
      );
      setLoading(false);
      return;
    }
    handleSignIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const userInfo = await GoogleSignin.signIn();

      // idToken is what Nhost /signin/idtoken expects for native Google auth.
      const idToken = userInfo.data?.idToken;
      if (!idToken) {
        throw new Error('No ID token received from Google Sign-In.');
      }

      console.log('ID Token received — authenticating with Nhost...');

      // Authenticate against Nhost Hasura Auth using the Google ID token.
      const response = await nhost.auth.signInIdToken({
        provider: 'google',
        idToken,
      });

      const session = response.body.session;

      if (!session?.accessToken) {
        throw new Error('No access token in Nhost response.');
      }

      console.log('Nhost authentication successful.');

      // Persist the Nhost access token
      await SecureStore.setItemAsync('authToken', session.accessToken);

      // Persist refresh token for future silent re-authentication.
      if (session.refreshToken) {
        await SecureStore.setItemAsync('nhostRefreshToken', session.refreshToken);
      }

      // Google can't supply a partner role, so we don't sync/create a record
      // here (the backend now rejects creating a user without a role). Instead
      // we check whether this Google account already has a partner profile.
      const userName = userInfo.data?.user?.name || '';
      const userEmail = userInfo.data?.user?.email || '';
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;

      let existingRole: string | undefined;
      try {
        const meRes = await fetch(`${apiUrl}/admin-users/me`, {
          headers: { 'Authorization': `Bearer ${session.accessToken}` },
        });
        if (meRes.ok) {
          const meJson = await meRes.json();
          existingRole = meJson?.data?.role;
        }
      } catch (meErr) {
        console.warn('Failed to fetch admin profile (non-fatal):', meErr);
      }

      if (isRealRole(existingRole)) {
        // Returning partner — straight to their role home.
        routeByRole(existingRole);
      } else {
        // First-time Google partner — carry the Google name/email into the
        // setup screen where they'll pick a role + phone before the account
        // is created in the backend.
        router.replace({
          pathname: '/completeProfile' as any,
          params: { name: userName, email: userEmail },
        });
      }

    } catch (error: any) {
      console.error('Google Sign-In Error:', error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        if (router.canGoBack()) router.back();
        return;
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert('Sign In', 'Sign in is already in progress.');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services are not available on this device.');
      } else {
        Alert.alert(
          'Sign In Error',
          error.message || 'Something went wrong with Google Sign-In.',
        );
      }

      if (router.canGoBack()) router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#a0face', '#bbf5d9', '#d8f19e', '#efea70', '#efea70']}
      style={styles.container}
    >
      <View style={styles.content}>
        {loading ? (
          <>
            <ActivityIndicator size="large" color="#16a669" />
            <Text style={styles.text}>Connecting to Google...</Text>
          </>
        ) : (
          <Text style={styles.text}>Google Sign-In not available</Text>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    alignItems: 'center',
    gap: 15,
  },
  text: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
});

export default GoogleSignInScreen;
