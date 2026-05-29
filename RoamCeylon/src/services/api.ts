import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { showToast } from '../utils/toast';
import { CONFIG } from '../config';
import { logger } from '../utils/logger';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: CONFIG.API_BASE_URL,
      timeout: CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add auth token and user ID
    this.client.interceptors.request.use(
      async config => {
        const token = await SecureStore.getItemAsync('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        // Attach userId as header for controllers that use optional-auth pattern
        const userId = await SecureStore.getItemAsync('userId');
        if (userId) {
          config.headers['x-user-id'] = userId;
        }
        return config;
      },
      error => {
        logger.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        
        // Suppress 401 toast
        if (error.response?.status !== 401) {
          logger.error('API Error:', error);
          showToast.apiError(error);
        }

        // If 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = await SecureStore.getItemAsync('nhostRefreshToken');
            if (refreshToken) {
              const subdomain = process.env.EXPO_PUBLIC_NHOST_SUBDOMAIN;
              const region = process.env.EXPO_PUBLIC_NHOST_REGION;
              
              // Call Nhost auth endpoint directly to bypass SDK state issues
              const refreshRes = await axios.post(
                `https://${subdomain}.auth.${region}.nhost.run/v1/token`,
                { refreshToken }
              );

              const { accessToken, refreshToken: newRefreshToken } = refreshRes.data;
              
              if (accessToken) {
                // Save new tokens
                await SecureStore.setItemAsync('authToken', accessToken);
                if (newRefreshToken) {
                  await SecureStore.setItemAsync('nhostRefreshToken', newRefreshToken);
                }

                // Update auth header for the failed request and retry
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return this.client(originalRequest);
              }
            }
          } catch (refreshErr) {
            logger.error('Token refresh failed:', refreshErr);
          }

          // If refresh failed or no refresh token, log out
          await SecureStore.deleteItemAsync('authToken');
          await SecureStore.deleteItemAsync('nhostRefreshToken');
          
          // Optionally redirect to login or let AuthContext handle it
        }
        
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
