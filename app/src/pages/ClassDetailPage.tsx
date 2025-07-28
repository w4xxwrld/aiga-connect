import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
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
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ClassDetailPageProps {
  navigation: any;
  route: {
    params: {
      classId: number;
    };
  };
}

interface ClassParticipant {
  id: number;
  full_name: string;
  birth_date: string;
  booking_type: string;
  booking_status: string;
  class_date: string;
  is_paid: boolean;
  payment_amount?: number;
  notes?: string;
  booked_by_parent?: string;
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
      
      // Load participants if user is a coach
      if (userRole === 'coach' && data.coach_id === user?.id) {
        try {
          const participantsData = await classesService.getClassParticipants(classId);
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
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Назад
        </Button>
      </View>
    );
  }

  const calculateAge = (birthDateString: string) => {
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

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
        <Title style={styles.headerTitle}>Детали занятия</Title>
        <View style={{ width: 60 }} />
      </View>

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
                <Text style={styles.infoLabel}>День недели:</Text>
                <Text style={styles.infoValue}>
                  {classesService.formatDayOfWeek(classData.day_of_week)}
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
                <MaterialCommunityIcons name="account-tie" size={20} color="#E74C3C" />
                <Text style={styles.infoLabel}>Тренер:</Text>
                <Text style={styles.infoValue}>
                  {classData.coach?.full_name || `ID: ${classData.coach_id}`}
                </Text>
              </View>

              {(classData.age_group_min || classData.age_group_max) && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="account-group" size={20} color="#E74C3C" />
                  <Text style={styles.infoLabel}>Возраст:</Text>
                  <Text style={styles.infoValue}>
                    {classData.age_group_min && classData.age_group_max 
                      ? `${classData.age_group_min}-${classData.age_group_max} лет`
                      : classData.age_group_min 
                        ? `от ${classData.age_group_min} лет`
                        : `до ${classData.age_group_max} лет`
                    }
                  </Text>
                </View>
              )}

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="account-multiple" size={20} color="#E74C3C" />
                <Text style={styles.infoLabel}>Максимум мест:</Text>
                <Text style={styles.infoValue}>{classData.max_capacity}</Text>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="currency-usd" size={20} color="#E74C3C" />
                <Text style={styles.infoLabel}>Стоимость:</Text>
                <Text style={styles.infoValue}>{classData.price_per_class} ₸</Text>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#E74C3C" />
                <Text style={styles.infoLabel}>Пробные занятия:</Text>
                <Text style={styles.infoValue}>
                  {classData.is_trial_available ? 'Доступны' : 'Недоступны'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Accepted Athletes Section for Coaches */}
        {userRole === 'coach' && classData.coach_id === user?.id && participants.length > 0 && (
          <Card style={styles.mainCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Участники занятия</Title>
              <Text style={styles.sectionSubtitle}>
                {participants.filter(p => p.booking_status === 'confirmed').length} подтвержденных участников
              </Text>
              
              <Divider style={styles.divider} />
              
              {participants
                .filter(participant => participant.booking_status === 'confirmed')
                .map((participant, index) => (
                  <View key={participant.id} style={styles.participantRow}>
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>{participant.full_name}</Text>
                      <Text style={styles.participantAge}>
                        {calculateAge(participant.birth_date)} лет
                      </Text>
                    </View>
                    <View style={styles.participantStatus}>
                      <Badge 
                        style={[
                          styles.paymentBadge, 
                          { backgroundColor: participant.is_paid ? '#4CAF50' : '#F44336' }
                        ]}
                      >
                        {participant.is_paid ? 'Оплачено' : 'Не оплачено'}
                      </Badge>
                      {participant.payment_amount && (
                        <Text style={styles.paymentAmount}>
                          {participant.payment_amount} ₸
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              
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
            <Button
              mode="contained"
              onPress={handleBookClass}
              style={styles.bookButton}
              buttonColor="#E74C3C"
              icon="bookmark-plus"
            >
              Записаться на занятие
            </Button>
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
                icon="account-group"
              >
                Все участники ({participants.length})
              </Button>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'beginner': return '#4CAF50';
    case 'intermediate': return '#FF9800';
    case 'advanced': return '#F44336';
    default: return '#757575';
  }
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D1B2A',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 56, // Safe area for status bar
    backgroundColor: '#0D1B2A',
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
    zIndex: 1000,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    minWidth: 60,
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