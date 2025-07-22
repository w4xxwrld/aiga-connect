import * as React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppProvider, useAppContext } from './src/context/AppContext';
import GreetingPage from './src/pages/GreetingPage';
import HomePage from './src/pages/HomePage';
import ProfilePage from './src/pages/ProfilePage';
import SettingsPage from './src/pages/SettingsPage';

const Stack = createNativeStackNavigator();

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#6200ee" />
      <Text style={styles.loadingText}>Загрузка...</Text>
    </View>
  );
}

function AppNavigator() {
  const { hasSeenGreeting, isLoading, resetApp } = useAppContext();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={hasSeenGreeting ? "Home" : "Greeting"}
        screenOptions={{ 
          headerShown: true,
          headerStyle: {
            backgroundColor: '#6200ee',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Greeting" 
          component={GreetingPage} 
          options={{ 
            title: 'Добро пожаловать',
            headerShown: false 
          }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomePage} 
          options={{ 
            title: 'AIGA Connect',
            headerRight: () => null
          }}
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfilePage} 
          options={{ 
            title: 'Профиль'
          }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsPage} 
          options={{ 
            title: 'Настройки'
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default function App() {
  return (
    <AppProvider>
      <AppNavigator />
    </AppProvider>
  );
}
