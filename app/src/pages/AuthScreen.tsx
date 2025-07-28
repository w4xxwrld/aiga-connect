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
  StatusBar,
} from 'react-native';
import {
  TextInput,
  Button,
  Title,
  Paragraph,
  SegmentedButtons,
  HelperText,
} from 'react-native-paper';
import { useAppContext } from '../context/AppContext';
import authService, { LoginData, RegisterData } from '../services/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  const logoScaleAnim = useRef(new Animated.Value(1)).current;
  
  // Form fields
  const [iin, setIin] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'parent' | 'athlete' | 'coach'>('parent');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Initial animation
    Animated.parallel([
      Animated.timing(logoScaleAnim, {
        toValue: 1.1,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(logoScaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    });
  }, []);

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
      console.log('Login response:', response);
      
      // Get current user data
      const userData = await authService.getCurrentUser();
      console.log('Current user data:', userData);
      
      if (userData) {
        // Set user data which will trigger navigation
        setUser(userData);
        console.log('Login successful, user data set:', userData);
        
        // Manual navigation to MainTabs
        console.log('Navigating to MainTabs screen...');
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' as never }],
        });
      } else {
        throw new Error('Failed to get user data after login');
      }
    } catch (error: any) {
      console.error('Login error details:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Не удалось войти в систему';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Ошибка входа', errorMessage);
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      Alert.alert('Ошибка', 'Пожалуйста, введите корректный email адрес');
      return;
    }

    // Require email for registration
    if (!email) {
      Alert.alert('Ошибка', 'Email обязателен для регистрации');
      return;
    }

    setLoading(true);
    try {
      // Calculate a reasonable birth date (18 years ago for adults)
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
      
      const registerData: RegisterData = {
        iin,
        full_name: fullName,
        email: email,
        password,
        primary_role: role,
        birth_date: birthDate.toISOString().split('T')[0],
        phone: undefined,
        emergency_contact: undefined,
        additional_roles: [],
        is_head_coach: false,
      };
      
      console.log('Sending registration data:', registerData);
      
      const userData = await authService.register(registerData);
      console.log('Registration successful:', userData);
      
      // After successful registration, automatically log in the user
      try {
        const loginData: LoginData = { iin, password };
        const authResponse = await authService.login(loginData);
        console.log('Auto-login after registration successful:', authResponse);
        
        // Get current user data
        const currentUserData = await authService.getCurrentUser();
        if (currentUserData) {
          // Set user data which will trigger navigation
          setUser(currentUserData);
          console.log('User authenticated after registration:', currentUserData);
          
          // Manual navigation to MainTabs
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' as never }],
          });
        } else {
          throw new Error('Failed to get user data after auto-login');
        }
      } catch (loginError: any) {
        console.error('Auto-login after registration failed:', loginError);
        // If auto-login fails, still show success but ask user to login manually
        Alert.alert(
          'Регистрация завершена', 
          'Регистрация прошла успешно! Пожалуйста, войдите в систему.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Switch to login mode
                setMode('login');
                setIin('');
                setPassword('');
                setFullName('');
                setEmail('');
                setRole('parent');
              }
            }
          ]
        );
      }
      
    } catch (error: any) {
      console.error('Registration error details:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Не удалось зарегистрироваться';
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Ошибка регистрации', errorMessage);
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'parent': return 'account-child';
      case 'athlete': return 'account-group';
      case 'coach': return 'account-tie';
      default: return 'account';
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0D1B2A" />
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Animated.View style={{ transform: [{ scale: logoScaleAnim }] }}>
            <Image 
              source={require('../../assets/image.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
          <Text style={styles.headerTitle}>AIGA Connect</Text>
          <Text style={styles.headerSubtitle}>Войдите в свою учетную запись</Text>
        </View>

        <View style={styles.formContainer}>
          <SegmentedButtons
            value={mode}
            onValueChange={handleModeChange}
            buttons={[
              { value: 'login', label: 'Вход', icon: 'login' },
              { value: 'register', label: 'Регистрация', icon: 'account-plus' },
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
              outlineColor="#fff"
              activeOutlineColor="#E74C3C"
              textColor="#fff"
              placeholderTextColor="#fff"
              theme={{
                colors: {
                  onSurfaceVariant: '#fff',
                }
              }}
              left={<TextInput.Icon icon="card-account-details" />}
            />

            {mode === 'register' && (
              <>
                <TextInput
                  label="Полное имя *"
                  value={fullName}
                  onChangeText={setFullName}
                  mode="outlined"
                  style={styles.input}
                  outlineColor="#fff"
                  activeOutlineColor="#E74C3C"
                  textColor="#fff"
                  placeholderTextColor="#fff"
                  theme={{
                    colors: {
                      onSurfaceVariant: '#fff',
                    }
                  }}
                  left={<TextInput.Icon icon="account" />}
                />

                <TextInput
                  label="Email (необязательно)"
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  outlineColor="#fff"
                  activeOutlineColor="#E74C3C"
                  textColor="#fff"
                  placeholderTextColor="#fff"
                  theme={{
                    colors: {
                      onSurfaceVariant: '#fff',
                    }
                  }}
                  left={<TextInput.Icon icon="email" />}
                />

                <View style={styles.roleContainer}>
                  <Text style={styles.roleLabel}>Выберите роль:</Text>
                  <SegmentedButtons
                    value={role}
                    onValueChange={(value) => setRole(value as any)}
                    buttons={[
                      { value: 'parent', label: 'Родитель', icon: 'account-child' },
                      { value: 'athlete', label: 'Спортсмен', icon: 'account-group' },
                      { value: 'coach', label: 'Тренер', icon: 'account-tie' },
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
              secureTextEntry={!showPassword}
              style={styles.input}
              outlineColor="#fff"
              activeOutlineColor="#E74C3C"
              textColor="#fff"
              placeholderTextColor="#fff"
              theme={{
                colors: {
                  onSurfaceVariant: '#fff',
                }
              }}
              left={<TextInput.Icon icon="lock" />}
              right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.button}
              buttonColor="#E74C3C"
              icon={mode === 'login' ? 'login' : 'account-plus'}
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
    width: width * 0.4,
    height: height * 0.15,
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#B0BEC5',
    textAlign: 'center',
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
    borderRadius: 8,
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