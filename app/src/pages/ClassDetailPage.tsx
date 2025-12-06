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
import classesService, { Class } from '../services/classes';
import attendanceService from '../services/attendance';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Layout from '../components/Layout';

interface ClassDetailPageProps {
  navigation: any;
  route: {
    params: {
      classId: number;
    };
  };
}

interface ClassParticipant {
  id: number; // Booking ID (unique)
  athlete_id: number; // User/Athlete ID
  first_name: string;
  last_name: string;
  birth_date: string;
  booking_status: string;
  class_date: string;
  is_paid: boolean;
  payment_amount?: number;
  notes?: string;
}

const ClassDetailPage: React.FC<ClassDetailPageProps> = ({ navigation, route }) => {
  const { userRole, user } = useAppContext();
  const { classId } = route.params;
  
  const [classData, setClassData] = useState<Class | null>(null);
  const [participants, setParticipants] = useState<ClassParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClassData();
  }, [classId]);

  const loadClassData = async () => {
    try {
      setLoading(true);
      const data = await classesService.getClass(classId);
      setClassData(data);

      // Load participants if user is a coach (filter by today's date)
      if (userRole === 'coach' && data.coach_id === user?.id) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const participantsData = await classesService.getClassParticipants(classId, today);
          setParticipants(participantsData);
        } catch (error) {
          console.error('Error loading participants:', error);
        }
      }
    } catch (error: any) {
      console.error('Error loading class data:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить информацию о занятии');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleBookClass = () => {
    navigation.navigate('BookClass', { classId });
  };

  const handleEditClass = () => {
    navigation.navigate('EditClass', { classId });
  };

  const handleMarkAttendance = () => {
    navigation.navigate('AttendanceScanner');
  };

  const handleViewAttendance = () => {
    navigation.navigate('ClassAttendanceReport', { classId });
  };

  const isClassHappeningNow = (): boolean => {
    if (!classData) return false;

    const now = new Date();
    const currentDay = now.toLocaleDateString('ru-RU', { weekday: 'long' });

    // Check if today is a class day
    if (!classData.days_of_week.includes(currentDay)) {
      return false;
    }

    // Check if within time window (30 minutes before to 30 minutes after)
    const [classHour, classMinute] = classData.start_time.split(':').map(Number);
    const classStartTime = new Date();
    classStartTime.setHours(classHour, classMinute, 0, 0);

    const timeDiff = (classStartTime.getTime() - now.getTime()) / (1000 * 60);

    return timeDiff >= -30 && timeDiff <= 30;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E74C3C" />
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  if (!classData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Занятие не найдено</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} textColor="#fff">
          Назад
        </Button>
      </View>
    );
  }

  const calculateAge = (birthDateString: string | null | undefined): number | null => {
    if (!birthDateString) return null;
    const birthDate = new Date(birthDateString);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Layout 
      title="Детали занятия"
      showBack={true}
      onBackPress={() => navigation.goBack()}
    >

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.mainCard}>
          <Card.Content>
            <View style={styles.titleSection}>
              <Title style={styles.classTitle}>{classData.name}</Title>
              <Badge style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(classData.difficulty_level) }]}>
                {classesService.getDifficultyDisplayName(classData.difficulty_level)}
              </Badge>
            </View>

            {classData.description && (
              <Text style={styles.description}>{classData.description}</Text>
            )}

            <Divider style={styles.divider} />

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="calendar" size={20} color="#E74C3C" />
                <Text style={styles.infoLabel}>Дни недели:</Text>
                <Text style={styles.infoValue}>
                  {classData.days_of_week?.filter(day => day).map(day => classesService.formatDayOfWeek(day)).join(', ') || 'Не указано'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="clock" size={20} color="#E74C3C" />
                <Text style={styles.infoLabel}>Время:</Text>
                <Text style={styles.infoValue}>
                  {classesService.formatTime(classData.start_time)} - {classesService.formatTime(classData.end_time)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="timer" size={20} color="#E74C3C" />
                <Text style={styles.infoLabel}>Длительность:</Text>
                <Text style={styles.infoValue}>
                  {classesService.calculateDuration(classData.start_time, classData.end_time)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="human-male-board" size={20} color="#E74C3C" />
                <Text style={styles.infoLabel}>Професор:</Text>
                <Text style={styles.infoValue}>
                  {classData.coach ? `${classData.coach.first_name} ${classData.coach.last_name}` : `ID: ${classData.coach_id}`}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="account-multiple" size={20} color="#E74C3C" />
                <Text style={styles.infoLabel}>Максимум мест:</Text>
                <Text style={styles.infoValue}>{classData.max_capacity}</Text>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="currency-usd" size={20} color="#E74C3C" />
                <Text style={styles.infoLabel}>Стоимость:</Text>
                <Text style={styles.infoValue}>{classData.price} ₸</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Today's Athletes Section for Coaches */}
        {userRole === 'coach' && classData.coach_id === user?.id && participants.length > 0 && (
          <Card style={styles.mainCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Участники на сегодня</Title>
              <Text style={styles.sectionSubtitle}>
                {participants.filter(p => p.booking_status === 'confirmed').length} подтвержденных на {new Date().toLocaleDateString('ru-RU')}
              </Text>
              
              <Divider style={styles.divider} />
              
              {participants
                .filter(participant => participant.booking_status === 'confirmed')
                .map((participant, index) => {
                  const age = calculateAge(participant.birth_date);
                  return (
                    <View key={participant.id} style={styles.participantRow}>
                      <View style={styles.participantInfo}>
                        <Text style={styles.participantName}>{participant.first_name} {participant.last_name}</Text>
                        {age !== null && (
                          <Text style={styles.participantAge}>
                            {age} лет
                          </Text>
                        )}
                      </View>
                      <View style={styles.participantStatus}>
                        <View
                          style={[
                            styles.paymentBadge,
                            { backgroundColor: participant.is_paid ? '#4CAF50' : '#F44336' }
                          ]}
                        >
                          <Text style={styles.paymentBadgeText}>
                            {participant.is_paid ? 'Оплачено' : 'Не оплачено'}
                          </Text>
                        </View>
                        {participant.payment_amount && (
                          <Text style={styles.paymentAmount}>
                            {participant.payment_amount} ₸
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              
              {participants.filter(p => p.booking_status === 'confirmed').length === 0 && (
                <Text style={styles.noParticipantsText}>
                  Пока нет подтвержденных участников
                </Text>
              )}
            </Card.Content>
          </Card>
        )}

        <View style={styles.actionsContainer}>
          {(userRole === 'parent' || userRole === 'athlete') && (
            <>
              <Button
                mode="contained"
                onPress={handleBookClass}
                style={styles.bookButton}
                buttonColor="#E74C3C"
                textColor="#fff"
                icon="bookmark-plus"
              >
                Записаться на занятие
              </Button>

              {userRole === 'athlete' && isClassHappeningNow() && (
                <Button
                  mode="contained"
                  onPress={handleMarkAttendance}
                  style={styles.attendanceButton}
                  buttonColor="#4CAF50"
                  textColor="#fff"
                  icon="qrcode-scan"
                >
                  Отметить посещение
                </Button>
              )}
            </>
          )}

          {userRole === 'coach' && classData.coach_id === user?.id && (
            <>
              <Button
                mode="outlined"
                onPress={handleEditClass}
                style={styles.editButton}
                textColor="#E74C3C"
                icon="pencil"
              >
                Редактировать занятие
              </Button>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('ClassParticipants', { classId })}
                style={styles.participantsButton}
                buttonColor="#2C3E50"
                textColor="#fff"
                icon="account-group"
              >
                Все участники ({participants.length})
              </Button>
              <Button
                mode="contained"
                onPress={handleViewAttendance}
                style={styles.attendanceButton}
                buttonColor="#4CAF50"
                textColor="#fff"
                icon="clipboard-check-outline"
              >
                Посещаемость
              </Button>
            </>
          )}
        </View>
      </ScrollView>
    </Layout>
  );
};

const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'beginner': return '#4CAF50';
    case 'amateur': return '#FF9800';
    case 'professional': return '#F44336';
    default: return '#757575';
  }
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
  classTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
  },
  description: {
    color: '#B0BEC5',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
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
  bookButton: {
    marginTop: 8,
  },
  editButton: {
    marginTop: 8,
  },
  participantsButton: {
    marginTop: 8,
  },
  attendanceButton: {
    marginTop: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: '#B0BEC5',
    fontSize: 14,
    marginBottom: 12,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#2C3E50',
    borderRadius: 8,
    marginBottom: 8,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  participantAge: {
    color: '#B0BEC5',
    fontSize: 14,
  },
  participantStatus: {
    alignItems: 'flex-end',
  },
  paymentBadge: {
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  paymentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  paymentAmount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noParticipantsText: {
    color: '#B0BEC5',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
});

export default ClassDetailPage; 