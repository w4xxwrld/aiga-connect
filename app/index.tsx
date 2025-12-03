import { registerRootComponent } from 'expo';
import React from 'react';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  return (
    <AppProvider>
      <AppNavigator />
    </AppProvider>
  );
}

registerRootComponent(App);

