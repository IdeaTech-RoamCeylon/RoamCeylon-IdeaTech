import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { googleSignIn } from '../../services/auth';
import { LinearGradient } from 'expo-linear-gradient';

WebBrowser.maybeCompleteAuthSession();

const GoogleSignInScreen = () => {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [loading, setLoading] = useState(true);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID, // Assuming same for now or handle separately
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  });

  useEffect(() => {
    if (request) {
      handleSignIn();
    }
  }, [request]);

  const handleSignIn = async () => {
    try {
      const result = await promptAsync();
      
      if (result.type === 'success') {
        const { id_token } = result.params;
        
        if (id_token) {
          const { accessToken } = await googleSignIn(id_token);
          await login(accessToken);
          // Navigation to Home is handled by AuthContext (isAuthenticated change)
        } else {
          throw new Error('No ID token received from Google');
        }
      } else if (result.type === 'cancel') {
        navigation.goBack();
      } else {
        throw new Error('Google sign in failed');
      }
    } catch (error: any) {
      console.error('Google Auth Error:', error);
      Alert.alert('Sign In Error', error.message || 'Something went wrong');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[ '#a0face', '#bbf5d9','#d8f19e','#efea70','#efea70']}
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
