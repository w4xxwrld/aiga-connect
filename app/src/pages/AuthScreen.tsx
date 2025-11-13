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

      console.log('🔵 [AUTH] Step 1: Validating credentials for:', formattedPhone);

      // Step 1: Validate phone and password (without getting tokens)
      await authService.validateLogin({ phone: formattedPhone, password });
      console.log('✅ [AUTH] Step 1: Credentials validated successfully');

      // Step 2: Send OTP after credentials are validated
      console.log('🔵 [AUTH] Step 2: Sending OTP...');
      const otpResponse = await authService.sendOTP(formattedPhone);
      console.log('🟢 [AUTH] Step 2: OTP sent successfully:', otpResponse);

      // Step 3: Navigate to OTP verification screen
      // User will be logged in ONLY after OTP verification
      console.log('🔵 [AUTH] Step 3: Navigating to OTP verification screen');
      navigation.navigate('OTPVerification', {
        phoneNumber: formattedPhone,
        isRegistration: false,
      });
    } catch (error: any) {
      console.error('🔴 [AUTH] Login flow error:', error);
      console.error('🔴 [AUTH] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      let errorMessage = 'Не удалось войти в систему';
      let errorTitle = 'Ошибка входа';

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

    if (!data.last_name || data.last_name.trim().length === 0) {
      Alert.alert('Ошибка', 'Пожалуйста, введите фамилию');
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

    // Validate password if provided
    if (data.password && data.password.length < 6) {
      Alert.alert('Ошибка', 'Пароль должен содержать минимум 6 символов');
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
      const otpResponse = await authService.sendOTP(formattedPhone);
      console.log('🟢 [AUTH] Step 2: OTP sent successfully:', otpResponse);

      console.log('🔵 [AUTH] Step 3: Navigating to OTP verification screen');
      navigation.navigate('OTPVerification', {
        phoneNumber: formattedPhone,
        isRegistration: true,
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
      // instead of calling handleRegister directly, go to role selection step
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
    };
    navigation.navigate('RoleSelection', { formData: registerData });
  };

  useEffect(() => {
    const selectedRole = route.params?.selectedRole;
    const formData = route.params?.formData;

    if (!selectedRole || !formData) return;

    try {
      navigation.setParams({ selectedRole: undefined, formData: undefined });
    } catch (e) {
    }

    const finalData: any = {
      ...formData,
      primary_role: selectedRole,
    };

    console.log("handleRegister begin");
    handleRegister(finalData);
    console.log("handleRegister over");
  }, [route.params?.selectedRole, route.params?.formData]);

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
                  label="Фамилия *"
                  value={lastName}
                  onChangeText={setLastName}
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
              disabled={loading || (mode === 'register' && (!phone || !firstName || !lastName || !email || !birthDate))}
              style={styles.button}
              buttonColor="#E74C3C"
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
