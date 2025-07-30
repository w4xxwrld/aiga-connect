import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  Badge,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { useAppContext } from '../context/AppContext';
import bookingsService, { Booking } from '../services/bookings';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Layout from '../components/Layout';

interface BookingDetailPageProps {
  navigation: any;
  route: {
    params: {
      bookingId: number;
    };
  };
}

const BookingDetailPage: React.FC<BookingDetailPageProps> = ({ navigation, route }) => {
  const { user, userRole } = useAppContext();
  const { bookingId } = route.params;
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookingData();
  }, [bookingId]);

  const loadBookingData = async () => {
    try {
      setLoading(true);
      console.log('BookingDetailPage: Loading booking data for ID:', bookingId);
      const data = await bookingsService.getBooking(bookingId);
      console.log('BookingDetailPage: Booking data loaded:', data);
      setBooking(data);
    } catch (error: any) {
      console.error('BookingDetailPage: Error loading booking data:', error);
      console.error('BookingDetailPage: Error response:', error.response?.data);
      Alert.alert('Ошибка', 'Не удалось загрузить информацию о записи');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;

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
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Ошибка', error.message || 'Не удалось отменить запись');
            }
          }
        }
      ]
    );
  };

  const handleApproveBooking = async () => {
    if (!booking) return;

    Alert.alert(
      'Подтвердить запись',
      'Вы уверены, что хотите подтвердить эту запись?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Подтвердить',
          style: 'default',
          onPress: async () => {
            try {
              await bookingsService.approveBooking(booking.id);
              Alert.alert('Успех', 'Запись подтверждена');
              loadBookingData(); // Reload booking data
            } catch (error: any) {
              Alert.alert('Ошибка', error.message || 'Не удалось подтвердить запись');
            }
          }
        }
      ]
    );
  };

  const handleDeclineBooking = async () => {
    if (!booking) return;

    Alert.prompt(
      'Отклонить запись',
      'Укажите причину отклонения:',
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
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Ошибка', error.message || 'Не удалось отклонить запись');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const handleViewClass = () => {
    if (booking?.class_obj) {
      navigation.navigate('ClassDetail', { classId: booking.class_obj.id });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E74C3C" />
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Запись не найдена</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Назад
        </Button>
      </View>
    );
  }

  return (
    <Layout 
      title="Детали записи"
      showBack={true}
      onBackPress={() => navigation.goBack()}
    >

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.mainCard}>
          <Card.Content>
            <View style={styles.titleSection}>
              <Title style={styles.bookingTitle}>
                {booking.class_obj?.name || 'Занятие'}
              </Title>
              <Badge 
                style={[
                  styles.statusBadge, 
                  { backgroundColor: bookingsService.getStatusColor(booking.status) }
                ]}
              >
                {bookingsService.getStatusDisplayName(booking.status)}
              </Badge>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="calendar" size={20} color="#E74C3C" />
                <Text style={styles.infoLabel}>Дата занятия:</Text>
                <Text style={styles.infoValue}>
                  {bookingsService.formatDateTime(booking.class_date)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="bookmark" size={20} color="#E74C3C" />
                <Text style={styles.infoLabel}>Тип записи:</Text>
                <Text style={styles.infoValue}>
                  {bookingsService.getBookingTypeDisplayName(booking.booking_type)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="calendar-clock" size={20} color="#E74C3C" />
                <Text style={styles.infoLabel}>Дата записи:</Text>
                <Text style={styles.infoValue}>
                  {bookingsService.formatDateTime(booking.booking_date)}
                </Text>
              </View>

              {userRole === 'parent' && booking.athlete && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="account-child" size={20} color="#E74C3C" />
                  <Text style={styles.infoLabel}>Спортсмен:</Text>
                  <Text style={styles.infoValue}>
                    {booking.athlete.full_name}
                  </Text>
                </View>
              )}

              {booking.class_obj?.coach && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="account-tie" size={20} color="#E74C3C" />
                  <Text style={styles.infoLabel}>Тренер:</Text>
                  <Text style={styles.infoValue}>
                    {booking.class_obj.coach.full_name}
                  </Text>
                </View>
              )}

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="credit-card" size={20} color="#E74C3C" />
                <Text style={styles.infoLabel}>Оплата:</Text>
                <Text style={[styles.infoValue, { color: booking.is_paid ? '#4CAF50' : '#F44336' }]}>
                  {booking.is_paid ? 'Оплачено' : 'Не оплачено'}
                  {booking.payment_amount && ` (${booking.payment_amount} ₸)`}
                </Text>
              </View>

              {booking.notes && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="note-text" size={20} color="#E74C3C" />
                  <Text style={styles.infoLabel}>Заметки:</Text>
                  <Text style={styles.infoValue}>{booking.notes}</Text>
                </View>
              )}

              {booking.cancellation_reason && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="alert-circle" size={20} color="#F44336" />
                  <Text style={styles.infoLabel}>Причина отмены:</Text>
                  <Text style={[styles.infoValue, { color: '#F44336' }]}>
                    {booking.cancellation_reason}
                  </Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        <View style={styles.actionsContainer}>
          {booking.class_obj && (
            <Button
              mode="outlined"
              onPress={handleViewClass}
              style={styles.actionButton}
              textColor="#E74C3C"
              icon="information"
            >
              Информация о занятии
            </Button>
          )}

          {/* Coach actions for pending bookings */}
          {userRole === 'coach' && booking.status === 'pending' && (
            <>
              <Button
                mode="contained"
                onPress={handleApproveBooking}
                style={styles.approveButton}
                buttonColor="#4CAF50"
                icon="check"
              >
                Подтвердить
              </Button>
              <Button
                mode="contained"
                onPress={handleDeclineBooking}
                style={styles.declineButton}
                buttonColor="#F44336"
                icon="close"
              >
                Отклонить
              </Button>
            </>
          )}

          {/* User actions for pending bookings */}
          {booking.status === 'pending' && userRole !== 'coach' && (
            <Button
              mode="contained"
              onPress={handleCancelBooking}
              style={styles.cancelButton}
              buttonColor="#F44336"
              icon="close"
            >
              Отменить запись
            </Button>
          )}
        </View>
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  mainCard: {
    backgroundColor: '#1B263B',
    borderRadius: 12,
    marginBottom: 16,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  bookingTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
  },
  divider: {
    backgroundColor: '#2C3E50',
    marginVertical: 16,
  },
  infoSection: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabel: {
    color: '#B0BEC5',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  infoValue: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'right',
    flex: 1,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    marginTop: 8,
  },
  cancelButton: {
    marginTop: 8,
  },
  approveButton: {
    marginTop: 8,
  },
  declineButton: {
    marginTop: 8,
  },
});

export default BookingDetailPage; 