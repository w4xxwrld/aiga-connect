import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService, { User } from '../services/auth';

type UserRole = 'athlete' | 'coach' | 'admin';

interface AppContextType {
  hasSeenGreeting: boolean;
  userRole: UserRole | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isCoachPending: boolean;
  setHasSeenGreeting: (value: boolean) => void;
  setUserRole: (role: UserRole) => void;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (value: boolean) => void;
  resetApp: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [hasSeenGreeting, setHasSeenGreeting] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAppState();
  }, []);

  const loadAppState = async () => {
    try {
      // Check authentication status
      const authenticated = await authService.isAuthenticated();
      console.log('AppContext: Authentication status:', authenticated);
      setIsAuthenticated(authenticated);

      if (authenticated) {
        // Always try to get fresh user data from API first
        const freshUserData = await authService.getCurrentUser();
        console.log('🔍 [DEBUG] AppContext loadAppState - freshUserData:', JSON.stringify(freshUserData, null, 2));
        console.log('🔍 [DEBUG] AppContext loadAppState - freshUserData.primary_role:', freshUserData?.primary_role);

        if (freshUserData) {
          setUser(freshUserData);
          setUserRole(freshUserData.primary_role);
          console.log('🔍 [DEBUG] AppContext - setUserRole called with:', freshUserData.primary_role);
        } else {
          // Fallback to stored data if API fails
          const userData = await authService.getUserData();

          if (userData) {
            setUser(userData);
            setUserRole(userData.primary_role);
          } else {
            // No valid user data, clear authentication
            console.log('AppContext: No valid user data, clearing auth');
            await authService.logout();
            setIsAuthenticated(false);
            setUser(null);
            setUserRole(null);
          }
        }
      } else {
        // Load user role from AsyncStorage (for non-authenticated users)
        const savedRole = await AsyncStorage.getItem('userRole');
        setUserRole(savedRole as UserRole || null);
      }
      
      // Check if greeting has been seen in this app installation
      const greetingSeen = await AsyncStorage.getItem('greetingSeenThisInstall');
      setHasSeenGreeting(greetingSeen === 'true');
    } catch (error) {
      console.error('Error loading app state:', error);
      // On error, treat as new user
      setHasSeenGreeting(false);
      setUserRole(null);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetHasSeenGreeting = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('greetingSeenThisInstall', value.toString());
      setHasSeenGreeting(value);
    } catch (error) {
      console.error('Error saving greeting state:', error);
    }
  };

  const handleSetUserRole = async (role: UserRole) => {
    try {
      await AsyncStorage.setItem('userRole', role);
      setUserRole(role);
    } catch (error) {
      console.error('Error saving user role:', error);
    }
  };

  const handleSetUser = async (userData: User | null) => {
    console.log('handleSetUser called with:', userData);
    if (userData) {
      await authService.storeUserData(userData);
      setUser(userData);
      setUserRole(userData.primary_role);
      setIsAuthenticated(true);
      console.log('User set, isAuthenticated should be true now');
    } else {
      setUser(null);
      setUserRole(null);
      setIsAuthenticated(false);
      console.log('User cleared, isAuthenticated should be false now');
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setUserRole(null);
      setIsAuthenticated(false);

      // Don't manually navigate - let NavigationHandler handle it automatically
      console.log('Logging out, authentication state cleared');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const resetApp = async () => {
    try {
      await AsyncStorage.removeItem('greetingSeenThisInstall');
      setHasSeenGreeting(false);
    } catch (error) {
      console.error('Error resetting app:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const freshUserData = await authService.getCurrentUser();
      if (freshUserData) {
        setUser(freshUserData);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  console.log('🔍 [DEBUG] AppContext value creation - userRole:', userRole, 'user?.primary_role:', user?.primary_role);

  const isCoachPending = user?.primary_role === 'coach' && user?.role_status === 'pending';

  const value: AppContextType = {
    hasSeenGreeting,
    userRole,
    user,
    isAuthenticated,
    isLoading,
    isAdmin: user?.primary_role === 'admin',
    isCoachPending,
    setHasSeenGreeting: handleSetHasSeenGreeting,
    setUserRole: handleSetUserRole,
    setUser: handleSetUser,
    setIsAuthenticated,
    resetApp,
    logout: handleLogout,
    refreshUser,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}; 