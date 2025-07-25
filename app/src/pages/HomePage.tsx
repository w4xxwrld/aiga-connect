import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { useAppContext } from '../context/AppContext';
import trainingService, { Training } from '../services/training';
import progressService, { Tournament } from '../services/progress';
import merchandiseService, { MerchandiseItem } from '../services/merchandise';
import communityService from '../services/community';
import notificationService from '../services/notifications';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const HomePage: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { user, userRole, linkedChildren } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upcomingTrainings, setUpcomingTrainings] = useState<Training[]>([]);
  const [upcomingTournaments, setUpcomingTournaments] = useState<Tournament[]>([]);
  const [featuredMerchandise, setFeaturedMerchandise] = useState<MerchandiseItem[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      const [trainings, tournaments, merchandise, unreadCount] = await Promise.all([
        trainingService.getUpcomingTrainings(5),
        progressService.getUpcomingTournaments(),
        merchandiseService.getFeaturedMerchandise(),
        notificationService.getUnreadCount()
      ]);
      
      setUpcomingTrainings(trainings);
      setUpcomingTournaments(tournaments);
      setFeaturedMerchandise(merchandise.slice(0, 3)); // Show top 3 featured items
      setUnreadNotifications(unreadCount);
    } catch (error: any) {
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

  const handleNavigateToMerchandise = () => {
    // Navigate to MerchandisePage
    if (navigation) {
      navigation.navigate('MerchandiseStore');
    } else {
      Alert.alert('Магазин', 'Функция магазина будет доступна в следующем обновлении');
    }
  };

  const handleAddToCart = (item: MerchandiseItem) => {
    merchandiseService.addToCart(item);
    Alert.alert('Успешно', `${item.name} добавлен в корзину!`);
  };

  const renderWelcomeSection = () => (
    <Card style={styles.welcomeCard}>
      <Card.Content>
        <View style={styles.welcomeHeader}>
          <View>
            <Title style={styles.welcomeTitle}>
              Добро пожаловать{user?.full_name ? `, ${user.full_name}` : ''}!
            </Title>
            <Text style={styles.welcomeSubtitle}>
              {userRole === 'parent' && 'Управляйте тренировками ваших детей'}
              {userRole === 'athlete' && 'Отслеживайте свой прогресс'}
              {userRole === 'coach' && 'Управляйте тренировками и учениками'}
            </Text>
          </View>
          {unreadNotifications > 0 && (
            <Button
              mode="text"
              onPress={() => navigation?.navigate('SettingsTab', { screen: 'Notifications' })}
              style={styles.notificationButton}
            >
              <View style={styles.notificationBadge}>
                <MaterialCommunityIcons name="bell" size={24} color="#E74C3C" />
                <View style={styles.notificationCountBadge}>
                  <Text style={styles.notificationCount}>{unreadNotifications}</Text>
                </View>
              </View>
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const renderQuickStats = () => {
    if (userRole === 'coach') return null;

    return (
      <Card style={styles.statsCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Быстрая статистика</Title>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="calendar-check" size={32} color="#4CAF50" />
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Тренировок</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="trophy" size={32} color="#FFD700" />
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Достижений</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="fire" size={32} color="#FF9800" />
              <Text style={styles.statValue}>5</Text>
              <Text style={styles.statLabel}>Дней подряд</Text>
            </View>
            {userRole === 'parent' && (
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="account-group" size={32} color="#2196F3" />
                <Text style={styles.statValue}>{linkedChildren.length}</Text>
                <Text style={styles.statLabel}>Детей</Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderUpcomingTrainings = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Ближайшие тренировки</Title>
          <Button 
            mode="text" 
            textColor="#E74C3C"
            onPress={() => navigation?.navigate('ScheduleTab', { screen: 'ScheduleMain' })}
          >
            Все
          </Button>
        </View>
        
        {upcomingTrainings.length === 0 ? (
          <Text style={styles.emptyText}>Нет запланированных тренировок</Text>
        ) : (
          upcomingTrainings.slice(0, 3).map((training) => (
            <View key={training.id} style={styles.trainingItem}>
              <View style={styles.trainingInfo}>
                <Text style={styles.trainingTitle}>{training.title}</Text>
                <Text style={styles.trainingDetails}>
                  {trainingService.formatDateTime(training.start_time)}
                </Text>
                <Text style={styles.trainingLocation}>{training.location}</Text>
              </View>
              <View style={styles.trainingMeta}>
                <Chip 
                  mode="outlined" 
                  style={styles.trainingChip}
                  textStyle={styles.trainingChipText}
                >
                  {trainingService.getTrainingTypeDisplayName(training.training_type)}
                </Chip>
                <Text style={styles.availableSpots}>
                  {training.available_spots}/{training.capacity}
                </Text>
              </View>
            </View>
          ))
        )}
      </Card.Content>
    </Card>
  );

  const renderUpcomingTournaments = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Предстоящие турниры</Title>
          <Button 
            mode="text" 
            textColor="#E74C3C"
            onPress={() => navigation?.navigate('ProgressTab', { screen: 'ProgressMain' })}
          >
            Все
          </Button>
        </View>
        
        {upcomingTournaments.length === 0 ? (
          <Text style={styles.emptyText}>Нет запланированных турниров</Text>
        ) : (
          upcomingTournaments.slice(0, 2).map((tournament) => (
            <View key={tournament.id} style={styles.tournamentItem}>
              <View style={styles.tournamentInfo}>
                <Text style={styles.tournamentTitle}>{tournament.name}</Text>
                <Text style={styles.tournamentDate}>
                  {progressService.formatDate(tournament.date)}
                </Text>
                <Text style={styles.tournamentLocation}>{tournament.location}</Text>
              </View>
              <Chip 
                mode="outlined" 
                style={styles.tournamentChip}
                textStyle={styles.tournamentChipText}
              >
                {progressService.getTournamentTypeDisplayName(tournament.type)}
              </Chip>
            </View>
          ))
        )}
      </Card.Content>
    </Card>
  );

  const renderFeaturedMerchandise = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>🛒 Магазин AIGA</Title>
          <Button 
            mode="text" 
            textColor="#E74C3C"
            onPress={handleNavigateToMerchandise}
          >
            Все товары
          </Button>
        </View>
        
        <Text style={styles.shopSubtitle}>Экипировка и мерч для грэпплинга</Text>
        
        {featuredMerchandise.length === 0 ? (
          <Text style={styles.emptyText}>Загрузка товаров...</Text>
        ) : (
          featuredMerchandise.map((item) => (
            <View key={item.id} style={styles.merchandiseItem}>
              <View style={styles.merchandiseInfo}>
                <Text style={styles.merchandiseTitle}>{item.name}</Text>
                <Text style={styles.merchandiseDescription} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.merchandiseMeta}>
                  <Text style={styles.merchandisePrice}>
                    {merchandiseService.formatPrice(item.price)}
                  </Text>
                  <View style={styles.merchandiseRating}>
                    <MaterialCommunityIcons name="star" size={14} color="#FFD700" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.merchandiseActions}>
                {item.is_featured && (
                  <Chip 
                    mode="flat" 
                    style={styles.featuredChip}
                    textStyle={styles.featuredChipText}
                  >
                    Хит
                  </Chip>
                )}
                <Button
                  mode="contained"
                  onPress={() => handleAddToCart(item)}
                  disabled={!item.in_stock}
                  style={styles.addToCartButton}
                  buttonColor="#E74C3C"
                  compact
                >
                  {item.in_stock ? 'В корзину' : 'Нет в наличии'}
                </Button>
              </View>
            </View>
          ))
        )}
        
        <Button
          mode="outlined"
          onPress={handleNavigateToMerchandise}
          style={styles.shopButton}
          textColor="#E74C3C"
        >
          Открыть магазин
        </Button>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E74C3C" />
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {renderWelcomeSection()}
      {renderQuickStats()}
      {renderUpcomingTrainings()}
      {renderUpcomingTournaments()}
      {renderFeaturedMerchandise()}
    </ScrollView>
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
  welcomeCard: {
    backgroundColor: '#1B263B',
    margin: 16,
    marginBottom: 8,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  notificationButton: {
    padding: 0,
    margin: 0,
    minWidth: 0,
  },
  notificationBadge: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCount: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  statsCard: {
    backgroundColor: '#1B263B',
    margin: 16,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    minWidth: '22%',
    marginVertical: 8,
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
  },
  sectionCard: {
    backgroundColor: '#1B263B',
    margin: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyText: {
    fontSize: 14,
    color: '#B0BEC5',
    textAlign: 'center',
    paddingVertical: 16,
  },
  
  // Training styles
  trainingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
  },
  trainingInfo: {
    flex: 1,
  },
  trainingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  trainingDetails: {
    fontSize: 12,
    color: '#B0BEC5',
    marginBottom: 2,
  },
  trainingLocation: {
    fontSize: 12,
    color: '#B0BEC5',
  },
  trainingMeta: {
    alignItems: 'flex-end',
  },
  trainingChip: {
    borderColor: '#E74C3C',
    marginBottom: 4,
  },
  trainingChipText: {
    fontSize: 10,
    color: '#fff',
  },
  availableSpots: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  
  // Tournament styles
  tournamentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
  },
  tournamentInfo: {
    flex: 1,
  },
  tournamentTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  tournamentDate: {
    fontSize: 12,
    color: '#E74C3C',
    marginBottom: 2,
  },
  tournamentLocation: {
    fontSize: 12,
    color: '#B0BEC5',
  },
  tournamentChip: {
    borderColor: '#2196F3',
  },
  tournamentChipText: {
    fontSize: 10,
    color: '#fff',
  },
  
  // Merchandise styles
  shopSubtitle: {
    fontSize: 13,
    color: '#B0BEC5',
    marginBottom: 12,
  },
  merchandiseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
  },
  merchandiseInfo: {
    flex: 1,
    paddingRight: 12,
  },
  merchandiseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  merchandiseDescription: {
    fontSize: 12,
    color: '#B0BEC5',
    marginBottom: 6,
  },
  merchandiseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  merchandisePrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E74C3C',
  },
  merchandiseRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#B0BEC5',
  },
  merchandiseActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  featuredChip: {
    backgroundColor: '#FF9800',
  },
  featuredChipText: {
    fontSize: 9,
    color: '#fff',
  },
  addToCartButton: {
    minWidth: 80,
  },
  shopButton: {
    marginTop: 12,
    borderColor: '#E74C3C',
  },
});

export default HomePage; 