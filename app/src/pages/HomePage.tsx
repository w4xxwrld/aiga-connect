import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  ActivityIndicator,
} from 'react-native-paper';
import { useAppContext } from '../context/AppContext';
import classesService, { Class } from '../services/classes';
import bookingsService, { Booking } from '../services/bookings';
import attendanceService, { Attendance } from '../services/attendance';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';

const HomePage: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { user, userRole } = useAppContext();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recentClasses, setRecentClasses] = useState<Class[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalBookings: 0,
    pendingBookings: 0,
    totalAttendance: 0,
    currentStreak: 0,
    monthlyAttendance: 0,
  });

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);

      // Load classes, bookings, and attendance in parallel
      const [classesData, bookingsData, attendances] = await Promise.all([
        classesService.getClasses().catch(() => []),
        bookingsService.getMyBookings().catch(() => []),
        userRole === 'athlete'
          ? attendanceService.getMyAttendance().catch(() => [])
          : Promise.resolve([])
      ]);

      setRecentClasses(classesData.slice(0, 3));
      setRecentBookings(bookingsData.slice(0, 3));
      setAttendanceData(attendances);

      setStats({
        totalClasses: classesData.length,
        totalBookings: bookingsData.length,
        pendingBookings: bookingsData.filter((b: Booking) => b.status === 'pending').length,
        totalAttendance: attendances.length,
        currentStreak: attendanceService.calculateStreak(attendances),
        monthlyAttendance: attendanceService.getMonthlyAttendanceCount(attendances),
      });
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  };

  const renderWelcomeSection = () => (
    <Card style={styles.welcomeCard}>
      <Card.Content>
        <View style={styles.welcomeHeader}>
          <View style={styles.welcomeTextContainer}>
            <Title style={styles.welcomeTitle}>
              Добро пожаловать{user?.full_name ? `, ${user.full_name}` : ''}! 👋
            </Title>
            <Text style={styles.welcomeSubtitle}>
              {userRole === 'athlete' && 'Отслеживайте свой прогресс'}
              {userRole === 'coach' && 'Управляйте тренировками и учениками'}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderQuickStats = () => (
    <View style={styles.statsContainer}>
      <StatCard
        icon="calendar"
        value={stats.totalClasses}
        label="Занятий"
      />

      <StatCard
        icon="bookmark"
        value={stats.totalBookings}
        label="Записей"
      />

      {userRole === 'athlete' && (
        <StatCard
          icon="clock"
          value={stats.pendingBookings}
          label="Ожидает"
        />
      )}
    </View>
  );

  const renderRecentClasses = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Все занятия</Title>
          <Button
            mode="text"
            onPress={() => navigation?.navigate('Classes')}
            textColor="#E74C3C"
            icon="arrow-right"
          >
            Все
          </Button>
        </View>
        
        {recentClasses.length > 0 ? (
          recentClasses.map((classItem) => (
            <View key={classItem.id} style={styles.recentItem}>
              <View style={styles.recentItemInfo}>
                <Text style={styles.recentItemTitle}>{classItem.name}</Text>
                <Text style={styles.recentItemSubtitle}>
                  {classesService.formatDayOfWeek(classItem.day_of_week)} • {classesService.formatTime(classItem.start_time)}
                </Text>
              </View>
              <Button
                mode="outlined"
                onPress={() => navigation?.navigate('ClassDetail', { classId: classItem.id })}
                textColor="#E74C3C"
                compact
              >
                Подробнее
              </Button>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Нет доступных занятий</Text>
        )}
      </Card.Content>
    </Card>
  );


  const renderAttendancePreview = () => {
    if (userRole !== 'athlete') return null;

    return (
      <Card style={styles.sectionCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Посещаемость</Title>
            <Button
              mode="text"
              onPress={() => navigation?.navigate('AttendanceTab')}
              textColor="#E74C3C"
              icon="arrow-right"
            >
              Все
            </Button>
          </View>

          <View style={styles.attendanceStatsGrid}>
            <View style={styles.attendanceStat}>
              <MaterialCommunityIcons name="check-circle" size={32} color="#4CAF50" />
              <Text style={styles.attendanceStatValue}>{stats.totalAttendance}</Text>
              <Text style={styles.attendanceStatLabel}>Всего посещений</Text>
            </View>

            <View style={styles.attendanceStat}>
              <MaterialCommunityIcons name="fire" size={32} color="#FF9800" />
              <Text style={styles.attendanceStatValue}>{stats.currentStreak}</Text>
              <Text style={styles.attendanceStatLabel}>Текущая серия</Text>
            </View>

            <View style={styles.attendanceStat}>
              <MaterialCommunityIcons name="calendar-month" size={32} color="#2196F3" />
              <Text style={styles.attendanceStatValue}>{stats.monthlyAttendance}</Text>
              <Text style={styles.attendanceStatLabel}>В этом месяце</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderRecentBookings = () => {
    if (userRole !== 'athlete') return null;

    return (
      <Card style={styles.sectionCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Ваши занятия</Title>
            <Button
              mode="text"
              onPress={() => navigation?.navigate('YourClasses')}
              textColor="#E74C3C"
              icon="arrow-right"
            >
              Все
            </Button>
          </View>

          {recentBookings.length > 0 ? (
            recentBookings.map((booking) => (
              <View key={booking.id} style={styles.recentItem}>
                <View style={styles.recentItemInfo}>
                  <Text style={styles.recentItemTitle}>
                    {booking.class_obj?.name || 'Занятие'}
                  </Text>
                  <Text style={styles.recentItemSubtitle}>
                    {bookingsService.formatDate(booking.class_date)} • {bookingsService.getStatusDisplayName(booking.status)}
                  </Text>
                </View>
                <Button
                  mode="outlined"
                  onPress={() => navigation?.navigate('BookingDetail', { bookingId: booking.id })}
                  textColor="#E74C3C"
                  compact
                >
                  Подробнее
                </Button>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>У вас пока нет записей</Text>
          )}
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
    <Layout
      title="AIGA Connect"
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderWelcomeSection()}
        {renderQuickStats()}
        {renderAttendancePreview()}
        {renderRecentClasses()}
        {renderRecentBookings()}
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 80,
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
  welcomeCard: {
    backgroundColor: '#1B263B',
    marginBottom: 16,
    borderRadius: 12,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    color: '#B0BEC5',
    fontSize: 16,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  sectionCard: {
    backgroundColor: '#1B263B',
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#2C3E50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
  },
  recentItemInfo: {
    flex: 1,
  },
  recentItemTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  recentItemSubtitle: {
    color: '#B0BEC5',
    fontSize: 14,
  },
  emptyText: {
    color: '#B0BEC5',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  viewAllText: {
    color: '#3498DB',
    fontSize: 14,
    fontWeight: '500',
  },
  attendanceStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  attendanceStat: {
    alignItems: 'center',
    flex: 1,
  },
  attendanceStatValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  attendanceStatLabel: {
    color: '#B0BEC5',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default HomePage; 