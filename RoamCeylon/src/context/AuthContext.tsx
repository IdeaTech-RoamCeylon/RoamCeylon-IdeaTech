import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { checkAuthStatus, storeAuthToken, removeAuthToken, getMe, UserProfile } from '../services/auth';

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

  // Memoize refreshUser to prevent recreation
  const refreshUser = useCallback(async () => {
    try {
      const userData = await getMe();
      setUser(userData);
      
      // Check if profile is complete (has name and email)
      const profileComplete = !!(userData?.name && userData?.email);
      setIsProfileComplete(profileComplete);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setUser(null);
      setIsProfileComplete(false);
    }
  }, []);

  // Memoize updateUserProfile to prevent recreation
  const updateUserProfile = useCallback((userData: UserProfile) => {
    setUser(userData);
    const profileComplete = !!(userData?.name && userData?.email);
    setIsProfileComplete(profileComplete);
  }, []);

  // Memoize login to prevent recreation
  const login = useCallback(async (token: string) => {
    await storeAuthToken(token);
    setIsAuthenticated(true);
    
    // Fetch user profile after login
    await refreshUser();
  }, [refreshUser]);

  // Memoize logout to prevent recreation
  const logout = useCallback(async () => {
    await removeAuthToken();
    setIsAuthenticated(false);
    setUser(null);
    setIsProfileComplete(false);
  }, []);

  useEffect(() => {
    // Check auth status on app start
    const checkAuth = async () => {
      const authStatus = await checkAuthStatus();
      setIsAuthenticated(authStatus);
      
      // If authenticated, fetch user profile
      if (authStatus) {
        await refreshUser();
      }
      
      setIsLoading(false);
    };
    checkAuth();
  }, [refreshUser]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    isAuthenticated,
    isLoading,
    user,
    isProfileComplete,
    setUser,
    updateUserProfile,
    login,
    logout,
    refreshUser,
  }), [isAuthenticated, isLoading, user, isProfileComplete, updateUserProfile, login, logout, refreshUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
