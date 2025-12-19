import Toast from 'react-native-toast-message';
import { AxiosError } from 'axios';

/**
 * Toast notification helper utility
 * Provides standardized toast messages across the app
 */

export const showToast = {
  /**
   * Show success toast
   */
  success: (message: string, title: string = 'Success') => {
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
    });
  },

  /**
   * Show error toast
   */
  error: (message: string, title: string = 'Error') => {
    Toast.show({
      type: 'error',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 4000,
    });
  },

  /**
   * Show info toast
   */
  info: (message: string, title: string = 'Info') => {
    Toast.show({
      type: 'info',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
    });
  },

  /**
   * Show warning toast
   */
  warning: (message: string, title: string = 'Warning') => {
    Toast.show({
      type: 'warning',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
    });
  },

  /**
   * Handle API errors and show appropriate toast
   */
  apiError: (error: any, defaultMessage: string = 'Something went wrong') => {
    // Check if it's a network error
    if (error.message === 'Network Error' || !error.response) {
      Toast.show({
        type: 'error',
        text1: 'No Internet Connection',
        text2: 'Please check your internet connection and try again',
        position: 'top',
        visibilityTime: 4000,
      });
      return;
    }

    // Check for AxiosError with response
    if (error.response) {
      const message = error.response.data?.message || defaultMessage;
      const status = error.response.status;
      
      // Handle specific status codes
      if (status === 401) {
        Toast.show({
          type: 'error',
          text1: 'Unauthorized',
          text2: message,
          position: 'top',
          visibilityTime: 4000,
        });
      } else if (status === 404) {
        Toast.show({
          type: 'error',
          text1: 'Not Found',
          text2: message,
          position: 'top',
          visibilityTime: 4000,
        });
      } else if (status === 500) {
        Toast.show({
          type: 'error',
          text1: 'Server Error',
          text2: 'Something went wrong on our end. Please try again later.',
          position: 'top',
          visibilityTime: 4000,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: message,
          position: 'top',
          visibilityTime: 4000,
        });
      }
      return;
    }

    // Generic error fallback
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: defaultMessage,
      position: 'top',
      visibilityTime: 4000,
    });
  },
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: any): boolean => {
  return error.message === 'Network Error' || !error.response;
};
