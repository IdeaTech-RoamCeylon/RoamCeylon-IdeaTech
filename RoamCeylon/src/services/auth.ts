import * as SecureStore from 'expo-secure-store';
import { apiService } from './api';
import { logger } from '../utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

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

/** Standard wrapper used by the NestJS backend on all API responses. */
export interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  timestamp: string;
  path: string;
  data: T;
  meta?: any;
}

// ─── Token management (SecureStore) ───────────────────────────────────────────
// The stored `authToken` is the Nhost access token after sign-in.
// The API interceptor in api.ts reads it to set Authorization headers.

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

export const checkAuthStatus = async (): Promise<boolean> => {
  const token = await getAuthToken();
  return !!token;
};

// ─── User profile API (still calls NestJS — protected by Nhost JWT guard) ────

export const getMe = async (): Promise<UserProfile> => {
  try {
    const response = await apiService.get<ApiResponse<UserProfile>>('/users/me');
    return response.data;
  } catch (error) {
    logger.error('Get user profile error:', error);
    throw error;
  }
};

export const updateProfile = async (
  name: string,
  email: string,
  birthday?: Date,
  gender?: string,
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

/**
 * Local logout helper.
 * NOTE: The full sign-out (including Nhost session invalidation) is handled in
 * AuthContext.logout() using nhost.auth.signOut(). This function is kept only
 * for utility — prefer AuthContext.logout() in components.
 */
export const logout = async (): Promise<void> => {
  try {
    await removeAuthToken();
    await removeUserId();
  } catch (error) {
    logger.error('Logout error:', error);
    throw error;
  }
};
