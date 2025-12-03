import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0D1B2A',
    card: '#1B263B',
    text: '#FFFFFF',
    border: '#2C3E50',
    primary: '#E74C3C',
  },
};

// Define navigation types
type RootStackParamList = {
  Greeting: undefined;
  Auth: undefined;
  OTPVerification: { phoneNumber: string; isRegistration: boolean };
  MainTabs: undefined;
  CoachPending: undefined;
  RoleSettings: undefined;
  ClassDetail: { classId: number };
  BookingDetail: { bookingId: number };
  BookClass: { classId: number };
  CreateClass: undefined;
  EditClass: { classId: number };
  ClassParticipants: { classId: number };
  Profile: undefined;
  EditProfile: undefined;
  RequestIndividualTraining: undefined;
  IndividualTrainingRequests: undefined;
  UsersManagement: undefined;
  AttendanceScanner: undefined;
  AttendanceHistory: undefined;
  AttendanceCalendar: undefined;
  CoachAttendanceDashboard: undefined;
  ClassAttendanceReport: { classId: number };
  AthleteInsights: undefined;
  AdminDashboard: undefined;
  PendingCoaches: undefined;
  UsersList: undefined;
  UserDetail: { userId: number };
  CoachesList: undefined;
  CoachDetail: { coachId: number };
  AdminAttendance: undefined;
};

type MainTabParamList = {
  Home: undefined;
  Classes: undefined;
  Attendance: undefined;
  YourClasses: undefined;
};

import { useAppContext } from '../context/AppContext';
import GreetingPage from '../pages/GreetingPage';
import AuthScreen from '../pages/AuthScreen';
import OTPVerificationScreen from '../pages/OTPVerificationScreen';
import HomePage from '../pages/HomePage';
import ClassesPage from '../pages/ClassesPage';
import BookingsPage from '../pages/BookingsPage';
import YourClassesPage from '../pages/YourClassesPage';
import ProfilePage from '../pages/ProfilePage';
import EditProfilePage from '../pages/EditProfilePage';
import ClassDetailPage from '../pages/ClassDetailPage';
import BookClassPage from '../pages/BookClassPage';
import CreateClassPage from '../pages/CreateClassPage';
import EditClassPage from '../pages/EditClassPage';
import ClassParticipantsPage from '../pages/ClassParticipantsPage';
import BookingDetailPage from '../pages/BookingDetailPage';
import RequestIndividualTrainingPage from '../pages/RequestIndividualTrainingPage';
import IndividualTrainingRequestsPage from '../pages/IndividualTrainingRequestsPage';
import UsersManagementPage from '../pages/UsersManagementPage';
import AttendanceTabPage from '../pages/attendance/AttendanceTabPage';
import AttendanceScannerPage from '../pages/attendance/AttendanceScannerPage';
import AttendanceHistoryPage from '../pages/attendance/AttendanceHistoryPage';
import AttendanceCalendarPage from '../pages/attendance/AttendanceCalendarPage';
import CoachAttendanceDashboardPage from '../pages/attendance/CoachAttendanceDashboardPage';
import ClassAttendanceReportPage from '../pages/attendance/ClassAttendanceReportPage';
import AthleteInsightsPage from '../pages/attendance/AthleteInsightsPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import PendingCoachesPage from '../pages/admin/PendingCoachesPage';
import UsersListPage from '../pages/admin/UsersListPage';
import UserDetailPage from '../pages/admin/UserDetailPage';
import CoachesListPage from '../pages/admin/CoachesListPage';
import CoachDetailPage from '../pages/admin/CoachDetailPage';
import AdminAttendancePage from '../pages/admin/AdminAttendancePage';
import CoachPendingPage from '../pages/CoachPendingPage';


const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Main Layout with tab navigation
const MainLayout: React.FC = () => {
  return (
    <View style={styles.mainLayout}>
      <View style={styles.tabContainer}>
        <MainTabs />
      </View>
    </View>
  );
};

