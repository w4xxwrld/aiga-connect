import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import {
  TextInput,
  Button,
  Title,
  Paragraph,
  SegmentedButtons,
} from 'react-native-paper';
import { useAppContext } from '../context/AppContext';
import authService, { LoginData, RegisterData } from '../services/auth';

type AuthMode = 'login' | 'register';

const { width, height } = Dimensions.get('window');

interface AuthScreenProps {
  navigation: any;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  const { setUser } = useAppContext();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // Form fields
  const [iin, setIin] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'parent' | 'athlete' | 'coach'>('parent');

  const animateModeChange = (newMode: AuthMode) => {
    // Fade out current content
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -20,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Change mode
      setMode(newMode);
      
      // Fade in new content
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleModeChange = (value: string) => {
    if (value !== mode) {
      animateModeChange(value as AuthMode);
    }
  };

  const handleLogin = async () => {
    if (!iin || !password) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля');
      return;
    }

    if (iin.length !== 12 || !/^\d+$/.test(iin)) {
      Alert.alert('Ошибка', 'ИИН должен содержать ровно 12 цифр');
      return;
    }

    setLoading(true);
    try {
      const loginData: LoginData = { iin, password };
      const response = await authService.login(loginData);
      
      console.log('Login successful, response:', response);
      
      // Get current user data from backend
      const userData = await authService.getCurrentUser();
      
      if (!userData) {
        throw new Error('Failed to get user data after login');
      }
      
      console.log('Setting user data:', userData);
      setUser(userData);
      
      // Navigate to main app
      console.log('Navigating to MainTabs');
      navigation.replace('MainTabs');
      
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Ошибка входа', error.message || 'Неверный ИИН или пароль');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!iin || !password || !fullName) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все обязательные поля');
      return;
    }

    if (iin.length !== 12 || !/^\d+$/.test(iin)) {
      Alert.alert('Ошибка', 'ИИН должен содержать ровно 12 цифр');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Ошибка', 'Пароль должен содержать минимум 6 символов');
      return;
    }

    setLoading(true);
    try {
      const registerData: RegisterData = {
        iin,
        full_name: fullName,
        email: email || undefined,
        password,
        role,
      };
      
      console.log('Registering user with data:', registerData);
      const userData = await authService.register(registerData);
      console.log('Registration successful, user data:', userData);
      
      // Store the user data from registration response
      await authService.storeUserData(userData);
      
      // After successful registration, automatically log in the user
      const loginData: LoginData = { iin, password };
      console.log('Auto-login after registration');
      await authService.login(loginData);
      
      // Set user data and trigger navigation
      console.log('Setting user data after registration:', userData);
      setUser(userData);
      
      // Navigate to main app
      console.log('Navigating to MainTabs after registration');
      navigation.replace('MainTabs');
      
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Ошибка регистрации', error.message || 'Ошибка при создании аккаунта');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (mode === 'login') {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Image 
            source={require('../../assets/image.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.formContainer}>
          <SegmentedButtons
            value={mode}
            onValueChange={handleModeChange}
            buttons={[
              { value: 'login', label: 'Вход' },
              { value: 'register', label: 'Регистрация' },
            ]}
            style={styles.segmentedButtons}
            theme={{
              colors: {
                primary: '#E74C3C',
                onSurface: '#fff',
                onSurfaceVariant: '#fff',
              }
            }}
          />

          <Animated.View
            style={[
              styles.animatedContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TextInput
              label="ИИН (12 цифр)"
              value={iin}
              onChangeText={setIin}
              mode="outlined"
              keyboardType="numeric"
              maxLength={12}
              style={styles.input}
              theme={{ 
                colors: { 
                  primary: '#E74C3C',
                  onSurfaceVariant: '#fff',
                  placeholder: '#fff',
                  onSurface: '#fff'
                } 
              }}
            />

            {mode === 'register' && (
              <>
                <TextInput
                  label="Полное имя *"
                  value={fullName}
                  onChangeText={setFullName}
                  mode="outlined"
                  style={styles.input}
                  theme={{ 
                    colors: { 
                      primary: '#E74C3C',
                      onSurfaceVariant: '#fff',
                      placeholder: '#fff',
                      onSurface: '#fff'
                    } 
                  }}
                />

                <TextInput
                  label="Email (необязательно)"
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  theme={{ 
                    colors: { 
                      primary: '#E74C3C',
                      onSurfaceVariant: '#fff',
                      placeholder: '#fff',
                      onSurface: '#fff'
                    } 
                  }}
                />

                <View style={styles.roleContainer}>
                  <Text style={styles.roleLabel}>Роль:</Text>
                  <SegmentedButtons
                    value={role}
                    onValueChange={(value) => setRole(value as any)}
                    buttons={[
                      { value: 'parent', label: 'Родитель' },
                      { value: 'athlete', label: 'Спортсмен' },
                      { value: 'coach', label: 'Тренер' },
                    ]}
                    style={styles.roleButtons}
                    theme={{
                      colors: {
                        primary: '#E74C3C',
                        onSurface: '#fff',
                        onSurfaceVariant: '#fff',
                      }
                    }}
                  />
                </View>
              </>
            )}

            <TextInput
              label="Пароль"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry
              style={styles.input}
              theme={{ 
                colors: { 
                  primary: '#E74C3C',
                  onSurfaceVariant: '#fff',
                  placeholder: '#fff',
                  onSurface: '#fff'
                } 
              }}
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.button}
              buttonColor="#E74C3C"
            >
              {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </Button>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <Paragraph style={styles.footerText}>
            {mode === 'login' 
              ? 'Нет аккаунта? Переключитесь на регистрацию'
              : 'Уже есть аккаунт? Переключитесь на вход'
            }
          </Paragraph>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: width * 0.9,
    height: height * 0.225,
  },
  formContainer: {
    marginBottom: 20,
  },
  animatedContainer: {
    // Container for animated form elements
  },
  segmentedButtons: {
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#2C3E50',
  },
  roleContainer: {
    marginBottom: 16,
  },
  roleLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#fff',
  },
  roleButtons: {
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
    paddingVertical: 8,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    color: '#fff',
  },
});

export default AuthScreen; 