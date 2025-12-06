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
import {DatePickerInput} from "react-native-paper-dates";
import { useAppContext } from '../context/AppContext';
import authService, { LoginData, RegisterData } from '../services/auth';
import { useRoute } from '@react-navigation/native';

type AuthMode = 'login' | 'register';

const { width, height } = Dimensions.get('window');

interface AuthScreenProps {
  navigation: any;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  const { setUser } = useAppContext();
  const route: any = useRoute();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(1)).current;

  // Form fields
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [birthDateString, setBirthDateString] = useState<string>('');
  const [password, setPassword] = useState('');
  const [primaryRole, setPrimaryRole] = useState<'athlete' | 'coach'>('coach');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
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

  const validatePhone = (number: string) => {
    const phoneRegex = /^\+7\d{10}$/;
    return phoneRegex.test(number);
  }

  // Validate name - allows Russian (Cyrillic) and English letters, spaces, hyphens
  const validateName = (name: string) => {
    const nameRegex = /^[a-zA-Zа-яА-ЯёЁ\s\-]+$/;
    return name.trim().length >= 2 && nameRegex.test(name.trim());
  }

  // Password validation - matches backend requirements
  const getPasswordErrors = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push('Минимум 8 символов');
    if (!/[A-Z]/.test(pwd)) errors.push('Заглавная буква (A-Z)');
    if (!/[a-z]/.test(pwd)) errors.push('Строчная буква (a-z)');
    if (!/\d/.test(pwd)) errors.push('Цифра (0-9)');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) errors.push('Спецсимвол (!@#$%^&*)');
    return errors;
  }

  const isPasswordValid = (pwd: string) => {
    return pwd.length >= 8 &&
           /[A-Z]/.test(pwd) &&
           /[a-z]/.test(pwd) &&
           /\d/.test(pwd) &&
           /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
  }

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
    if (!phone || !password) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля');
      return;
    }

    setLoading(true);
    try {
      // Format phone number to E.164 format
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

      console.log('🔵 [AUTH] Logging in with phone and password:', formattedPhone);

      // Login with phone and password
      const authResponse = await authService.login({
        phone_number: formattedPhone,
        password
      });
      console.log('🟢 [AUTH] Login successful, tokens received');

      // Get user data
      const userData = await authService.getCurrentUser();
      console.log('🟢 [AUTH] User data retrieved:', userData);

      if (userData) {
        // Set user data which will trigger navigation
        setUser(userData);
        console.log('✅ [AUTH] User authenticated and logged in successfully');

        // Navigate to MainTabs
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      } else {
        throw new Error('Failed to get user data after authentication');
      }
    } catch (error: any) {
      console.error('🔴 [AUTH] Login error:', error);
      console.error('🔴 [AUTH] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      let errorMessage = 'Не удалось войти в систему';
      let errorTitle = 'Ошибка входа';

      if (error.response?.status === 401) {
        errorMessage = 'Неверный номер телефона или пароль';
      } else if (error.response?.status === 429) {
        errorTitle = 'Слишком много попыток';
        errorMessage = error.response?.data?.detail || 'Вы превысили лимит попыток. Пожалуйста, подождите несколько минут и попробуйте снова.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert(errorTitle, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (
    data: RegisterData
  ) => {
    // Validate all required fields
    if (!data.phone) {
      Alert.alert('Ошибка', 'Пожалуйста, введите номер телефона');
      return;
    }

    if (!data.first_name || data.first_name.trim().length === 0) {
      Alert.alert('Ошибка', 'Пожалуйста, введите имя');
      return;
    }

    if (!validateName(data.first_name)) {
      Alert.alert('Ошибка', 'Имя должно содержать минимум 2 символа и только буквы (русские или английские)');
      return;
    }

    if (!data.last_name || data.last_name.trim().length === 0) {
      Alert.alert('Ошибка', 'Пожалуйста, введите фамилию');
      return;
    }

    if (!validateName(data.last_name)) {
      Alert.alert('Ошибка', 'Фамилия должна содержать минимум 2 символа и только буквы (русские или английские)');
      return;
    }

    if (!data.email || data.email.trim().length === 0) {
      Alert.alert('Ошибка', 'Пожалуйста, введите email');
      return;
    }

    if (!data.birth_date) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите дату рождения');
      return;
    }

    if (!data.primary_role) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите роль');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      Alert.alert('Ошибка', 'Пожалуйста, введите корректный email адрес');
      return;
    }

    // Validate phone format (should start with +)
    if (!data.phone.startsWith('+')) {
      Alert.alert('Ошибка', 'Номер телефона должен начинаться с + (например, +77071234567)');
      return;
    }

    // Validate password
    if (!data.password) {
      Alert.alert('Ошибка', 'Пожалуйста, введите пароль');
      return;
    }

    if (!isPasswordValid(data.password)) {
      const errors = getPasswordErrors(data.password);
      Alert.alert('Ошибка пароля', `Пароль должен содержать:\n• ${errors.join('\n• ')}`);
      return;
    }

    // Validate birth date
    const birthDateObj = new Date(data.birth_date);
    const today = new Date();
    const age = today.getFullYear() - birthDateObj.getFullYear();

    if (birthDateObj > today) {
      Alert.alert('Ошибка', 'Дата рождения не может быть в будущем');
      return;
    }

    if (age < 5) {
      Alert.alert('Ошибка', 'Возраст должен быть не менее 5 лет');
      return;
    }

    setLoading(true);
    try {
      // Format phone number to E.164 format
      const formattedPhone = data.phone.startsWith('+') ? data.phone : `+${data.phone}`;

      const registerData: RegisterData = {
        phone: formattedPhone,
        first_name: data.first_name,
        last_name: data.last_name,
        ...(data.photo_url && { photoUrl: data.photo_url }),
        email: data.email,
        birth_date: data.birth_date,
        primary_role: data.primary_role,
        ...(data.password && { password: data.password }),
      };

      console.log('🔵 [AUTH] Step 1: Sending registration data:', registerData);

      const userData = await authService.register(registerData);
      console.log('✅ [AUTH] Step 1: Registration successful:', userData);

      console.log('🔵 [AUTH] Step 2: Sending OTP for phone verification...');
      const otpResponse = await authService.sendOTP(data.phone);
      console.log('🟢 [AUTH] Step 2: OTP sent successfully:', otpResponse);

      console.log('🔵 [AUTH] Step 3: Navigating to OTP verification screen');
      navigation.navigate('OTPVerification', {
        phoneNumber: formattedPhone,
        isRegistration: true,
        registrationData: registerData,
      });

    } catch (error: any) {
      console.error('🔴 [AUTH] Registration error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      let errorMessage = 'Не удалось зарегистрироваться';
      let errorTitle = 'Ошибка регистрации';

      // Check for rate limiting (429 error)
      if (error.response?.status === 429) {
        errorTitle = 'Слишком много попыток';
        errorMessage = error.response?.data?.detail || 'Вы превысили лимит попыток. Пожалуйста, подождите несколько минут и попробуйте снова.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert(errorTitle, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (mode === 'login') {
      handleLogin();
    } else {
  
      onRegisterNext();
    }
  };

  const onRegisterNext = () => {
    const registerData = {
      phone: phone.startsWith('+') ? phone : `+${phone}`,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      birth_date: birthDateString,
      password: password || undefined,
      primary_role: primaryRole, // Include role from form
    };

    console.log("handleRegister begin");
    handleRegister(registerData);
    console.log("handleRegister over");
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
              label="Телефон"
              value={phone}
              onChangeText={setPhone}
              mode="outlined"
              keyboardType="phone-pad"
              maxLength={12}
              placeholder="+77001234567"
              style={styles.input}
              outlineColor={phone.length === 12 ? (validatePhone(phone) ? '#27AE60' : '#E74C3C') : '#fff'}
              activeOutlineColor="#E74C3C"
              textColor="#fff"
              placeholderTextColor="#666"
              theme={{
                colors: {
                  onSurfaceVariant: '#fff',
                }
              }}
              left={<TextInput.Icon icon="phone" />}
              right={phone.length === 12 && (
                <TextInput.Icon
                  icon={validatePhone(phone) ? "check-circle" : "alert-circle"}
                  color={validatePhone(phone) ? '#27AE60' : '#E74C3C'}
                />
              )}
            />
            {phone.length > 0 && phone.length < 12 && (
              <HelperText type="info" visible={true}>
                Формат: +7 и 10 цифр (например, +77001234567)
              </HelperText>
            )}
            {phone.length === 12 && validatePhone(phone) === false && (
              <HelperText type="error" visible={true}>
                Неверный формат номера. Используйте +7XXXXXXXXXX
              </HelperText>
            )}

            {mode === 'register' && (
              <>
                <TextInput
                  label="Имя *"
                  value={firstName}
                  onChangeText={setFirstName}
                  mode="outlined"
                  placeholder="Введите имя (например, Алексей)"
                  style={styles.input}
                  outlineColor={firstName.length > 0 ? (validateName(firstName) ? '#27AE60' : '#E74C3C') : '#fff'}
                  activeOutlineColor="#E74C3C"
                  textColor="#fff"
                  placeholderTextColor="#666"
                  theme={{
                    colors: {
                      onSurfaceVariant: '#fff',
                    }
                  }}
                  left={<TextInput.Icon icon="account" />}
                  right={firstName.length > 0 && (
                    <TextInput.Icon
                      icon={validateName(firstName) ? "check-circle" : "alert-circle"}
                      color={validateName(firstName) ? '#27AE60' : '#E74C3C'}
                    />
                  )}
                />
                {firstName.length > 0 && !validateName(firstName) && (
                  <HelperText type="error" visible={true}>
                    Только буквы (русские или английские), минимум 2 символа
                  </HelperText>
                )}

                <TextInput
                  label="Фамилия *"
                  value={lastName}
                  onChangeText={setLastName}
                  mode="outlined"
                  placeholder="Введите фамилию (например, Иванов)"
                  style={styles.input}
                  outlineColor={lastName.length > 0 ? (validateName(lastName) ? '#27AE60' : '#E74C3C') : '#fff'}
                  activeOutlineColor="#E74C3C"
                  textColor="#fff"
                  placeholderTextColor="#666"
                  theme={{
                    colors: {
                      onSurfaceVariant: '#fff',
                    }
                  }}
                  left={<TextInput.Icon icon="account" />}
                  right={lastName.length > 0 && (
                    <TextInput.Icon
                      icon={validateName(lastName) ? "check-circle" : "alert-circle"}
                      color={validateName(lastName) ? '#27AE60' : '#E74C3C'}
                    />
                  )}
                />
                {lastName.length > 0 && !validateName(lastName) && (
                  <HelperText type="error" visible={true}>
                    Только буквы (русские или английские), минимум 2 символа
                  </HelperText>
                )}

                <TextInput
                  label="Email *"
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

                <View>
                    <DatePickerInput
                      locale="ru"
                      label="Дата"
                      value={birthDate}
                      onChange={(d) => {
                        setBirthDate(d);
                        if (d) {
                          const year = d.getFullYear();
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const day = String(d.getDate()).padStart(2, '0');
                          setBirthDateString(`${year}-${month}-${day}`);
                        } else {
                          setBirthDateString('');
                        }
                      }}
                      inputMode="start"
                    />
                </View>

                <View style={styles.roleSelectionContainer}>
                  <Text style={styles.roleSelectionLabel}>Выберите роль *</Text>
                  <SegmentedButtons
                    value={primaryRole}
                    onValueChange={(value) => setPrimaryRole(value as 'athlete' | 'coach')}
                    buttons={[
                      {
                        value: 'athlete',
                        label: 'Ученик',
                        icon: 'school',
                      },
                      {
                        value: 'coach',
                        label: 'Профессор',
                        icon: 'human-male-board',
                      },
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
                </View>
              </>
            )}

            <TextInput
              label="Пароль *"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              outlineColor={mode === 'register' && password.length > 0 ? (isPasswordValid(password) ? '#27AE60' : '#E74C3C') : '#fff'}
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
            {mode === 'register' && password.length > 0 && !isPasswordValid(password) && (
              <HelperText type="error" visible={true}>
                Нужно: {getPasswordErrors(password).join(', ')}
              </HelperText>
            )}
            {mode === 'register' && password.length === 0 && (
              <HelperText type="info" visible={true} style={{ color: '#B0BEC5' }}>
                8+ символов, A-Z, a-z, 0-9, спецсимвол
              </HelperText>
            )}

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={
                loading ||
                !phone ||
                !password ||
                (mode === 'register' && (!firstName || !lastName || !email || !birthDate || !primaryRole || !validateName(firstName) || !validateName(lastName) || !isPasswordValid(password)))
              }
              style={styles.button}
              buttonColor="#E74C3C"
              textColor="#fff"
              icon={mode === 'login' ? 'login' : 'account-plus'}
            >
              {mode === 'login' ? 'Войти' : 'Дальше'}
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
  roleSelectionContainer: {
    marginBottom: 20,
  },
  roleSelectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
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
