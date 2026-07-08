import { useState, useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  } as any),
});

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';

// Thrown when the running build doesn't include the native push-token module
// (e.g. testing an older build while a new EAS build with the module is pending).
function isMissingNativeModuleError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('ExpoPushTokenManager') || message.includes('Cannot find native module');
}

/**
 * Hook to manage push notification registration and token handling
 */
export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Set up notification listeners
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('[Push] Notification received:', notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('[Push] Notification response:', response);
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  /**
   * Register for push notifications: request permissions, get token, send to backend
   */
  const registerForPushNotifications = async (): Promise<boolean> => {
    try {
      // Check if running on a physical device
      if (!Device.isDevice) {
        Alert.alert(
          'Physical Device Required',
          'Push notifications only work on physical devices, not simulators.',
        );
        return false;
      }

      // Check existing permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive push notifications.',
        );
        return false;
      }

      setPermissionGranted(true);

      // Set up Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0E5E2F',
        });
      }

      // Get the Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: undefined, // Uses the project ID from app.json
      });
      const token = tokenData.data;
      setExpoPushToken(token);
      console.log('[Push] Expo push token:', token);

      // Register the token with the backend
      const authToken = await SecureStore.getItemAsync('authToken');
      if (authToken) {
        const response = await fetch(`${API_URL}/notifications/register-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            token,
            platform: Platform.OS,
          }),
        });

        if (response.ok) {
          console.log('[Push] Token registered with backend');

          // Send a test notification
          await fetch(`${API_URL}/notifications/test`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
          });
          console.log('[Push] Test notification sent');
        } else {
          console.warn('[Push] Failed to register token with backend');
        }
      }

      return true;
    } catch (error) {
      console.error('[Push] Error registering for push notifications:', error);
      if (isMissingNativeModuleError(error)) {
        Alert.alert(
          'Update Required',
          'Push notifications need a newer build of the app. This feature will work once the latest build is installed.',
        );
      } else {
        Alert.alert('Error', 'Failed to enable push notifications. Please try again.');
      }
      return false;
    }
  };

  /**
   * Unregister push token from the backend
   */
  const unregisterPushNotifications = async (): Promise<boolean> => {
    try {
      if (!expoPushToken) {
        // Try to get the token if we don't have it cached
        try {
          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: undefined,
          });
          const token = tokenData.data;

          const authToken = await SecureStore.getItemAsync('authToken');
          if (authToken && token) {
            await fetch(`${API_URL}/notifications/unregister-token`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({ token }),
            });
          }
        } catch {
          // Token may not be available, that's ok
        }
        setExpoPushToken(null);
        return true;
      }

      const authToken = await SecureStore.getItemAsync('authToken');
      if (authToken) {
        await fetch(`${API_URL}/notifications/unregister-token`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ token: expoPushToken }),
        });
        console.log('[Push] Token unregistered from backend');
      }

      setExpoPushToken(null);
      return true;
    } catch (error) {
      console.error('[Push] Error unregistering push notifications:', error);
      return false;
    }
  };

  return {
    expoPushToken,
    permissionGranted,
    registerForPushNotifications,
    unregisterPushNotifications,
  };
}
