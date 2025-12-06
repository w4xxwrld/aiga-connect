import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card, ActivityIndicator, Chip, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import { useAppContext } from '../../context/AppContext';
import adminService, {
  AdminAttendanceRecord,
  AdminAttendanceStats,
} from '../../services/admin';

type DateFilter = 'all' | 'today' | 'week' | 'month';

const AdminAttendancePage: React.FC = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const { isAdmin } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [attendances, setAttendances] = useState<AdminAttendanceRecord[]>([]);
  const [stats, setStats] = useState<AdminAttendanceStats | null>(null);
  const [total, setTotal] = useState(0);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const dateFilterOptions: { value: DateFilter; label: string }[] = [
    { value: 'all', label: 'Все' },
    { value: 'today', label: 'Сегодня' },
    { value: 'week', label: 'Неделя' },
    { value: 'month', label: 'Месяц' },
  ];

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert('Доступ запрещен', 'У вас нет прав для просмотра этой страницы');
      navigation.goBack();
      return;
    }
    loadData();
  }, [isAdmin, dateFilter]);

  const getDateRange = (): { start_date?: string; end_date?: string } => {
    const today = new Date();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    switch (dateFilter) {
      case 'today':
        return { start_date: formatDate(today), end_date: formatDate(today) };
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { start_date: formatDate(weekAgo), end_date: formatDate(today) };
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return { start_date: formatDate(monthAgo), end_date: formatDate(today) };
      default:
        return {};
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const dateRange = getDateRange();

      const [attendanceResult, statsResult] = await Promise.all([
        adminService.getAttendanceList({ ...dateRange, limit: 100 }),
        adminService.getAttendanceStats(dateRange),
      ]);

      setAttendances(attendanceResult.attendances);
      setTotal(attendanceResult.total);
      setStats(statsResult);
    } catch (error: any) {
      console.error('Error loading attendance data:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredAttendances = attendances.filter((attendance) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const athleteName = attendance.athlete
      ? `${attendance.athlete.first_name} ${attendance.athlete.last_name}`.toLowerCase()
      : '';
    const className = attendance.class_obj?.name.toLowerCase() || '';
    return athleteName.includes(query) || className.includes(query);
  });

  const renderAttendanceItem = ({ item }: { item: AdminAttendanceRecord }) => (
    <Card style={styles.attendanceCard}>
      <Card.Content>
        <View style={styles.attendanceHeader}>
          <View style={styles.athleteInfo}>
            <MaterialCommunityIcons name="account" size={20} color="#2196F3" />
            <Text style={styles.athleteName}>
              {item.athlete
                ? `${item.athlete.first_name} ${item.athlete.last_name}`
                : 'Неизвестный'}
            </Text>
          </View>
          <Chip
            mode="flat"
            textStyle={styles.dateChipText}
            style={styles.dateChip}
          >
            {formatDate(item.attendance_date)}
          </Chip>
        </View>

        <View style={styles.classInfo}>
          <MaterialCommunityIcons name="calendar-clock" size={16} color="#4CAF50" />
          <Text style={styles.className}>
            {item.class_obj?.name || 'Неизвестное занятие'}
          </Text>
        </View>

        {item.class_obj?.coach && (
          <View style={styles.coachInfo}>
            <MaterialCommunityIcons name="whistle" size={16} color="#FFC107" />
            <Text style={styles.coachName}>
              {item.class_obj.coach.first_name} {item.class_obj.coach.last_name}
            </Text>
          </View>
        )}

        <View style={styles.timeInfo}>
          <MaterialCommunityIcons name="clock-outline" size={16} color="#B0BEC5" />
          <Text style={styles.timeText}>
            Отмечено в {formatTime(item.marked_at)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderHeader = () => (
    <View>
      {/* Stats Section */}
      {stats && (
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <StatCard
              icon="check-circle"
              value={stats.total_attendances}
              label="Всего посещений"
              iconColor="#4CAF50"
            />
            <StatCard
              icon="account-group"
              value={stats.unique_athletes}
              label="Уник. учеників"
              iconColor="#2196F3"
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              icon="calendar-check"
              value={stats.unique_classes}
              label="Занятий"
              iconColor="#9C27B0"
            />
            <StatCard
              icon="calendar-today"
              value={stats.today_count}
              label="Сегодня"
              iconColor="#FFC107"
            />
          </View>
        </View>
      )}

      {/* Filters */}
      <View style={styles.filtersSection}>
        <Searchbar
          placeholder="Поиск по ученику или занятию"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor="#B0BEC5"
          placeholderTextColor="#B0BEC5"
        />

        <View style={styles.filterChips}>
          {dateFilterOptions.map((option) => (
            <Chip
              key={option.value}
              mode="outlined"
              selected={dateFilter === option.value}
              onPress={() => setDateFilter(option.value)}
              style={[
                styles.filterChip,
                dateFilter === option.value && styles.filterChipSelected,
              ]}
              textStyle={[
                styles.filterChipText,
                dateFilter === option.value && styles.filterChipTextSelected,
              ]}
            >
              {option.label}
            </Chip>
          ))}
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>История посещений</Text>
        <Text style={styles.listCount}>{filteredAttendances.length} записей</Text>
      </View>
    </View>
  );

  if (loading && attendances.length === 0 && !refreshing) {
    return (
      <Layout title="Посещаемость" showBack onBackPress={() => navigation.goBack()}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout title="Посещаемость" showBack onBackPress={() => navigation.goBack()}>
      <FlatList
        data={filteredAttendances}
        renderItem={renderAttendanceItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="clipboard-check-outline"
            message="Записей о посещении нет"
            subtitle="Данные о посещении появятся здесь"
          />
        }
      />
    </Layout>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  statsSection: {
    marginBottom: 24,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filtersSection: {
    marginBottom: 16,
  },
  searchBar: {
    backgroundColor: '#1B263B',
    marginBottom: 12,
    borderRadius: 8,
  },
  searchInput: {
    color: '#fff',
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: 'transparent',
    borderColor: '#2C3E50',
  },
  filterChipSelected: {
    backgroundColor: '#E74C3C',
    borderColor: '#E74C3C',
  },
  filterChipText: {
    color: '#B0BEC5',
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listCount: {
    color: '#B0BEC5',
    fontSize: 14,
  },
  attendanceCard: {
    backgroundColor: '#1B263B',
    borderRadius: 12,
    marginBottom: 12,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  athleteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  athleteName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  dateChip: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  dateChipText: {
    color: '#4CAF50',
    fontSize: 12,
  },
  classInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  className: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
  },
  coachInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  coachName: {
    color: '#B0BEC5',
    fontSize: 14,
    marginLeft: 8,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2C3E50',
  },
  timeText: {
    color: '#B0BEC5',
    fontSize: 12,
    marginLeft: 8,
  },
});

export default AdminAttendancePage;
