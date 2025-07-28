import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  Badge,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { useAppContext } from '../context/AppContext';
import bookingsService, { Booking } from '../services/bookings';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const BookingsPage: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { user, userRole } = useAppContext();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, selectedStatus]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const bookingsData = await bookingsService.getMyBookings();
      console.log('BookingsPage: Loaded bookings:', bookingsData);
      console.log('BookingsPage: User role:', userRole);
      console.log('BookingsPage: Pending bookings:', bookingsData.filter(b => b.status === 'pending'));
      setBookings(bookingsData);
    } catch (error: any) {
      console.error('Error loading bookings:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить записи');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const filterBookings = () => {
    if (selectedStatus === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter(booking => booking.status === selectedStatus));
    }
  };

  const handleCancelBooking = async (booking: Booking) => {
    Alert.alert(
      'Отменить запись',
      'Вы уверены, что хотите отменить эту запись?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Отменить',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingsService.cancelBooking(booking.id, 'Отменено пользователем');
              Alert.alert('Успех', 'Запись отменена');
              loadBookings(); // Reload bookings
            } catch (error: any) {
              Alert.alert('Ошибка', error.message || 'Не удалось отменить запись');
            }
          }
        }
      ]
    );
  };

  const handleBookingPress = (booking: Booking) => {
    navigation?.navigate('BookingDetail', { bookingId: booking.id });
  };

  const handleQuickApprove = async (booking: Booking) => {
    Alert.alert(
      'Подтвердить запись',
      `Подтвердить запись ${booking.athlete?.full_name || 'спортсмена'} на занятие "${booking.class_obj?.name}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Подтвердить',
          style: 'default',
          onPress: async () => {
            try {
              await bookingsService.approveBooking(booking.id);
              Alert.alert('Успех', 'Запись подтверждена');
              loadBookings(); // Reload bookings
            } catch (error: any) {
              Alert.alert('Ошибка', error.message || 'Не удалось подтвердить запись');
            }
          }
        }
      ]
    );
  };

  const handleQuickDecline = async (booking: Booking) => {
    Alert.prompt(
      'Отклонить запись',
      `Укажите причину отклонения записи ${booking.athlete?.full_name || 'спортсмена'}:`,
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
              await bookingsService.declineBooking(booking.id, reason.trim());
              Alert.alert('Успех', 'Запись отклонена');
              loadBookings(); // Reload bookings
            } catch (error: any) {
              Alert.alert('Ошибка', error.message || 'Не удалось отклонить запись');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const renderBookingCard = (booking: Booking) => {
    console.log('BookingsPage: Rendering booking:', booking.id, 'Status:', booking.status, 'UserRole:', userRole);
    console.log('BookingsPage: Should show coach actions:', userRole === 'coach' && booking.status === 'pending');
    
    return (
    <Card key={booking.id} style={styles.bookingCard} onPress={() => handleBookingPress(booking)}>
      <Card.Content>
        <View style={styles.bookingHeader}>
          <View style={styles.bookingInfo}>
            <Title style={styles.bookingTitle}>
              {booking.class_obj?.name || 'Занятие'}
            </Title>
            <Text style={styles.bookingDate}>
              {bookingsService.formatDate(booking.class_date)}
            </Text>
            <Text style={styles.bookingType}>
              {bookingsService.getBookingTypeDisplayName(booking.booking_type)}
            </Text>
          </View>
          <View style={styles.bookingMeta}>
            <Badge 
              style={[
                styles.statusBadge, 
                { backgroundColor: bookingsService.getStatusColor(booking.status) }
              ]}
            >
              {bookingsService.getStatusDisplayName(booking.status)}
            </Badge>
            {booking.is_paid && (
              <Badge style={[styles.statusBadge, { backgroundColor: '#4CAF50' }]}>
                Оплачено
              </Badge>
            )}
          </View>
        </View>

        <View style={styles.bookingDetails}>
          {userRole === 'parent' && booking.athlete && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="account-child" size={16} color="#E74C3C" />
              <Text style={styles.detailText}>
                Спортсмен: {booking.athlete.full_name}
              </Text>
            </View>
          )}

          {userRole === 'coach' && booking.athlete && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="account-child" size={16} color="#E74C3C" />
              <Text style={styles.detailText}>
                Спортсмен: {booking.athlete.full_name}
              </Text>
            </View>
          )}

          {userRole === 'coach' && booking.booked_by_parent && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="account" size={16} color="#E74C3C" />
              <Text style={styles.detailText}>
                Забронировал: {booking.booked_by_parent.full_name}
              </Text>
            </View>
          )}

          {booking.class_obj?.coach && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="account-tie" size={16} color="#E74C3C" />
              <Text style={styles.detailText}>
                Тренер: {booking.class_obj.coach.full_name}
              </Text>
            </View>
          )}

          {booking.payment_amount && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="currency-usd" size={16} color="#E74C3C" />
              <Text style={styles.detailText}>
                Сумма: {booking.payment_amount} ₸
              </Text>
            </View>
          )}

          {booking.notes && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="note-text" size={16} color="#E74C3C" />
              <Text style={styles.detailText} numberOfLines={2}>
                Заметки: {booking.notes}
              </Text>
            </View>
          )}

          {booking.cancellation_reason && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="alert-circle" size={16} color="#F44336" />
              <Text style={[styles.detailText, { color: '#F44336' }]}>
                Причина отмены: {booking.cancellation_reason}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bookingActions}>
          <Button
            mode="outlined"
            onPress={() => handleBookingPress(booking)}
            style={styles.actionButton}
            textColor="#E74C3C"
          >
            Подробнее
          </Button>
          
          {/* Coach quick actions for pending bookings */}
          {userRole === 'coach' && booking.status === 'pending' && (
            <>
              <Button
                mode="contained"
                onPress={() => handleQuickApprove(booking)}
                style={[styles.actionButton, styles.quickApproveButton]}
                buttonColor="#4CAF50"
                icon="check"
                compact
              >
                ✓
              </Button>
              <Button
                mode="contained"
                onPress={() => handleQuickDecline(booking)}
                style={[styles.actionButton, styles.quickDeclineButton]}
                buttonColor="#F44336"
                icon="close"
                compact
              >
                ✗
              </Button>
            </>
          )}
          
          {/* User cancel action for pending bookings */}
          {booking.status === 'pending' && userRole !== 'coach' && (
            <Button
              mode="contained"
              onPress={() => handleCancelBooking(booking)}
              style={[styles.actionButton, styles.cancelButton]}
              buttonColor="#F44336"
            >
              Отменить
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const getStatusCount = (status: string) => {
  return bookings.filter(booking => booking.status === status).length;
};

if (loading) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#E74C3C" />
      <Text style={styles.loadingText}>Загрузка записей...</Text>
    </View>
  );
}

return (
  <View style={styles.container}>
    <StatusBar barStyle="light-content" backgroundColor="#0D1B2A" />
    
    <View style={styles.actionHeader}>
      <Button
        mode="contained"
        onPress={() => navigation?.navigate('Classes')}
        buttonColor="#E74C3C"
        icon="plus"
      >
        {userRole === 'coach' ? 'Управление' : 'Записаться'}
      </Button>
      
      {/* Individual Training Request buttons */}
      {(userRole === 'athlete' || userRole === 'parent') && (
        <Button
          mode="outlined"
          onPress={() => navigation?.navigate('RequestIndividualTraining')}
          style={styles.individualTrainingButton}
          textColor="#E74C3C"
          icon="account-star"
        >
          Индивидуальная тренировка
        </Button>
      )}
      
      {userRole === 'coach' && (
        <Button
          mode="outlined"
          onPress={() => navigation?.navigate('IndividualTrainingRequests')}
          style={styles.individualTrainingButton}
          textColor="#E74C3C"
          icon="account-star"
        >
          Индивидуальные запросы
        </Button>
      )}
    </View>

    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{bookings.length}</Text>
        <Text style={styles.statLabel}>{userRole === 'coach' ? 'Всего записей' : 'Всего'}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{getStatusCount('confirmed')}</Text>
        <Text style={styles.statLabel}>Подтверждено</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{getStatusCount('pending')}</Text>
        <Text style={styles.statLabel}>{userRole === 'coach' ? 'Ожидает решения' : 'Ожидает'}</Text>
      </View>
    </View>

    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Chip
          selected={selectedStatus === 'all'}
          onPress={() => setSelectedStatus('all')}
          style={styles.filterChip}
          textStyle={styles.filterChipText}
        >
          Все ({bookings.length})
        </Chip>
        <Chip
          selected={selectedStatus === 'pending'}
          onPress={() => setSelectedStatus('pending')}
          style={styles.filterChip}
          textStyle={styles.filterChipText}
        >
          Ожидает ({getStatusCount('pending')})
        </Chip>
        <Chip
          selected={selectedStatus === 'confirmed'}
          onPress={() => setSelectedStatus('confirmed')}
          style={styles.filterChip}
          textStyle={styles.filterChipText}
        >
          Подтверждено ({getStatusCount('confirmed')})
        </Chip>
        <Chip
          selected={selectedStatus === 'completed'}
          onPress={() => setSelectedStatus('completed')}
          style={styles.filterChip}
          textStyle={styles.filterChipText}
        >
          Завершено ({getStatusCount('completed')})
        </Chip>
        <Chip
          selected={selectedStatus === 'cancelled'}
          onPress={() => setSelectedStatus('cancelled')}
          style={styles.filterChip}
          textStyle={styles.filterChipText}
        >
          Отменено ({getStatusCount('cancelled')})
        </Chip>
      </ScrollView>
    </View>

    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {filteredBookings.length > 0 ? (
        filteredBookings.map(renderBookingCard)
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="calendar-remove" size={48} color="#B0BEC5" />
          <Text style={styles.emptyStateText}>
            {selectedStatus !== 'all' 
              ? 'Записи не найдены' 
              : userRole === 'coach' 
                ? 'У вас пока нет записей на ваши занятия'
                : 'У вас пока нет записей на занятия'}
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation?.navigate('Classes')}
            style={styles.emptyStateButton}
            buttonColor="#E74C3C"
          >
            Записаться на занятие
          </Button>
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
  globalHeader: {
    backgroundColor: '#0D1B2A',
    paddingTop: 56, // Safe area for status bar
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
    zIndex: 1000,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
  },
  individualTrainingButton: {
    marginLeft: 8,
    minWidth: 180, // Adjust as needed
  },

  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1B263B',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statNumber: {
    color: '#E74C3C',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#B0BEC5',
    fontSize: 12,
    marginTop: 4,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: '#1B263B',
  },
  filterChipText: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  bookingCard: {
    backgroundColor: '#1B263B',
    marginBottom: 16,
    borderRadius: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookingDate: {
    color: '#E74C3C',
    fontSize: 14,
    marginBottom: 2,
  },
  bookingType: {
    color: '#B0BEC5',
    fontSize: 12,
  },
  bookingMeta: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    marginBottom: 4,
  },
  bookingDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  detailText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  cancelButton: {
    marginLeft: 8,
  },
  quickApproveButton: {
    marginLeft: 4,
    minWidth: 40,
  },
  quickDeclineButton: {
    marginLeft: 4,
    minWidth: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    color: '#B0BEC5',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyStateButton: {
    marginTop: 8,
  },
});

export default BookingsPage; 