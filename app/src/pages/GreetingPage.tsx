import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import {
  Button,
} from 'react-native-paper';
import { useAppContext } from '../context/AppContext';

const { width, height } = Dimensions.get('window');

const GreetingPage: React.FC = () => {
  const { setHasSeenGreeting } = useAppContext();

  const handleLogin = () => {
    setHasSeenGreeting(true);
    // Navigate to auth screen in login mode
  };

  const handleRegistration = () => {
    setHasSeenGreeting(true);
    // Navigate to auth screen in registration mode
  };

  return (
    <View style={styles.container}>
      {/* Logo Section */}
      <View style={styles.logoSection}>
        <Image 
          source={require('../../assets/image.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>QAZAQ GRAPPLING</Text>
      </View>

      {/* Buttons Section */}
      <View style={styles.buttonSection}>
        <Button
          mode="contained"
          onPress={handleLogin}
          style={styles.loginButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          Login
        </Button>
        
        <Button
          mode="outlined"
          onPress={handleRegistration}
          style={styles.registrationButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          Registration
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingTop: 100,
    paddingBottom: 80,
  },
  logoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.6,
    height: height * 0.2,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '300',
    letterSpacing: 1,
  },
  buttonSection: {
    gap: 20,
  },
  loginButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    borderWidth: 0,
  },
  registrationButton: {
    borderColor: '#fff',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  buttonContent: {
    paddingVertical: 12,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default GreetingPage; 