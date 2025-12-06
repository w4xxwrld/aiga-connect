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
  SegmentedButtons,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Layout from '../../components/Layout';
import EmptyState from '../../components/EmptyState';
import { useAppContext } from '../../context/AppContext';
import attendanceService, { Attendance } from '../../services/attendance';
import classesService, { Class } from '../../services/classes';

interface AthleteInsight {
  athlete_id: number;
  athlete_name: string;
  athlete_phone: string;
  total_attendances: number;
  classes: { [classId: number]: number };
  last_attendance_date?: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

const AthleteInsightsPage: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { user } = useAppContext();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [insights, setInsights] = useState<AthleteInsight[]>([]);
  const [filteredInsights, setFilteredInsights] = useState<AthleteInsight[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'most' | 'least' | 'name'>('most');

  useEffect(() => {
    loadInsights();
  }, []);

  useEffect(() => {
    filterAndSortInsights();
  }, [insights, searchQuery, sortBy]);

  const loadInsights = async () => {
    try {
      setLoading(true);

      // Get all classes taught by this coach
      const allClasses = await classesService.getClasses();
      const myClasses = allClasses.filter(
        (classItem) => classItem.coach_id === user?.id
      );

      if (myClasses.length === 0) {
        setInsights([]);
        return;
      }

      // Get attendance for all classes
      const attendancesByClass: { [classId: number]: Attendance[] } = {};

      await Promise.all(
        myClasses.map(async (classItem) => {
          try {
            const attendances = await attendanceService.getClassAttendance(classItem.id);
            attendancesByClass[classItem.id] = attendances;
          } catch (error) {
            console.error(`Error loading attendance for class ${classItem.id}:`, error);
            attendancesByClass[classItem.id] = [];
          }
        })
      );

      // Aggregate data by athlete
      const athleteData: { [athleteId: number]: AthleteInsight } = {};

      Object.entries(attendancesByClass).forEach(([classIdStr, attendances]) => {
        const classId = Number(classIdStr);

        attendances.forEach((attendance) => {
          if (!attendance.athlete_id || !attendance.athlete) return;

          if (!athleteData[attendance.athlete_id]) {
            athleteData[attendance.athlete_id] = {
              athlete_id: attendance.athlete_id,
              athlete_name: `${attendance.athlete.first_name} ${attendance.athlete.last_name}`,
              athlete_phone: attendance.athlete.phone,
              total_attendances: 0,
              classes: {},
              trend: 'stable',
            };
          }

          athleteData[attendance.athlete_id].total_attendances++;
          athleteData[attendance.athlete_id].classes[classId] =
            (athleteData[attendance.athlete_id].classes[classId] || 0) + 1;

          // Track last attendance
          if (
            !athleteData[attendance.athlete_id].last_attendance_date ||
            attendance.attendance_date > athleteData[attendance.athlete_id].last_attendance_date!
          ) {
            athleteData[attendance.athlete_id].last_attendance_date = attendance.attendance_date;
          }
        });
      });

      // Calculate trends (simple: based on last 2 weeks vs previous 2 weeks)
      const now = new Date();
      const twoWeeksAgo = new Date(now);
      twoWeeksAgo.setDate(now.getDate() - 14);
      const fourWeeksAgo = new Date(now);
      fourWeeksAgo.setDate(now.getDate() - 28);

      Object.values(athleteData).forEach((athlete) => {
        let recentCount = 0;
        let previousCount = 0;

        Object.values(attendancesByClass).forEach((attendances) => {
          attendances.forEach((attendance) => {
            if (attendance.athlete_id === athlete.athlete_id) {
              const attendanceDate = new Date(attendance.attendance_date);

              if (attendanceDate >= twoWeeksAgo) {
                recentCount++;
              } else if (attendanceDate >= fourWeeksAgo) {
                previousCount++;
              }
            }
          });
        });

        if (recentCount > previousCount) {
          athlete.trend = 'increasing';
        } else if (recentCount < previousCount) {
          athlete.trend = 'decreasing';
        } else {
          athlete.trend = 'stable';
        }
      });

      setInsights(Object.values(athleteData));
    } catch (error: any) {
      console.error('Error loading insights:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortInsights = () => {
    let filtered = [...insights];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (insight) =>
          insight.athlete_name.toLowerCase().includes(query) ||
          insight.athlete_phone.includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'most':
          return b.total_attendances - a.total_attendances;
        case 'least':
          return a.total_attendances - b.total_attendances;
        case 'name':
          return a.athlete_name.localeCompare(b.athlete_name);
        default:
          return 0;
      }
    });

    setFilteredInsights(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInsights();
    setRefreshing(false);
  };

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'increasing':
        return 'trending-up';
      case 'decreasing':
        return 'trending-down';
      case 'stable':
        return 'trending-neutral';
      default:
        return 'trending-neutral';
    }
  };

  const getTrendColor = (trend: string): string => {
    switch (trend) {
      case 'increasing':
        return '#4CAF50';
      case 'decreasing':
        return '#F44336';
      case 'stable':
        return '#B0BEC5';
      default:
        return '#B0BEC5';
    }
  };

  const getTrendLabel = (trend: string): string => {
    switch (trend) {
      case 'increasing':
        return 'Растёт';
      case 'decreasing':
        return 'Снижается';
      case 'stable':
        return 'Стабильно';
      default:
        return 'Стабильно';
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Title style={styles.headerTitle}>Аналитика учеников</Title>
      <Text style={styles.headerSubtitle}>
        Всего учеников: {insights.length}
      </Text>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filterSection}>
      <Searchbar
        placeholder="Поиск по имени или телефону..."
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

      <SegmentedButtons
        value={sortBy}
        onValueChange={(value) => setSortBy(value as any)}
        buttons={[
          { value: 'most', label: 'Актив.' },
          { value: 'least', label: 'Неактив.' },
          { value: 'name', label: 'Имя' },
        ]}
        style={styles.segmentedButtons}
        density="medium"
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

  const renderAthleteCard = (insight: AthleteInsight) => (
    <Card key={insight.athlete_id} style={styles.athleteCard}>
      <Card.Content>
        <View style={styles.athleteHeader}>
          <View style={styles.athleteInfo}>
            <View style={styles.athleteAvatar}>
              <MaterialCommunityIcons name="account" size={32} color="#E74C3C" />
            </View>
            <View style={styles.athleteDetails}>
              <Text style={styles.athleteName}>{insight.athlete_name}</Text>
              <Text style={styles.athletePhone}>{insight.athlete_phone}</Text>
            </View>
          </View>

          <View style={styles.athleteStats}>
            <Text style={styles.attendanceCount}>{insight.total_attendances}</Text>
            <Text style={styles.attendanceLabel}>посещений</Text>
          </View>
        </View>

        <View style={styles.athleteTrend}>
          <MaterialCommunityIcons
            name={getTrendIcon(insight.trend)}
            size={20}
            color={getTrendColor(insight.trend)}
          />
          <Text style={[styles.trendText, { color: getTrendColor(insight.trend) }]}>
            {getTrendLabel(insight.trend)}
          </Text>

          {insight.last_attendance_date && (
            <>
              <Text style={styles.trendDot}> • </Text>
              <Text style={styles.lastAttendance}>
                Последнее посещение:{' '}
                {attendanceService.formatDate(insight.last_attendance_date)}
              </Text>
            </>
          )}
        </View>

        {Object.keys(insight.classes).length > 0 && (
          <View style={styles.classesSection}>
            <Text style={styles.classesSectionTitle}>Занятия:</Text>
            <View style={styles.classChips}>
              {Object.entries(insight.classes).map(([classIdStr, count]) => (
                <Chip
                  key={classIdStr}
                  style={styles.classChip}
                  textStyle={styles.classChipText}
                >
                  Класс #{classIdStr}: {count}
                </Chip>
              ))}
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderInsightsList = () => {
    if (filteredInsights.length === 0) {
      return (
        <Card style={styles.card}>
          <Card.Content>
            <EmptyState
              icon={searchQuery ? 'account-search' : 'account-off'}
              title={searchQuery ? 'Нет результатов' : 'Нет данных'}
              description={
                searchQuery
                  ? 'Попробуйте изменить запрос поиска'
                  : 'Пока нет данных об учениках'
              }
            />
          </Card.Content>
        </Card>
      );
    }

    return filteredInsights.map(renderAthleteCard);
  };

  if (loading && !refreshing) {
    return (
      <Layout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>Загрузка аналитики...</Text>
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
        {renderInsightsList()}
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
  segmentedButtons: {
    backgroundColor: '#1B263B',
    borderRadius: 20,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: '#1B263B',
    marginBottom: 16,
    borderRadius: 12,
  },
  athleteCard: {
    backgroundColor: '#1B263B',
    marginBottom: 12,
    borderRadius: 12,
  },
  athleteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  athleteInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  athleteAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0D1B2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  athleteDetails: {
    flex: 1,
  },
  athleteName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  athletePhone: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  athleteStats: {
    alignItems: 'center',
  },
  attendanceCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E74C3C',
  },
  attendanceLabel: {
    fontSize: 12,
    color: '#B0BEC5',
  },
  athleteTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  trendDot: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  lastAttendance: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  classesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2C3E50',
  },
  classesSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0BEC5',
    marginBottom: 8,
  },
  classChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  classChip: {
    backgroundColor: '#0D1B2A',
  },
  classChipText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
});

export default AthleteInsightsPage;
