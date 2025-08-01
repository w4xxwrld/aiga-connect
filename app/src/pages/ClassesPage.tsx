import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  Badge,
  ActivityIndicator,
  Searchbar,
  Chip,
} from 'react-native-paper';
import { useAppContext } from '../context/AppContext';
import classesService, { Class } from '../services/classes';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';

const ClassesPage: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { user, userRole, isSidebarOpen, setIsSidebarOpen } = useAppContext();
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    filterClasses();
  }, [classes, searchQuery, selectedDifficulty]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      let classesData: Class[];
      
      console.log('ClassesPage: User data:', {
        userRole,
        userId: user?.id,
        isHeadCoach: user?.is_head_coach,
        user: user
      });
      
      console.log('ClassesPage: User object details:', {
        id: user?.id,
        full_name: user?.full_name,
        primary_role: user?.primary_role,
        is_head_coach: user?.is_head_coach,
        roles: user?.roles
      });
      
      console.log('ClassesPage: Checking conditions:', {
        isCoach: userRole === 'coach',
        isHeadCoach: user?.is_head_coach === true,
        userId: user?.id
      });
      
      if (userRole === 'coach') {
        if (user?.is_head_coach === true) {
          // Head coaches see all classes
          console.log('ClassesPage: Loading all classes for head coach');
          classesData = await classesService.getClasses();
        } else {
          // Regular coaches see only their own classes
          console.log('ClassesPage: Loading classes for regular coach', user?.id);
          classesData = await classesService.getClassesByCoach(user?.id || 0);
        }
      } else {
        // Athletes and parents see all classes
        console.log('ClassesPage: Loading all classes for athlete/parent');
        classesData = await classesService.getClasses();
      }
      
      console.log('ClassesPage: Loaded classes count:', classesData.length);
      setClasses(classesData);
    } catch (error: any) {
      console.error('Error loading classes:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить занятия');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClasses();
    setRefreshing(false);
  };

  const filterClasses = () => {
    let filtered = classes;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(cls => 
        cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(cls => cls.difficulty_level === selectedDifficulty);
    }

    setFilteredClasses(filtered);
  };

  const handleClassPress = (classItem: Class) => {
    navigation?.navigate('ClassDetail', { classId: classItem.id });
  };

  const handleBookClass = (classItem: Class) => {
    navigation?.navigate('BookClass', { classId: classItem.id });
  };

  const handleSidebarClose = useCallback(() => {
    setIsSidebarOpen(false);
  }, [setIsSidebarOpen]);

  const renderClassCard = (classItem: Class) => (
    <Card key={classItem.id} style={styles.classCard} onPress={() => handleClassPress(classItem)}>
      <Card.Content>
        <View style={styles.classHeader}>
          <View style={styles.classInfo}>
            <Title style={styles.classTitle}>{classItem.name}</Title>
            <Text style={styles.classTime}>
              {classesService.formatDayOfWeek(classItem.day_of_week)} • {classesService.formatTime(classItem.start_time)} - {classesService.formatTime(classItem.end_time)}
            </Text>
            <Text style={styles.classDuration}>
              Длительность: {classesService.calculateDuration(classItem.start_time, classItem.end_time)}
            </Text>
          </View>
          <View style={styles.classMeta}>
            <Text style={styles.priceText}>{classItem.price_per_class} ₸</Text>
          </View>
        </View>

        {classItem.description && (
          <Text style={styles.classDescription} numberOfLines={2}>
            {classItem.description}
          </Text>
        )}

        <View style={styles.classDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="account-tie" size={16} color="#E74C3C" />
            <Text style={styles.detailText}>
              Тренер: {classItem.coach?.full_name || `ID: ${classItem.coach_id}`}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="signal" size={16} color="#E74C3C" />
            <Text style={styles.detailText}>
              Уровень: <Text style={[styles.difficultyText, { color: getDifficultyColor(classItem.difficulty_level) }]}>
                {classesService.getDifficultyDisplayName(classItem.difficulty_level)}
              </Text>
            </Text>
          </View>
          
          {classItem.age_group_min && classItem.age_group_max && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="account-group" size={16} color="#E74C3C" />
              <Text style={styles.detailText}>
                Возраст: {classItem.age_group_min}-{classItem.age_group_max} лет
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="account-multiple" size={16} color="#E74C3C" />
            <Text style={styles.detailText}>
              Мест: {classItem.max_capacity}
            </Text>
          </View>
        </View>

        <View style={styles.classActions}>
          <Button
            mode="outlined"
            onPress={() => handleClassPress(classItem)}
            style={styles.actionButton}
            textColor="#E74C3C"
          >
            Подробнее
          </Button>
          
          {(userRole === 'parent' || userRole === 'athlete') && (
            <Button
              mode="contained"
              onPress={() => handleBookClass(classItem)}
              style={[styles.actionButton, styles.bookButton]}
              buttonColor="#E74C3C"
            >
              Записаться
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#757575';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E74C3C" />
        <Text style={styles.loadingText}>Загрузка занятий...</Text>
      </View>
    );
  }

  const getHeaderTitle = () => {
    if (userRole === 'coach' && user?.is_head_coach) {
      return 'Все занятия';
    } else if (userRole === 'coach') {
      return 'Мои занятия';
    } else {
      return 'Занятия';
    }
  };

  return (
    <Layout 
      title={getHeaderTitle()}
      onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}
    >
      
      {userRole === 'coach' && (
        <View style={styles.actionHeader}>
          <Button
            mode="contained"
            onPress={() => navigation?.navigate('CreateClass')}
            buttonColor="#E74C3C"
            icon="plus"
          >
            Создать
          </Button>
        </View>
      )}

      <Searchbar
        placeholder="Поиск занятий..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        iconColor="#E74C3C"
        placeholderTextColor="#B0BEC5"
      />

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip
            selected={selectedDifficulty === 'all'}
            onPress={() => setSelectedDifficulty('all')}
            style={styles.filterChip}
            textStyle={styles.filterChipText}
          >
            Все
          </Chip>
          <Chip
            selected={selectedDifficulty === 'beginner'}
            onPress={() => setSelectedDifficulty('beginner')}
            style={styles.filterChip}
            textStyle={styles.filterChipText}
          >
            Начинающие
          </Chip>
          <Chip
            selected={selectedDifficulty === 'intermediate'}
            onPress={() => setSelectedDifficulty('intermediate')}
            style={styles.filterChip}
            textStyle={styles.filterChipText}
          >
            Средний
          </Chip>
          <Chip
            selected={selectedDifficulty === 'advanced'}
            onPress={() => setSelectedDifficulty('advanced')}
            style={styles.filterChip}
            textStyle={styles.filterChipText}
          >
            Продвинутые
          </Chip>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredClasses.length > 0 ? (
          filteredClasses.map(renderClassCard)
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="calendar-remove" size={48} color="#B0BEC5" />
            <Text style={styles.emptyStateText}>
              {searchQuery || selectedDifficulty !== 'all' 
                ? 'Занятия не найдены' 
                : userRole === 'coach' && user?.is_head_coach
                  ? 'Нет активных занятий'
                  : userRole === 'coach'
                    ? 'У вас пока нет занятий'
                    : 'Нет доступных занятий'
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Sidebar */}
      <Sidebar
        isVisible={isSidebarOpen}
        onClose={handleSidebarClose}
      />
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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

  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 10,
    paddingRight: 10,
  },

  searchBar: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 16,
    backgroundColor: '#1B263B',
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: '#1B263B',
  },
  filterChipText: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80, // Increased to account for bottom navbar
  },
  classCard: {
    backgroundColor: '#1B263B',
    marginBottom: 16,
    borderRadius: 12,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  classInfo: {
    flex: 1,
  },
  classTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  classTime: {
    color: '#E74C3C',
    fontSize: 14,
    marginBottom: 2,
  },
  classDuration: {
    color: '#B0BEC5',
    fontSize: 12,
  },
  classMeta: {
    alignItems: 'flex-end',
  },
  priceText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  classDescription: {
    color: '#B0BEC5',
    fontSize: 14,
    marginBottom: 12,
  },
  classDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
  },
  difficultyText: {
    fontWeight: 'bold',
  },
  classActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  bookButton: {
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    color: '#B0BEC5',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default ClassesPage; 