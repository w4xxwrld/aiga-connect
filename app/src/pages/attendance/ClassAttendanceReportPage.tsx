import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  ActivityIndicator,
  Chip,
  SegmentedButtons,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Layout from '../../components/Layout';
import EmptyState from '../../components/EmptyState';
import StatCard from '../../components/StatCard';
import attendanceService, { Attendance, AttendanceStats, DateRange } from '../../services/attendance';
import classesService, { Class } from '../../services/classes';

const ClassAttendanceReportPage: React.FC<{ route?: any; navigation?: any }> = ({
  route,
  navigation,
}) => {
  const classId = route?.params?.classId;

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [classData, setClassData] = useState<Class | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('all');
  const [groupBy, setGroupBy] = useState<'date' | 'athlete'>('date');

  useEffect(() => {
    if (classId) {
      loadClassData();
    }
  }, [classId, filter]);

  const loadClassData = async () => {
    try {
      setLoading(true);

      // Get date range based on filter
      const dateRange: DateRange = {};
      const now = new Date();

      if (filter === 'week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);
        dateRange.start_date = attendanceService.formatDateForAPI(startOfWeek);
      } else if (filter === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateRange.start_date = attendanceService.formatDateForAPI(startOfMonth);
      }

      // Load class info, attendances, and stats
      const [classInfo, attendanceData, statsData] = await Promise.all([
        classesService.getClass(classId),
        attendanceService.getClassAttendance(classId),
        attendanceService.getClassAttendanceStats(classId, dateRange),
      ]);

      setClassData(classInfo);
      setAttendances(attendanceData);
      setStats(statsData);
    } catch (error: any) {
      console.error('Error loading class attendance data:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClassData();
    setRefreshing(false);
  };

  const renderHeader = () => {
    if (!classData) return null;

    return (
      <View style={styles.header}>
        <Title style={styles.headerTitle}>{classData.name}</Title>
        <Text style={styles.headerSubtitle}>
          {classData.start_time} • {classData.duration} мин •{' '}
          {classData.days_of_week.join(', ')}
        </Text>
      </View>
    );
  };

  const renderFilters = () => (
    <View style={styles.filterSection}>
      <Text style={styles.filterLabel}>Период</Text>
      <SegmentedButtons
        value={filter}
        onValueChange={(value) => setFilter(value as any)}
        buttons={[
          { value: 'all', label: 'Всё время' },
          { value: 'week', label: 'Неделя' },
          { value: 'month', label: 'Месяц' },
        ]}
        style={styles.segmentedButtons}
        theme={{
          colors: {
            secondaryContainer: '#E74C3C',
            onSecondaryContainer: '#FFFFFF',
          },
        }}
      />

      <Text style={[styles.filterLabel, { marginTop: 12 }]}>Группировка</Text>
      <SegmentedButtons
        value={groupBy}
        onValueChange={(value) => setGroupBy(value as any)}
        buttons={[
          { value: 'date', label: 'По датам' },
          { value: 'athlete', label: 'По ученикам' },
        ]}
        style={styles.segmentedButtons}
        theme={{
          colors: {
            secondaryContainer: '#E74C3C',
            onSecondaryContainer: '#FFFFFF',
          },
        }}
      />
    </View>
  );

  const renderStats = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsContainer}>
        <StatCard
          icon="account-multiple"
          value={stats.unique_athletes}
          label="Учеников"
        />
        <StatCard
          icon="check-all"
          value={stats.total_attendances}
          label="Посещений"
        />
      </View>
    );
  };

  const renderMethodBreakdown = () => {
    if (!stats) return null;

    const qrPercentage =
      stats.total_attendances > 0
        ? Math.round((stats.qr_scan_count / stats.total_attendances) * 100)
        : 0;
    const manualPercentage = 100 - qrPercentage;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Способы отметки</Title>

          <View style={styles.methodBreakdown}>
            <View style={styles.methodItem}>
              <MaterialCommunityIcons name="qrcode-scan" size={24} color="#4CAF50" />
              <Text style={styles.methodLabel}>QR сканирование</Text>
              <Text style={styles.methodValue}>
                {stats.qr_scan_count} ({qrPercentage}%)
              </Text>
            </View>

            <View style={styles.methodItem}>
              <MaterialCommunityIcons name="pencil" size={24} color="#FF9800" />
              <Text style={styles.methodLabel}>Ручной ввод</Text>
              <Text style={styles.methodValue}>
                {stats.manual_entry_count} ({manualPercentage}%)
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderAttendancesByDate = () => {
    if (attendances.length === 0) {
      return (
        <Card style={styles.card}>
          <Card.Content>
            <EmptyState
              icon="clipboard-off-outline"
              title="Нет данных о посещениях"
              description="Пока никто не отметил посещение этого занятия"
            />
          </Card.Content>
        </Card>
      );
    }

    const grouped = attendanceService.groupByDate(attendances);
    const dates = Object.keys(grouped).sort((a, b) =>
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
              {grouped[date].length}
            </Chip>
          </View>

          {grouped[date].map((attendance) => (
            <View key={attendance.id} style={styles.attendanceItem}>
              <View style={styles.attendanceIcon}>
                <MaterialCommunityIcons
                  name={attendanceService.getMethodIcon(attendance.method)}
                  size={20}
                  color="#4CAF50"
                />
              </View>

              <View style={styles.attendanceContent}>
                <Text style={styles.athleteName}>
                  {attendance.athlete?.first_name} {attendance.athlete?.last_name}
                </Text>
                <Text style={styles.attendanceTime}>
                  {attendanceService.formatTime(attendance.marked_at)} •{' '}
                  {attendanceService.getMethodDisplayName(attendance.method)}
                </Text>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>
    ));
  };

  const renderAttendancesByAthlete = () => {
    if (attendances.length === 0) {
      return (
        <Card style={styles.card}>
          <Card.Content>
            <EmptyState
              icon="clipboard-off-outline"
              title="Нет данных о посещениях"
              description="Пока никто не отметил посещение этого занятия"
            />
          </Card.Content>
        </Card>
      );
    }

    // Group by athlete
    const grouped: { [athleteId: number]: Attendance[] } = {};
    attendances.forEach((attendance) => {
      if (attendance.athlete_id) {
        if (!grouped[attendance.athlete_id]) {
          grouped[attendance.athlete_id] = [];
        }
        grouped[attendance.athlete_id].push(attendance);
      }
    });

    const athletes = Object.keys(grouped).map(Number);

    // Sort by attendance count
    athletes.sort((a, b) => grouped[b].length - grouped[a].length);

    return athletes.map((athleteId) => {
      const athleteAttendances = grouped[athleteId];
      const athlete = athleteAttendances[0]?.athlete;

      if (!athlete) return null;

      const attendanceRate =
        classData && classData.max_participants
          ? Math.round((athleteAttendances.length / stats!.total_attendances) * 100)
          : 0;

      return (
        <Card key={athleteId} style={styles.card}>
          <Card.Content>
            <View style={styles.athleteHeader}>
              <View style={styles.athleteInfo}>
                <MaterialCommunityIcons
                  name="account-circle"
                  size={32}
                  color="#E74C3C"
                />
                <View style={styles.athleteDetails}>
                  <Text style={styles.athleteNameLarge}>
                    {athlete.first_name} {athlete.last_name}
                  </Text>
                  <Text style={styles.athletePhone}>{athlete.phone}</Text>
                </View>
              </View>
              <Chip style={styles.countChip} textStyle={styles.countChipText}>
                {athleteAttendances.length}
              </Chip>
            </View>

            <View style={styles.athleteAttendances}>
              {athleteAttendances
                .sort(
                  (a, b) =>
                    new Date(b.attendance_date).getTime() -
                    new Date(a.attendance_date).getTime()
                )
                .slice(0, 5)
                .map((attendance) => (
                  <View key={attendance.id} style={styles.miniAttendanceItem}>
                    <Text style={styles.miniAttendanceDate}>
                      {attendanceService.formatDate(attendance.attendance_date)}
                    </Text>
                    <Text style={styles.miniAttendanceTime}>
                      {attendanceService.formatTime(attendance.marked_at)}
                    </Text>
                  </View>
                ))}

              {athleteAttendances.length > 5 && (
                <Text style={styles.moreAttendancesText}>
                  +{athleteAttendances.length - 5} ещё
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>
      );
    });
  };

  if (loading && !refreshing) {
    return (
      <Layout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>Загрузка отчета...</Text>
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
        {renderStats()}
        {renderMethodBreakdown()}
        {renderFilters()}
        {groupBy === 'date' ? renderAttendancesByDate() : renderAttendancesByAthlete()}
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  card: {
    backgroundColor: '#1B263B',
    marginBottom: 12,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  methodBreakdown: {
    gap: 12,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodLabel: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  methodValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E74C3C',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0BEC5',
    marginBottom: 8,
  },
  segmentedButtons: {
    backgroundColor: '#1B263B',
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
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
  },
  attendanceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0D1B2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attendanceContent: {
    flex: 1,
  },
  athleteName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    marginBottom: 2,
  },
  attendanceTime: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  athleteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
  },
  athleteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  athleteDetails: {
    flex: 1,
  },
  athleteNameLarge: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  athletePhone: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  athleteAttendances: {
    gap: 6,
  },
  miniAttendanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  miniAttendanceDate: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  miniAttendanceTime: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  moreAttendancesText: {
    fontSize: 14,
    color: '#E74C3C',
    marginTop: 4,
  },
});

export default ClassAttendanceReportPage;
