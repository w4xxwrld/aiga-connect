import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  ActivityIndicator,
  SegmentedButtons,
} from 'react-native-paper';
import { useAppContext } from '../../context/AppContext';
import attendanceService, { Attendance } from '../../services/attendance';
import classesService, { Class } from '../../services/classes';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';

const AttendanceTabPage: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { user, userRole } = useAppContext();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Athlete state
  const [myAttendances, setMyAttendances] = useState<Attendance[]>([]);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [streak, setStreak] = useState(0);

  // Coach state
  const [todayClasses, setTodayClasses] = useState<Class[]>([]);
  const [todayCheckIns, setTodayCheckIns] = useState(0);

  useEffect(() => {
    loadData();
  }, [userRole]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (userRole === 'athlete') {
        await loadAthleteData();
      } else if (userRole === 'coach') {
        await loadCoachData();
      }
    } catch (error: any) {
      console.error('Error loading attendance data:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const loadAthleteData = async () => {
    try {
      // Load all attendance data in parallel
      const [attendances, count] = await Promise.all([
        attendanceService.getMyAttendance(),
        attendanceService.getMyAttendanceCount(),
      ]);

      setMyAttendances(attendances);
      setAttendanceCount(count);
      setMonthlyCount(attendanceService.getMonthlyAttendanceCount(attendances));
      setStreak(attendanceService.calculateStreak(attendances));
    } catch (error) {
      throw error;
    }
  };

  const loadCoachData = async () => {
    try {
      // Get all classes taught by this coach
      const allClasses = await classesService.getClasses();
      const myClasses = allClasses.filter(
        (classItem) => classItem.coach_id === user?.id
      );

      // Filter classes for today
      const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long' });
      const todaysClasses = myClasses.filter((classItem) =>
        classItem.days_of_week.includes(today)
      );

      setTodayClasses(todaysClasses);

      // Get attendance for today's classes
      const todayDate = attendanceService.getTodayDate();
      let totalCheckIns = 0;

      await Promise.all(
        todaysClasses.map(async (classItem) => {
          try {
            const attendance = await attendanceService.getClassAttendance(
              classItem.id,
              todayDate
            );
            totalCheckIns += attendance.length;
          } catch (error) {
            console.error(`Error loading attendance for class ${classItem.id}:`, error);
          }
        })
      );

      setTodayCheckIns(totalCheckIns);
    } catch (error) {
      throw error;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleMarkAttendance = () => {
    navigation?.navigate('AttendanceScanner');
  };

  const handleViewHistory = () => {
    navigation?.navigate('AttendanceHistory');
  };

  const handleViewCalendar = () => {
    navigation?.navigate('AttendanceCalendar');
  };

  const handleViewDashboard = () => {
    navigation?.navigate('CoachAttendanceDashboard');
  };

  const handleViewInsights = () => {
    navigation?.navigate('AthleteInsights');
  };

  // Athlete View Components
  const renderAthleteStats = () => (
    <View style={styles.statsContainer}>
      <StatCard
        icon="check-all"
        value={attendanceCount}
        label="Всего посещений"
      />
      <StatCard
        icon="calendar-month"
        value={monthlyCount}
        label="За месяц"
      />
      <StatCard
        icon="fire"
        value={streak}
        label="Дней подряд"
      />
    </View>
  );

  const renderAthleteActions = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.cardTitle}>Быстрые действия</Title>

        <Button
          mode="contained"
          icon="qrcode-scan"
          style={styles.primaryButton}
          onPress={handleMarkAttendance}
        >
          Отметить посещение
        </Button>

        <View style={styles.buttonGroup}>
          <Button
            mode="outlined"
            icon="history"
            style={styles.secondaryButton}
            onPress={handleViewHistory}
          >
            История
          </Button>
          <Button
            mode="outlined"
            icon="calendar"
            style={styles.secondaryButton}
            onPress={handleViewCalendar}
          >
            Календарь
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderRecentAttendances = () => {
    const recentAttendances = myAttendances.slice(0, 5);

    if (recentAttendances.length === 0) {
      return (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Последние посещения</Title>
            <EmptyState
              icon="clipboard-check-outline"
              title="Нет записей о посещениях"
              description="Отметьте посещение, чтобы увидеть историю"
            />
          </Card.Content>
        </Card>
      );
    }

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={styles.cardTitle}>Последние посещения</Title>
            <TouchableOpacity onPress={handleViewHistory}>
              <Text style={styles.viewAllText}>Все →</Text>
            </TouchableOpacity>
          </View>

          {recentAttendances.map((attendance) => (
            <View key={attendance.id} style={styles.attendanceItem}>
              <View style={styles.attendanceIcon}>
                <MaterialCommunityIcons
                  name={attendanceService.getMethodIcon(attendance.method)}
                  size={24}
                  color="#4CAF50"
                />
              </View>
              <View style={styles.attendanceInfo}>
                <Text style={styles.attendanceClassName}>
                  {attendance.class_obj?.name || 'Занятие'}
                </Text>
                <Text style={styles.attendanceDate}>
                  {attendanceService.formatDate(attendance.attendance_date)} в{' '}
                  {attendanceService.formatTime(attendance.marked_at)}
                </Text>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  // Coach View Components
  const renderCoachStats = () => (
    <View style={styles.statsContainer}>
      <StatCard
        icon="calendar-today"
        value={todayClasses.length}
        label="Занятий сегодня"
      />
      <StatCard
        icon="account-check"
        value={todayCheckIns}
        label="Отметок сегодня"
      />
      <StatCard
        icon="clock-outline"
        value={todayClasses.filter(c => {
          const now = new Date();
          const classTime = c.start_time.split(':');
          const classHour = parseInt(classTime[0]);
          return classHour > now.getHours();
        }).length}
        label="Предстоящих"
      />
    </View>
  );

  const renderCoachActions = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.cardTitle}>Управление</Title>

        <Button
          mode="contained"
          icon="view-dashboard"
          style={styles.primaryButton}
          onPress={handleViewDashboard}
        >
          Панель посещаемости
        </Button>

        <View style={styles.buttonGroup}>
          <Button
            mode="outlined"
            icon="chart-line"
            style={styles.secondaryButton}
            onPress={handleViewInsights}
          >
            Аналитика
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderTodayClasses = () => {
    if (todayClasses.length === 0) {
      return (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Занятия сегодня</Title>
            <EmptyState
              icon="calendar-blank"
              title="Нет занятий на сегодня"
              description="Сегодня у вас нет запланированных занятий"
            />
          </Card.Content>
        </Card>
      );
    }

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Занятия сегодня</Title>

          {todayClasses.map((classItem) => (
            <TouchableOpacity
              key={classItem.id}
              style={styles.classItem}
              onPress={() =>
                navigation?.navigate('ClassAttendanceReport', { classId: classItem.id })
              }
            >
              <View style={styles.classInfo}>
                <Text style={styles.className}>{classItem.name}</Text>
                <Text style={styles.classTime}>
                  {classItem.start_time} • {classItem.duration} мин
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color="#B0BEC5"
              />
            </TouchableOpacity>
          ))}
        </Card.Content>
      </Card>
    );
  };

  if (loading && !refreshing) {
    return (
      <Layout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>Загрузка...</Text>
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
        {/* Header */}
        <View style={styles.header}>
          <Title style={styles.headerTitle}>Посещения</Title>
          <Text style={styles.headerSubtitle}>
            {userRole === 'athlete' && 'Отслеживайте свои посещения'}
            {userRole === 'coach' && 'Управляйте посещаемостью учеников'}
          </Text>
        </View>

        {/* Stats */}
        {userRole === 'athlete' && renderAthleteStats()}
        {userRole === 'coach' && renderCoachStats()}

        {/* Actions */}
        {userRole === 'athlete' && renderAthleteActions()}
        {userRole === 'coach' && renderCoachActions()}

        {/* Content */}
        {userRole === 'athlete' && renderRecentAttendances()}
        {userRole === 'coach' && renderTodayClasses()}
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
    marginBottom: 24,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  card: {
    backgroundColor: '#1B263B',
    marginBottom: 16,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#E74C3C',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#E74C3C',
    marginBottom: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    borderColor: '#E74C3C',
  },
  attendanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
  },
  attendanceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0D1B2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attendanceInfo: {
    flex: 1,
  },
  attendanceClassName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    marginBottom: 4,
  },
  attendanceDate: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    marginBottom: 4,
  },
  classTime: {
    fontSize: 14,
    color: '#B0BEC5',
  },
});

export default AttendanceTabPage;
