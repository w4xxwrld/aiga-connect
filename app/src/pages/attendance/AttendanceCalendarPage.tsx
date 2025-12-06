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
} from 'react-native-paper';
import { Calendar, DateData } from 'react-native-calendars';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Layout from '../../components/Layout';
import EmptyState from '../../components/EmptyState';
import attendanceService, { Attendance } from '../../services/attendance';

const AttendanceCalendarPage: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDateAttendances, setSelectedDateAttendances] = useState<Attendance[]>([]);

  useEffect(() => {
    loadAttendances();
  }, []);

  const loadAttendances = async () => {
    try {
      setLoading(true);

      const attendanceData = await attendanceService.getMyAttendance();
      setAttendances(attendanceData);
    } catch (error: any) {
      console.error('Error loading attendances:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAttendances();
    setRefreshing(false);
  };

  const handleDayPress = (day: DateData) => {
    const dateString = day.dateString;
    setSelectedDate(dateString);

    // Find attendances for the selected date
    const dayAttendances = attendances.filter(
      (attendance) => attendance.attendance_date === dateString
    );

    setSelectedDateAttendances(dayAttendances);
  };

  const getMarkedDates = () => {
    const marked = attendanceService.getMarkedDates(attendances);

    // Add selection to the selected date
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#E74C3C',
      };
    }

    return marked;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Title style={styles.headerTitle}>Календарь посещений</Title>
      <Text style={styles.headerSubtitle}>
        Всего посещений: {attendances.length}
      </Text>
    </View>
  );

  const renderCalendar = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Calendar
          onDayPress={handleDayPress}
          markedDates={getMarkedDates()}
          theme={{
            calendarBackground: '#1B263B',
            textSectionTitleColor: '#B0BEC5',
            selectedDayBackgroundColor: '#E74C3C',
            selectedDayTextColor: '#FFFFFF',
            todayTextColor: '#E74C3C',
            dayTextColor: '#FFFFFF',
            textDisabledColor: '#2C3E50',
            dotColor: '#4CAF50',
            selectedDotColor: '#FFFFFF',
            arrowColor: '#E74C3C',
            monthTextColor: '#FFFFFF',
            indicatorColor: '#E74C3C',
            textDayFontFamily: 'System',
            textMonthFontFamily: 'System',
            textDayHeaderFontFamily: 'System',
            textDayFontWeight: '400',
            textMonthFontWeight: '600',
            textDayHeaderFontWeight: '600',
            textDayFontSize: 14,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 12,
          }}
          style={styles.calendar}
        />

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Дни посещений</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#E74C3C' }]} />
            <Text style={styles.legendText}>Выбранный день</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderSelectedDateDetails = () => {
    if (!selectedDate) {
      return (
        <Card style={styles.card}>
          <Card.Content>
            <EmptyState
              icon="calendar-blank"
              title="Выберите дату"
              description="Нажмите на дату в календаре, чтобы увидеть посещения"
            />
          </Card.Content>
        </Card>
      );
    }

    if (selectedDateAttendances.length === 0) {
      return (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>
              {attendanceService.formatDate(selectedDate)}
            </Title>
            <EmptyState
              icon="clipboard-off-outline"
              title="Нет посещений"
              description="В этот день вы не отмечали посещения"
            />
          </Card.Content>
        </Card>
      );
    }

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.dateHeader}>
            <Title style={styles.cardTitle}>
              {attendanceService.formatDate(selectedDate)}
            </Title>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {selectedDateAttendances.length}
              </Text>
            </View>
          </View>

          {selectedDateAttendances.map((attendance) => (
            <TouchableOpacity
              key={attendance.id}
              style={styles.attendanceItem}
              onPress={() => {
                if (attendance.class_obj?.id) {
                  navigation?.navigate('ClassDetail', {
                    classId: attendance.class_obj.id,
                  });
                }
              }}
            >
              <View style={styles.attendanceIcon}>
                <MaterialCommunityIcons
                  name={attendanceService.getMethodIcon()}
                  size={24}
                  color="#4CAF50"
                />
              </View>

              <View style={styles.attendanceContent}>
                <Text style={styles.attendanceClassName}>
                  {attendance.class_obj?.name || 'Занятие'}
                </Text>
                <View style={styles.attendanceDetails}>
                  <Text style={styles.attendanceTime}>
                    Отмечено в {attendanceService.formatTime(attendance.marked_at)}
                  </Text>
                  <Text style={styles.attendanceDot}> • </Text>
                  <Text style={styles.attendanceMethod}>
                    {attendanceService.getMethodDisplayName()}
                  </Text>
                </View>
                {attendance.class_obj?.coach && (
                  <Text style={styles.coachName}>
                    Профессор: {attendance.class_obj.coach.first_name}{' '}
                    {attendance.class_obj.coach.last_name}
                  </Text>
                )}
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

  const renderMonthlyStats = () => {
    const now = new Date();
    const monthlyAttendances = attendances.filter((attendance) => {
      const attendanceDate = new Date(attendance.attendance_date);
      return (
        attendanceDate.getMonth() === now.getMonth() &&
        attendanceDate.getFullYear() === now.getFullYear()
      );
    });

    const uniqueDates = new Set(monthlyAttendances.map((a) => a.attendance_date));

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Статистика за месяц</Title>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{monthlyAttendances.length}</Text>
              <Text style={styles.statLabel}>Всего посещений</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{uniqueDates.size}</Text>
              <Text style={styles.statLabel}>Уникальных дней</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading && !refreshing) {
    return (
      <Layout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>Загрузка календаря...</Text>
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
        {renderMonthlyStats()}
        {renderCalendar()}
        {renderSelectedDateDetails()}
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
  card: {
    backgroundColor: '#1B263B',
    marginBottom: 16,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  calendar: {
    borderRadius: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#B0BEC5',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#B0BEC5',
    textAlign: 'center',
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  countBadge: {
    backgroundColor: '#E74C3C',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
  attendanceTime: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  attendanceDot: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  attendanceMethod: {
    fontSize: 14,
    color: '#4CAF50',
  },
  coachName: {
    fontSize: 12,
    color: '#B0BEC5',
  },
});

export default AttendanceCalendarPage;
