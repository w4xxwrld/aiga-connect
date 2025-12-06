import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Button,
  TextInput,
  HelperText,
  SegmentedButtons,
  Avatar,
  List,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import classesService from '../services/classes';
import bookingsService from '../services/bookings';
import { Class } from '../services/classes';

interface BookClassPageProps {
  navigation: any;
  route: {
    params: {
      classId: number;
    };
  };
}

const BookClassPage: React.FC<BookClassPageProps> = ({ navigation, route }) => {
  const { classId } = route.params;
  const { user, userRole } = useAppContext();
  
  // State
  const [classData, setClassData] = useState<Class | null>(null);
  const [bookingType, setBookingType] = useState<'regular' | 'trial' | 'makeup'>('regular');
  const [classDate, setClassDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load class data
      const classInfo = await classesService.getClass(classId);
      setClassData(classInfo);

      // Set default class date to next occurrence
      const nextClassDate = getNextClassDate(classInfo);
      setClassDate(nextClassDate);

    } catch (error: any) {
      console.error('Error loading data:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const getNextClassDate = (classInfo: Class): string => {
    const today = new Date();
    const dayNames = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

    // Get the first day from days_of_week array
    const firstDay = classInfo.days_of_week?.[0];
    if (!firstDay) {
      // If no days specified, return today
      return today.toISOString().split('T')[0];
    }

    const targetDay = dayNames.indexOf(firstDay.toLowerCase());
    if (targetDay === -1) {
      // Invalid day, return today
      return today.toISOString().split('T')[0];
    }

    let nextDate = new Date(today);
    const currentDay = today.getDay();

    // Calculate days until next class
    let daysUntilNext = targetDay - currentDay;
    if (daysUntilNext <= 0) {
      daysUntilNext += 7; // Next week
    }

    nextDate.setDate(today.getDate() + daysUntilNext);
    return nextDate.toISOString().split('T')[0];
  };

  const validateForm = () => {
    // Date is automatically set to next class occurrence
    // No validation needed for user input
    return true;
  };

  const handleBookClass = async () => {
    if (!validateForm() || !classData || !user) return;

    setBooking(true);
    try {
      const bookingData = {
        athlete_id: user.id,
        class_id: classId,
        booking_type: bookingType,
        class_date: classDate,
      };

      await bookingsService.createBooking(bookingData);

      Alert.alert(
        'Успешно',
        'Занятие успешно забронировано',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          }
        ]
      );
    } catch (error: any) {
      console.error('Error booking class:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось забронировать занятие');
    } finally {
      setBooking(false);
    }
  };

  const renderBookingForm = () => {
    if (!classData) return null;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Информация о занятии</Title>

          <View style={styles.classInfo}>
            <Text style={styles.className}>{classData.name}</Text>

            {classData.description && (
              <Text style={styles.classDescription}>{classData.description}</Text>
            )}

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="calendar" size={20} color="#E74C3C" />
              <Text style={styles.infoText}>
                {classData.days_of_week?.filter(day => day).map(day => classesService.formatDayOfWeek(day)).join(', ') || 'Не указано'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#E74C3C" />
              <Text style={styles.infoText}>
                {classesService.formatTime(classData.start_time)} - {classesService.formatTime(classData.end_time)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="human-male-board" size={20} color="#E74C3C" />
              <Text style={styles.infoText}>
                Профессор: {classData.coach?.full_name || classData.coach ? `${classData.coach.first_name} ${classData.coach.last_name}` : 'Не указан'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="account-multiple" size={20} color="#E74C3C" />
              <Text style={styles.infoText}>
                Максимум мест: {classData.max_capacity}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="signal" size={20} color="#E74C3C" />
              <Text style={styles.infoText}>
                Уровень: {classesService.getDifficultyDisplayName(classData.difficulty_level)}
              </Text>
            </View>

            <View style={styles.infoPriceRow}>
              <MaterialCommunityIcons name="currency-usd" size={24} color="#E74C3C" />
              <Text style={styles.classPrice}>
                {classData.price_per_class || classData.price} ₸
              </Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <Title style={styles.sectionTitle}>Тип записи</Title>
          <SegmentedButtons
            value={bookingType}
            onValueChange={(value) => setBookingType(value as any)}
            buttons={[
              { value: 'regular', label: 'Обыч' },
              { value: 'trial', label: 'Пробн' },
              { value: 'makeup', label: 'Компен' },
            ]}
            style={styles.segmentedButtons}
            density="small"
            theme={{
              colors: {
                primary: '#E74C3C',
                onSurface: '#fff',
                onSurfaceVariant: '#fff',
                outline: '#2C3E50',
              }
            }}
          />

          {bookingType === 'trial' && classData && !classData.is_trial_available && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={20} color="#E74C3C" />
              <Text style={styles.errorText}>
                Пробные занятия не разрешены для этого класса
              </Text>
            </View>
          )}

          <View style={styles.nextClassInfo}>
            <MaterialCommunityIcons name="calendar-check" size={20} color="#4CAF50" />
            <Text style={styles.nextClassText}>
              Следующее занятие: {new Date(classDate).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E74C3C" />
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Global Header */}
      <View style={styles.globalHeader}>
        <Text style={styles.headerTitle}>AIGA Connect</Text>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {renderBookingForm()}
        
        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            onPress={handleBookClass}
            style={styles.bookButton}
            buttonColor="#E74C3C"
            textColor="#fff"
            icon="calendar-check"
            loading={booking}
            disabled={booking}
          >
            Забронировать занятие
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            textColor="#E74C3C"
            icon="close"
            disabled={booking}
          >
            Отмена
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const styles: any = {
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  globalHeader: {
    backgroundColor: '#0D1B2A',
    paddingTop: 56, // Safe area for status bar
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
    zIndex: 1000,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
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
  classInfo: {
    marginBottom: 16,
  },
  className: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  classDescription: {
    color: '#B0BEC5',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  infoPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  classPrice: {
    color: '#E74C3C',
    fontSize: 24,
    fontWeight: 'bold',
  },
  nextClassInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C3E50',
    padding: 16,
    borderRadius: 8,
    gap: 12,
    marginTop: 8,
  },
  nextClassText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  divider: {
    backgroundColor: '#2C3E50',
    marginVertical: 16,
  },
  segmentedButtons: {
    marginBottom: 12,
    marginHorizontal: -4,
    textColor: '#fff',
  },
  actionsContainer: {
    gap: 12,
  },
  bookButton: {
    marginTop: 8,
  },
  cancelButton: {
    marginTop: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C3E50',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
};

export default BookClassPage; 