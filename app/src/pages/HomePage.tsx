import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
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
import { MaterialCommunityIcons } from '@expo/vector-icons';

const HomePage: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { user, userRole } = useAppContext();
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recentClasses, setRecentClasses] = useState<Class[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalBookings: 0,
    pendingBookings: 0,
  });

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      // Load classes and bookings in parallel
      const [classesData, bookingsData] = await Promise.all([
        classesService.getClasses().catch(() => []),
        bookingsService.getMyBookings().catch(() => [])
      ]);

      setRecentClasses(classesData.slice(0, 3));
      setRecentBookings(bookingsData.slice(0, 3));
      
      setStats({
        totalClasses: classesData.length,
        totalBookings: bookingsData.length,
        pendingBookings: bookingsData.filter(b => b.status === 'pending').length,
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
              {userRole === 'parent' && 'Управляйте тренировками ваших детей'}
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
      <Card style={styles.statCard}>
        <Card.Content style={styles.statContent}>
          <MaterialCommunityIcons name="calendar" size={24} color="#E74C3C" />
          <Text style={styles.statNumber}>{stats.totalClasses}</Text>
          <Text style={styles.statLabel}>Занятий</Text>
        </Card.Content>
      </Card>
      
      <Card style={styles.statCard}>
        <Card.Content style={styles.statContent}>
          <MaterialCommunityIcons name="bookmark" size={24} color="#E74C3C" />
          <Text style={styles.statNumber}>{stats.totalBookings}</Text>
          <Text style={styles.statLabel}>Записей</Text>
        </Card.Content>
      </Card>
      
      {(userRole === 'parent' || userRole === 'athlete') && (
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="clock" size={24} color="#E74C3C" />
            <Text style={styles.statNumber}>{stats.pendingBookings}</Text>
            <Text style={styles.statLabel}>Ожидает</Text>
          </Card.Content>
        </Card>
      )}
    </View>
  );

  const renderQuickActions = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Быстрые действия</Title>
        </View>
        
        <View style={styles.actionsGrid}>
          <Button
            mode="contained"
            onPress={() => navigation?.navigate('Classes')}
            style={styles.actionButton}
            buttonColor="#E74C3C"
            icon="calendar"
          >
            Занятия
          </Button>
          
          {(userRole === 'parent' || userRole === 'athlete') && (
            <Button
              mode="contained"
              onPress={() => navigation?.navigate('Bookings')}
              style={styles.actionButton}
              buttonColor="#2C3E50"
              icon="bookmark"
            >
              Мои записи
            </Button>
          )}
          
          {userRole === 'coach' && (
            <Button
              mode="contained"
              onPress={() => navigation?.navigate('CreateClass')}
              style={styles.actionButton}
              buttonColor="#2C3E50"
              icon="plus"
            >
              Создать занятие
            </Button>
          )}
          
          <Button
            mode="contained"
            onPress={() => navigation?.navigate('Profile')}
            style={styles.actionButton}
            buttonColor="#34495E"
            icon="account"
          >
            Профиль
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderRecentClasses = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Последние занятия</Title>
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

  const renderRecentBookings = () => {
    if (userRole !== 'parent' && userRole !== 'athlete') return null;

    return (
      <Card style={styles.sectionCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Последние записи</Title>
            <Button
              mode="text"
              onPress={() => navigation?.navigate('Bookings')}
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1B2A" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderWelcomeSection()}
        {renderQuickStats()}
        {renderQuickActions()}
        {renderRecentClasses()}
        {renderRecentBookings()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 32,
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
  statCard: {
    flex: 1,
    backgroundColor: '#1B263B',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    color: '#B0BEC5',
    fontSize: 12,
    textAlign: 'center',
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
    gap: 12,
  },
  actionButton: {
    flex: 1,
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

});

export default HomePage; 