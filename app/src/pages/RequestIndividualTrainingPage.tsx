import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  TextInput,
  ActivityIndicator,
  Divider,
  Chip,
} from 'react-native-paper';
import { useAppContext } from '../context/AppContext';
import bookingsService, { IndividualTrainingRequestCreate } from '../services/bookings';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface RequestIndividualTrainingPageProps {
  navigation: any;
}

interface Coach {
  id: number;
  full_name: string;
  email: string;
}

const RequestIndividualTrainingPage: React.FC<RequestIndividualTrainingPageProps> = ({ navigation }) => {
  const { user, userRole } = useAppContext();
  
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [requestedDate, setRequestedDate] = useState<Date>(new Date());
  const [preferredTimeStart, setPreferredTimeStart] = useState('');
  const [preferredTimeEnd, setPreferredTimeEnd] = useState('');
  const [athleteNotes, setAthleteNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimeStartPicker, setShowTimeStartPicker] = useState(false);
  const [showTimeEndPicker, setShowTimeEndPicker] = useState(false);

  useEffect(() => {
    loadCoaches();
  }, []);

  const loadCoaches = async () => {
    try {
      // TODO: Replace with actual API call to get coaches
      const mockCoaches: Coach[] = [
        { id: 1, full_name: 'Иван Петров', email: 'ivan@aiga.com' },
        { id: 2, full_name: 'Мария Сидорова', email: 'maria@aiga.com' },
        { id: 3, full_name: 'Алексей Козлов', email: 'alex@aiga.com' },
      ];
      setCoaches(mockCoaches);
    } catch (error: any) {
      console.error('Error loading coaches:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить список тренеров');
    }
  };

  const validateForm = (): boolean => {
    if (!selectedCoach) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите тренера');
      return false;
    }

    if (requestedDate < new Date()) {
      Alert.alert('Ошибка', 'Дата тренировки не может быть в прошлом');
      return false;
    }

    if (preferredTimeStart && preferredTimeEnd) {
      const startTime = new Date(`2000-01-01T${preferredTimeStart}`);
      const endTime = new Date(`2000-01-01T${preferredTimeEnd}`);
      if (startTime >= endTime) {
        Alert.alert('Ошибка', 'Время окончания должно быть позже времени начала');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user) return;

    setLoading(true);
    try {
      const requestData: IndividualTrainingRequestCreate = {
        coach_id: selectedCoach!.id,
        requested_date: requestedDate.toISOString(),
        preferred_time_start: preferredTimeStart || undefined,
        preferred_time_end: preferredTimeEnd || undefined,
        athlete_notes: athleteNotes.trim() || undefined,
      };

      await bookingsService.createIndividualTrainingRequest(requestData);
      
      Alert.alert(
        'Успех',
        'Запрос на индивидуальную тренировку отправлен',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error: any) {
      console.error('Error creating individual training request:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось отправить запрос');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time: string): string => {
    if (!time) return 'Не указано';
    return time;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0D1B2A" />
      
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Индивидуальная тренировка</Title>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.mainCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Запрос на индивидуальную тренировку</Title>
            
            <Divider style={styles.divider} />

            {/* Coach Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Выберите тренера *</Text>
              <View style={styles.coachesContainer}>
                {coaches.map((coach) => (
                  <Chip
                    key={coach.id}
                    selected={selectedCoach?.id === coach.id}
                    onPress={() => setSelectedCoach(coach)}
                    style={[
                      styles.coachChip,
                      selectedCoach?.id === coach.id ? styles.selectedCoachChip : styles.unselectedCoachChip
                    ]}
                    textStyle={styles.coachChipText}
                  >
                    {coach.full_name}
                  </Chip>
                ))}
              </View>
            </View>

            <Divider style={styles.divider} />

            {/* Date Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Желаемая дата *</Text>
              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
                textColor="#E74C3C"
                icon="calendar"
                buttonColor="transparent"
              >
                {formatDate(requestedDate)}
              </Button>
            </View>

            <Divider style={styles.divider} />

            {/* Time Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Предпочтительное время</Text>
              
              <View style={styles.timeContainer}>
                <View style={styles.timeInput}>
                  <Text style={styles.timeLabel}>Начало</Text>
                  <Button
                    mode="outlined"
                    onPress={() => setShowTimeStartPicker(true)}
                    style={styles.timeButton}
                    textColor="#E74C3C"
                    buttonColor="transparent"
                  >
                    {formatTime(preferredTimeStart)}
                  </Button>
                </View>
                
                <View style={styles.timeInput}>
                  <Text style={styles.timeLabel}>Окончание</Text>
                  <Button
                    mode="outlined"
                    onPress={() => setShowTimeEndPicker(true)}
                    style={styles.timeButton}
                    textColor="#E74C3C"
                    buttonColor="transparent"
                  >
                    {formatTime(preferredTimeEnd)}
                  </Button>
                </View>
              </View>
            </View>

            <Divider style={styles.divider} />

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Дополнительная информация</Text>
              <TextInput
                mode="outlined"
                label="Заметки для тренера"
                value={athleteNotes}
                onChangeText={setAthleteNotes}
                multiline
                numberOfLines={4}
                style={styles.notesInput}
                outlineColor="#fff"
                activeOutlineColor="#E74C3C"
                textColor="#fff"
                placeholderTextColor="#fff"
                theme={{
                  colors: {
                    onSurfaceVariant: '#fff',
                  }
                }}
              />
            </View>
          </Card.Content>
        </Card>

        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading || !selectedCoach}
            style={[styles.bookButton, !selectedCoach && styles.disabledButton]}
            buttonColor={selectedCoach ? "#E74C3C" : "#666"}
            icon="send"
          >
            {selectedCoach ? "Отправить запрос" : "Выберите тренера"}
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            textColor="#E74C3C"
            icon="close"
            disabled={loading}
          >
            Отмена
          </Button>
        </View>
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={requestedDate}
          mode="date"
          display="inline"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setRequestedDate(selectedDate);
            }
          }}
          minimumDate={new Date()}
        />
      )}

      {/* Time Start Picker */}
      {showTimeStartPicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          display="spinner"
          onChange={(event, selectedDate) => {
            setShowTimeStartPicker(false);
            if (selectedDate) {
              const hours = selectedDate.getHours().toString().padStart(2, '0');
              const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
              setPreferredTimeStart(`${hours}:${minutes}`);
            }
          }}
        />
      )}

      {/* Time End Picker */}
      {showTimeEndPicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          display="spinner"
          onChange={(event, selectedDate) => {
            setShowTimeEndPicker(false);
            if (selectedDate) {
              const hours = selectedDate.getHours().toString().padStart(2, '0');
              const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
              setPreferredTimeEnd(`${hours}:${minutes}`);
            }
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#0D1B2A',
  },
  headerTitle: {
    color: '#E74C3C',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  mainCard: {
    backgroundColor: '#1B263B',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#E74C3C',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    backgroundColor: '#E74C3C',
    marginVertical: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  coachesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  coachChip: {
    backgroundColor: '#2C3E50',
  },
  selectedCoachChip: {
    borderColor: '#E74C3C',
    borderWidth: 2,
  },
  unselectedCoachChip: {
    borderColor: '#fff',
    borderWidth: 1,
  },
  coachChipText: {
    color: '#FFFFFF',
  },
  dateButton: {
    borderColor: '#fff',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  timeLabel: {
    color: '#E74C3C',
    fontSize: 14,
    marginBottom: 4,
  },
  timeButton: {
    borderColor: '#fff',
  },
  notesInput: {
    backgroundColor: '#2C3E50',
  },
  submitButton: {
    marginTop: 16,
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
  disabledButton: {
    opacity: 0.6,
  },
});

export default RequestIndividualTrainingPage; 