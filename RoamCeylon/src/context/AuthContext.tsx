import React, { createContext, useState, useContext, useEffect } from 'react';
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

  // Fetch user profile data
  const refreshUser = async () => {
    try {
      console.log('=== AuthContext: Fetching user from /users/me ===');
      const userData = await getMe();
      console.log('User data from backend:', JSON.stringify(userData, null, 2));
      setUser(userData);
      
      // Check if profile is complete (has name and email)
      const profileComplete = !!(userData?.name && userData?.email);
      console.log('Profile complete?', profileComplete);
      setIsProfileComplete(profileComplete);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setUser(null);
      setIsProfileComplete(false);
    }
  };

  // Update user profile and check completion
  const updateUserProfile = (userData: UserProfile) => {
    setUser(userData);
    const profileComplete = !!(userData?.name && userData?.email);
    setIsProfileComplete(profileComplete);
  };

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
  }, []);

  const login = async (token: string) => {
    await storeAuthToken(token);
    setIsAuthenticated(true);
    
    // Fetch user profile after login
    await refreshUser();
  };

  const logout = async () => {
    await removeAuthToken();
    setIsAuthenticated(false);
    setUser(null);
    setIsProfileComplete(false);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        isLoading, 
        user,
        isProfileComplete,
        setUser,
        updateUserProfile,
        login, 
        logout,
        refreshUser 
      }}
    >
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
