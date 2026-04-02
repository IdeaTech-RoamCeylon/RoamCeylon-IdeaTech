import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { googleSignIn } from '../../services/auth';
import { LinearGradient } from 'expo-linear-gradient';

// Configure Google Sign-In once when the module loads.
// webClientId is required for the backend token exchange (server-side OAuth).
// androidClientId is optional here since we're using webClientId for auth.
GoogleSignin.configure({
  webClientId: '770657770767-jm7n3tpra4ll777imp2ced5k8keehc4d.apps.googleusercontent.com',
  offlineAccess: true, // Enables serverAuthCode for backend token exchange
  scopes: ['profile', 'email'],
});

const GoogleSignInScreen = () => {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    handleSignIn();
  }, []);

  const handleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const userInfo = await GoogleSignin.signIn();

      console.log('Google Sign-In result:', JSON.stringify(userInfo, null, 2));

      // serverAuthCode is the authorization code for backend exchange.
      const serverAuthCode = userInfo.data?.serverAuthCode;

      if (!serverAuthCode) {
        throw new Error('No server auth code received from Google. Make sure offlineAccess is enabled.');
      }

      console.log('Server Auth Code received, exchanging with backend...');

      const { accessToken } = await googleSignIn(serverAuthCode);
      await login(accessToken);
      // Navigation to Home is handled by AuthContext (isAuthenticated change)

    } catch (error: any) {
      console.error('Google Sign-In Error:', error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled — go back silently
        if (navigation.canGoBack()) navigation.goBack();
        return;
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert('Sign In', 'Sign in is already in progress.');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services are not available on this device.');
      } else {
        Alert.alert('Sign In Error', error.message || 'Something went wrong with Google Sign-In.');
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
