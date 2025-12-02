import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  ActivityIndicator,
  Chip,
  SegmentedButtons,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Layout from '../../components/Layout';
import EmptyState from '../../components/EmptyState';
import { useAppContext } from '../../context/AppContext';
import attendanceService, { Attendance } from '../../services/attendance';
import classesService, { Class } from '../../services/classes';

interface ClassWithAttendance extends Class {
  todayAttendances: Attendance[];
  totalCapacity: number;
}

const CoachAttendanceDashboardPage: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { user } = useAppContext();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'today' | 'week' | 'all'>('today');
  const [classesWithAttendance, setClassesWithAttendance] = useState<ClassWithAttendance[]>([]);

  // Load data when page is focused
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [filter])
  );

  const loadDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      // Get all classes taught by this coach
      const allClasses = await classesService.getClasses();
      const myClasses = allClasses.filter(
        (classItem) => classItem.coach_id === user?.id
      );

      // Filter classes based on selected filter
      const filteredClasses = filterClasses(myClasses);

      // Get attendance for each class
      const todayDate = attendanceService.getTodayDate();
      const classesData: ClassWithAttendance[] = await Promise.all(
        filteredClasses.map(async (classItem) => {
          try {
            const attendances = await attendanceService.getClassAttendance(
              classItem.id,
              filter === 'today' ? todayDate : undefined
            );

            return {
              ...classItem,
              todayAttendances: attendances,
              totalCapacity: classItem.max_participants || 0,
            };
          } catch (error) {
            console.error(`Error loading attendance for class ${classItem.id}:`, error);
            return {
              ...classItem,
              todayAttendances: [],
              totalCapacity: classItem.max_participants || 0,
            };
          }
        })
      );

      // Sort by start time
      classesData.sort((a, b) => a.start_time.localeCompare(b.start_time));

      setClassesWithAttendance(classesData);
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      if (!silent) {
        Alert.alert('Ошибка', error.message || 'Не удалось загрузить данные');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const filterClasses = (classes: Class[]): Class[] => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('ru-RU', { weekday: 'long' });

    switch (filter) {
      case 'today':
        return classes.filter((c) => c.days_of_week.includes(currentDay));

      case 'week':
        // Return all classes (they're scheduled weekly)
        return classes;

      case 'all':
        return classes;

      default:
        return classes;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getClassStatus = (classItem: ClassWithAttendance): {
    status: 'upcoming' | 'ongoing' | 'completed';
    label: string;
    color: string;
  } => {
    const now = new Date();
    const [classHour, classMinute] = classItem.start_time.split(':').map(Number);

    const classStartTime = new Date();
    classStartTime.setHours(classHour, classMinute, 0, 0);

    const classEndTime = new Date(classStartTime);
    classEndTime.setMinutes(classEndTime.getMinutes() + classItem.duration);

    if (now < classStartTime) {
      return { status: 'upcoming', label: 'Предстоящее', color: '#FF9800' };
    } else if (now >= classStartTime && now <= classEndTime) {
      return { status: 'ongoing', label: 'Идёт сейчас', color: '#4CAF50' };
    } else {
      return { status: 'completed', label: 'Завершено', color: '#B0BEC5' };
    }
  };

  const renderHeader = () => {
    const totalCheckIns = classesWithAttendance.reduce(
      (sum, c) => sum + c.todayAttendances.length,
      0
    );

    return (
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Панель посещаемости</Title>
        <Text style={styles.headerSubtitle}>
          {filter === 'today' && `Сегодня: ${totalCheckIns} отметок`}
          {filter === 'week' && `На этой неделе`}
          {filter === 'all' && `Все занятия`}
        </Text>
      </View>
    );
  };

  const renderFilters = () => (
    <View style={styles.filterSection}>
      <SegmentedButtons
        value={filter}
        onValueChange={(value) => setFilter(value as any)}
        buttons={[
          { value: 'today', label: 'Сегодня' },
          { value: 'week', label: 'Неделя' },
          { value: 'all', label: 'Все' },
        ]}
        style={styles.segmentedButtons}
        theme={{
          colors: {
            secondaryContainer: '#E74C3C',
            onSecondaryContainer: '#FFFFFF',
            surface: 'transparent',
            onSurface: '#FFFFFF',
            outline: '#2C3E50',
          },
        }}
      />
    </View>
  );

  const renderClassCard = (classItem: ClassWithAttendance) => {
    const status = getClassStatus(classItem);
    const attendanceRate =
      classItem.totalCapacity > 0
        ? Math.round(
            (classItem.todayAttendances.length / classItem.totalCapacity) * 100
          )
        : 0;

    return (
      <TouchableOpacity
        key={classItem.id}
        onPress={() =>
          navigation?.navigate('ClassAttendanceReport', { classId: classItem.id })
        }
      >
        <Card style={styles.classCard}>
          <Card.Content>
            <View style={styles.classHeader}>
              <View style={styles.classInfo}>
                <Text style={styles.className}>{classItem.name}</Text>
                <Text style={styles.classTime}>
                  {classItem.start_time} • {classItem.duration} мин
                </Text>
              </View>
              <Chip
                style={[styles.statusChip, { backgroundColor: status.color }]}
                textStyle={styles.statusChipText}
              >
                {status.label}
              </Chip>
            </View>

            <View style={styles.attendanceSection}>
              <View style={styles.attendanceCount}>
                <MaterialCommunityIcons
                  name="account-check"
                  size={24}
                  color="#4CAF50"
                />
                <Text style={styles.attendanceCountText}>
                  {classItem.todayAttendances.length}
                  {classItem.totalCapacity > 0 && (
                    <Text style={styles.attendanceCapacity}>
                      {' '}
                      / {classItem.totalCapacity}
                    </Text>
                  )}
                </Text>
                {classItem.totalCapacity > 0 && (
                  <Text style={styles.attendanceRate}>({attendanceRate}%)</Text>
                )}
              </View>

              {classItem.todayAttendances.length > 0 && (
                <View style={styles.attendeesList}>
                  {classItem.todayAttendances.slice(0, 3).map((attendance) => (
                    <View key={attendance.id} style={styles.attendeeItem}>
                      <MaterialCommunityIcons
                        name="account-circle"
                        size={16}
                        color="#B0BEC5"
                      />
                      <Text style={styles.attendeeName}>
                        {attendance.athlete?.first_name}{' '}
                        {attendance.athlete?.last_name}
                      </Text>
                      <Text style={styles.attendeeTime}>
                        {attendanceService.formatTime(attendance.marked_at)}
                      </Text>
                    </View>
                  ))}

                  {classItem.todayAttendances.length > 3 && (
                    <Text style={styles.moreAttendeesText}>
                      +{classItem.todayAttendances.length - 3} ещё
                    </Text>
                  )}
                </View>
              )}

              {classItem.todayAttendances.length === 0 && (
                <Text style={styles.noAttendeesText}>Пока никто не отметился</Text>
              )}
            </View>

            <View style={styles.classFooter}>
              <Text style={styles.viewDetailsText}>Подробнее →</Text>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderClassesList = () => {
    if (classesWithAttendance.length === 0) {
      return (
        <Card style={styles.card}>
          <Card.Content>
            <EmptyState
              icon="calendar-blank"
              title={
                filter === 'today'
                  ? 'Нет занятий на сегодня'
                  : 'Нет занятий'
              }
              description={
                filter === 'today'
                  ? 'Сегодня у вас нет запланированных занятий'
                  : 'У вас пока нет занятий'
              }
            />
          </Card.Content>
        </Card>
      );
    }

    return classesWithAttendance.map(renderClassCard);
  };

  if (loading && !refreshing) {
    return (
      <Layout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>Загрузка панели...</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#E74C3C']}
            tintColor="#E74C3C"
          />
        }
      >
        {renderHeader()}
        {renderFilters()}
        {renderClassesList()}
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#B0BEC5',
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  filterSection: {
    marginBottom: 16,
  },
  segmentedButtons: {
    backgroundColor: '#1B263B',
  },
  card: {
    backgroundColor: '#1B263B',
    marginBottom: 16,
    borderRadius: 12,
  },
  classCard: {
    backgroundColor: '#1B263B',
    marginBottom: 12,
    borderRadius: 12,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  classTime: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  statusChip: {
    marginLeft: 8,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  attendanceSection: {
    marginBottom: 12,
  },
  attendanceCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  attendanceCountText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  attendanceCapacity: {
    fontSize: 16,
    color: '#B0BEC5',
  },
  attendanceRate: {
    fontSize: 14,
    color: '#4CAF50',
  },
  attendeesList: {
    marginTop: 8,
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  attendeeName: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
  },
  attendeeTime: {
    fontSize: 12,
    color: '#B0BEC5',
  },
  moreAttendeesText: {
    fontSize: 14,
    color: '#E74C3C',
    marginTop: 4,
  },
  noAttendeesText: {
    fontSize: 14,
    color: '#B0BEC5',
    fontStyle: 'italic',
  },
  classFooter: {
    borderTopWidth: 1,
    borderTopColor: '#2C3E50',
    paddingTop: 12,
    marginTop: 12,
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#E74C3C',
    fontWeight: '600',
  },
});

export default CoachAttendanceDashboardPage;
