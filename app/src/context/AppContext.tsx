import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserRole = 'parent' | 'athlete' | 'coach';

interface AppContextType {
  hasSeenGreeting: boolean;
  userRole: UserRole | null;
  setHasSeenGreeting: (value: boolean) => void;
  setUserRole: (role: UserRole) => void;
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
      const [greetingSeen, savedRole] = await Promise.all([
        AsyncStorage.getItem('hasSeenGreeting'),
        AsyncStorage.getItem('userRole'),
      ]);
      setHasSeenGreeting(greetingSeen === 'true');
      setUserRole(savedRole as UserRole || null);
    } catch (error) {
      console.error('Error loading app state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetHasSeenGreeting = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('hasSeenGreeting', value.toString());
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

  const value: AppContextType = {
    hasSeenGreeting,
    userRole,
    setHasSeenGreeting: handleSetHasSeenGreeting,
    setUserRole: handleSetUserRole,
    isLoading,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}; 