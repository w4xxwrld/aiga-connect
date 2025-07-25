import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  ActivityIndicator,
  ProgressBar,
  Avatar,
  Badge,
} from 'react-native-paper';
import { useAppContext } from '../context/AppContext';
import progressService, { AthleteProgress, Achievement, Challenge, Tournament } from '../services/progress';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ProgressPage: React.FC = () => {
  const { user, userRole, linkedChildren } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [progress, setProgress] = useState<AthleteProgress | null>(null);
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => {
    initializeProgress();
  }, [user, linkedChildren]);

  const initializeProgress = async () => {
    if (!user) return;

    let athleteId: number;
    if (userRole === 'athlete') {
      athleteId = user.id;
    } else if (userRole === 'parent' && linkedChildren.length > 0) {
      athleteId = linkedChildren[0].child.id; // Default to first child
    } else {
      setLoading(false);
      return;
    }

    setSelectedAthleteId(athleteId);
    await loadProgress(athleteId);
  };

  const loadProgress = async (athleteId: number) => {
    try {
      setLoading(true);
      const [progressData, tournamentsData] = await Promise.all([
        progressService.getAthleteProgress(athleteId),
        progressService.getUpcomingTournaments()
      ]);
      
      setProgress(progressData);
      setTournaments(tournamentsData);
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось загрузить прогресс');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    if (!selectedAthleteId) return;
    setRefreshing(true);
    await loadProgress(selectedAthleteId);
    setRefreshing(false);
  };

  const handleCompleteChallenge = async (challenge: Challenge) => {
    try {
      await progressService.completeChallenge(challenge.id);
      Alert.alert(
        'Поздравляем!', 
        `Челлендж "${challenge.title}" выполнен! Получено ${challenge.points_reward} баллов.`
      );
      if (selectedAthleteId) {
        await loadProgress(selectedAthleteId);
      }
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось завершить челлендж');
    }
  };

  const handleChildSelection = (childId: number) => {
    setSelectedAthleteId(childId);
    loadProgress(childId);
  };

  const renderChildSelector = () => {
    if (userRole !== 'parent' || linkedChildren.length <= 1) return null;

    return (
      <View style={styles.childSelector}>
        <Text style={styles.selectorTitle}>Выберите ребенка:</Text>
        <View style={styles.childChips}>
          {linkedChildren.map((rel) => (
            <Chip
              key={rel.child.id}
              mode={selectedAthleteId === rel.child.id ? 'flat' : 'outlined'}
              selected={selectedAthleteId === rel.child.id}
              onPress={() => handleChildSelection(rel.child.id)}
              style={[
                styles.childChip,
                selectedAthleteId === rel.child.id && styles.selectedChildChip
              ]}
              textStyle={styles.childChipText}
            >
              {rel.child.full_name || `Ребенок ${rel.child.iin}`}
            </Chip>
          ))}
        </View>
      </View>
    );
  };

  const renderBeltProgress = () => {
    if (!progress) return null;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.beltHeader}>
            <View style={styles.beltInfo}>
              <Title style={styles.cardTitle}>Текущий пояс</Title>
              <View style={styles.beltDisplay}>
                <View 
                  style={[
                    styles.beltColor, 
                    { backgroundColor: progress.current_belt.color }
                  ]} 
                />
                <Text style={styles.beltName}>{progress.current_belt.name}</Text>
              </View>
            </View>
            <View style={styles.pointsDisplay}>
              <Text style={styles.pointsValue}>{progress.total_points}</Text>
              <Text style={styles.pointsLabel}>баллов</Text>
            </View>
          </View>

          {progress.next_belt && (
            <View style={styles.nextBeltSection}>
              <Text style={styles.nextBeltLabel}>
                До {progress.next_belt.name}: {progress.progress_to_next}%
              </Text>
              <ProgressBar 
                progress={progress.progress_to_next / 100} 
                color="#E74C3C"
                style={styles.progressBar}
              />
              
              <View style={styles.requirements}>
                <Text style={styles.requirementsTitle}>Требования:</Text>
                {progress.next_belt.requirements.map((req, index) => (
                  <Text key={index} style={styles.requirement}>• {req}</Text>
                ))}
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderTrainingStats = () => {
    if (!progress) return null;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Статистика тренировок</Title>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="calendar-check" size={24} color="#4CAF50" />
              <Text style={styles.statValue}>{progress.training_stats.total_sessions}</Text>
              <Text style={styles.statLabel}>Всего тренировок</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="calendar-month" size={24} color="#2196F3" />
              <Text style={styles.statValue}>{progress.training_stats.this_month_sessions}</Text>
              <Text style={styles.statLabel}>В этом месяце</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="fire" size={24} color="#FF9800" />
              <Text style={styles.statValue}>{progress.training_stats.streak_days}</Text>
              <Text style={styles.statLabel}>Дней подряд</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="trophy-outline" size={24} color="#E74C3C" />
              <Text style={styles.statValue}>#{progress.rank}</Text>
              <Text style={styles.statLabel}>Рейтинг</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderAchievements = () => {
    if (!progress) return null;

    const earnedAchievements = progress.achievements.filter(a => a.is_earned);
    const unlockedAchievements = progress.achievements.filter(a => !a.is_earned);

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>
            Достижения ({earnedAchievements.length}/{progress.achievements.length})
          </Title>
          
          {earnedAchievements.length > 0 && (
            <View style={styles.achievementsSection}>
              <Text style={styles.sectionSubtitle}>Получены</Text>
              <View style={styles.achievementsGrid}>
                {earnedAchievements.map((achievement) => (
                  <View key={achievement.id} style={styles.achievementItem}>
                    <Avatar.Icon 
                      size={50} 
                      icon={achievement.icon} 
                      style={[styles.achievementIcon, styles.earnedAchievement]}
                    />
                    <Text style={styles.achievementTitle}>{achievement.title}</Text>
                    <Text style={styles.achievementPoints}>+{achievement.points}</Text>
                    {achievement.earned_date && (
                      <Text style={styles.achievementDate}>
                        {progressService.formatDate(achievement.earned_date)}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {unlockedAchievements.length > 0 && (
            <View style={styles.achievementsSection}>
              <Text style={styles.sectionSubtitle}>Доступны</Text>
              <View style={styles.achievementsGrid}>
                {unlockedAchievements.map((achievement) => (
                  <View key={achievement.id} style={styles.achievementItem}>
                    <Avatar.Icon 
                      size={50} 
                      icon={achievement.icon} 
                      style={[styles.achievementIcon, styles.lockedAchievement]}
                    />
                    <Text style={[styles.achievementTitle, styles.lockedText]}>
                      {achievement.title}
                    </Text>
                    <Text style={[styles.achievementPoints, styles.lockedText]}>
                      +{achievement.points}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderChallenges = () => {
    if (!progress) return null;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Активные челленджи</Title>
          {progress.active_challenges.map((challenge) => (
            <View key={challenge.id} style={styles.challengeItem}>
              <View style={styles.challengeHeader}>
                <View style={styles.challengeInfo}>
                  <MaterialCommunityIcons 
                    name={challenge.icon as any} 
                    size={24} 
                    color="#E74C3C" 
                  />
                  <View style={styles.challengeTexts}>
                    <Text style={styles.challengeTitle}>{challenge.title}</Text>
                    <Text style={styles.challengeDescription}>{challenge.description}</Text>
                  </View>
                </View>
                <Chip 
                  mode="outlined" 
                  style={styles.challengeTypeChip}
                  textStyle={styles.challengeTypeText}
                >
                  {progressService.getChallengeTypeDisplayName(challenge.type)}
                </Chip>
              </View>

              <View style={styles.challengeProgress}>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressText}>
                    {challenge.current_value} / {challenge.target_value}
                  </Text>
                  <Text style={styles.rewardText}>+{challenge.points_reward} баллов</Text>
                </View>
                <ProgressBar 
                  progress={challenge.current_value / challenge.target_value} 
                  color="#4CAF50"
                  style={styles.challengeProgressBar}
                />
              </View>

              {challenge.deadline && (
                <Text style={styles.challengeDeadline}>
                  До: {progressService.formatDate(challenge.deadline)}
                </Text>
              )}

              {challenge.current_value >= challenge.target_value && !challenge.is_completed && (
                <Button
                  mode="contained"
                  onPress={() => handleCompleteChallenge(challenge)}
                  style={styles.completeButton}
                  buttonColor="#4CAF50"
                >
                  Завершить челлендж
                </Button>
              )}
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderTournaments = () => {
    if (tournaments.length === 0) return null;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Предстоящие турниры</Title>
          {tournaments.map((tournament) => (
            <View key={tournament.id} style={styles.tournamentItem}>
              <View style={styles.tournamentHeader}>
                <Text style={styles.tournamentName}>{tournament.name}</Text>
                <Chip 
                  mode="outlined" 
                  style={styles.tournamentTypeChip}
                  textStyle={styles.tournamentTypeText}
                >
                  {progressService.getTournamentTypeDisplayName(tournament.type)}
                </Chip>
              </View>
              
              <View style={styles.tournamentDetails}>
                <View style={styles.tournamentDetailRow}>
                  <MaterialCommunityIcons name="calendar" size={16} color="#B0BEC5" />
                  <Text style={styles.tournamentDetailText}>
                    {progressService.formatDate(tournament.date)}
                  </Text>
                </View>
                
                <View style={styles.tournamentDetailRow}>
                  <MaterialCommunityIcons name="map-marker" size={16} color="#B0BEC5" />
                  <Text style={styles.tournamentDetailText}>{tournament.location}</Text>
                </View>

                {tournament.registration_deadline && (
                  <View style={styles.tournamentDetailRow}>
                    <MaterialCommunityIcons name="clock-alert" size={16} color="#FF9800" />
                    <Text style={styles.tournamentDetailText}>
                      Регистрация до: {progressService.formatDate(tournament.registration_deadline)}
                    </Text>
                  </View>
                )}
              </View>

              {tournament.description && (
                <Paragraph style={styles.tournamentDescription}>
                  {tournament.description}
                </Paragraph>
              )}

              <Button
                mode="outlined"
                onPress={() => Alert.alert('Информация', 'Регистрация на турниры будет добавлена в следующем обновлении')}
                style={styles.registerButton}
                textColor="#E74C3C"
              >
                Узнать больше
              </Button>
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E74C3C" />
        <Text style={styles.loadingText}>Загрузка прогресса...</Text>
      </View>
    );
  }

  if (!progress) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="account-off" size={64} color="#B0BEC5" />
        <Text style={styles.emptyText}>
          {userRole === 'parent' 
            ? 'Привяжите профиль ребенка в настройках для просмотра прогресса'
            : 'Прогресс не найден'
          }
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderChildSelector()}
        {renderBeltProgress()}
        {renderTrainingStats()}
        {renderChallenges()}
        {renderAchievements()}
        {renderTournaments()}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D1B2A',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#B0BEC5',
    textAlign: 'center',
    marginTop: 16,
  },
  childSelector: {
    padding: 16,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  childChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  childChip: {
    borderColor: '#E74C3C',
  },
  selectedChildChip: {
    backgroundColor: '#E74C3C',
  },
  childChipText: {
    color: '#fff',
  },
  card: {
    backgroundColor: '#1B263B',
    margin: 16,
    marginTop: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  beltHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  beltInfo: {
    flex: 1,
  },
  beltDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  beltColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#666',
  },
  beltName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  pointsDisplay: {
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E74C3C',
  },
  pointsLabel: {
    fontSize: 12,
    color: '#B0BEC5',
  },
  nextBeltSection: {
    marginTop: 16,
  },
  nextBeltLabel: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2C3E50',
  },
  requirements: {
    marginTop: 12,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  requirement: {
    fontSize: 13,
    color: '#B0BEC5',
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#0D1B2A',
    borderRadius: 8,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#B0BEC5',
    textAlign: 'center',
    marginTop: 2,
  },
  achievementsSection: {
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginBottom: 8,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementIcon: {
    marginBottom: 8,
  },
  earnedAchievement: {
    backgroundColor: '#4CAF50',
  },
  lockedAchievement: {
    backgroundColor: '#2C3E50',
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 2,
  },
  achievementPoints: {
    fontSize: 11,
    color: '#E74C3C',
    fontWeight: 'bold',
  },
  achievementDate: {
    fontSize: 10,
    color: '#B0BEC5',
    marginTop: 2,
  },
  lockedText: {
    color: '#666',
  },
  challengeItem: {
    backgroundColor: '#0D1B2A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  challengeInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  challengeTexts: {
    flex: 1,
    marginLeft: 12,
  },
  challengeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  challengeDescription: {
    fontSize: 12,
    color: '#B0BEC5',
    marginTop: 2,
  },
  challengeTypeChip: {
    borderColor: '#FF9800',
    marginLeft: 8,
  },
  challengeTypeText: {
    fontSize: 10,
    color: '#fff',
  },
  challengeProgress: {
    marginTop: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#fff',
  },
  rewardText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  challengeProgressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2C3E50',
  },
  challengeDeadline: {
    fontSize: 11,
    color: '#FF9800',
    marginTop: 4,
  },
  completeButton: {
    marginTop: 8,
  },
  tournamentItem: {
    backgroundColor: '#0D1B2A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  tournamentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tournamentName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  tournamentTypeChip: {
    borderColor: '#2196F3',
    marginLeft: 8,
  },
  tournamentTypeText: {
    fontSize: 10,
    color: '#fff',
  },
  tournamentDetails: {
    gap: 4,
  },
  tournamentDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tournamentDetailText: {
    fontSize: 12,
    color: '#B0BEC5',
  },
  tournamentDescription: {
    fontSize: 12,
    color: '#B0BEC5',
    marginTop: 8,
  },
  registerButton: {
    marginTop: 8,
    borderColor: '#E74C3C',
  },
});

export default ProgressPage; 