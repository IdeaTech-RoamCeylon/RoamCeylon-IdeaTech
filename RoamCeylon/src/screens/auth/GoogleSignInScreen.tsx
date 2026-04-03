import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { nhost } from '../../config/nhostClient';
import * as SecureStore from 'expo-secure-store';

// Configure Google Sign-In.
// webClientId must match the Web Application OAuth client in Google Cloud Console.
// offlineAccess is NOT required — the new flow sends the idToken directly to
// Nhost (signInIdToken) instead of exchanging a serverAuthCode on the backend.
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  scopes: ['profile', 'email'],
});

const GoogleSignInScreen = () => {
  const navigation = useNavigation();
  const { login, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    handleSignIn();
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
      // On success: response.body.session contains accessToken + refreshToken.
      // On failure: FetchError is thrown (caught below).
      const response = await nhost.auth.signInIdToken({
        provider: 'google',
        idToken,
      });

      const session = response.body.session;

      if (!session?.accessToken) {
        throw new Error('No access token in Nhost response.');
      }

      console.log('Nhost authentication successful.');

      // Persist the Nhost access token so the existing API interceptor
      // can attach it as "Authorization: Bearer <token>" to NestJS requests.
      await SecureStore.setItemAsync('authToken', session.accessToken);

      // Persist refresh token for future silent re-authentication.
      if (session.refreshToken) {
        await SecureStore.setItemAsync('nhostRefreshToken', session.refreshToken);
      }

      // Notify AuthContext — sets isAuthenticated = true and fetches the
      // user profile from NestJS via the stored Nhost access token.
      await login(session.accessToken);

      // Now that the backend profile is auto-created, sync Google User Info 
      // up to it so that `isProfileComplete` evaluates to true!
      const userName = userInfo.data?.user?.name;
      const userEmail = userInfo.data?.user?.email;

      if (userName && userEmail) {
        try {
          const { updateProfile } = require('../../services/auth');
          await updateProfile(userName, userEmail);
          
          await refreshUser();
        } catch (updateErr) {
          console.warn('Failed to auto-sync Google profile to backend:', updateErr);
        }
      }

    } catch (error: any) {
      console.error('Google Sign-In Error:', error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        if (navigation.canGoBack()) navigation.goBack();
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

      if (navigation.canGoBack()) navigation.goBack();
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
        <ActivityIndicator size="large" color="#16a669" />
        <Text style={styles.text}>Connecting to Google...</Text>
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
