import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

interface Progress {
  id: number;
  athlete_id: number;
  current_belt: string;
  current_stripes: number;
  total_classes_attended: number;
  total_tournaments_participated: number;
  total_wins: number;
  total_losses: number;
  belt_received_date: string;
  last_promotion_date: string;
}

interface Achievement {
  id: number;
  athlete_id: number;
  achievement_type: string;
  title: string;
  description: string;
  points_earned: number;
  achieved_date: string;
}

const ProgressPage: React.FC = () => {
  const { user, isSidebarOpen, setIsSidebarOpen, linkedChildren } = useAppContext();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const handleSidebarClose = useCallback(() => {
    setIsSidebarOpen(false);
  }, [setIsSidebarOpen]);

  const beltColors = {
    white: '#FFFFFF',
    yellow: '#FFD700',
    orange: '#FFA500',
    green: '#32CD32',
    blue: '#4169E1',
    purple: '#800080',
    brown: '#8B4513',
    black: '#000000',
  };

  const beltNames = {
    white: 'Белый пояс',
    yellow: 'Желтый пояс',
    orange: 'Оранжевый пояс',
    green: 'Зеленый пояс',
    blue: 'Синий пояс',
    purple: 'Фиолетовый пояс',
    brown: 'Коричневый пояс',
    black: 'Черный пояс',
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      
      // Get athlete ID - for parents, use linked child, for athletes use their own ID
      let athleteId = user?.id;
      if (user?.primary_role === 'parent' && linkedChildren.length > 0) {
        athleteId = linkedChildren[0].id; // Use first linked child
      }
      
      if (!athleteId) {
        console.log('No athlete ID available for progress');
        setProgress(null);
        setAchievements([]);
        return;
      }
      
      const response = await api.get(`/progress/progress/${athleteId}`);
      setProgress(response.data);
      
      const achievementsResponse = await api.get(`/progress/achievements/athlete/${athleteId}`);
      setAchievements(achievementsResponse.data);
    } catch (error) {
      console.error('Error fetching progress:', error);
      // Don't show alert, just set empty data
      setProgress(null);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  const getBeltColor = (beltLevel: string) => {
    return beltColors[beltLevel as keyof typeof beltColors] || '#FFFFFF';
  };

  const getBeltName = (beltLevel: string) => {
    return beltNames[beltLevel as keyof typeof beltNames] || beltLevel;
  };

  if (loading) {
    return (
      <Layout title="Прогресс" onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>Загрузка прогресса...</Text>
        </View>
        <Sidebar isVisible={isSidebarOpen} onClose={handleSidebarClose} />
      </Layout>
    );
  }

  return (
    <Layout title="Прогресс" onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}>
      <ScrollView style={styles.container}>

      {/* Current Belt Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Текущий уровень</Text>
        <View style={styles.beltContainer}>
          <View style={styles.beltVisual}>
            <MaterialCommunityIcons name="karate" size={40} color="#E74C3C" />
          </View>
          <View style={styles.beltInfo}>
            <View style={styles.beltDisplay}>
              <Text style={styles.beltText}>{getBeltName(progress?.current_belt || 'white')}</Text>
              {progress?.current_stripes && progress.current_stripes > 0 && (
                <Text style={styles.stripesText}>{progress.current_stripes} полосы</Text>
              )}
            </View>
            <Text style={styles.beltDate}>
              Получен: {progress?.belt_received_date ? new Date(progress.belt_received_date).toLocaleDateString('ru-RU') : 'Не указано'}
            </Text>
            <Text style={styles.lastPromotion}>
              Последнее повышение: {progress?.last_promotion_date ? new Date(progress.last_promotion_date).toLocaleDateString('ru-RU') : 'Не указано'}
            </Text>
          </View>
        </View>
      </View>

      {/* Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Статистика</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="calendar-check" size={24} color="#E74C3C" />
            <Text style={styles.statNumber}>{progress?.total_classes_attended || 0}</Text>
            <Text style={styles.statLabel}>Занятий посещено</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="trophy" size={24} color="#E74C3C" />
            <Text style={styles.statNumber}>{progress?.total_tournaments_participated || 0}</Text>
            <Text style={styles.statLabel}>Турниров</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="medal" size={24} color="#E74C3C" />
            <Text style={styles.statNumber}>{progress?.total_wins || 0}</Text>
            <Text style={styles.statLabel}>Побед</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="chart-line" size={24} color="#E74C3C" />
            <Text style={styles.statNumber}>
              {progress?.total_wins && progress?.total_losses 
                ? Math.round((progress.total_wins / (progress.total_wins + progress.total_losses)) * 100)
                : 0}%
            </Text>
            <Text style={styles.statLabel}>Процент побед</Text>
          </View>
        </View>
      </View>

      {/* Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Достижения</Text>
        {achievements.length > 0 ? (
          achievements.map((achievement) => (
            <View key={achievement.id} style={styles.achievementCard}>
              <View style={styles.achievementHeader}>
                <MaterialCommunityIcons name="star" size={20} color="#FFD700" />
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementPoints}>+{achievement.points_earned} баллов</Text>
              </View>
              <Text style={styles.achievementDescription}>{achievement.description}</Text>
              <Text style={styles.achievementDate}>
                {new Date(achievement.achieved_date).toLocaleDateString('ru-RU')}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="trophy-outline" size={48} color="#B0BEC5" />
            <Text style={styles.emptyText}>Пока нет достижений</Text>
            <Text style={styles.emptySubtext}>Участвуйте в тренировках и турнирах для получения достижений</Text>
          </View>
        )}
      </View>
      </ScrollView>
      <Sidebar isVisible={isSidebarOpen} onClose={handleSidebarClose} />
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
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  section: {
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  beltContainer: {
    backgroundColor: '#1B263B',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  beltVisual: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: '#1B263B',
    borderWidth: 2,
    borderColor: '#2C3E50',
  },
  beltDisplay: {
    marginBottom: 12,
  },
  actualBelt: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  beltText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E74C3C',
    textAlign: 'left',
  },
  stripesText: {
    fontSize: 14,
    color: '#B0BEC5',
    marginTop: 4,
  },
  beltInfo: {
    flex: 1,
  },
  beltDate: {
    fontSize: 14,
    color: '#B0BEC5',
    marginBottom: 4,
  },
  lastPromotion: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#1B263B',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#B0BEC5',
    textAlign: 'center',
    marginTop: 4,
  },
  achievementCard: {
    backgroundColor: '#1B263B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginLeft: 8,
  },
  achievementPoints: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  achievementDescription: {
    fontSize: 14,
    color: '#B0BEC5',
    marginBottom: 8,
  },
  achievementDate: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#B0BEC5',
    marginTop: 16,
    fontWeight: 'bold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ProgressPage; 