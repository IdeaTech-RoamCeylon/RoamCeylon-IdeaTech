import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  storeAuthToken,
  removeAuthToken,
  getMe,
  UserProfile,
  updateProfile,
} from '../services/auth';
import { nhost } from '../config/nhostClient';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  isProfileComplete: boolean;
  setUser: (user: UserProfile | null) => void;
  updateUserProfile: (userData: UserProfile) => void;
  login: (token: string, nhostUser?: any) => Promise<{ isProfileComplete: boolean }>;
  logout: () => Promise<void>;
  refreshUser: (nhostUserArg?: any) => Promise<{ isProfileComplete: boolean }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  // Memoize refreshUser to prevent recreation.
  const refreshUser = useCallback(async (nhostUserArg?: any) => {
    try {
      let userData = await getMe();
      let profileComplete = !!(userData?.name && userData?.email);

      // If the NestJS profile is missing any details, try to sync it from either
      // 1. Temporary registration data stored in SecureStore
      // 2. Nhost's authenticated user details (passed directly or fetched from client)
      const needsSync = !userData?.name || !userData?.email || !userData?.phoneNumber || !userData?.birthday || !userData?.gender;
      if (needsSync) {
        const tempRegDataStr = await SecureStore.getItemAsync('tempRegistrationData');
        if (tempRegDataStr) {
          try {
            const tempRegData = JSON.parse(tempRegDataStr);
            if (tempRegData?.name && tempRegData?.email) {
              const birthdayDate = tempRegData.birthday ? new Date(tempRegData.birthday) : undefined;
              userData = await updateProfile(
                tempRegData.name,
                tempRegData.email,
                birthdayDate,
                tempRegData.gender,
                tempRegData.phoneNumber,
                tempRegData.isLocal,
              );
              profileComplete = !!(userData?.name && userData?.email);
              
              // Clear the temporary registration data after successful sync
              await SecureStore.deleteItemAsync('tempRegistrationData');
            }
          } catch (e) {
            console.error('Failed to parse temp registration data:', e);
          }
        }

        // Fallback to Nhost user object if SecureStore data wasn't found or failed
        // (or if we still need to sync details like phoneNumber for existing users)
        const stillNeedsSync = !userData?.name || !userData?.email || !userData?.phoneNumber || !userData?.birthday || !userData?.gender;
        if (stillNeedsSync) {
          const nhostUser = nhostUserArg || nhost.auth.getUser();
          if (nhostUser?.displayName && nhostUser?.email) {
            const birthdayStr = nhostUser.metadata?.birthday as string | undefined;
            const birthdayDate = birthdayStr ? new Date(birthdayStr) : undefined;
            const gender = nhostUser.metadata?.gender as string | undefined;
            const phone = nhostUser.metadata?.phoneNumber as string | undefined;

            const isLocal = nhostUser.metadata?.isLocal as boolean | undefined;

            // Auto-sync profile to NestJS backend
            userData = await updateProfile(
              nhostUser.displayName,
              nhostUser.email,
              birthdayDate,
              gender,
              phone,
              isLocal,
            );
            profileComplete = !!(userData?.name && userData?.email);
          }
        }
      }

      setUser(userData);
      setIsProfileComplete(profileComplete);
      return { isProfileComplete: profileComplete };
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setUser(null);
      setIsProfileComplete(false);
      return { isProfileComplete: false };
    }
  }, []);

  const updateUserProfile = useCallback((userData: UserProfile) => {
    setUser(userData);
    const profileComplete = !!(userData?.name && userData?.email);
    setIsProfileComplete(profileComplete);
  }, []);

  /**
   * Called after a successful Nhost sign-in (Google or SMS OTP).
   * The Nhost access token has already been stored in SecureStore before
   * this is called (by GoogleSignInScreen / OTPScreen), so the API
   * interceptor will pick it up automatically.
   */
  const login = useCallback(
    async (token: string, nhostUser?: any) => {
      await storeAuthToken(token);
      setIsAuthenticated(true);
      return await refreshUser(nhostUser);
    },
    [refreshUser],
  );

  /**
   * Signs the user out of both Nhost and the local app state.
   * Uses the stored refresh token to invalidate the session server-side.
   */
  const logout = useCallback(async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync('nhostRefreshToken');
      // Sign out from Nhost — invalidates the session server-side.
      await nhost.auth.signOut(
        refreshToken ? { refreshToken } : {},
      );
    } catch (err) {
      // Non-fatal: even if Nhost sign-out fails, clear local state.
      console.warn('Nhost sign-out error (ignored):', err);
    } finally {
      await removeAuthToken();
      await SecureStore.deleteItemAsync('nhostRefreshToken');
      setIsAuthenticated(false);
      setUser(null);
      setIsProfileComplete(false);
    }
  }, []);

  useEffect(() => {
    // On app start, check if a stored auth token still exists.
    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync('authToken');
        if (token) {
          setIsAuthenticated(true);
          await refreshUser();
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [refreshUser]);

  const contextValue = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      user,
      isProfileComplete,
      setUser,
      updateUserProfile,
      login,
      logout,
      refreshUser,
    }),
    [isAuthenticated, isLoading, user, isProfileComplete, updateUserProfile, login, logout, refreshUser],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
