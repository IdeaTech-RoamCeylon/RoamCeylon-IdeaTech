import * as SecureStore from 'expo-secure-store';
import { apiService } from './api';
import { logger } from '../utils/logger';

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
  accessToken?: string;
  user?: {
    id: string;
    phoneNumber: string;
    name?: string;
  };
}

export interface UserProfile {
  id: string;
  phoneNumber?: string;
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

export const storeUserId = async (userId: string): Promise<void> => {
  await SecureStore.setItemAsync('userId', userId);
};

export const getUserId = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync('userId');
};

export const removeUserId = async (): Promise<void> => {
  await SecureStore.deleteItemAsync('userId');
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
    logger.error('Send OTP error:', error);
    throw error;
  }
};

// Backend response wrapper structure
export interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  timestamp: string;
  path: string;
  data: T;
  meta?: any;
}

export const verifyOtp = async (
  phoneNumber: string,
  otp: string
): Promise<{ accessToken: string; user: { id: string; phoneNumber: string } }> => {
  try {
    // Backend returns wrapped response: { data: { accessToken: "...", user: {...} }, success: true, ... }
    const response = await apiService.post<ApiResponse<{ accessToken: string; user: { id: string; phoneNumber: string } }>>('/auth/verify-otp', {
      phoneNumber,
      otp,
    });

    const accessToken = response.data?.accessToken;

    if (!accessToken) {
      logger.error('Verify OTP response missing token:', response);
      throw new Error('No access token received from server');
    }

    // Store token and user ID if verification successful
    await storeAuthToken(accessToken);

    const user = response.data?.user || {
      id: '',
      phoneNumber: phoneNumber
    };

    // Persist userId so API interceptor can attach x-user-id header
    if (user.id) {
      await storeUserId(user.id);
    }

    return {
      accessToken,
      user
    };
  } catch (error) {
    logger.error('Verify OTP error:', error);
    throw error;
  }
};

export const getMe = async (): Promise<UserProfile> => {
  try {
    const response = await apiService.get<ApiResponse<UserProfile>>('/users/me');
    return response.data;
  } catch (error) {
    logger.error('Get user profile error:', error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await removeAuthToken();
    await removeUserId();
    // Additional logout logic (clear cache, reset state, etc.)
  } catch (error) {
    logger.error('Logout error:', error);
    throw error;
  }
};


export const updateProfile = async (
  name: string,
  email: string,
  birthday?: Date,
  gender?: string
): Promise<UserProfile> => {
  try {
    const response = await apiService.patch<ApiResponse<UserProfile>>('/users/me', {
      name,
      email,
      birthday: birthday?.toISOString(),
      gender,
    });
    return response.data;
  } catch (error) {
    logger.error('Update profile error:', error);
    throw error;
  }
};

export const checkAuthStatus = async (): Promise<boolean> => {
  const token = await getAuthToken();
  return !!token;
};
