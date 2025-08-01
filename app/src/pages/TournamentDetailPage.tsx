import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  Divider,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import tournamentsService, { Tournament } from '../services/tournaments';

interface TournamentDetailPageProps {
  navigation: any;
  route: {
    params: {
      tournamentId: number;
    };
  };
}

const TournamentDetailPage: React.FC<TournamentDetailPageProps> = ({ navigation, route }) => {
  const { tournamentId } = route.params;
  const { user, isSidebarOpen, setIsSidebarOpen } = useAppContext();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(true);

  useEffect(() => {
    fetchTournamentDetails();
  }, [tournamentId]);

  useEffect(() => {
    if (tournament && user?.primary_role === 'athlete') {
      checkRegistrationStatus();
    }
  }, [tournament, user]);

  const checkRegistrationStatus = async () => {
    if (!tournament || !user) return;
    
    try {
      setCheckingRegistration(true);
      const registered = await tournamentsService.isAthleteRegisteredForTournament(tournament.id, user.id);
      setIsRegistered(registered);
    } catch (error) {
      console.error('Error checking registration status:', error);
      setIsRegistered(false);
    } finally {
      setCheckingRegistration(false);
    }
  };

  const fetchTournamentDetails = async () => {
    try {
      setLoading(true);
      const tournamentData = await tournamentsService.getTournament(tournamentId);
      setTournament(tournamentData);
      
      // Check registration status if user is an athlete
      if (user?.primary_role === 'athlete') {
        checkRegistrationStatus();
      }
    } catch (error: any) {
      console.error('Error fetching tournament details:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить информацию о турнире');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user || !tournament) return;

    setRegistering(true);
    try {
      let athleteId = user.id;
      
      // If parent, use the first linked child
      if (user.primary_role === 'parent') {
        // For now, we'll show an alert that child linking needs to be implemented
        Alert.alert('Информация', 'Для родителей регистрация детей будет доступна после реализации связи с детьми');
        return;
      }
      
      if (!athleteId) {
        Alert.alert('Ошибка', 'Не удалось определить спортсмена для регистрации');
        return;
      }

      // Check if registration is still open
      if (tournament.registration_end && !tournamentsService.isRegistrationOpen(tournament.registration_end)) {
        Alert.alert('Ошибка', 'Регистрация на турнир уже закрыта');
        return;
      }
      
      // Check if tournament is full
      if (tournament.max_participants && tournament.current_participants >= tournament.max_participants) {
        Alert.alert('Ошибка', 'Турнир уже заполнен');
        return;
      }

      // Register for tournament
      await tournamentsService.registerForTournament(tournament.id, {
        athlete_id: athleteId,
        weight_category: 'Средний вес', // Default, could be made configurable
        belt_level: 'Белый пояс', // Default, could be made configurable
      });

      Alert.alert('Успех', 'Регистрация на турнир прошла успешно!');
      // Refresh tournament data and registration status
      fetchTournamentDetails();
      checkRegistrationStatus();
    } catch (error: any) {
      console.error('Error registering for tournament:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось зарегистрироваться на турнир');
    } finally {
      setRegistering(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return '#3498DB';
      case 'ongoing': return '#E74C3C';
      case 'completed': return '#27AE60';
      case 'cancelled': return '#95A5A6';
      default: return '#B0BEC5';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming': return 'Предстоящий';
      case 'ongoing': return 'Идет сейчас';
      case 'completed': return 'Завершен';
      case 'cancelled': return 'Отменен';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Layout title="Детали турнира" showBack={true} onBackPress={() => navigation.goBack()}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </Layout>
    );
  }

  if (!tournament) {
    return (
      <Layout title="Детали турнира" showBack={true} onBackPress={() => navigation.goBack()}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color="#E74C3C" />
          <Text style={styles.errorText}>Турнир не найден</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout 
      title="Детали турнира" 
      showBack={true} 
      onBackPress={() => navigation.goBack()}
      onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Tournament Header */}
        <Card style={styles.mainCard}>
          <Card.Content>
            <View style={styles.headerSection}>
              <Title style={styles.tournamentTitle}>{tournament.name}</Title>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tournament.status) }]}>
                <Text style={styles.statusText}>{getStatusText(tournament.status)}</Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            <Text style={styles.description}>{tournament.description}</Text>

            <Divider style={styles.divider} />

            {/* Tournament Details */}
            <View style={styles.detailsSection}>
              <Title style={styles.sectionTitle}>Информация о турнире</Title>
              
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="map-marker" size={20} color="#E74C3C" />
                <Text style={styles.detailLabel}>Место проведения:</Text>
                <Text style={styles.detailValue}>{tournament.location}</Text>
              </View>

              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="calendar" size={20} color="#E74C3C" />
                <Text style={styles.detailLabel}>Дата и время:</Text>
                <Text style={styles.detailValue}>{formatDate(tournament.event_date)}</Text>
              </View>

              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="trophy" size={20} color="#E74C3C" />
                <Text style={styles.detailLabel}>Уровень:</Text>
                <Text style={styles.detailValue}>
                  {tournamentsService.getTournamentLevelDisplayName(tournament.tournament_level)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="currency-usd" size={20} color="#E74C3C" />
                <Text style={styles.detailLabel}>Взнос:</Text>
                <Text style={styles.detailValue}>
                  {tournament.registration_fee ? tournamentsService.formatPrice(tournament.registration_fee) : 'Бесплатно'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="account-group" size={20} color="#E74C3C" />
                <Text style={styles.detailLabel}>Участники:</Text>
                <Text style={styles.detailValue}>
                  {tournament.current_participants || 0}/{tournament.max_participants || '∞'}
                </Text>
              </View>

              {tournament.organizer && (
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="account-tie" size={20} color="#E74C3C" />
                  <Text style={styles.detailLabel}>Организатор:</Text>
                  <Text style={styles.detailValue}>{tournament.organizer}</Text>
                </View>
              )}

              {tournament.contact_info && (
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="phone" size={20} color="#E74C3C" />
                  <Text style={styles.detailLabel}>Контакты:</Text>
                  <Text style={styles.detailValue}>{tournament.contact_info}</Text>
                </View>
              )}
            </View>

            {/* Categories */}
            {tournament.age_categories && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.categoriesSection}>
                  <Title style={styles.sectionTitle}>Возрастные категории</Title>
                  <View style={styles.categoriesContainer}>
                    {tournament.age_categories.split(',').map((category, index) => (
                      <Chip key={index} style={styles.categoryChip} textStyle={styles.categoryChipText}>
                        {category.trim()}
                      </Chip>
                    ))}
                  </View>
                </View>
              </>
            )}

            {tournament.weight_categories && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.categoriesSection}>
                  <Title style={styles.sectionTitle}>Весовая категория</Title>
                  <View style={styles.categoriesContainer}>
                    {tournament.weight_categories.split(',').map((category, index) => (
                      <Chip key={index} style={styles.categoryChip} textStyle={styles.categoryChipText}>
                        {category.trim()}
                      </Chip>
                    ))}
                  </View>
                </View>
              </>
            )}

            {tournament.belt_categories && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.categoriesSection}>
                  <Title style={styles.sectionTitle}>Категории по поясам</Title>
                  <View style={styles.categoriesContainer}>
                    {tournament.belt_categories.split(',').map((category, index) => (
                      <Chip key={index} style={styles.categoryChip} textStyle={styles.categoryChipText}>
                        {category.trim()}
                      </Chip>
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* Registration Dates */}
            {tournament.registration_start && tournament.registration_end && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.registrationSection}>
                  <Title style={styles.sectionTitle}>Регистрация</Title>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="calendar-plus" size={20} color="#E74C3C" />
                    <Text style={styles.detailLabel}>Начало регистрации:</Text>
                    <Text style={styles.detailValue}>{formatDate(tournament.registration_start)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="calendar-minus" size={20} color="#E74C3C" />
                    <Text style={styles.detailLabel}>Конец регистрации:</Text>
                    <Text style={styles.detailValue}>{formatDate(tournament.registration_end)}</Text>
                  </View>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Registration Status Info */}
        {tournament.status === 'upcoming' && user?.primary_role === 'athlete' && (
          <View style={styles.registrationStatusContainer}>
            {!checkingRegistration && isRegistered && (
              <Text style={styles.registrationStatusText}>
                ✅ Вы уже зарегистрированы на этот турнир
              </Text>
            )}
            {!checkingRegistration && !isRegistered && tournament.registration_end && !tournamentsService.isRegistrationOpen(tournament.registration_end) && (
              <Text style={styles.registrationStatusText}>
                ⏰ Регистрация закрыта
              </Text>
            )}
            {!checkingRegistration && !isRegistered && tournament.max_participants && tournament.current_participants >= tournament.max_participants && (
              <Text style={styles.registrationStatusText}>
                🚫 Турнир заполнен
              </Text>
            )}
            {!checkingRegistration && !isRegistered && (!tournament.registration_end || tournamentsService.isRegistrationOpen(tournament.registration_end)) &&
             (!tournament.max_participants || tournament.current_participants < tournament.max_participants) && (
              <Text style={styles.registrationStatusText}>
                ✅ Регистрация открыта
              </Text>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {tournament.status === 'upcoming' && 
           user?.primary_role === 'athlete' && 
           !isRegistered &&
           (!tournament.registration_end || tournamentsService.isRegistrationOpen(tournament.registration_end)) &&
           (!tournament.max_participants || tournament.current_participants < tournament.max_participants) && (
            <>
              {checkingRegistration ? (
                <Button
                  mode="contained"
                  disabled={true}
                  style={styles.registerButton}
                  buttonColor="#95A5A6"
                  icon="clock-outline"
                >
                  Проверка регистрации...
                </Button>
              ) : (
                <Button
                  mode="contained"
                  onPress={handleRegister}
                  loading={registering}
                  disabled={registering}
                  style={styles.registerButton}
                  buttonColor="#E74C3C"
                  icon="calendar-check"
                >
                  Зарегистрироваться
                </Button>
              )}
            </>
          )}
          
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            textColor="#E74C3C"
            icon="arrow-left"
          >
            Назад
          </Button>
        </View>
      </ScrollView>

      <Sidebar isVisible={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </Layout>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16,
  },
  mainCard: {
    backgroundColor: '#1B263B',
    borderRadius: 12,
    marginBottom: 16,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tournamentTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    backgroundColor: '#2C3E50',
    marginVertical: 16,
  },
  description: {
    color: '#B0BEC5',
    fontSize: 16,
    lineHeight: 24,
  },
  detailsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#E74C3C',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    color: '#B0BEC5',
    fontSize: 16,
    marginLeft: 8,
    marginRight: 8,
    minWidth: 120,
  },
  detailValue: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  categoriesSection: {
    marginBottom: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#2C3E50',
    marginBottom: 8,
  },
  categoryChipText: {
    color: '#fff',
  },
  registrationSection: {
    marginBottom: 16,
  },
  actionsContainer: {
    gap: 12,
  },
  registerButton: {
    marginTop: 8,
  },
  backButton: {
    marginTop: 4,
  },
  registrationStatusContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  registrationStatusText: {
    color: '#B0BEC5',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default TournamentDetailPage; 