// Custom Tab Bar Component
const CustomTabBar: React.FC<any> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const { isAdmin } = useAppContext();

  const getTabIcon = (routeName: string, focused: boolean) => {
    const iconColor = focused ? '#E74C3C' : '#B0BEC5';
    const iconSize = 24;

    switch (routeName) {
      case 'Home':
        return <MaterialCommunityIcons name="home" size={iconSize} color={iconColor} />;
      case 'Classes':
        return <MaterialCommunityIcons name="calendar" size={iconSize} color={iconColor} />;
      case 'Attendance':
        return <MaterialCommunityIcons name="clipboard-check-outline" size={iconSize} color={iconColor} />;
      case 'YourClasses':
        return <MaterialCommunityIcons name="bookmark-check" size={iconSize} color={iconColor} />;
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
      case 'Attendance':
        return 'Посещения';
      case 'YourClasses':
        return 'Ваши занятия';
      default:
        return 'Главная';
    }
  };

  // Minimal bottom padding
  const bottomPadding = Platform.OS === 'android'
    ? Math.max(insets.bottom, 8)
    : Math.max(insets.bottom, 8);

  return (
    <View style={[styles.customTabBar, { paddingBottom: bottomPadding }]}>
      {state.routes.map((route: any, index: number) => {
        // Hide Attendance tab for admins
        if (isAdmin && route.name === 'Attendance') {
          return null;
        }

        const { options } = descriptors[route.key];
        const label = getTabLabel(route.name);
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={onPress}
          >
            {getTabIcon(route.name, isFocused)}
            <Text style={[
              styles.tabLabel,
              { color: isFocused ? '#E74C3C' : '#B0BEC5' }
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// Tab Navigator
const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
      sceneContainerStyle={{ backgroundColor: '#0D1B2A' }}
    >
      <Tab.Screen name="Home" component={HomePage} />
      <Tab.Screen name="Classes" component={ClassesPage} />
      <Tab.Screen name="Attendance" component={AttendanceTabPage} />
      <Tab.Screen name="YourClasses" component={YourClassesPage} />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  const { hasSeenGreeting, isAuthenticated, isLoading, isCoachPending } = useAppContext();
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
    if (isCoachPending) return "CoachPending";
    return "MainTabs";
  };

  return (
    <NavigationContainer ref={navigationRef} theme={DarkTheme}>
      <Stack.Navigator
        initialRouteName={getInitialRouteName()}
        screenOptions={{
          headerShown: false
        }}
      >
        <Stack.Screen name="Greeting" component={GreetingPage} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
        <Stack.Screen name="CoachPending" component={CoachPendingPage} />
        <Stack.Screen name="MainTabs" component={MainLayout} />
        <Stack.Screen name="ClassDetail" component={ClassDetailPage} />
        <Stack.Screen name="Profile" component={ProfilePage} />
        <Stack.Screen name="EditProfile" component={EditProfilePage} />
        {/* Placeholder screens for future implementation */}
        <Stack.Screen name="BookingDetail" component={BookingDetailPage} />
        <Stack.Screen name="RequestIndividualTraining" component={RequestIndividualTrainingPage} />
        <Stack.Screen name="IndividualTrainingRequests" component={IndividualTrainingRequestsPage} />
        <Stack.Screen name="BookClass" component={BookClassPage} />
        <Stack.Screen name="CreateClass" component={CreateClassPage} />
        <Stack.Screen name="EditClass" component={EditClassPage} />
        <Stack.Screen name="ClassParticipants" component={ClassParticipantsPage} />
        <Stack.Screen name="UsersManagement" component={UsersManagementPage} />
        {/* Attendance screens */}
        <Stack.Screen name="AttendanceScanner" component={AttendanceScannerPage} />
        <Stack.Screen name="AttendanceHistory" component={AttendanceHistoryPage} />
        <Stack.Screen name="AttendanceCalendar" component={AttendanceCalendarPage} />
        <Stack.Screen name="CoachAttendanceDashboard" component={CoachAttendanceDashboardPage} />
        <Stack.Screen name="ClassAttendanceReport" component={ClassAttendanceReportPage} />
        <Stack.Screen name="AthleteInsights" component={AthleteInsightsPage} />
        {/* Admin screens */}
        <Stack.Screen name="AdminDashboard" component={AdminDashboardPage} />
        <Stack.Screen name="PendingCoaches" component={PendingCoachesPage} />
        <Stack.Screen name="UsersList" component={UsersListPage} />
        <Stack.Screen name="UserDetail" component={UserDetailPage} />
        <Stack.Screen name="CoachesList" component={CoachesListPage} />
        <Stack.Screen name="CoachDetail" component={CoachDetailPage} />
        <Stack.Screen name="AdminAttendance" component={AdminAttendancePage} />

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
  tabContainer: {
    flex: 1,
  },
  customTabBar: {
    flexDirection: 'row',
    backgroundColor: '#1B263B',
    borderTopWidth: 1,
    borderTopColor: '#2C3E50',
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});

export default AppNavigator;
