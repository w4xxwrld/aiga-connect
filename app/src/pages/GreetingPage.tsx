import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import {
  Button,
} from 'react-native-paper';
import { useAppContext } from '../context/AppContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface GreetingPageProps {
  navigation: any;
}

const GreetingPage: React.FC<GreetingPageProps> = ({ navigation }) => {
  const { setHasSeenGreeting } = useAppContext();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const buttonSlideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(logoScaleAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Animate buttons after logo animation completes
      Animated.timing(buttonSlideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const handleLogin = () => {
    setHasSeenGreeting(true);
    // Manual navigation to Auth screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' as never }],
    });
  };

  const handleRegistration = () => {
    setHasSeenGreeting(true);
    // Manual navigation to Auth screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' as never }],
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1B2A" />
      
      {/* Background gradient effect */}
      <View style={styles.backgroundGradient} />
      
      {/* Logo Section */}
      <Animated.View 
        style={[
          styles.logoSection,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: logoScaleAnim }
            ],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/image.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.logoGlow} />
        </View>
        
        <Text style={styles.title}>AIGA CONNECT</Text>
        <Text style={styles.subtitle}>QAZAQ GRAPPLING</Text>
        
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="account-group" size={20} color="#E74C3C" />
            <Text style={styles.featureText}>Спортсмены</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="account-child" size={20} color="#E74C3C" />
            <Text style={styles.featureText}>Родители</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="account-tie" size={20} color="#E74C3C" />
            <Text style={styles.featureText}>Тренеры</Text>
          </View>
        </View>
      </Animated.View>

      {/* Buttons Section */}
      <Animated.View 
        style={[
          styles.buttonSection,
          {
            transform: [{ translateY: buttonSlideAnim }],
          },
        ]}
      >
        <Button
          mode="contained"
          onPress={handleLogin}
          style={styles.loginButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          icon="login"
        >
          Войти
        </Button>
        
        <Button
          mode="outlined"
          onPress={handleRegistration}
          style={styles.registrationButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          icon="account-plus"
        >
          Регистрация
        </Button>
        
        <Text style={styles.footerText}>
          Присоединяйтесь к сообществу AIGA
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingTop: 60,
    paddingBottom: 80,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0D1B2A',
    opacity: 0.9,
  },
  logoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  logo: {
    width: width * 0.6,
    height: height * 0.2,
    zIndex: 2,
  },
  logoGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: '#E74C3C',
    opacity: 0.1,
    borderRadius: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#E74C3C',
    textAlign: 'center',
    fontWeight: '300',
    letterSpacing: 1,
    marginBottom: 40,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    fontSize: 12,
    color: '#B0BEC5',
    marginTop: 8,
    textAlign: 'center',
  },
  buttonSection: {
    gap: 20,
  },
  loginButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 12,
    borderWidth: 0,
    elevation: 4,
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  registrationButton: {
    borderColor: '#E74C3C',
    borderWidth: 2,
    borderRadius: 12,
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
  footerText: {
    fontSize: 14,
    color: '#B0BEC5',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});

export default GreetingPage; 