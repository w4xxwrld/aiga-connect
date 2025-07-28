import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService, { User } from '../services/auth';
import childrenService, { Child } from '../services/children';

type UserRole = 'parent' | 'athlete' | 'coach';

interface AppContextType {
  hasSeenGreeting: boolean;
  userRole: UserRole | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  linkedChildren: Child[];
  setHasSeenGreeting: (value: boolean) => void;
  setUserRole: (role: UserRole) => void;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (value: boolean) => void;
  setLinkedChildren: (children: Child[]) => void;
  loadChildren: () => Promise<void>;
  resetApp: () => Promise<void>;
  logout: () => Promise<void>;
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
  const [linkedChildren, setLinkedChildren] = useState<Child[]>([]);

  useEffect(() => {
    loadAppState();
  }, []);

  const loadAppState = async () => {
    try {
      // Check authentication status
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        // Load user data
        const userData = await authService.getUserData();
        if (userData) {
          setUser(userData);
          setUserRole(userData.primary_role);
          
          // Load children if user is a parent
          if (userData.primary_role === 'parent') {
            await loadChildren();
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
      setLinkedChildren([]);
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
      
      // Load children if user is a parent
      if (userData.primary_role === 'parent') {
        await loadChildren();
      }
    } else {
      setUser(null);
      setUserRole(null);
      setIsAuthenticated(false);
      setLinkedChildren([]);
      console.log('User cleared, isAuthenticated should be false now');
    }
  };

  const handleSetLinkedChildren = (childrenData: Child[]) => {
    setLinkedChildren(childrenData);
  };

  const loadChildren = async () => {
    try {
      if (user?.primary_role === 'parent') {
        const childrenData = await childrenService.getMyChildren();
        setLinkedChildren(childrenData);
        await AsyncStorage.setItem('children', JSON.stringify(childrenData));
      }
    } catch (error) {
      console.error('Error loading children:', error);
      // Try to load from storage as fallback
      try {
        const savedChildren = await AsyncStorage.getItem('children');
        if (savedChildren) {
          setLinkedChildren(JSON.parse(savedChildren));
        }
      } catch (storageError) {
        console.error('Error loading children from storage:', storageError);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setUserRole(null);
      setIsAuthenticated(false);
      setLinkedChildren([]);
      
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

  const value: AppContextType = {
    hasSeenGreeting,
    userRole,
    user,
    isAuthenticated,
    isLoading,
    linkedChildren,
    setHasSeenGreeting: handleSetHasSeenGreeting,
    setUserRole: handleSetUserRole,
    setUser: handleSetUser,
    setIsAuthenticated,
    setLinkedChildren: handleSetLinkedChildren,
    loadChildren,
    resetApp,
    logout: handleLogout,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}; 