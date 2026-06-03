import { Alert } from 'react-native';

/**
 * Toast notification helper utility for the Admin app.
 * Uses Alert.alert() as a lightweight cross-platform fallback
 * since react-native-toast-message is not installed.
 */
export const showToast = {
  success: (message: string, title: string = 'Success') => {
    Alert.alert(title, message);
  },

  error: (message: string, title: string = 'Error') => {
    Alert.alert(title, message);
  },

  info: (message: string, title: string = 'Info') => {
    Alert.alert(title, message);
  },

  warning: (message: string, title: string = 'Warning') => {
    Alert.alert(title, message);
  },
};
