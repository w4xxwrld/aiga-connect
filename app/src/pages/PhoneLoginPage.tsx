import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  StatusBar,
  TextInput,
} from 'react-native';
import { Button, HelperText } from 'react-native-paper';
import authService from '../services/auth';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';
import parsePhoneNumberFromString, { isValidPhoneNumber } from 'libphonenumber-js';
import {OtpInput} from "react-native-otp-entry";

const { width, height } = Dimensions.get('window');

interface PhoneLoginPageProps {
  navigation: any;
}

export const PhoneLoginPage: React.FC<PhoneLoginPageProps> = ({ navigation }) => {
   const [phoneNumber, setPhoneNumber] = useState<string>('');
   const [error, setError] = useState<string>('');
   const [loading, setLoading] = useState<boolean>(false);
   const [isValid, setIsValid] = useState<boolean>(false);
   const [countryCode, setCountryCode] = useState<CountryCode>('KZ');
   const [callingCode, setCallingCode] = useState('+7');
   const [code, setCode] = useState<string>('');

   const handleSelect = (country: Country) => {
      setCountryCode(country.cca2 as CountryCode);
      setCallingCode(`+${country.callingCode[0]}`);
   };

   const handleChange = (text: string) => {
      // Разрешаем только цифры и некоторые символы форматирования
      const cleaned = text.replace(/[^\d\s\-()]/g, '');
      setPhoneNumber(cleaned);
      // Очищаем ошибку при вводе
      if (error) {
         setError('');
      }
   };

   const handleSendCode = async () => {
      // Validate phone number
      // Call sendOTP API
      // Navigate to OTP verification
      const otpData = await authService.sendOTP(`+${phoneNumber}`);
      console.log("answer", otpData)
      // navigation.reset({
      //    index: 0,
      //    routes: [{ name: 'MainTabs' as never }],
      // });
   };

   const handleComplete = (value: string) => {
      console.log('OTP code:', value);
      setCode(value);
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
           <Text style={styles.headerTitle}>AIGA Connect</Text>
           <Text style={styles.headerSubtitle}></Text>
         </View>

         <View style={styles.formContainer}>
           <View style={styles.phoneInputContainer}>
             <CountryPicker
               countryCode={countryCode}
               withFilter
               withFlag
               withCallingCode
               onSelect={handleSelect}
               containerButtonStyle={styles.countryPickerButton}
             />
             <Text style={styles.callingCode}>{callingCode}</Text>
             <TextInput
               style={[
                 styles.phoneInput,
                 error ? styles.phoneInputError : null,
               ]}
               value={phoneNumber}
               onChangeText={handleChange}
               placeholder="Номер телефона"
               placeholderTextColor="#B0BEC5"
               keyboardType="phone-pad"
               autoFocus={false}
             />
           </View>

            ${code && (
                 <View style={{ padding: 20 }}>
                    <Text style={{ fontSize: 20, marginBottom: 10 }}>Введите код из SMS</Text>

                    <OtpInput
                      numberOfDigits={6}
                      focusColor="#007bff"
                      onTextChange={setCode}
                      onFilled={handleComplete}
                      theme={{
                         containerStyle: { marginVertical: 20 },
                         pinCodeContainerStyle: {
                            borderColor: '#ccc',
                            borderRadius: 8,
                         },
                         pinCodeTextStyle: { fontSize: 20, color: '#000' },
                      }}
                    />

                    <Text>Ваш код: {code}</Text>
                 </View>
            )}

           {error ? (
             <HelperText type="error" visible={!!error} style={styles.errorText}>
               {error}
             </HelperText>
           ) : null}

           <Button
             mode="contained"
             onPress={handleSendCode}
             loading={loading}
             disabled={loading || !phoneNumber || !!error}
             style={styles.button}
             buttonColor="#E74C3C"
             icon="send"
           >
             {loading ? 'Отправка...' : 'Отправить код'}
           </Button>

           <Button
             mode="text"
             onPress={() => navigation.goBack()}
             style={styles.backButton}
             textColor="#B0BEC5"
             icon="arrow-left"
           >
             Назад к входу
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
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#2C3E50',
    borderRadius: 8,
    padding: 8,
  },
  countryPickerButton: {
    marginRight: 8,
  },
  callingCode: {
    fontSize: 16,
    color: '#fff',
    marginRight: 8,
    minWidth: 40,
  },
  inputWrapper: {
    flex: 1,
  },
  phoneInput: {
    fontSize: 16,
    color: '#fff',
    paddingVertical: 8,
    minHeight: 40,
  },
  phoneInputError: {
    borderColor: '#E74C3C',
  },
  errorText: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButton: {
    marginTop: 16,
  },
});
