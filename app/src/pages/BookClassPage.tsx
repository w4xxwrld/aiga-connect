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
import childrenService from '../services/children';
import { Class } from '../services/classes';
import { Child } from '../services/children';

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
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [bookingType, setBookingType] = useState<'regular' | 'trial' | 'makeup'>('regular');
  const [classDate, setClassDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
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
      
      // Load children if user is a parent
      if (userRole === 'parent') {
        const childrenData = await childrenService.getMyChildren();
        setChildren(childrenData);
        
        // Auto-select first child if available
        if (childrenData.length > 0) {
          setSelectedChild(childrenData[0]);
        }
      }
      
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
    const targetDay = dayNames.indexOf(classInfo.day_of_week.toLowerCase());
    
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
    const newErrors: { [key: string]: string } = {};

    if (userRole === 'parent' && !selectedChild) {
      newErrors.child = 'Выберите ребенка для записи';
    }

    if (!classDate) {
      newErrors.classDate = 'Выберите дату занятия';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBookClass = async () => {
    if (!validateForm() || !classData || !user) return;

    setBooking(true);
    try {
      const bookingData = {
        athlete_id: userRole === 'parent' ? selectedChild!.id : user.id,
        class_id: classId,
        booking_type: bookingType,
        class_date: classDate,
        notes: notes.trim() || undefined,
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

  const renderChildSelector = () => {
    if (userRole !== 'parent' || children.length === 0) return null;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Выберите ребенка</Title>
          {children.map((child) => (
            <List.Item
              key={child.id}
              title={child.full_name}
              description={`Возраст: ${childrenService.calculateAge(child.birth_date)} лет`}
              left={() => (
                <Avatar.Text 
                  size={40} 
                  label={child.full_name.charAt(0)} 
                  style={[
                    styles.childAvatar,
                    selectedChild?.id === child.id && styles.selectedChildAvatar
                  ]}
                />
              )}
              right={() => 
                selectedChild?.id === child.id && (
                  <MaterialCommunityIcons name="check-circle" size={24} color="#E74C3C" />
                )
              }
              onPress={() => setSelectedChild(child)}
              style={[
                styles.childItem,
                selectedChild?.id === child.id && styles.selectedChildItem
              ]}
            />
          ))}
          {errors.child && <HelperText type="error" visible={!!errors.child}>{errors.child}</HelperText>}
        </Card.Content>
      </Card>
    );
  };

  const renderBookingForm = () => {
    if (!classData) return null;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Информация о занятии</Title>
          
          <View style={styles.classInfo}>
            <Text style={styles.className}>{classData.name}</Text>
            <Text style={styles.classTime}>
              {classesService.formatDayOfWeek(classData.day_of_week)} • {classesService.formatTime(classData.start_time)} - {classesService.formatTime(classData.end_time)}
            </Text>
            <Text style={styles.classCoach}>
              Тренер: {classData.coach?.full_name || 'Не указан'}
            </Text>
            <Text style={styles.classPrice}>
              Стоимость: {classData.price_per_class} ₸
            </Text>
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
          />

          <Title style={styles.sectionTitle}>Дата занятия</Title>
          <TextInput
            label="Дата"
            value={classDate}
            onChangeText={setClassDate}
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
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#fff"
            error={!!errors.classDate}
          />
          {errors.classDate && <HelperText type="error" visible={!!errors.classDate}>{errors.classDate}</HelperText>}

          <Title style={styles.sectionTitle}>Дополнительная информация</Title>
          <TextInput
            label="Заметки (необязательно)"
            value={notes}
            onChangeText={setNotes}
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
            placeholderTextColor="#fff"
            multiline
            numberOfLines={3}
          />
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
        {renderChildSelector()}
        {renderBookingForm()}
        
        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            onPress={handleBookClass}
            style={styles.bookButton}
            buttonColor="#E74C3C"
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  classTime: {
    color: '#B0BEC5',
    fontSize: 16,
    marginBottom: 4,
  },
  classCoach: {
    color: '#B0BEC5',
    fontSize: 16,
    marginBottom: 4,
  },
  classPrice: {
    color: '#E74C3C',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    backgroundColor: '#2C3E50',
    marginVertical: 16,
  },
  segmentedButtons: {
    marginBottom: 12,
    marginHorizontal: -4,
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#2C3E50',
  },
  childItem: {
    backgroundColor: '#2C3E50',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedChildItem: {
    backgroundColor: '#34495E',
    borderColor: '#E74C3C',
    borderWidth: 1,
  },
  childAvatar: {
    backgroundColor: '#34495E',
  },
  selectedChildAvatar: {
    backgroundColor: '#E74C3C',
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
};

export default BookClassPage; 