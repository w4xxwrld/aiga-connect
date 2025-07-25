import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Define navigation types
type RootStackParamList = {
  Greeting: undefined;
  Auth: undefined;
  MainTabs: undefined;
};

type HomeStackParamList = {
  HomeMain: undefined;
  MerchandiseStore: undefined;
  MerchandiseDetail: { itemId: string };
};

type ScheduleStackParamList = {
  ScheduleMain: undefined;
  TrainingDetail: { trainingId: string };
  CreateTraining: undefined;
};
import { useAppContext } from '../context/AppContext';
import GreetingPage from '../pages/GreetingPage';
import AuthScreen from '../pages/AuthScreen';
import HomePage from '../pages/HomePage';
import SchedulePage from '../pages/SchedulePage';
import ProgressPage from '../pages/ProgressPage';
import CommunityPage from '../pages/CommunityPage';
import ProfilePage from '../pages/ProfilePage';
import SettingsPage from '../pages/SettingsPage';
import TrainingDetailPage from '../pages/TrainingDetailPage';
import CreateTrainingPage from '../pages/CreateTrainingPage';
import MerchandisePage from '../pages/MerchandisePage';
import MerchandiseDetailPage from '../pages/MerchandiseDetailPage';
import NotificationsPage from '../pages/NotificationsPage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Stack Navigator for Home and related pages
const HomeStackNavigator = () => {
  const HomeStack = createStackNavigator();
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1B263B' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <HomeStack.Screen 
        name="HomeMain" 
        component={HomePage} 
        options={{ title: 'AIGA Connect' }}
      />
      <HomeStack.Screen 
        name="MerchandiseStore" 
        component={MerchandisePage} 
        options={{ title: 'Магазин' }}
      />
      <HomeStack.Screen 
        name="MerchandiseDetail" 
        component={MerchandiseDetailPage} 
        options={{ title: 'Товар' }}
      />
    </HomeStack.Navigator>
  );
};

// Stack Navigator for Schedule and related pages
const ScheduleStackNavigator = () => {
  const ScheduleStack = createStackNavigator();
  return (
    <ScheduleStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1B263B' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <ScheduleStack.Screen 
        name="ScheduleMain" 
        component={SchedulePage} 
        options={{ title: 'Расписание' }}
      />
      <ScheduleStack.Screen 
        name="TrainingDetail" 
        component={TrainingDetailPage} 
        options={{ title: 'Детали тренировки' }}
      />
      <ScheduleStack.Screen 
        name="CreateTraining" 
        component={CreateTrainingPage} 
        options={{ title: 'Создать тренировку' }}
      />
    </ScheduleStack.Navigator>
  );
};

// Stack Navigator for Progress
const ProgressStackNavigator = () => {
  const ProgressStack = createStackNavigator();
  return (
    <ProgressStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1B263B' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <ProgressStack.Screen 
        name="ProgressMain" 
        component={ProgressPage} 
        options={{ title: 'Прогресс' }}
      />
    </ProgressStack.Navigator>
  );
};

// Stack Navigator for Community
const CommunityStackNavigator = () => {
  const CommunityStack = createStackNavigator();
  return (
    <CommunityStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1B263B' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <CommunityStack.Screen 
        name="CommunityMain" 
        component={CommunityPage} 
        options={{ title: 'Общение' }}
      />
    </CommunityStack.Navigator>
  );
};

// Stack Navigator for Profile
const ProfileStackNavigator = () => {
  const ProfileStack = createStackNavigator();
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1B263B' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <ProfileStack.Screen 
        name="ProfileMain" 
        component={ProfilePage} 
        options={{ title: 'Профиль' }}
      />
    </ProfileStack.Navigator>
  );
};

// Stack Navigator for Settings
const SettingsStackNavigator = () => {
  const SettingsStack = createStackNavigator();
  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1B263B' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <SettingsStack.Screen 
        name="SettingsMain" 
        component={SettingsPage} 
        options={{ title: 'Настройки' }}
      />
      <SettingsStack.Screen 
        name="Notifications" 
        component={NotificationsPage} 
        options={{ title: 'Уведомления' }}
      />
    </SettingsStack.Navigator>
  );
};

// Main Tab Navigator
const MainTabs: React.FC = () => {
  const { userRole } = useAppContext();

  const getTabIcon = (routeName: string, focused: boolean) => {
    const iconColor = focused ? '#E74C3C' : '#fff';
    
    switch (routeName) {
      case 'HomeTab':
        return <MaterialCommunityIcons name="home" size={24} color={iconColor} />;
      case 'ScheduleTab':
        return <MaterialCommunityIcons name="calendar" size={24} color={iconColor} />;
      case 'ProgressTab':
        return <MaterialCommunityIcons name="chart-line" size={24} color={iconColor} />;
      case 'CommunityTab':
        return <MaterialCommunityIcons name="account-group" size={24} color={iconColor} />;
      case 'ProfileTab':
        return <MaterialCommunityIcons name="account" size={24} color={iconColor} />;
      case 'SettingsTab':
        return <MaterialCommunityIcons name="cog" size={24} color={iconColor} />;
      default:
        return <MaterialCommunityIcons name="home" size={24} color={iconColor} />;
    }
  };

  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case 'HomeTab':
        return 'Главная';
      case 'ScheduleTab':
        return 'Расписание';
      case 'ProgressTab':
        return 'Прогресс';
      case 'CommunityTab':
        return 'Общение';
      case 'ProfileTab':
        return 'Профиль';
      case 'SettingsTab':
        return 'Настройки';
      default:
        return 'Главная';
    }
  };

  // Show Progress tab only for athletes and parents
  const showProgressTab = userRole === 'athlete' || userRole === 'parent';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => getTabIcon(route.name, focused),
        tabBarLabel: getTabLabel(route.name),
        tabBarActiveTintColor: '#E74C3C',
        tabBarInactiveTintColor: '#fff',
        tabBarStyle: {
          backgroundColor: '#1B263B',
          borderTopWidth: 1,
          borderTopColor: '#2C3E50',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false, // Hide tab headers since stack navigators handle them
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} />
      <Tab.Screen name="ScheduleTab" component={ScheduleStackNavigator} />
      {showProgressTab && (
        <Tab.Screen name="ProgressTab" component={ProgressStackNavigator} />
      )}
      <Tab.Screen name="CommunityTab" component={CommunityStackNavigator} />
      <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} />
      <Tab.Screen name="SettingsTab" component={SettingsStackNavigator} />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  const { hasSeenGreeting, isAuthenticated, isLoading } = useAppContext();

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
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={getInitialRouteName()}
        screenOptions={{ 
          headerShown: false
        }}
      >
        <Stack.Screen name="Greeting" component={GreetingPage} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
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
});

export default AppNavigator; 