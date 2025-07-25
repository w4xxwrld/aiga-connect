import * as React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <PaperProvider>
      <AppProvider>
        <AppNavigator />
      </AppProvider>
    </PaperProvider>
  );
}
