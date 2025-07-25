import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Searchbar,
  ActivityIndicator,
  Menu,
  Divider,
  FAB,
} from 'react-native-paper';
import { useAppContext } from '../context/AppContext';
import trainingService, { Training, TrainingFilter } from '../services/training';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const SchedulePage: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { userRole, user, linkedChildren } = useAppContext();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<TrainingFilter>({});
  const [bookingLoading, setBookingLoading] = useState<number | null>(null);

  useEffect(() => {
    loadTrainings();
  }, [currentFilter]);

  const loadTrainings = async () => {
    try {
      setLoading(true);
      const data = await trainingService.getUpcomingTrainings();
      setTrainings(data);
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось загрузить расписание');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrainings();
    setRefreshing(false);
  };

  const handleBookTraining = async (training: Training, athleteId?: number) => {
    if (!user) return;

    // Determine athlete ID
    let targetAthleteId = athleteId;
    if (!targetAthleteId) {
      if (userRole === 'athlete') {
        targetAthleteId = user.id;
      } else if (userRole === 'parent' && linkedChildren.length === 1) {
        targetAthleteId = linkedChildren[0].child.id;
      } else if (userRole === 'parent' && linkedChildren.length > 1) {
        // Show selection dialog for multiple children
        showChildSelectionDialog(training);
        return;
      } else {
        Alert.alert('Ошибка', 'Не удалось определить спортсмена для записи');
        return;
      }
    }

    setBookingLoading(training.id);
    try {
      await trainingService.createBooking({
        training_id: training.id,
        athlete_id: targetAthleteId,
      });
      
      Alert.alert('Успешно', 'Запись на тренировку создана!');
      await loadTrainings(); // Refresh to show updated spots
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось записаться на тренировку');
    } finally {
      setBookingLoading(null);
    }
  };

  const showChildSelectionDialog = (training: Training) => {
    const childOptions = linkedChildren.map(rel => ({
      text: rel.child.full_name || `Ребенок ${rel.child.iin}`,
      onPress: () => handleBookTraining(training, rel.child.id),
    }));

    Alert.alert(
      'Выберите ребенка',
      'Для кого записать на тренировку?',
      [
        ...childOptions,
        { text: 'Отмена', style: 'cancel' },
      ]
    );
  };

  const applyFilter = (filter: Partial<TrainingFilter>) => {
    setCurrentFilter({ ...currentFilter, ...filter });
    setFilterMenuVisible(false);
  };

  const clearFilters = () => {
    setCurrentFilter({});
    setFilterMenuVisible(false);
  };

  const filteredTrainings = trainings.filter(training => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        training.title.toLowerCase().includes(query) ||
        training.trainer.full_name?.toLowerCase().includes(query) ||
        training.location.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const renderTrainingCard = (training: Training) => {
    const isBookable = training.is_bookable && training.available_spots > 0;
    const canBook = userRole !== 'coach' && isBookable;

    return (
      <Card 
        key={training.id} 
        style={styles.trainingCard}
        onPress={() => navigation?.navigate('TrainingDetail', { trainingId: training.id.toString() })}
      >
        <Card.Content>
          <View style={styles.trainingHeader}>
            <View style={styles.trainingInfo}>
              <Title style={styles.trainingTitle}>{training.title}</Title>
              <Text style={styles.trainerName}>
                Тренер: {training.trainer.full_name || 'Не указан'}
              </Text>
            </View>
            <View style={styles.trainingMeta}>
              <Chip 
                mode="outlined" 
                style={styles.typeChip}
                textStyle={styles.chipText}
              >
                {trainingService.getTrainingTypeDisplayName(training.training_type)}
              </Chip>
            </View>
          </View>

          <View style={styles.trainingDetails}>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="clock" size={16} color="#B0BEC5" />
              <Text style={styles.detailText}>
                {trainingService.formatDateTime(training.start_time)} - {trainingService.formatTime(training.end_time)}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#B0BEC5" />
              <Text style={styles.detailText}>{training.location}</Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="account-group" size={16} color="#B0BEC5" />
              <Text style={styles.detailText}>
                Свободно мест: {training.available_spots}/{training.capacity}
              </Text>
            </View>

            <View style={styles.chipRow}>
              <Chip 
                mode="outlined" 
                style={styles.levelChip}
                textStyle={styles.chipText}
              >
                {trainingService.getLevelDisplayName(training.level)}
              </Chip>
              <Chip 
                mode="outlined" 
                style={styles.ageChip}
                textStyle={styles.chipText}
              >
                {trainingService.getAgeGroupDisplayName(training.age_group)}
              </Chip>
              <Chip 
                mode="outlined" 
                style={styles.beltChip}
                textStyle={styles.chipText}
              >
                {trainingService.getBeltLevelDisplayName(training.belt_level)}
              </Chip>
            </View>

            {training.description && (
              <Paragraph style={styles.description}>{training.description}</Paragraph>
            )}

            {training.price && (
              <Text style={styles.price}>Стоимость: {training.price / 100} ₸</Text>
            )}
          </View>

          {canBook && (
            <Button
              mode="contained"
              onPress={() => handleBookTraining(training)}
              loading={bookingLoading === training.id}
              disabled={bookingLoading === training.id}
              style={styles.bookButton}
              buttonColor="#E74C3C"
            >
              {training.available_spots === 0 ? 'В лист ожидания' : 'Записаться'}
            </Button>
          )}

          {!isBookable && training.available_spots === 0 && (
            <Text style={styles.fullText}>Мест нет</Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderFilterMenu = () => (
    <Menu
      visible={filterMenuVisible}
      onDismiss={() => setFilterMenuVisible(false)}
      anchor={
        <Button
          mode="outlined"
          onPress={() => setFilterMenuVisible(true)}
          style={styles.filterButton}
          textColor="#fff"
        >
          Фильтры
        </Button>
      }
    >
      <Menu.Item
        onPress={() => applyFilter({ training_type: 'group' })}
        title="Групповые"
      />
      <Menu.Item
        onPress={() => applyFilter({ training_type: 'individual' })}
        title="Индивидуальные"
      />
      <Divider />
      <Menu.Item
        onPress={() => applyFilter({ level: 'beginner' })}
        title="Начинающий"
      />
      <Menu.Item
        onPress={() => applyFilter({ level: 'intermediate' })}
        title="Средний"
      />
      <Menu.Item
        onPress={() => applyFilter({ level: 'advanced' })}
        title="Продвинутый"
      />
      <Divider />
      <Menu.Item
        onPress={clearFilters}
        title="Очистить фильтры"
      />
    </Menu>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E74C3C" />
        <Text style={styles.loadingText}>Загрузка расписания...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Поиск тренировок..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          theme={{ colors: { primary: '#E74C3C' } }}
        />
        {renderFilterMenu()}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredTrainings.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="calendar-blank" size={64} color="#B0BEC5" />
            <Text style={styles.emptyStateText}>Нет доступных тренировок</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery || Object.keys(currentFilter).length > 0
                ? 'Попробуйте изменить фильтры или поисковый запрос'
                : 'Тренировки пока не запланированы'}
            </Text>
          </View>
        ) : (
          <View style={styles.trainingsList}>
            {filteredTrainings.map(renderTrainingCard)}
          </View>
        )}
      </ScrollView>

      {userRole === 'coach' && (
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => navigation?.navigate('CreateTraining')}
          label="Создать"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    backgroundColor: '#1B263B',
  },
  filterButton: {
    borderColor: '#E74C3C',
  },
  scrollView: {
    flex: 1,
  },
  trainingsList: {
    padding: 16,
    gap: 12,
  },
  trainingCard: {
    backgroundColor: '#1B263B',
    marginBottom: 12,
  },
  trainingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  trainingInfo: {
    flex: 1,
  },
  trainingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  trainerName: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  trainingMeta: {
    alignItems: 'flex-end',
  },
  trainingDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#fff',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  typeChip: {
    borderColor: '#E74C3C',
  },
  levelChip: {
    borderColor: '#4CAF50',
  },
  ageChip: {
    borderColor: '#FF9800',
  },
  beltChip: {
    borderColor: '#2196F3',
  },
  chipText: {
    fontSize: 12,
    color: '#fff',
  },
  description: {
    fontSize: 14,
    color: '#B0BEC5',
    marginTop: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginTop: 8,
  },
  bookButton: {
    marginTop: 12,
  },
  fullText: {
    fontSize: 14,
    color: '#FF5722',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: 'bold',
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 300,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#B0BEC5',
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#E74C3C',
  },
});

export default SchedulePage; 