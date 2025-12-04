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
  otp: string,
  sessionId: string
): Promise<VerifyOTPResponse> => {
  try {
    // Placeholder implementation - replace with actual API endpoint
    const response = await apiService.post<VerifyOTPResponse>('/auth/verify-otp', {
      phoneNumber,
      otp,
      sessionId,
    });

    // Store token if verification successful
    if (response.success && response.token) {
      await storeAuthToken(response.token);
    }

    return response;
  } catch (error) {
    console.error('Verify OTP error:', error);
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
