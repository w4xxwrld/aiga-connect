import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  TextInput,
  ActivityIndicator,
  HelperText,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppContext } from '../context/AppContext';
import authService, { User } from '../services/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface EditProfilePageProps {
  navigation: any;
}

const EditProfilePage: React.FC<EditProfilePageProps> = ({ navigation }) => {
  const { user, setUser } = useAppContext();
  
  // Form state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [birthDate, setBirthDate] = useState(user?.birth_date ? new Date(user.birth_date) : new Date());
  const [emergencyContact, setEmergencyContact] = useState(user?.emergency_contact || '');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setBirthDate(user.birth_date ? new Date(user.birth_date) : new Date());
      setEmergencyContact(user.emergency_contact || '');
    }
  }, [user]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Validate full name
    if (!fullName.trim()) {
      newErrors.fullName = 'Имя обязательно для заполнения';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Имя должно содержать минимум 2 символа';
    }

    // Validate email
    if (!email.trim()) {
      newErrors.email = 'Email обязателен для заполнения';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Введите корректный email адрес';
      }
    }

    // Validate phone (optional but if provided, should be valid)
    if (phone.trim() && !/^\+?[0-9\s\-\(\)]{10,}$/.test(phone.trim())) {
      newErrors.phone = 'Введите корректный номер телефона';
    }

    // Validate emergency contact (optional but if provided, should be valid)
    if (emergencyContact.trim() && !/^\+?[0-9\s\-\(\)]{10,}$/.test(emergencyContact.trim())) {
      newErrors.emergencyContact = 'Введите корректный номер телефона';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        birth_date: birthDate.toISOString().split('T')[0],
        emergency_contact: emergencyContact.trim() || undefined,
      };

      console.log('Updating profile with data:', updateData);
      
      const updatedUser = await authService.updateProfile(updateData);
      
      if (updatedUser) {
        setUser(updatedUser);
        Alert.alert(
          'Успешно',
          'Профиль обновлен (изменения сохранены локально)',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      
      let errorMessage = 'Не удалось обновить профиль';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Ошибка', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Отменить изменения',
      'Вы уверены, что хотите отменить изменения? Все несохраненные данные будут потеряны.',
      [
        { text: 'Продолжить редактирование', style: 'cancel' },
        { 
          text: 'Отменить', 
          style: 'destructive',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E74C3C" />
        <Text style={styles.loadingText}>Сохранение изменений...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1B2A" />
      
      {/* Header */}
      <View style={styles.header}>
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          textColor="#E74C3C"
          icon="arrow-left"
          style={styles.headerButton}
        >
          Назад
        </Button>
        <Title style={styles.headerTitle}>Редактировать профиль</Title>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Личная информация</Title>
            
            {/* Full Name */}
            <TextInput
              label="Полное имя *"
              value={fullName}
              onChangeText={setFullName}
              mode="outlined"
              style={styles.input}
              outlineColor="#fff"
              activeOutlineColor="#E74C3C"
              textColor="#fff"
              theme={{
                colors: {
                  onSurfaceVariant: '#fff',
                }
              }}
              error={!!errors.fullName}
            />
            {errors.fullName && <HelperText type="error" visible={!!errors.fullName}>{errors.fullName}</HelperText>}

            {/* Email */}
            <TextInput
              label="Email *"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              outlineColor="#fff"
              activeOutlineColor="#E74C3C"
              textColor="#fff"
              keyboardType="email-address"
              autoCapitalize="none"
              theme={{
                colors: {
                  onSurfaceVariant: '#fff',
                }
              }}
              error={!!errors.email}
            />
            {errors.email && <HelperText type="error" visible={!!errors.email}>{errors.email}</HelperText>}

            {/* Phone */}
            <TextInput
              label="Номер телефона"
              value={phone}
              onChangeText={setPhone}
              mode="outlined"
              style={styles.input}
              outlineColor="#fff"
              activeOutlineColor="#E74C3C"
              textColor="#fff"
              keyboardType="phone-pad"
              placeholder="+7 (XXX) XXX-XX-XX"
              placeholderTextColor="#fff"
              theme={{
                colors: {
                  onSurfaceVariant: '#fff',
                }
              }}
              error={!!errors.phone}
            />
            {errors.phone && <HelperText type="error" visible={!!errors.phone}>{errors.phone}</HelperText>}

            {/* Birth Date */}
            <View style={styles.dateContainer}>
              <Text style={styles.dateLabel}>Дата рождения *</Text>
              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(!showDatePicker)}
                style={styles.dateButton}
                textColor="#fff"
              >
                {formatDate(birthDate)}
              </Button>
              {showDatePicker && (
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={birthDate}
                    mode="date"
                    display="inline"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                    style={styles.datePicker}
                    textColor="#fff"
                    themeVariant="dark"
                  />
                </View>
              )}
            </View>

            {/* Emergency Contact */}
            <TextInput
              label="Экстренный контакт"
              value={emergencyContact}
              onChangeText={setEmergencyContact}
              mode="outlined"
              style={styles.input}
              outlineColor="#fff"
              activeOutlineColor="#E74C3C"
              textColor="#fff"
              keyboardType="phone-pad"
              placeholder="+7 (XXX) XXX-XX-XX"
              placeholderTextColor="#fff"
              theme={{
                colors: {
                  onSurfaceVariant: '#fff',
                }
              }}
              error={!!errors.emergencyContact}
            />
            {errors.emergencyContact && <HelperText type="error" visible={!!errors.emergencyContact}>{errors.emergencyContact}</HelperText>}
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
            buttonColor="#E74C3C"
            icon="content-save"
            disabled={loading}
          >
            Сохранить изменения
          </Button>
          
          <Button
            mode="outlined"
            onPress={handleCancel}
            style={styles.cancelButton}
            textColor="#E74C3C"
            icon="close"
          >
            Отменить
          </Button>
        </View>
      </ScrollView>


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D1B2A',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 56,
    backgroundColor: '#0D1B2A',
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
    zIndex: 1000,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerButton: {
    minWidth: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#1B263B',
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#2C3E50',
  },
  dateContainer: {
    marginBottom: 16,
  },
  dateLabel: {
    color: '#B0BEC5',
    fontSize: 16,
    marginBottom: 8,
  },
  dateButton: {
    borderColor: '#2C3E50',
    marginBottom: 8,
  },
  datePickerContainer: {
    backgroundColor: '#1B263B',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#2C3E50',
    marginTop: 8,
  },
  datePicker: {
    backgroundColor: '#1B263B',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
  },
  actionsContainer: {
    gap: 12,
  },
  saveButton: {
    marginTop: 8,
  },
  cancelButton: {
    marginTop: 4,
  },
});

export default EditProfilePage; 