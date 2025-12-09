import * as SecureStore from 'expo-secure-store';
import { apiService } from './api';

// Types
export interface OTPResponse {
  success: boolean;
  message: string;
  sessionId?: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    phoneNumber: string;
    name?: string;
  };
}

export interface UserProfile {
  id: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  birthday?: string; // Format: YYYY-MM-DD or ISO date string
  gender?: 'Male' | 'Female' | 'Other';
  profilePicture?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Token management
export const storeAuthToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync('authToken', token);
};

export const getAuthToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync('authToken');
};

export const removeAuthToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync('authToken');
};

// Auth API functions
export const sendOtp = async (phoneNumber: string): Promise<OTPResponse> => {
  try {
    // Placeholder implementation - replace with actual API endpoint
    const response = await apiService.post<OTPResponse>('/auth/send-otp', {
      phoneNumber,
    });
    return response;
  } catch (error) {
    console.error('Send OTP error:', error);
    throw error;
  }
};

export const verifyOtp = async (
  phoneNumber: string,
  otp: string
): Promise<{ accessToken: string; user: { id: string; phoneNumber: string } }> => {
  try {
    // Backend returns { token: "fake-jwt" } for mock
    const response = await apiService.post<{ token: string }>('/auth/verify-otp', {
      phoneNumber,
      otp,
    });

    // Store token if verification successful
    if (response.token) {
      await storeAuthToken(response.token);
    }

    // Return in expected format for compatibility
    return {
      accessToken: response.token,
      user: {
        id: 'mock-user-id',
        phoneNumber,
      },
    };
  } catch (error) {
    console.error('Verify OTP error:', error);
    throw error;
  }
};

export const getMe = async (): Promise<UserProfile> => {
  try {
    const response = await apiService.get<UserProfile>('/users/me');
    return response;
  } catch (error) {
    console.error('Get user profile error:', error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await removeAuthToken();
    // Additional logout logic (clear cache, reset state, etc.)
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const checkAuthStatus = async (): Promise<boolean> => {
  const token = await getAuthToken();
  return !!token;
};
