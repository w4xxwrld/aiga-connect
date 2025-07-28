import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  Badge,
  ActivityIndicator,
  Divider,
  TextInput,
} from 'react-native-paper';
import { useAppContext } from '../context/AppContext';
import bookingsService, { IndividualTrainingRequest, IndividualTrainingRequestUpdate } from '../services/bookings';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface IndividualTrainingRequestsPageProps {
  navigation: any;
}

const IndividualTrainingRequestsPage: React.FC<IndividualTrainingRequestsPageProps> = ({ navigation }) => {
  const { user, userRole } = useAppContext();
  
  const [requests, setRequests] = useState<IndividualTrainingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [filteredRequests, setFilteredRequests] = useState<IndividualTrainingRequest[]>([]);

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, selectedStatus]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const requestsData = await bookingsService.getMyIndividualTrainingRequests();
      setRequests(requestsData);
    } catch (error: any) {
      console.error('Error loading individual training requests:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить запросы на индивидуальные тренировки');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const filterRequests = () => {
    if (selectedStatus === 'all') {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter(request => request.status === selectedStatus));
    }
  };

  const handleAcceptRequest = async (request: IndividualTrainingRequest) => {
    Alert.prompt(
      'Принять запрос',
      `Принять запрос от ${request.athlete?.full_name || 'спортсмена'} на ${bookingsService.formatDate(request.requested_date)}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Принять',
          style: 'default',
          onPress: async () => {
            try {
              const updateData: IndividualTrainingRequestUpdate = {
                scheduled_date: request.requested_date,
                scheduled_time_start: request.preferred_time_start,
                scheduled_time_end: request.preferred_time_end,
                payment_amount: 5000, // Default payment amount
                is_paid: false,
              };
              
              await bookingsService.acceptIndividualTrainingRequest(request.id, updateData);
              Alert.alert('Успех', 'Запрос принят');
              loadRequests(); // Reload requests
            } catch (error: any) {
              Alert.alert('Ошибка', error.message || 'Не удалось принять запрос');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const handleDeclineRequest = async (request: IndividualTrainingRequest) => {
    Alert.prompt(
      'Отклонить запрос',
      `Укажите причину отклонения запроса от ${request.athlete?.full_name || 'спортсмена'}:`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Отклонить',
          style: 'destructive',
          onPress: async (reason) => {
            if (!reason || reason.trim() === '') {
              Alert.alert('Ошибка', 'Пожалуйста, укажите причину отклонения');
              return;
            }
            try {
              await bookingsService.declineIndividualTrainingRequest(request.id, reason.trim());
              Alert.alert('Успех', 'Запрос отклонен');
              loadRequests(); // Reload requests
            } catch (error: any) {
              Alert.alert('Ошибка', error.message || 'Не удалось отклонить запрос');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const handleCompleteRequest = async (request: IndividualTrainingRequest) => {
    Alert.alert(
      'Завершить тренировку',
      `Завершить индивидуальную тренировку с ${request.athlete?.full_name || 'спортсменом'}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Завершить',
          style: 'default',
          onPress: async () => {
            try {
              await bookingsService.completeIndividualTrainingRequest(request.id);
              Alert.alert('Успех', 'Тренировка завершена');
              loadRequests(); // Reload requests
            } catch (error: any) {
              Alert.alert('Ошибка', error.message || 'Не удалось завершить тренировку');
            }
          }
        }
      ]
    );
  };

  const handleRequestPress = (request: IndividualTrainingRequest) => {
    // TODO: Navigate to detailed view
    Alert.alert('Детали запроса', `Запрос от ${request.athlete?.full_name || 'спортсмена'}`);
  };

  const getStatusCount = (status: string) => {
    return requests.filter(request => request.status === status).length;
  };

  const renderRequestCard = (request: IndividualTrainingRequest) => (
    <Card key={request.id} style={styles.requestCard} onPress={() => handleRequestPress(request)}>
      <Card.Content>
        <View style={styles.requestHeader}>
          <View style={styles.requestInfo}>
            <Title style={styles.requestTitle}>
              {request.athlete?.full_name || 'Спортсмен'}
            </Title>
            <Text style={styles.requestDate}>
              {bookingsService.formatDate(request.requested_date)}
            </Text>
            {request.preferred_time_start && request.preferred_time_end && (
              <Text style={styles.requestTime}>
                {request.preferred_time_start} - {request.preferred_time_end}
              </Text>
            )}
          </View>
          <View style={styles.requestMeta}>
            <Badge 
              style={[
                styles.statusBadge, 
                { backgroundColor: bookingsService.getIndividualTrainingStatusColor(request.status) }
              ]}
            >
              {bookingsService.getIndividualTrainingStatusDisplayName(request.status)}
            </Badge>
            {request.is_paid && (
              <Badge style={[styles.statusBadge, { backgroundColor: '#4CAF50' }]}>
                Оплачено
              </Badge>
            )}
          </View>
        </View>

        <View style={styles.requestDetails}>
          {request.requested_by_parent && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="account" size={16} color="#E74C3C" />
              <Text style={styles.detailText}>
                Забронировал: {request.requested_by_parent.full_name}
              </Text>
            </View>
          )}

          {request.athlete_notes && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="note-text" size={16} color="#E74C3C" />
              <Text style={styles.detailText} numberOfLines={2}>
                Заметки: {request.athlete_notes}
              </Text>
            </View>
          )}

          {request.coach_notes && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="account-tie" size={16} color="#E74C3C" />
              <Text style={styles.detailText} numberOfLines={2}>
                Заметки тренера: {request.coach_notes}
              </Text>
            </View>
          )}

          {request.decline_reason && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="alert-circle" size={16} color="#F44336" />
              <Text style={[styles.detailText, { color: '#F44336' }]}>
                Причина отклонения: {request.decline_reason}
              </Text>
            </View>
          )}

          {request.scheduled_date && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="calendar-check" size={16} color="#4CAF50" />
              <Text style={styles.detailText}>
                Назначено: {bookingsService.formatDate(request.scheduled_date)}
                {request.scheduled_time_start && ` ${request.scheduled_time_start}-${request.scheduled_time_end}`}
              </Text>
            </View>
          )}

          {request.payment_amount && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="currency-usd" size={16} color="#E74C3C" />
              <Text style={styles.detailText}>
                Сумма: {request.payment_amount} ₸
              </Text>
            </View>
          )}
        </View>

        <View style={styles.requestActions}>
          <Button
            mode="outlined"
            onPress={() => handleRequestPress(request)}
            style={styles.actionButton}
            textColor="#E74C3C"
          >
            Подробнее
          </Button>
          
          {/* Coach actions based on status */}
          {request.status === 'pending' && (
            <>
              <Button
                mode="contained"
                onPress={() => handleAcceptRequest(request)}
                style={[styles.actionButton, styles.acceptButton]}
                buttonColor="#4CAF50"
                icon="check"
              >
                Принять
              </Button>
              <Button
                mode="contained"
                onPress={() => handleDeclineRequest(request)}
                style={[styles.actionButton, styles.declineButton]}
                buttonColor="#F44336"
                icon="close"
              >
                Отклонить
              </Button>
            </>
          )}

          {request.status === 'accepted' && (
            <Button
              mode="contained"
              onPress={() => handleCompleteRequest(request)}
              style={[styles.actionButton, styles.completeButton]}
              buttonColor="#2196F3"
              icon="flag-checkered"
            >
              Завершить
            </Button>
          )}
        </View>
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1B2A" />
      
      <View style={styles.header}>
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          textColor="#E74C3C"
          icon="arrow-left"
          style={styles.backButton}
        >
          Назад
        </Button>
        <Title style={styles.headerTitle}>Индивидуальные тренировки</Title>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{requests.length}</Text>
            <Text style={styles.statLabel}>Всего запросов</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{getStatusCount('accepted')}</Text>
            <Text style={styles.statLabel}>Принято</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{getStatusCount('pending')}</Text>
            <Text style={styles.statLabel}>Ожидает решения</Text>
          </View>
        </View>

        {/* Filter */}
        <View style={styles.filterContainer}>
          <Button
            mode={selectedStatus === 'all' ? 'contained' : 'outlined'}
            onPress={() => setSelectedStatus('all')}
            style={styles.filterButton}
            buttonColor="#E74C3C"
          >
            Все
          </Button>
          <Button
            mode={selectedStatus === 'pending' ? 'contained' : 'outlined'}
            onPress={() => setSelectedStatus('pending')}
            style={styles.filterButton}
            buttonColor="#E74C3C"
          >
            Ожидающие
          </Button>
          <Button
            mode={selectedStatus === 'accepted' ? 'contained' : 'outlined'}
            onPress={() => setSelectedStatus('accepted')}
            style={styles.filterButton}
            buttonColor="#E74C3C"
          >
            Принятые
          </Button>
        </View>

        {/* Requests List */}
        {filteredRequests.length > 0 ? (
          filteredRequests.map(renderRequestCard)
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-question" size={64} color="#E74C3C" />
            <Text style={styles.emptyStateText}>
              {selectedStatus !== 'all' 
                ? 'Запросы не найдены' 
                : 'У вас пока нет запросов на индивидуальные тренировки'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#0D1B2A',
  },
  backButton: {
    marginRight: 8,
  },
  headerTitle: {
    color: '#E74C3C',
    fontSize: 20,
    fontWeight: 'bold',
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
    color: '#E74C3C',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1B263B',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E74C3C',
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
  },
  requestCard: {
    backgroundColor: '#1B263B',
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestTitle: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: 'bold',
  },
  requestDate: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 4,
  },
  requestTime: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 2,
  },
  requestMeta: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    marginBottom: 4,
  },
  requestDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  acceptButton: {
    marginLeft: 4,
  },
  declineButton: {
    marginLeft: 4,
  },
  completeButton: {
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    color: '#E74C3C',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default IndividualTrainingRequestsPage; 