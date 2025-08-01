import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import tournamentsService, { TournamentCreate } from '../services/tournaments';

const CreateTournamentPage: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { user, isSidebarOpen, setIsSidebarOpen } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    event_date: '',
    registration_start: '',
    registration_end: '',
    max_participants: '',
    registration_fee: '',
    tournament_level: 'local' as const,
    age_categories: '',
    weight_categories: '',
    belt_categories: '',
    organizer: '',
    contact_info: '',
  });

  const handleSidebarClose = useCallback(() => {
    setIsSidebarOpen(false);
  }, [setIsSidebarOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.location || !formData.event_date) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните обязательные поля');
      return;
    }

    try {
      setLoading(true);
      
      const tournamentData: TournamentCreate = {
        name: formData.name,
        description: formData.description || undefined,
        location: formData.location,
        event_date: formData.event_date,
        registration_start: formData.registration_start || undefined,
        registration_end: formData.registration_end || undefined,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : undefined,
        registration_fee: formData.registration_fee ? parseInt(formData.registration_fee) : undefined,
        tournament_level: formData.tournament_level,
        age_categories: formData.age_categories || undefined,
        weight_categories: formData.weight_categories || undefined,
        belt_categories: formData.belt_categories || undefined,
        organizer: formData.organizer || undefined,
        contact_info: formData.contact_info || undefined,
      };

      await tournamentsService.createTournament(tournamentData);
      Alert.alert('Успех', 'Турнир создан успешно!', [
        { text: 'OK', onPress: () => navigation?.goBack() }
      ]);
    } catch (error: any) {
      console.error('Error creating tournament:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось создать турнир');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.is_head_coach) {
    return (
      <Layout title="Создать турнир" onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#E74C3C" />
          <Text style={styles.errorText}>Доступ запрещен</Text>
          <Text style={styles.errorSubtext}>Только главные тренеры могут создавать турниры</Text>
        </View>
        <Sidebar isVisible={isSidebarOpen} onClose={handleSidebarClose} />
      </Layout>
    );
  }

  return (
    <Layout title="Создать турнир" onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}>
      <ScrollView style={styles.container}>
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Основная информация</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Название турнира *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Введите название турнира"
              placeholderTextColor="#7F8C8D"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Описание</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="Описание турнира"
              placeholderTextColor="#7F8C8D"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Место проведения *</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(value) => handleInputChange('location', value)}
              placeholder="Адрес или название зала"
              placeholderTextColor="#7F8C8D"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Дата проведения *</Text>
            <TextInput
              style={styles.input}
              value={formData.event_date}
              onChangeText={(value) => handleInputChange('event_date', value)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#7F8C8D"
            />
          </View>

          <Text style={styles.sectionTitle}>Регистрация</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Начало регистрации</Text>
            <TextInput
              style={styles.input}
              value={formData.registration_start}
              onChangeText={(value) => handleInputChange('registration_start', value)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#7F8C8D"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Конец регистрации</Text>
            <TextInput
              style={styles.input}
              value={formData.registration_end}
              onChangeText={(value) => handleInputChange('registration_end', value)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#7F8C8D"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Максимум участников</Text>
            <TextInput
              style={styles.input}
              value={formData.max_participants}
              onChangeText={(value) => handleInputChange('max_participants', value)}
              placeholder="Количество"
              placeholderTextColor="#7F8C8D"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Взнос за участие (₸)</Text>
            <TextInput
              style={styles.input}
              value={formData.registration_fee}
              onChangeText={(value) => handleInputChange('registration_fee', value)}
              placeholder="Сумма"
              placeholderTextColor="#7F8C8D"
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.sectionTitle}>Категории</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Возрастные категории</Text>
            <TextInput
              style={styles.input}
              value={formData.age_categories}
              onChangeText={(value) => handleInputChange('age_categories', value)}
              placeholder="Например: 8-10, 11-13, 14-16"
              placeholderTextColor="#7F8C8D"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Весовая категория</Text>
            <TextInput
              style={styles.input}
              value={formData.weight_categories}
              onChangeText={(value) => handleInputChange('weight_categories', value)}
              placeholder="Например: до 50кг, 50-60кг"
              placeholderTextColor="#7F8C8D"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Категории по поясам</Text>
            <TextInput
              style={styles.input}
              value={formData.belt_categories}
              onChangeText={(value) => handleInputChange('belt_categories', value)}
              placeholder="Например: белый, желтый, оранжевый"
              placeholderTextColor="#7F8C8D"
            />
          </View>

          <Text style={styles.sectionTitle}>Контакты</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Организатор</Text>
            <TextInput
              style={styles.input}
              value={formData.organizer}
              onChangeText={(value) => handleInputChange('organizer', value)}
              placeholder="Имя организатора"
              placeholderTextColor="#7F8C8D"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Контактная информация</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.contact_info}
              onChangeText={(value) => handleInputChange('contact_info', value)}
              placeholder="Телефон, email или другие контакты"
              placeholderTextColor="#7F8C8D"
              multiline
              numberOfLines={2}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Создать турнир</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Sidebar isVisible={isSidebarOpen} onClose={handleSidebarClose} />
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#B0BEC5',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1B263B',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2C3E50',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#E74C3C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 32,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#7F8C8D',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#E74C3C',
    marginTop: 16,
    fontWeight: 'bold',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#B0BEC5',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default CreateTournamentPage; 