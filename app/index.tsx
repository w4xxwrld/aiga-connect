import { registerRootComponent } from 'expo';
import React from 'react';
import { Text, TextInput } from 'react-native';
import { Provider as PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';

// Disable font scaling from system settings to maintain consistent UI
// @ts-ignore - defaultProps is deprecated but still works for this use case
Text.defaultProps = Text.defaultProps || {};
// @ts-ignore
Text.defaultProps.allowFontScaling = false;
// @ts-ignore
Text.defaultProps.maxFontSizeMultiplier = 1;

// @ts-ignore
TextInput.defaultProps = TextInput.defaultProps || {};
// @ts-ignore
TextInput.defaultProps.allowFontScaling = false;
// @ts-ignore
TextInput.defaultProps.maxFontSizeMultiplier = 1;

// Custom theme with dark mode colors matching your app
const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#00D9FF',
    background: '#0D1B2A',
    surface: '#1B2838',
  },
};

function App() {
  return (
    <PaperProvider theme={theme}>
      <AppProvider>
        <AppNavigator />
      </AppProvider>
    </PaperProvider>
  );
}

registerRootComponent(App);

