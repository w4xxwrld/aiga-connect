import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Define navigation types
type RootStackParamList = {
  Greeting: undefined;
  Auth: undefined;
  MainTabs: undefined;
  ClassDetail: { classId: number };
  BookingDetail: { bookingId: number };
  BookClass: { classId: number };
  CreateClass: undefined;
  EditClass: { classId: number };
  ClassParticipants: { classId: number };
  EditProfile: undefined;
  LinkChild: undefined;
  RequestIndividualTraining: undefined;
  IndividualTrainingRequests: undefined;
};

type MainTabParamList = {
  Home: undefined;
  Classes: undefined;
  Bookings: undefined;
  Profile: undefined;
};

import { useAppContext } from '../context/AppContext';
import GreetingPage from '../pages/GreetingPage';
import AuthScreen from '../pages/AuthScreen';
import HomePage from '../pages/HomePage';
import ClassesPage from '../pages/ClassesPage';
import BookingsPage from '../pages/BookingsPage';
import ProfilePage from '../pages/ProfilePage';
import EditProfilePage from '../pages/EditProfilePage';
import LinkChildPage from '../pages/LinkChildPage';
import ClassDetailPage from '../pages/ClassDetailPage';
import BookClassPage from '../pages/BookClassPage';
import CreateClassPage from '../pages/CreateClassPage';
import EditClassPage from '../pages/EditClassPage';
import ClassParticipantsPage from '../pages/ClassParticipantsPage';
import BookingDetailPage from '../pages/BookingDetailPage';
import RequestIndividualTrainingPage from '../pages/RequestIndividualTrainingPage';
import IndividualTrainingRequestsPage from '../pages/IndividualTrainingRequestsPage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Fixed Header component
const FixedHeader: React.FC = () => (
  <View style={styles.fixedHeader}>
    <Text style={styles.headerTitle}>AIGA Connect</Text>
  </View>
);

// Main Layout with fixed header and tab navigation
const MainLayout: React.FC = () => {
  return (
    <View style={styles.mainLayout}>
      <FixedHeader />
      <View style={styles.tabContainer}>
        <MainTabs />
      </View>
    </View>
  );
};

// Tab Navigator
const MainTabs: React.FC = () => {
  const { userRole } = useAppContext();
  
  // Don't show Bookings tab for coaches
  const shouldShowBookings = userRole !== 'coach';

  const getTabIcon = (routeName: string, focused: boolean) => {
    const iconColor = focused ? '#E74C3C' : '#B0BEC5';
    const iconSize = 24;

    switch (routeName) {
      case 'Home':
        return <MaterialCommunityIcons name="home" size={iconSize} color={iconColor} />;
      case 'Classes':
        return <MaterialCommunityIcons name="calendar" size={iconSize} color={iconColor} />;
      case 'Bookings':
        return <MaterialCommunityIcons name="bookmark" size={iconSize} color={iconColor} />;
      case 'Profile':
        return <MaterialCommunityIcons name="account" size={iconSize} color={iconColor} />;
      default:
        return <MaterialCommunityIcons name="home" size={iconSize} color={iconColor} />;
    }
  };

  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case 'Home':
        return 'Главная';
      case 'Classes':
        return 'Занятия';
      case 'Bookings':
        return 'Записи';
      case 'Profile':
        return 'Профиль';
      default:
        return 'Главная';
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: any }) => ({
        tabBarIcon: ({ focused }: { focused: boolean }) => getTabIcon(route.name, focused),
        tabBarLabel: getTabLabel(route.name),
        tabBarActiveTintColor: '#E74C3C',
        tabBarInactiveTintColor: '#B0BEC5',
        tabBarStyle: {
          backgroundColor: '#1B263B',
          borderTopWidth: 1,
          borderTopColor: '#2C3E50',
          paddingBottom: 10,
          paddingTop: 5,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false, // Hide default headers
      })}
    >
      <Tab.Screen name="Home" component={HomePage} />
      <Tab.Screen name="Classes" component={ClassesPage} />
      {shouldShowBookings && <Tab.Screen name="Bookings" component={BookingsPage} />}
      <Tab.Screen name="Profile" component={ProfilePage} />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  const { hasSeenGreeting, isAuthenticated, isLoading } = useAppContext();
  const navigationRef = useRef<any>(null);
  const lastAuthState = useRef<boolean | null>(null);

  useEffect(() => {
    // Only handle logout navigation (when isAuthenticated changes from true to false)
    if (lastAuthState.current === true && isAuthenticated === false) {
      console.log('User logged out, navigating to Auth screen');
      // Use setTimeout to ensure navigation is ready
      setTimeout(() => {
        if (navigationRef.current) {
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'Auth' }],
          });
        }
      }, 100);
    }
    lastAuthState.current = isAuthenticated;
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E74C3C" />
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  const getInitialRouteName = () => {
    if (!hasSeenGreeting) return "Greeting";
    if (!isAuthenticated) return "Auth";
    return "MainTabs";
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator 
        initialRouteName={getInitialRouteName()}
        screenOptions={{ 
          headerShown: false
        }}
      >
        <Stack.Screen name="Greeting" component={GreetingPage} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="MainTabs" component={MainLayout} />
        <Stack.Screen name="ClassDetail" component={ClassDetailPage} />
        <Stack.Screen name="EditProfile" component={EditProfilePage} />
        <Stack.Screen name="LinkChild" component={LinkChildPage} />
        {/* Placeholder screens for future implementation */}
        <Stack.Screen name="BookingDetail" component={BookingDetailPage} />
        <Stack.Screen name="RequestIndividualTraining" component={RequestIndividualTrainingPage} />
        <Stack.Screen name="IndividualTrainingRequests" component={IndividualTrainingRequestsPage} />
        <Stack.Screen name="BookClass" component={BookClassPage} />
        <Stack.Screen name="CreateClass" component={CreateClassPage} />
        <Stack.Screen name="EditClass" component={EditClassPage} />
        <Stack.Screen name="ClassParticipants" component={ClassParticipantsPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D1B2A',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
  mainLayout: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  fixedHeader: {
    backgroundColor: '#0D1B2A',
    paddingTop: 56, // Safe area for status bar
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
    zIndex: 1000,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tabContainer: {
    flex: 1,
  },
});

export default AppNavigator; 