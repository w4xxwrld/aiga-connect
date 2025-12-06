import React, { useState, useEffect } from 'react';
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
  StatusBar,
} from 'react-native';
import { Button } from 'react-native-paper';
import { OtpInput } from 'react-native-otp-entry';
import { useAppContext } from '../context/AppContext';
import authService from '../services/auth';

const { width, height } = Dimensions.get('window');

interface OTPVerificationScreenProps {
  navigation: any;
  route: {
    params: {
      phoneNumber: string;
      isRegistration: boolean;
      registrationData?: any;
    };
  };
}

const OTPVerificationScreen: React.FC<OTPVerificationScreenProps> = ({ navigation, route }) => {
  const { setUser } = useAppContext();
  const { phoneNumber, isRegistration, registrationData } = route.params;
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [resendTimer, setResendTimer] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);

  useEffect(() => {
    // Start countdown timer for resend button
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleVerifyOTP = async (otpCode: string) => {
    if (otpCode.length !== 6) {
      Alert.alert('Ошибка', 'Пожалуйста, введите 6-значный код');
      return;
    }

    setLoading(true);
    try {
      console.log('🔵 [OTP] Verifying OTP for phone:', phoneNumber);

      // Verify OTP (will return tokens if existing user, or requires_role_selection if new user)
      const verifyResponse = await authService.verifyOTP(phoneNumber, otpCode);
      console.log('🟢 [OTP] OTP verified successfully:', verifyResponse);

      // Check if this is an existing user (has tokens) or new user (needs role selection)
      if (verifyResponse.access_token && verifyResponse.refresh_token) {
        // Existing user - tokens are already stored by authService.verifyOTP
        console.log('✅ [OTP] Existing user logged in, fetching user data');

        // Get the authenticated user data
        const userData = await authService.getCurrentUser();
        console.log('🟢 [OTP] User data retrieved:', userData);

        if (userData) {
          // Set user data which will trigger navigation
          setUser(userData);
          console.log('✅ [OTP] User authenticated and logged in successfully');

          // Check if coach is pending approval
          const targetScreen = (userData.primary_role === 'coach' && userData.role_status === 'pending')
            ? 'CoachPending'
            : 'MainTabs';

          navigation.reset({
            index: 0,
            routes: [{ name: targetScreen as never }],
          });
        } else {
          throw new Error('Failed to get user data after authentication');
        }
      } else if (verifyResponse.requires_role_selection) {
        // New user - complete registration with the role from registration data
        console.log('🔵 [OTP] New user, completing registration with role:', registrationData?.primary_role);

        // For registration flow, complete registration immediately with the selected role
        if (isRegistration && registrationData?.primary_role) {
          // Complete registration with the role
          const completeResponse = await authService.completeRegistration(
            registrationData,
            registrationData.primary_role
          );
          console.log('🟢 [OTP] Registration completed successfully:', completeResponse);

          // Get the authenticated user data
          const userData = await authService.getCurrentUser();
          console.log('🟢 [OTP] User data retrieved:', userData);

          if (userData) {
            // Set user data which will trigger navigation
            setUser(userData);
            console.log('✅ [OTP] User authenticated and logged in successfully');

            // Check if coach is pending approval
            const targetScreen = (userData.primary_role === 'coach' && userData.role_status === 'pending')
              ? 'CoachPending'
              : 'MainTabs';

            navigation.reset({
              index: 0,
              routes: [{ name: targetScreen as never }],
            });
          } else {
            throw new Error('Failed to get user data after registration');
          }
        } else if (isRegistration && !registrationData?.primary_role) {
          // No role provided in registration data
          Alert.alert(
            'Ошибка',
            'Не указана роль пользователя. Пожалуйста, попробуйте снова.'
          );
        } else {
          // If this is login but user doesn't exist, show error
          Alert.alert(
            'Пользователь не найден',
            'Этот номер телефона не зарегистрирован. Пожалуйста, зарегистрируйтесь.'
          );
        }
      } else {
        throw new Error('Unexpected response from OTP verification');
      }
    } catch (error: any) {
      console.error('🔴 [OTP] Verification error:', error);
      let errorMessage = 'Не удалось подтвердить код';
      let errorTitle = 'Ошибка верификации';

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
      setCode(''); // Clear the code on error
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    try {
      console.log('Resending OTP to:', phoneNumber);
      const response = await authService.sendOTP(phoneNumber);
      console.log('Resend OTP response:', response);

      Alert.alert('Успех', 'Код отправлен повторно');

      // Reset timer
      setResendTimer(60);
      setCanResend(false);
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      let errorMessage = 'Не удалось отправить код повторно';
      let errorTitle = 'Ошибка';

      // Check for rate limiting (429 error)
      if (error.response?.status === 429) {
        errorTitle = 'Слишком много попыток';
        errorMessage = error.response?.data?.detail || 'Вы превысили лимит попыток отправки кода. Пожалуйста, подождите 10 минут и попробуйте снова.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert(errorTitle, errorMessage);
    } finally {
      setResendLoading(false);
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
          <Image
            source={require('../../assets/image.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Подтверждение номера</Text>
          <Text style={styles.headerSubtitle}>
            Мы отправили код на номер{'\n'}
            <Text style={styles.phoneNumber}>{phoneNumber}</Text>
          </Text>
        </View>

        <View style={styles.formContainer}>
          <OtpInput
            numberOfDigits={6}
            focusColor="#E74C3C"
            onTextChange={setCode}
            onFilled={handleVerifyOTP}
            theme={{
              containerStyle: styles.otpContainer,
              pinCodeContainerStyle: styles.otpPinContainer,
              pinCodeTextStyle: styles.otpPinText,
              focusStickStyle: styles.otpFocusStick,
            }}
          />

          {code.length === 6 && (
            <Button
              mode="contained"
              onPress={() => handleVerifyOTP(code)}
              loading={loading}
              disabled={loading}
              style={styles.button}
              buttonColor="#E74C3C"
              textColor="#fff"
              icon="check-circle"
            >
              {loading ? 'Проверка...' : 'Подтвердить'}
            </Button>
          )}

          <View style={styles.resendContainer}>
            {canResend ? (
              <Button
                mode="text"
                onPress={handleResendCode}
                loading={resendLoading}
                disabled={resendLoading}
                textColor="#E74C3C"
              >
                Отправить код повторно
              </Button>
            ) : (
              <Text style={styles.timerText}>
                Отправить код повторно через {resendTimer} сек
              </Text>
            )}
          </View>

          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            textColor="#B0BEC5"
            icon="arrow-left"
          >
            Назад
          </Button>
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
    marginBottom: 40,
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
    marginBottom: 12,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#B0BEC5',
    textAlign: 'center',
    lineHeight: 24,
  },
  phoneNumber: {
    color: '#E74C3C',
    fontWeight: 'bold',
  },
  formContainer: {
    marginBottom: 20,
  },
  otpContainer: {
    marginVertical: 30,
  },
  otpPinContainer: {
    backgroundColor: '#2C3E50',
    borderColor: '#fff',
    borderWidth: 1,
    borderRadius: 8,
    width: 48,
    height: 56,
  },
  otpPinText: {
    fontSize: 24,
    color: '#fff',
  },
  otpFocusStick: {
    backgroundColor: '#E74C3C',
  },
  button: {
    marginTop: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resendContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 14,
    color: '#B0BEC5',
    textAlign: 'center',
  },
  backButton: {
    marginTop: 16,
  },
});

export default OTPVerificationScreen;
