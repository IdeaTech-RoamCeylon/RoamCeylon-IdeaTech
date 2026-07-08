import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useColorScheme } from 'react-native';
import React, { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

function AuthGuard() {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      // Determine if the route is a protected admin segment
      const firstSegment = segments[0];
      const isProtected = 
        firstSegment === 'activities' || 
        firstSegment === 'booking' || 
        firstSegment === 'home';

      if (isProtected) {
        const token = await SecureStore.getItemAsync('authToken');
        if (!token) {
          router.replace('/login');
        }
      }
    };

    checkAuth();
  }, [segments, router]);

  return null;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthGuard />
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
