import React, { createContext, useState, useContext, useEffect } from 'react';
import { checkAuthStatus, storeAuthToken, removeAuthToken, getMe, UserProfile } from '../services/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Fetch user profile data
  const refreshUser = async () => {
    try {
      const userData = await getMe();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setUser(null);
    }
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
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        isLoading, 
        user, 
        setUser, 
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
