import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Button,
  TextInput,
  HelperText,
  SegmentedButtons,
  Switch,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import classesService from '../services/classes';

interface CreateClassPageProps {
  navigation: any;
}

const CreateClassPage: React.FC<CreateClassPageProps> = ({ navigation }) => {
  const { user } = useAppContext();
  
  // Helper function to get display name for weekdays
  const getDayDisplayName = (day: string): string => {
    const dayNames: { [key: string]: string } = {
      'понедельник': 'Пн',
      'вторник': 'Вт', 
      'среда': 'Ср',
      'четверг': 'Чт',
      'пятница': 'Пт',
      'суббота': 'Сб',
      'воскресенье': 'Вс'
    };
    return dayNames[day] || day;
  };

  // Helper function to format time input
  const formatTimeInput = (text: string): string => {
    // Remove all non-numeric characters
    const numbers = text.replace(/\D/g, '');
    
    // Limit to 4 digits
    const limited = numbers.slice(0, 4);
    
    // Format with colon
    if (limited.length >= 3) {
      return `${limited.slice(0, 2)}:${limited.slice(2)}`;
    } else if (limited.length >= 1) {
      return limited;
    }
    
    return '';
  };

  // Helper function to handle time input change
  const handleTimeChange = (text: string, setter: (value: string) => void) => {
    const formatted = formatTimeInput(text);
    setter(formatted);
  };
  
  // State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [selectedDays, setSelectedDays] = useState<string[]>(['понедельник']);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [ageGroupMin, setAgeGroupMin] = useState('');
  const [ageGroupMax, setAgeGroupMax] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [pricePerClass, setPricePerClass] = useState('');
  const [isTrialAvailable, setIsTrialAvailable] = useState(false);
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Название занятия обязательно';
    }

    if (!startTime.trim()) {
      newErrors.startTime = 'Время начала обязательно';
    }

    if (!endTime.trim()) {
      newErrors.endTime = 'Время окончания обязательно';
    }

    if (startTime && endTime && startTime >= endTime) {
      newErrors.endTime = 'Время окончания должно быть позже времени начала';
    }

    if (!maxCapacity.trim()) {
      newErrors.maxCapacity = 'Максимальное количество участников обязательно';
    } else if (parseInt(maxCapacity) <= 0) {
      newErrors.maxCapacity = 'Количество участников должно быть больше 0';
    }

    if (!pricePerClass.trim()) {
      newErrors.pricePerClass = 'Стоимость занятия обязательна';
    } else if (parseInt(pricePerClass) < 0) {
      newErrors.pricePerClass = 'Стоимость не может быть отрицательной';
    }

    if (ageGroupMin && ageGroupMax && parseInt(ageGroupMin) >= parseInt(ageGroupMax)) {
      newErrors.ageGroupMax = 'Максимальный возраст должен быть больше минимального';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateClass = async () => {
    if (!validateForm() || !user) return;

    // Debug logging
    console.log('CreateClassPage: Starting class creation');
    console.log('CreateClassPage: User data:', user);
    console.log('CreateClassPage: User role:', user.primary_role);
    console.log('CreateClassPage: User roles:', user.roles);

    setCreating(true);
    try {
      const classData = {
        name: name.trim(),
        description: description.trim() || undefined,
        difficulty_level: difficultyLevel,
        day_of_week: selectedDays.join(', '),
        start_time: startTime,
        end_time: endTime,
        age_group_min: ageGroupMin ? parseInt(ageGroupMin) : undefined,
        age_group_max: ageGroupMax ? parseInt(ageGroupMax) : undefined,
        max_capacity: parseInt(maxCapacity),
        price_per_class: parseInt(pricePerClass),
        is_trial_available: isTrialAvailable,
        coach_id: user.id,
      };

      console.log('CreateClassPage: Sending class data:', classData);

      await classesService.createClass(classData);
      
      console.log('CreateClassPage: Class created successfully');
      
      Alert.alert(
        'Успешно',
        'Занятие успешно создано',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          }
        ]
      );
    } catch (error: any) {
      console.error('CreateClassPage: Error creating class:', error);
      console.error('CreateClassPage: Error response:', error.response?.data);
      Alert.alert('Ошибка', error.message || 'Не удалось создать занятие');
    } finally {
      setCreating(false);
    }
  };

  const renderBasicInfo = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Основная информация</Title>
        
        <TextInput
          label="Название занятия *"
          value={name}
          onChangeText={setName}
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
          error={!!errors.name}
        />
        {errors.name && <HelperText type="error" visible={!!errors.name}>{errors.name}</HelperText>}

        <TextInput
          label="Описание (необязательно)"
          value={description}
          onChangeText={setDescription}
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

        <Title style={styles.sectionTitle}>Уровень сложности</Title>
        <SegmentedButtons
          value={difficultyLevel}
          onValueChange={(value) => setDifficultyLevel(value as any)}
          buttons={[
            { value: 'beginner', label: 'Нач' },
            { value: 'intermediate', label: 'Сред' },
            { value: 'advanced', label: 'Прод' },
          ]}
          style={styles.segmentedButtons}
          density="small"
        />
      </Card.Content>
    </Card>
  );

  const renderScheduleInfo = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Расписание</Title>
        
        <Title style={styles.subsectionTitle}>Дни недели (выберите несколько)</Title>
        <View style={styles.weekdayContainer}>
          <View style={styles.weekdayRow}>
            {['понедельник', 'вторник', 'среда', 'четверг'].map((day) => (
              <Button
                key={day}
                mode="outlined"
                onPress={() => {
                  if (selectedDays.includes(day)) {
                    setSelectedDays(selectedDays.filter(d => d !== day));
                  } else {
                    setSelectedDays([...selectedDays, day]);
                  }
                }}
                style={[
                  styles.dayButton,
                  { 
                    backgroundColor: '#0D1B2A',
                    borderColor: selectedDays.includes(day) ? '#E74C3C' : '#fff',
                    borderWidth: 1,
                  }
                ]}
                textColor="#fff"
              >
                {getDayDisplayName(day)}
              </Button>
            ))}
          </View>
          <View style={styles.weekdayRow}>
            {['пятница', 'суббота', 'воскресенье'].map((day) => (
              <Button
                key={day}
                mode="outlined"
                onPress={() => {
                  if (selectedDays.includes(day)) {
                    setSelectedDays(selectedDays.filter(d => d !== day));
                  } else {
                    setSelectedDays([...selectedDays, day]);
                  }
                }}
                style={[
                  styles.dayButton,
                  { 
                    backgroundColor: '#0D1B2A',
                    borderColor: selectedDays.includes(day) ? '#E74C3C' : '#fff',
                    borderWidth: 1,
                  }
                ]}
                textColor="#fff"
              >
                {getDayDisplayName(day)}
              </Button>
            ))}
          </View>
        </View>

        <View style={styles.timeContainer}>
          <View style={styles.timeInput}>
            <TextInput
              label="Время начала *"
              value={startTime}
              onChangeText={(text) => handleTimeChange(text, setStartTime)}
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
              placeholder="HH:MM"
              keyboardType="numeric"
              error={!!errors.startTime}
            />
            {errors.startTime && <HelperText type="error" visible={!!errors.startTime}>{errors.startTime}</HelperText>}
          </View>

          <View style={styles.timeInput}>
            <TextInput
              label="Время окончания *"
              value={endTime}
              onChangeText={(text) => handleTimeChange(text, setEndTime)}
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
              placeholder="HH:MM"
              keyboardType="numeric"
              error={!!errors.endTime}
            />
            {errors.endTime && <HelperText type="error" visible={!!errors.endTime}>{errors.endTime}</HelperText>}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderCapacityInfo = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Вместимость и стоимость</Title>
        
        <TextInput
          label="Максимальное количество участников *"
          value={maxCapacity}
          onChangeText={setMaxCapacity}
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
          keyboardType="numeric"
          error={!!errors.maxCapacity}
        />
        {errors.maxCapacity && <HelperText type="error" visible={!!errors.maxCapacity}>{errors.maxCapacity}</HelperText>}

        <TextInput
          label="Стоимость за занятие (₸) *"
          value={pricePerClass}
          onChangeText={setPricePerClass}
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
          keyboardType="numeric"
          error={!!errors.pricePerClass}
        />
        {errors.pricePerClass && <HelperText type="error" visible={!!errors.pricePerClass}>{errors.pricePerClass}</HelperText>}

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Доступны пробные занятия</Text>
          <Switch
            value={isTrialAvailable}
            onValueChange={setIsTrialAvailable}
            color="#E74C3C"
          />
        </View>
      </Card.Content>
    </Card>
  );

  const renderAgeGroupInfo = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Возрастные ограничения (необязательно)</Title>
        
        <View style={styles.ageContainer}>
          <View style={styles.ageInput}>
            <TextInput
              label="Минимальный возраст"
              value={ageGroupMin}
              onChangeText={setAgeGroupMin}
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
              keyboardType="numeric"
            />
          </View>

          <View style={styles.ageInput}>
            <TextInput
              label="Максимальный возраст"
              value={ageGroupMax}
              onChangeText={setAgeGroupMax}
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
              keyboardType="numeric"
              error={!!errors.ageGroupMax}
            />
            {errors.ageGroupMax && <HelperText type="error" visible={!!errors.ageGroupMax}>{errors.ageGroupMax}</HelperText>}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Global Header */}
      <View style={styles.globalHeader}>
        <Text style={styles.headerTitle}>AIGA Connect</Text>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {renderBasicInfo()}
        {renderScheduleInfo()}
        {renderCapacityInfo()}
        {renderAgeGroupInfo()}
        
        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            onPress={handleCreateClass}
            style={styles.createButton}
            buttonColor="#E74C3C"
            icon="plus"
            loading={creating}
            disabled={creating}
          >
            Создать занятие
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            textColor="#E74C3C"
            icon="close"
            disabled={creating}
          >
            Отмена
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#1B263B',
    borderRadius: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subsectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    marginBottom: 6,
    backgroundColor: '#2C3E50',
  },
  segmentedButtons: {
    marginBottom: 12,
    marginHorizontal: -4,
  },
  weekdayContainer: {
    marginBottom: 12,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekdayButtons: {
    marginHorizontal: -4,
  },
  dayButton: {
    flex: 1,
    marginHorizontal: 4,
    marginVertical: 4,
    minWidth: 60,
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  timeInput: {
    flex: 1,
  },
  ageContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  ageInput: {
    flex: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  switchLabel: {
    color: '#fff',
    fontSize: 16,
  },
  actionsContainer: {
    gap: 8,
  },
  createButton: {
    marginTop: 8,
    height: 48,
  },
  cancelButton: {
    marginTop: 4,
    height: 48,
  },
};

export default CreateClassPage; 