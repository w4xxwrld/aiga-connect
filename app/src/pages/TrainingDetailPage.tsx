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
  Divider,
  Avatar,
  List,
  Dialog,
  Portal,
} from 'react-native-paper';
import { useAppContext } from '../context/AppContext';
import trainingService, { Training, Booking } from '../services/training';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface TrainingDetailPageProps {
  route: {
    params: {
      trainingId: string;
    };
  };
  navigation: any;
}

const TrainingDetailPage: React.FC<TrainingDetailPageProps> = ({ route, navigation }) => {
  const { user, userRole, linkedChildren } = useAppContext();
  const { trainingId } = route.params;
  
  const [training, setTraining] = useState<Training | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [childSelectionVisible, setChildSelectionVisible] = useState(false);
  const [userBooking, setUserBooking] = useState<Booking | null>(null);

  useEffect(() => {
    loadTrainingDetails();
  }, [trainingId]);

  const loadTrainingDetails = async () => {
    try {
      setLoading(true);
      const [trainingData, bookingsData] = await Promise.all([
        trainingService.getTraining(parseInt(trainingId)),
        trainingService.getTrainingBookings(parseInt(trainingId))
      ]);
      
      setTraining(trainingData);
      setBookings(bookingsData);
      
      // Check if current user has a booking
      if (user) {
        const existingBooking = bookingsData.find(b => 
          b.user_id === user.id || 
          (userRole === 'parent' && linkedChildren.some(child => child.child.id === b.athlete_id))
        );
        setUserBooking(existingBooking || null);
      }
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось загрузить детали тренировки');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrainingDetails();
    setRefreshing(false);
  };

  const handleBookTraining = async (athleteId?: number) => {
    if (!training || !user) return;

    try {
      setBookingLoading(true);
      
      const bookingData = {
        training_id: training.id,
        athlete_id: athleteId || user.id,
        notes: ''
      };

      await trainingService.createBooking(bookingData);
      Alert.alert('Успешно', 'Вы записались на тренировку!');
      await loadTrainingDetails();
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось записаться на тренировку');
    } finally {
      setBookingLoading(false);
      setChildSelectionVisible(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!userBooking) return;

    Alert.alert(
      'Отменить запись',
      'Вы уверены, что хотите отменить запись на эту тренировку?',
      [
        { text: 'Нет', style: 'cancel' },
        {
          text: 'Да',
          style: 'destructive',
          onPress: async () => {
            try {
              setBookingLoading(true);
              await trainingService.cancelBooking(userBooking.id);
              Alert.alert('Успешно', 'Запись отменена');
              await loadTrainingDetails();
            } catch (error: any) {
              Alert.alert('Ошибка', error.message || 'Не удалось отменить запись');
            } finally {
              setBookingLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleBookingAction = () => {
    if (userBooking) {
      handleCancelBooking();
    } else if (userRole === 'parent' && linkedChildren.length > 1) {
      setChildSelectionVisible(true);
    } else if (userRole === 'parent' && linkedChildren.length === 1) {
      handleBookTraining(linkedChildren[0].child.id);
    } else {
      handleBookTraining();
    }
  };

  const renderTrainingInfo = () => {
    if (!training) return null;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.trainingHeader}>
            <View style={styles.trainingTitleContainer}>
              <Title style={styles.trainingTitle}>{training.title}</Title>
              <View style={styles.trainingMeta}>
                <Chip 
                  mode="outlined" 
                  style={styles.typeChip}
                  textStyle={styles.chipText}
                >
                  {trainingService.getTrainingTypeDisplayName(training.training_type)}
                </Chip>
                <Chip 
                  mode="outlined" 
                  style={styles.levelChip}
                  textStyle={styles.chipText}
                >
                  {trainingService.getTrainingLevelDisplayName(training.level)}
                </Chip>
              </View>
            </View>
            <View style={styles.capacityInfo}>
              <Text style={styles.capacityText}>
                {training.capacity - (training.available_spots || 0)}/{training.capacity}
              </Text>
              <Text style={styles.capacityLabel}>записано</Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="clock" size={20} color="#E74C3C" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Время</Text>
                <Text style={styles.detailValue}>
                  {trainingService.formatDateTime(training.start_time)}
                </Text>
                <Text style={styles.detailSubValue}>
                  Длительность: {trainingService.calculateDuration(training.start_time, training.end_time)}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#E74C3C" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Место</Text>
                <Text style={styles.detailValue}>{training.location}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="account" size={20} color="#E74C3C" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Тренер</Text>
                <Text style={styles.detailValue}>{training.trainer?.full_name || 'Не указан'}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="target" size={20} color="#E74C3C" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Уровень</Text>
                <Text style={styles.detailValue}>
                  {trainingService.getAgeGroupDisplayName(training.age_group)} • {trainingService.getBeltLevelDisplayName(training.belt_level)}
                </Text>
              </View>
            </View>

            {training.price && (
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="currency-usd" size={20} color="#E74C3C" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Стоимость</Text>
                  <Text style={styles.detailValue}>{training.price} ₸</Text>
                </View>
              </View>
            )}
          </View>

          {training.description && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionTitle}>Описание</Text>
                <Text style={styles.descriptionText}>{training.description}</Text>
              </View>
            </>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderBookingButton = () => {
    if (!training || userRole === 'coach') return null;

    const isBookable = training.is_bookable && training.available_spots! > 0;
    const buttonText = userBooking 
      ? 'Отменить запись' 
      : isBookable 
        ? 'Записаться' 
        : training.available_spots === 0 
          ? 'Мест нет'
          : 'Недоступно';

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Button
            mode="contained"
            onPress={handleBookingAction}
            disabled={!isBookable && !userBooking}
            loading={bookingLoading}
            buttonColor={userBooking ? '#FF5722' : '#E74C3C'}
            style={styles.bookingButton}
          >
            {buttonText}
          </Button>
          
          {userBooking && (
            <View style={styles.bookingInfo}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.bookingInfoText}>
                Вы записаны на эту тренировку
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderParticipants = () => {
    if (userRole !== 'coach' || bookings.length === 0) return null;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Участники ({bookings.length})</Title>
          {bookings.map((booking) => (
            <List.Item
              key={booking.id}
              title={booking.athlete?.full_name || 'Неизвестный участник'}
              description={`Записан: ${trainingService.formatDateTime(booking.booking_date)}`}
              left={(props) => (
                <Avatar.Text 
                  {...props} 
                  size={40} 
                  label={(booking.athlete?.full_name || 'U').charAt(0)} 
                  style={styles.participantAvatar}
                />
              )}
              right={(props) => (
                <Chip 
                  mode="outlined" 
                  style={styles.statusChip}
                  textStyle={styles.chipText}
                >
                  {trainingService.getBookingStatusDisplayName(booking.status)}
                </Chip>
              )}
              style={styles.participantItem}
            />
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderChildSelectionDialog = () => (
    <Portal>
      <Dialog visible={childSelectionVisible} onDismiss={() => setChildSelectionVisible(false)}>
        <Dialog.Title>Выберите ребенка</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.dialogText}>
            Для кого записаться на тренировку?
          </Text>
          {linkedChildren.map((relationship) => (
            <Button
              key={relationship.child.id}
              mode="outlined"
              onPress={() => handleBookTraining(relationship.child.id)}
              style={styles.childSelectionButton}
              textColor="#fff"
            >
              {relationship.child.full_name || `Ребенок ${relationship.child.iin}`}
            </Button>
          ))}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setChildSelectionVisible(false)} textColor="#fff">
            Отмена
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
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
      {renderTrainingInfo()}
      {renderBookingButton()}
      {renderParticipants()}
      {renderChildSelectionDialog()}
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
  card: {
    backgroundColor: '#1B263B',
    margin: 16,
    marginBottom: 8,
  },
  trainingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  trainingTitleContainer: {
    flex: 1,
    paddingRight: 16,
  },
  trainingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  trainingMeta: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  typeChip: {
    borderColor: '#E74C3C',
  },
  levelChip: {
    borderColor: '#2196F3',
  },
  chipText: {
    fontSize: 12,
    color: '#fff',
  },
  capacityInfo: {
    alignItems: 'center',
  },
  capacityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E74C3C',
  },
  capacityLabel: {
    fontSize: 12,
    color: '#B0BEC5',
  },
  divider: {
    backgroundColor: '#2C3E50',
    marginVertical: 16,
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#B0BEC5',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  detailSubValue: {
    fontSize: 12,
    color: '#B0BEC5',
  },
  descriptionContainer: {
    marginTop: 16,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#B0BEC5',
    lineHeight: 20,
  },
  bookingButton: {
    paddingVertical: 8,
  },
  bookingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  bookingInfoText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  participantItem: {
    paddingHorizontal: 0,
  },
  participantAvatar: {
    backgroundColor: '#2C3E50',
  },
  statusChip: {
    borderColor: '#4CAF50',
  },
  dialogText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 16,
  },
  childSelectionButton: {
    marginVertical: 4,
    borderColor: '#E74C3C',
  },
});

export default TrainingDetailPage; 