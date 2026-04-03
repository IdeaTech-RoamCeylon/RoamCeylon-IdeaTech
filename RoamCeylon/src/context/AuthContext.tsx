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
} from '../services/auth';
import { nhost } from '../config/nhostClient';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  isProfileComplete: boolean;
  setUser: (user: UserProfile | null) => void;
  updateUserProfile: (userData: UserProfile) => void;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  // Memoize refreshUser to prevent recreation.
  const refreshUser = useCallback(async () => {
    try {
      const userData = await getMe();
      setUser(userData);
      const profileComplete = !!(userData?.name && userData?.email);
      setIsProfileComplete(profileComplete);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setUser(null);
      setIsProfileComplete(false);
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
    async (token: string) => {
      await storeAuthToken(token);
      setIsAuthenticated(true);
      await refreshUser();
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
