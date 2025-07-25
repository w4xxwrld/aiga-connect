import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  TextInput,
  SegmentedButtons,
  Chip,
  ActivityIndicator,
  HelperText,
} from 'react-native-paper';
import { useAppContext } from '../context/AppContext';
import trainingService, { TrainingCreate } from '../services/training';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CreateTrainingPageProps {
  navigation: any;
}

const CreateTrainingPage: React.FC<CreateTrainingPageProps> = ({ navigation }) => {
  const { user, userRole } = useAppContext();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [trainingType, setTrainingType] = useState('group');
  const [level, setLevel] = useState('beginner');
  const [ageGroup, setAgeGroup] = useState('adults_18_plus');
  const [beltLevel, setBeltLevel] = useState('mixed');
  const [capacity, setCapacity] = useState('20');
  const [location, setLocation] = useState('Главный зал');
  const [price, setPrice] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if user is coach
  if (userRole !== 'coach') {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color="#E74C3C" />
        <Text style={styles.errorText}>
          Только тренеры могут создавать тренировки
        </Text>
        <Button 
          mode="outlined" 
          onPress={() => navigation.goBack()}
          textColor="#fff"
          style={styles.backButton}
        >
          Назад
        </Button>
      </View>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Название обязательно';
    }

    if (!startDate.trim()) {
      newErrors.startDate = 'Дата обязательна';
    } else {
      // Basic date format validation (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDate)) {
        newErrors.startDate = 'Формат даты: ГГГГ-ММ-ДД';
      }
    }

    if (!startTime.trim()) {
      newErrors.startTime = 'Время начала обязательно';
    } else {
      // Basic time format validation (HH:MM)
      const timeRegex = /^\d{2}:\d{2}$/;
      if (!timeRegex.test(startTime)) {
        newErrors.startTime = 'Формат времени: ЧЧ:ММ';
      }
    }

    if (!endTime.trim()) {
      newErrors.endTime = 'Время окончания обязательно';
    } else {
      const timeRegex = /^\d{2}:\d{2}$/;
      if (!timeRegex.test(endTime)) {
        newErrors.endTime = 'Формат времени: ЧЧ:ММ';
      }
    }

    if (!location.trim()) {
      newErrors.location = 'Место проведения обязательно';
    }

    const capacityNum = parseInt(capacity);
    if (isNaN(capacityNum) || capacityNum < 1 || capacityNum > 50) {
      newErrors.capacity = 'Вместимость должна быть от 1 до 50';
    }

    if (trainingType === 'individual' && price.trim()) {
      const priceNum = parseInt(price);
      if (isNaN(priceNum) || priceNum < 0) {
        newErrors.price = 'Цена должна быть положительным числом';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Ошибка', 'Пожалуйста, исправьте ошибки в форме');
      return;
    }

    try {
      setLoading(true);

      // Combine date and time
      const startDateTime = `${startDate}T${startTime}:00`;
      const endDateTime = `${startDate}T${endTime}:00`;

      const trainingData: TrainingCreate = {
        title: title.trim(),
        description: description.trim() || undefined,
        start_time: startDateTime,
        end_time: endDateTime,
        training_type: trainingType as any,
        level: level as any,
        age_group: ageGroup as any,
        belt_level: beltLevel as any,
        capacity: parseInt(capacity),
        location: location.trim(),
        price: trainingType === 'individual' && price.trim() ? parseInt(price) : undefined,
      };

      await trainingService.createTraining(trainingData);
      
      Alert.alert('Успешно', 'Тренировка создана!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]);
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось создать тренировку');
    } finally {
      setLoading(false);
    }
  };

  const renderBasicInfo = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Основная информация</Title>
        
        <TextInput
          label="Название тренировки"
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          error={!!errors.title}
          style={styles.input}
          theme={{
            colors: {
              onSurfaceVariant: '#fff',
              placeholder: '#B0BEC5',
              onSurface: '#fff',
            }
          }}
        />
        {errors.title && <HelperText type="error">{errors.title}</HelperText>}

        <TextInput
          label="Описание (необязательно)"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
          theme={{
            colors: {
              onSurfaceVariant: '#fff',
              placeholder: '#B0BEC5',
              onSurface: '#fff',
            }
          }}
        />

        <TextInput
          label="Место проведения"
          value={location}
          onChangeText={setLocation}
          mode="outlined"
          error={!!errors.location}
          style={styles.input}
          theme={{
            colors: {
              onSurfaceVariant: '#fff',
              placeholder: '#B0BEC5',
              onSurface: '#fff',
            }
          }}
        />
        {errors.location && <HelperText type="error">{errors.location}</HelperText>}
      </Card.Content>
    </Card>
  );

  const renderDateTime = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Дата и время</Title>
        
        <TextInput
          label="Дата (ГГГГ-ММ-ДД)"
          value={startDate}
          onChangeText={setStartDate}
          mode="outlined"
          error={!!errors.startDate}
          placeholder="2024-01-15"
          style={styles.input}
          theme={{
            colors: {
              onSurfaceVariant: '#fff',
              placeholder: '#B0BEC5',
              onSurface: '#fff',
            }
          }}
        />
        {errors.startDate && <HelperText type="error">{errors.startDate}</HelperText>}

        <View style={styles.timeRow}>
          <View style={styles.timeInput}>
            <TextInput
              label="Время начала (ЧЧ:ММ)"
              value={startTime}
              onChangeText={setStartTime}
              mode="outlined"
              error={!!errors.startTime}
              placeholder="10:00"
              style={styles.input}
              theme={{
                colors: {
                  onSurfaceVariant: '#fff',
                  placeholder: '#B0BEC5',
                  onSurface: '#fff',
                }
              }}
            />
            {errors.startTime && <HelperText type="error">{errors.startTime}</HelperText>}
          </View>
          
          <View style={styles.timeInput}>
            <TextInput
              label="Время окончания (ЧЧ:ММ)"
              value={endTime}
              onChangeText={setEndTime}
              mode="outlined"
              error={!!errors.endTime}
              placeholder="11:30"
              style={styles.input}
              theme={{
                colors: {
                  onSurfaceVariant: '#fff',
                  placeholder: '#B0BEC5',
                  onSurface: '#fff',
                }
              }}
            />
            {errors.endTime && <HelperText type="error">{errors.endTime}</HelperText>}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderTrainingSettings = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Настройки тренировки</Title>
        
        <Text style={styles.fieldLabel}>Тип тренировки</Text>
        <SegmentedButtons
          value={trainingType}
          onValueChange={setTrainingType}
          buttons={[
            { value: 'group', label: 'Групповая' },
            { value: 'individual', label: 'Индивидуальная' },
            { value: 'competition_prep', label: 'Подготовка' },
            { value: 'seminar', label: 'Семинар' },
          ]}
          style={styles.segmentedButtons}
        />

        <Text style={styles.fieldLabel}>Уровень подготовки</Text>
        <SegmentedButtons
          value={level}
          onValueChange={setLevel}
          buttons={[
            { value: 'beginner', label: 'Начинающий' },
            { value: 'intermediate', label: 'Средний' },
            { value: 'advanced', label: 'Продвинутый' },
            { value: 'expert', label: 'Эксперт' },
          ]}
          style={styles.segmentedButtons}
        />

        <Text style={styles.fieldLabel}>Возрастная группа</Text>
        <View style={styles.chipContainer}>
          {[
            { value: 'kids_4_7', label: '4-7 лет' },
            { value: 'kids_8_12', label: '8-12 лет' },
            { value: 'teens_13_17', label: '13-17 лет' },
            { value: 'adults_18_plus', label: '18+ лет' },
            { value: 'mixed_ages', label: 'Смешанные' },
          ].map((option) => (
            <Chip
              key={option.value}
              mode={ageGroup === option.value ? 'flat' : 'outlined'}
              onPress={() => setAgeGroup(option.value)}
              style={[
                styles.chip,
                ageGroup === option.value && styles.selectedChip
              ]}
              textStyle={[
                styles.chipText,
                ageGroup === option.value && styles.selectedChipText
              ]}
            >
              {option.label}
            </Chip>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Уровень пояса</Text>
        <View style={styles.chipContainer}>
          {[
            { value: 'white', label: 'Белый' },
            { value: 'yellow', label: 'Желтый' },
            { value: 'orange', label: 'Оранжевый' },
            { value: 'green', label: 'Зеленый' },
            { value: 'blue', label: 'Синий' },
            { value: 'brown', label: 'Коричневый' },
            { value: 'black', label: 'Черный' },
            { value: 'mixed', label: 'Смешанный' },
          ].map((option) => (
            <Chip
              key={option.value}
              mode={beltLevel === option.value ? 'flat' : 'outlined'}
              onPress={() => setBeltLevel(option.value)}
              style={[
                styles.chip,
                beltLevel === option.value && styles.selectedChip
              ]}
              textStyle={[
                styles.chipText,
                beltLevel === option.value && styles.selectedChipText
              ]}
            >
              {option.label}
            </Chip>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  const renderCapacityAndPrice = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Вместимость и цена</Title>
        
        <TextInput
          label="Максимальное количество участников"
          value={capacity}
          onChangeText={setCapacity}
          mode="outlined"
          keyboardType="numeric"
          error={!!errors.capacity}
          style={styles.input}
          theme={{
            colors: {
              onSurfaceVariant: '#fff',
              placeholder: '#B0BEC5',
              onSurface: '#fff',
            }
          }}
        />
        {errors.capacity && <HelperText type="error">{errors.capacity}</HelperText>}

        {trainingType === 'individual' && (
          <>
            <TextInput
              label="Цена (₸, необязательно)"
              value={price}
              onChangeText={setPrice}
              mode="outlined"
              keyboardType="numeric"
              error={!!errors.price}
              style={styles.input}
              theme={{
                colors: {
                  onSurfaceVariant: '#fff',
                  placeholder: '#B0BEC5',
                  onSurface: '#fff',
                }
              }}
            />
            {errors.price && <HelperText type="error">{errors.price}</HelperText>}
          </>
        )}
      </Card.Content>
    </Card>
  );

  const renderSubmitButton = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          buttonColor="#E74C3C"
          style={styles.submitButton}
        >
          Создать тренировку
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView style={styles.container}>
      {renderBasicInfo()}
      {renderDateTime()}
      {renderTrainingSettings()}
      {renderCapacityAndPrice()}
      {renderSubmitButton()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D1B2A',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    borderColor: '#E74C3C',
  },
  card: {
    backgroundColor: '#1B263B',
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#2C3E50',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInput: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    marginTop: 16,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    borderColor: '#E74C3C',
  },
  selectedChip: {
    backgroundColor: '#E74C3C',
  },
  chipText: {
    fontSize: 12,
    color: '#fff',
  },
  selectedChipText: {
    color: '#fff',
  },
  submitButton: {
    paddingVertical: 8,
  },
});

export default CreateTrainingPage; 