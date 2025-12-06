import React, { useState, useEffect, useCallback } from 'react';
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
  ActivityIndicator,
  Searchbar,
  Chip,
} from 'react-native-paper';
import { useAppContext } from '../context/AppContext';
import classesService, { Class } from '../services/classes';
import bookingsService, { Booking } from '../services/bookings';
import attendanceService from '../services/attendance';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Layout from '../components/Layout';
import EmptyState from '../components/EmptyState';
import { useFocusEffect } from '@react-navigation/native';

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

const YourClassesPage: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { userRole, user } = useAppContext();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // For coaches: their own classes
  const [myClasses, setMyClasses] = useState<Class[]>([]);

  // For athletes: their bookings
  const [myBookings, setMyBookings] = useState<Booking[]>([]);

  // Attendance counts
  const [attendanceCounts, setAttendanceCounts] = useState<{[key: number]: number}>({});
  const [personalAttendanceCount, setPersonalAttendanceCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [userRole])
  );

  const loadData = async () => {
    try {
      setLoading(true);

      if (userRole === 'coach') {
        // Load classes taught by this coach
        const allClasses = await classesService.getClasses();
        const coachClasses = allClasses.filter(
          (classItem) => classItem.coach_id === user?.id
        );
        setMyClasses(coachClasses);

        // Load attendance counts for each class
        const counts: {[key: number]: number} = {};
        await Promise.all(
          coachClasses.map(async (classItem) => {
            try {
              const stats = await attendanceService.getClassAttendanceStats(classItem.id);
              counts[classItem.id] = stats.total_attendances;
            } catch (error) {
              console.error(`Error loading attendance for class ${classItem.id}:`, error);
              counts[classItem.id] = 0;
            }
          })
        );
        setAttendanceCounts(counts);
      } else {
        // Load bookings for athlete
        const bookings = await bookingsService.getMyBookings();
        setMyBookings(bookings);

        // Load personal attendance count
        try {
          const count = await attendanceService.getMyAttendanceCount();
          setPersonalAttendanceCount(count);
        } catch (error) {
          console.error('Error loading attendance count:', error);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getFilteredData = () => {
    if (userRole === 'coach') {
      // Filter classes by search query
      return myClasses.filter((classItem) =>
        classItem.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      // Filter bookings by search query and status
      let filtered = myBookings.filter((booking) =>
        booking.class_obj?.name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())
      );

      if (statusFilter !== 'all') {
        filtered = filtered.filter(
          (booking) => booking.status === statusFilter
        );
      }

      return filtered;
    }
  };

  const renderCoachClasses = () => {
    const filteredClasses = getFilteredData() as Class[];

    if (filteredClasses.length === 0) {
      return (
        <EmptyState
          icon="calendar-blank"
          message={
            searchQuery
              ? 'Занятия не найдены'
              : 'У вас пока нет занятий. Создайте первое занятие!'
          }
          actionLabel={!searchQuery ? 'Создать занятие' : undefined}
          onActionPress={
            !searchQuery
              ? () => navigation?.navigate('CreateClass')
              : undefined
          }
        />
      );
    }

    return filteredClasses.map((classItem) => (
      <Card
        key={classItem.id}
        style={styles.card}
        onPress={() =>
          navigation?.navigate('ClassDetail', { classId: classItem.id })
        }
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.className}>{classItem.name}</Text>
              <View
                style={[
                  styles.difficultyBadge,
                  { backgroundColor: getDifficultyColor(classItem.difficulty_level) },
                ]}
              >
                <Text style={styles.difficultyText}>
                  {classesService.getDifficultyDisplayName(classItem.difficulty_level)}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#B0BEC5"
            />
          </View>

          {classItem.description && (
            <Text style={styles.classDescription} numberOfLines={2}>
              {classItem.description}
            </Text>
          )}

          <View style={styles.classInfo}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="calendar"
                size={16}
                color="#B0BEC5"
              />
              <Text style={styles.infoText}>
                {classItem.days_of_week?.filter(day => day).map(day => classesService.formatDayOfWeek(day)).join(', ') || 'Не указано'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={16}
                color="#B0BEC5"
              />
              <Text style={styles.infoText}>
                {classesService.formatTime(classItem.start_time)} -{' '}
                {classesService.formatTime(classItem.end_time)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="account-group"
                size={16}
                color="#B0BEC5"
              />
              <Text style={styles.infoText}>
                {classItem.current_participants || 0} / {classItem.max_capacity}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="clipboard-check-outline"
                size={16}
                color="#4CAF50"
              />
              <Text style={styles.infoText}>
                {attendanceCounts[classItem.id] || 0} посещений
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    ));
  };

  const renderAthleteBookings = () => {
    const filteredBookings = getFilteredData() as Booking[];

    if (filteredBookings.length === 0) {
      return (
        <EmptyState
          icon="bookmark-outline"
          message={
            searchQuery || statusFilter !== 'all'
              ? 'Записи не найдены'
              : 'У вас пока нет записей на занятия'
          }
          actionLabel={
            !searchQuery && statusFilter === 'all'
              ? 'Найти занятия'
              : undefined
          }
          onActionPress={
            !searchQuery && statusFilter === 'all'
              ? () => navigation?.navigate('Classes')
              : undefined
          }
        />
      );
    }

    return filteredBookings.map((booking) => (
      <Card
        key={booking.id}
        style={styles.card}
        onPress={() =>
          navigation?.navigate('BookingDetail', { bookingId: booking.id })
        }
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.className}>
                {booking.class_obj?.name || 'Занятие'}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(booking.status) },
                ]}
              >
                <Text style={styles.statusText}>
                  {bookingsService.getStatusDisplayName(booking.status)}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#B0BEC5"
            />
          </View>

          <View style={styles.classInfo}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="calendar"
                size={16}
                color="#B0BEC5"
              />
              <Text style={styles.infoText}>
                {bookingsService.formatDateTime(booking.class_date)}
              </Text>
            </View>

            {booking.booking_type && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="bookmark-check"
                  size={16}
                  color="#B0BEC5"
                />
                <Text style={styles.infoText}>
                  {booking.booking_type === 'regular' && 'Обычное'}
                  {booking.booking_type === 'trial' && 'Пробное'}
                  {booking.booking_type === 'makeup' && 'Отработка'}
                </Text>
              </View>
            )}

            {booking.class_obj?.coach && (booking.class_obj.coach.first_name || booking.class_obj.coach.full_name) && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="account"
                  size={16}
                  color="#B0BEC5"
                />
                <Text style={styles.infoText}>
                  Професор: {booking.class_obj.coach.full_name || `${booking.class_obj.coach.first_name} ${booking.class_obj.coach.last_name}`}
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    ));
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner':
        return '#4CAF50';
      case 'amateur':
        return '#FF9800';
      case 'professional':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'confirmed':
        return '#27AE60';
      case 'completed':
        return '#3498DB';
      case 'cancelled':
        return '#E74C3C';
      default:
        return '#95A5A6';
    }
  };

  if (loading) {
    return (
      <Layout title="Ваши занятия">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout title="Ваши занятия">
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder={
              userRole === 'coach' ? 'Поиск занятий...' : 'Поиск записей...'
            }
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            iconColor="#B0BEC5"
            placeholderTextColor="#B0BEC5"
          />
        </View>

        {/* Status Filter (Athletes only) */}
        {userRole !== 'coach' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
            contentContainerStyle={styles.filterContent}
          >
            <Chip
              selected={statusFilter === 'all'}
              onPress={() => setStatusFilter('all')}
              style={[
                styles.filterChip,
                statusFilter === 'all' && styles.filterChipSelected,
              ]}
              textStyle={[
                styles.filterChipText,
                statusFilter === 'all' && styles.filterChipTextSelected,
              ]}
            >
              Все
            </Chip>
            <Chip
              selected={statusFilter === 'pending'}
              onPress={() => setStatusFilter('pending')}
              style={[
                styles.filterChip,
                statusFilter === 'pending' && styles.filterChipSelected,
              ]}
              textStyle={[
                styles.filterChipText,
                statusFilter === 'pending' && styles.filterChipTextSelected,
              ]}
            >
              Ожидает
            </Chip>
            <Chip
              selected={statusFilter === 'confirmed'}
              onPress={() => setStatusFilter('confirmed')}
              style={[
                styles.filterChip,
                statusFilter === 'confirmed' && styles.filterChipSelected,
              ]}
              textStyle={[
                styles.filterChipText,
                statusFilter === 'confirmed' && styles.filterChipTextSelected,
              ]}
            >
              Подтверждено
            </Chip>
            <Chip
              selected={statusFilter === 'completed'}
              onPress={() => setStatusFilter('completed')}
              style={[
                styles.filterChip,
                statusFilter === 'completed' && styles.filterChipSelected,
              ]}
              textStyle={[
                styles.filterChipText,
                statusFilter === 'completed' && styles.filterChipTextSelected,
              ]}
            >
              Завершено
            </Chip>
            <Chip
              selected={statusFilter === 'cancelled'}
              onPress={() => setStatusFilter('cancelled')}
              style={[
                styles.filterChip,
                statusFilter === 'cancelled' && styles.filterChipSelected,
              ]}
              textStyle={[
                styles.filterChipText,
                statusFilter === 'cancelled' && styles.filterChipTextSelected,
              ]}
            >
              Отменено
            </Chip>
          </ScrollView>
        )}

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {userRole === 'coach'
            ? renderCoachClasses()
            : renderAthleteBookings()}
        </ScrollView>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  searchBar: {
    backgroundColor: '#1B263B',
    borderRadius: 8,
    elevation: 0,
  },
  searchInput: {
    color: '#fff',
    minHeight: 40,
  },
  filterContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 52,
  },
  filterContent: {
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    backgroundColor: '#1B263B',
    borderColor: '#2C3E50',
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 0,
    margin: 0,
  },
  filterChipSelected: {
    backgroundColor: '#E74C3C',
    borderColor: '#E74C3C',
  },
  filterChipText: {
    color: '#B0BEC5',
    fontSize: 13,
    lineHeight: 18,
    marginVertical: 0,
    paddingVertical: 0,
  },
  filterChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#1B263B',
    marginBottom: 12,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  classDescription: {
    color: '#B0BEC5',
    fontSize: 14,
    marginBottom: 12,
    marginTop: 8,
  },
  classInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    color: '#B0BEC5',
    fontSize: 14,
  },
});

export default YourClassesPage;
