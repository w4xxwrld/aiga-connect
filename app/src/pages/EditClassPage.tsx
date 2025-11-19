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
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import classesService, { Class } from '../services/classes';

interface EditClassPageProps {
  navigation: any;
  route: {
    params: {
      classId: number;
    };
  };
}

const EditClassPage: React.FC<EditClassPageProps> = ({ navigation, route }) => {
  const { classId } = route.params;
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

  // State
  const [classData, setClassData] = useState<Class | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState<'beginner' | 'amateur' | 'professional'>('beginner');
  const [selectedDays, setSelectedDays] = useState<string[]>(['понедельник']);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadClassData();
  }, []);

  const loadClassData = async () => {
    try {
      setLoading(true);
      const data = await classesService.getClass(classId);
      setClassData(data);

      // Populate form fields
      setName(data.name);
      setDescription(data.description || '');
      setDifficultyLevel(data.difficulty_level);
      setSelectedDays(data.days_of_week);
      setStartTime(data.start_time);
      setEndTime(data.end_time);
      setMaxCapacity(data.max_capacity.toString());
      setPrice(data.price.toString());
    } catch (error: any) {
      console.error('Error loading class data:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось загрузить данные занятия');
    } finally {
      setLoading(false);
    }
  };

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

    if (!price.trim()) {
      newErrors.price = 'Стоимость занятия обязательна';
    } else if (parseInt(price) < 0) {
      newErrors.price = 'Стоимость не может быть отрицательной';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateClass = async () => {
    if (!validateForm() || !user) return;

    setSaving(true);
    try {
      const updateData = {
        name: name.trim(),
        description: description.trim() || undefined,
        difficulty_level: difficultyLevel,
        days_of_week: selectedDays.map(day => classesService.convertDayToEnglish(day)),
        start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
        end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
        max_capacity: parseInt(maxCapacity),
        price: parseInt(price),
      };

      await classesService.updateClass(classId, updateData);
      
      Alert.alert(
        'Успешно',
        'Занятие успешно обновлено',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          }
        ]
      );
    } catch (error: any) {
      console.error('Error updating class:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось обновить занятие');
    } finally {
      setSaving(false);
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
            { value: 'amateur', label: 'Люб' },
            { value: 'professional', label: 'Проф' },
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
              onChangeText={setStartTime}
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
              error={!!errors.startTime}
            />
            {errors.startTime && <HelperText type="error" visible={!!errors.startTime}>{errors.startTime}</HelperText>}
          </View>

          <View style={styles.timeInput}>
            <TextInput
              label="Время окончания *"
              value={endTime}
              onChangeText={setEndTime}
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
          value={price}
          onChangeText={setPrice}
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
          error={!!errors.price}
        />
        {errors.price && <HelperText type="error" visible={!!errors.price}>{errors.price}</HelperText>}
      </Card.Content>
    </Card>
  );

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
        {renderBasicInfo()}
        {renderScheduleInfo()}
        {renderCapacityInfo()}

        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            onPress={handleUpdateClass}
            style={styles.updateButton}
            buttonColor="#E74C3C"
            icon="content-save"
            loading={saving}
            disabled={saving}
          >
            Сохранить изменения
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            textColor="#E74C3C"
            icon="close"
            disabled={saving}
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
  subsectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    marginBottom: 8,
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
    gap: 12,
  },
  timeInput: {
    flex: 1,
  },
  actionsContainer: {
    gap: 12,
  },
  updateButton: {
    marginTop: 8,
  },
  cancelButton: {
    marginTop: 4,
  },
};

export default EditClassPage; 