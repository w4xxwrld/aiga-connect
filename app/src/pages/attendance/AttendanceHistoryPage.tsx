import React, { useState, useEffect } from 'react';
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
  Searchbar,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Layout from '../../components/Layout';
import EmptyState from '../../components/EmptyState';
import attendanceService, { Attendance, DateRange } from '../../services/attendance';

const AttendanceHistoryPage: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [filteredAttendances, setFilteredAttendances] = useState<Attendance[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({});
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadAttendances();
  }, [dateRange]);

  useEffect(() => {
    filterAttendances();
  }, [attendances, searchQuery]);

  const loadAttendances = async () => {
    try {
      setLoading(true);

      const [attendanceData, count] = await Promise.all([
        attendanceService.getMyAttendance(dateRange),
        attendanceService.getMyAttendanceCount(),
      ]);

      setAttendances(attendanceData);
      setTotalCount(count);
    } catch (error: any) {
      console.error('Error loading attendances:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось загрузить историю');
    } finally {
      setLoading(false);
    }
  };

  const filterAttendances = () => {
    if (!searchQuery) {
      setFilteredAttendances(attendances);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = attendances.filter(
      (attendance) =>
        attendance.class_obj?.name.toLowerCase().includes(query) ||
        attendanceService.formatDate(attendance.attendance_date).toLowerCase().includes(query)
    );

    setFilteredAttendances(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAttendances();
    setRefreshing(false);
  };

  const handleSetThisMonth = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setDateRange({
      start_date: attendanceService.formatDateForAPI(startOfMonth),
      end_date: attendanceService.formatDateForAPI(endOfMonth),
    });
  };

  const handleSetLastMonth = () => {
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    setDateRange({
      start_date: attendanceService.formatDateForAPI(startOfLastMonth),
      end_date: attendanceService.formatDateForAPI(endOfLastMonth),
    });
  };

  const handleClearFilter = () => {
    setDateRange({});
    setSearchQuery('');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Title style={styles.headerTitle}>История посещений</Title>
      <Text style={styles.headerSubtitle}>
        Всего посещений: {totalCount}
      </Text>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filterSection}>
      <Searchbar
        placeholder="Поиск по занятиям или датам..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        inputStyle={styles.searchBarInput}
        placeholderTextColor="#B0BEC5"
        iconColor="#E74C3C"
        theme={{
          colors: {
            primary: '#E74C3C',
            background: '#1B263B',
            text: '#FFFFFF',
          },
        }}
      />

      <View style={styles.chipContainer}>
        <Chip
          selected={!!dateRange.start_date && !dateRange.end_date}
          onPress={handleSetThisMonth}
          style={styles.chip}
          textStyle={styles.chipText}
          selectedColor="#FFFFFF"
        >
          Этот месяц
        </Chip>
        <Chip
          onPress={handleSetLastMonth}
          style={styles.chip}
          textStyle={styles.chipText}
          selectedColor="#FFFFFF"
        >
          Прошлый месяц
        </Chip>
        {(dateRange.start_date || searchQuery) && (
          <Chip
            icon="close"
            onPress={handleClearFilter}
            style={[styles.chip, styles.clearChip]}
            textStyle={styles.chipText}
          >
            Сбросить
          </Chip>
        )}
      </View>
    </View>
  );

  const renderAttendanceItem = (attendance: Attendance) => (
    <TouchableOpacity
      key={attendance.id}
      style={styles.attendanceItem}
      onPress={() => {
        if (attendance.class_obj?.id) {
          navigation?.navigate('ClassDetail', { classId: attendance.class_obj.id });
        }
      }}
    >
      <View style={styles.attendanceIcon}>
        <MaterialCommunityIcons
          name={attendanceService.getMethodIcon(attendance.method)}
          size={24}
          color="#4CAF50"
        />
      </View>

      <View style={styles.attendanceContent}>
        <Text style={styles.attendanceClassName}>
          {attendance.class_obj?.name || 'Занятие'}
        </Text>
        <View style={styles.attendanceDetails}>
          <Text style={styles.attendanceDate}>
            {attendanceService.formatDate(attendance.attendance_date)}
          </Text>
          <Text style={styles.attendanceDot}> • </Text>
          <Text style={styles.attendanceTime}>
            {attendanceService.formatTime(attendance.marked_at)}
          </Text>
        </View>
        <Text style={styles.attendanceMethod}>
          {attendanceService.getMethodDisplayName(attendance.method)}
        </Text>
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color="#B0BEC5"
      />
    </TouchableOpacity>
  );

  const renderAttendancesByDate = () => {
    if (filteredAttendances.length === 0) {
      return (
        <Card style={styles.card}>
          <Card.Content>
            <EmptyState
              icon="clipboard-check-outline"
              title={searchQuery || dateRange.start_date ? 'Нет результатов' : 'Нет записей'}
              description={
                searchQuery || dateRange.start_date
                  ? 'Попробуйте изменить фильтры поиска'
                  : 'Отметьте посещение, чтобы увидеть историю'
              }
            />
          </Card.Content>
        </Card>
      );
    }

    // Group attendances by date
    const groupedAttendances = attendanceService.groupByDate(filteredAttendances);
    const dates = Object.keys(groupedAttendances).sort((a, b) =>
      new Date(b).getTime() - new Date(a).getTime()
    );

    return dates.map((date) => (
      <Card key={date} style={styles.card}>
        <Card.Content>
          <View style={styles.dateHeader}>
            <Text style={styles.dateText}>
              {attendanceService.formatDate(date)}
            </Text>
            <Chip style={styles.countChip} textStyle={styles.countChipText}>
              {groupedAttendances[date].length}
            </Chip>
          </View>

          {groupedAttendances[date].map((attendance) =>
            renderAttendanceItem(attendance)
          )}
        </Card.Content>
      </Card>
    ));
  };

  if (loading && !refreshing) {
    return (
      <Layout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>Загрузка истории...</Text>
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
        {renderAttendancesByDate()}
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
  searchBar: {
    backgroundColor: '#1B263B',
    borderRadius: 8,
    marginBottom: 12,
  },
  searchBarInput: {
    color: '#FFFFFF',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#1B263B',
  },
  chipText: {
    color: '#FFFFFF',
  },
  clearChip: {
    backgroundColor: '#E74C3C',
  },
  card: {
    backgroundColor: '#1B263B',
    marginBottom: 12,
    borderRadius: 12,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  countChip: {
    backgroundColor: '#0D1B2A',
  },
  countChipText: {
    color: '#E74C3C',
    fontSize: 12,
    fontWeight: '600',
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
  attendanceContent: {
    flex: 1,
  },
  attendanceClassName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    marginBottom: 4,
  },
  attendanceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  attendanceDate: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  attendanceDot: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  attendanceTime: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  attendanceMethod: {
    fontSize: 12,
    color: '#4CAF50',
  },
});

export default AttendanceHistoryPage;
