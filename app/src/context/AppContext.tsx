import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserRole = 'parent' | 'athlete' | 'coach';

interface AppContextType {
  hasSeenGreeting: boolean;
  userRole: UserRole | null;
  setHasSeenGreeting: (value: boolean) => void;
  setUserRole: (role: UserRole) => void;
  resetApp: () => Promise<void>;
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAppState();
  }, []);

  const loadAppState = async () => {
    try {
      // Load user role from AsyncStorage (persists across app sessions)
      const savedRole = await AsyncStorage.getItem('userRole');
      
      // Check if greeting has been seen in this app installation
      // This will be reset when app is reinstalled
      const greetingSeen = await AsyncStorage.getItem('greetingSeenThisInstall');
      
      setHasSeenGreeting(greetingSeen === 'true');
      setUserRole(savedRole as UserRole || null);
    } catch (error) {
      console.error('Error loading app state:', error);
      // On error, treat as new user
      setHasSeenGreeting(false);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetHasSeenGreeting = async (value: boolean) => {
    try {
      // Save to a key that persists only during this app installation
      await AsyncStorage.setItem('greetingSeenThisInstall', value.toString());
      setHasSeenGreeting(value);
    } catch (error) {
      console.error('Error saving greeting state:', error);
    }
  };

  const handleSetUserRole = async (role: UserRole) => {
    try {
      // Save user role to persist across app sessions
      await AsyncStorage.setItem('userRole', role);
      setUserRole(role);
    } catch (error) {
      console.error('Error saving user role:', error);
    }
  };

  const resetApp = async () => {
    try {
      // Clear only the greeting flag, keep user role
      await AsyncStorage.removeItem('greetingSeenThisInstall');
      setHasSeenGreeting(false);
      // Keep userRole as it might be useful to remember
    } catch (error) {
      console.error('Error resetting app:', error);
    }
  };

  const value: AppContextType = {
    hasSeenGreeting,
    userRole,
    setHasSeenGreeting: handleSetHasSeenGreeting,
    setUserRole: handleSetUserRole,
    resetApp,
    isLoading,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}; 