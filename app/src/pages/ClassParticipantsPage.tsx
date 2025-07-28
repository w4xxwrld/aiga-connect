import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Button,
  Badge,
  Chip,
  Searchbar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import classesService from '../services/classes';
import bookingsService from '../services/bookings';
import { Class } from '../services/classes';

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

interface ClassParticipantsPageProps {
  navigation: any;
  route: {
    params: {
      classId: number;
    };
  };
}

const ClassParticipantsPage: React.FC<ClassParticipantsPageProps> = ({ navigation, route }) => {
  const { classId } = route.params;
  const { user, userRole } = useAppContext();
  
  const [classData, setClassData] = useState<Class | null>(null);
  const [participants, setParticipants] = useState<ClassParticipant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<ClassParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterParticipants();
  }, [participants, searchQuery, selectedStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classInfo, participantsData] = await Promise.all([
        classesService.getClass(classId),
        classesService.getClassParticipants(classId)
      ]);
      setClassData(classInfo);
      setParticipants(participantsData);
    } catch (error: any) {
      console.error('Error loading data:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveBooking = async (participant: ClassParticipant) => {
    Alert.alert(
      'Подтвердить запись',
      `Подтвердить запись ${participant.full_name} на занятие?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Подтвердить',
          onPress: async () => {
            try {
              await bookingsService.approveBooking(participant.id);
              Alert.alert('Успех', 'Запись подтверждена');
              loadData(); // Reload data to update status
            } catch (error: any) {
              Alert.alert('Ошибка', error.message || 'Не удалось подтвердить запись');
            }
          }
        }
      ]
    );
  };

  const handleDeclineBooking = async (participant: ClassParticipant) => {
    Alert.alert(
      'Отклонить запись',
      `Отклонить запись ${participant.full_name}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Отклонить',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingsService.declineBooking(participant.id, 'Отклонено тренером');
              Alert.alert('Успех', 'Запись отклонена');
              loadData(); // Reload data to update status
            } catch (error: any) {
              Alert.alert('Ошибка', error.message || 'Не удалось отклонить запись');
            }
          }
        }
      ]
    );
  };

  const filterParticipants = () => {
    let filtered = participants;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(participant =>
        participant.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(participant => participant.booking_status === selectedStatus);
    }

    setFilteredParticipants(filtered);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'cancelled': return '#F44336';
      case 'completed': return '#2196F3';
      default: return '#757575';
    }
  };

  const getStatusDisplayName = (status: string): string => {
    switch (status) {
      case 'confirmed': return 'Подтверждено';
      case 'pending': return 'Ожидает';
      case 'cancelled': return 'Отменено';
      case 'completed': return 'Завершено';
      default: return status;
    }
  };

  const getBookingTypeDisplayName = (type: string): string => {
    switch (type) {
      case 'regular': return 'Обычное';
      case 'trial': return 'Пробное';
      case 'makeup': return 'Компенсационное';
      default: return type;
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderParticipantCard = (participant: ClassParticipant) => (
    <Card key={participant.id} style={styles.participantCard}>
      <Card.Content>
        <View style={styles.participantHeader}>
          <View style={styles.participantInfo}>
            <Title style={styles.participantName}>{participant.full_name}</Title>
            <Text style={styles.participantAge}>
              {calculateAge(participant.birth_date)} лет
            </Text>
          </View>
          <Badge 
            style={[styles.statusBadge, { backgroundColor: getStatusColor(participant.booking_status) }]}
          >
            {getStatusDisplayName(participant.booking_status)}
          </Badge>
        </View>

        <View style={styles.participantDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar" size={16} color="#E74C3C" />
            <Text style={styles.detailLabel}>Дата занятия:</Text>
            <Text style={styles.detailValue}>
              {formatDate(participant.class_date)} в {formatTime(participant.class_date)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="bookmark" size={16} color="#E74C3C" />
            <Text style={styles.detailLabel}>Тип записи:</Text>
            <Text style={styles.detailValue}>
              {getBookingTypeDisplayName(participant.booking_type)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="credit-card" size={16} color="#E74C3C" />
            <Text style={styles.detailLabel}>Оплата:</Text>
            <Text style={[styles.detailValue, { color: participant.is_paid ? '#4CAF50' : '#F44336' }]}>
              {participant.is_paid ? 'Оплачено' : 'Не оплачено'}
              {participant.payment_amount && ` (${participant.payment_amount} ₸)`}
            </Text>
          </View>

          {participant.notes && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="note-text" size={16} color="#E74C3C" />
              <Text style={styles.detailLabel}>Заметки:</Text>
              <Text style={styles.detailValue}>{participant.notes}</Text>
            </View>
          )}
        </View>

        {/* Coach Action Buttons */}
        {userRole === 'coach' && classData?.coach_id === user?.id && participant.booking_status === 'pending' && (
          <View style={styles.actionButtonsContainer}>
            <Button
              mode="contained"
              onPress={() => handleApproveBooking(participant)}
              style={[styles.actionButton, styles.approveButton]}
              buttonColor="#4CAF50"
              icon="check"
              compact
            >
              Подтвердить
            </Button>
            <Button
              mode="contained"
              onPress={() => handleDeclineBooking(participant)}
              style={[styles.actionButton, styles.declineButton]}
              buttonColor="#F44336"
              icon="close"
              compact
            >
              Отклонить
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const getStatusCount = (status: string) => {
    return participants.filter(participant => participant.booking_status === status).length;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E74C3C" />
        <Text style={styles.loadingText}>Загрузка участников...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Global Header */}
      <View style={styles.globalHeader}>
        <Text style={styles.headerTitle}>AIGA Connect</Text>
        {userRole === 'coach' && classData?.coach_id === user?.id && getStatusCount('pending') > 0 && (
          <Button
            mode="contained"
            onPress={() => setSelectedStatus('pending')}
            style={styles.pendingActionButton}
            buttonColor="#FF9800"
            icon="clock"
            compact
          >
            Ожидает ({getStatusCount('pending')})
          </Button>
        )}
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Class Info */}
        {classData && (
          <Card style={styles.classInfoCard}>
            <Card.Content>
              <Title style={styles.classTitle}>{classData.name}</Title>
              <Text style={styles.classSubtitle}>
                {classesService.formatDayOfWeek(classData.day_of_week)} • {classesService.formatTime(classData.start_time)} - {classesService.formatTime(classData.end_time)}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{participants.length}</Text>
            <Text style={styles.statLabel}>Всего участников</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{getStatusCount('confirmed')}</Text>
            <Text style={styles.statLabel}>Подтверждено</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{getStatusCount('pending')}</Text>
            <Text style={styles.statLabel}>Ожидает</Text>
          </View>
        </View>

        {/* Search */}
        <Searchbar
          placeholder="Поиск участников..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="#E74C3C"
        />

        {/* Filters */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Chip
              selected={selectedStatus === 'all'}
              onPress={() => setSelectedStatus('all')}
              style={styles.filterChip}
              textStyle={styles.filterChipText}
            >
              Все ({participants.length})
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
          </ScrollView>
        </View>

        {/* Participants List */}
        {filteredParticipants.length > 0 ? (
          filteredParticipants.map(renderParticipantCard)
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-group" size={48} color="#B0BEC5" />
            <Text style={styles.emptyStateText}>
              {searchQuery || selectedStatus !== 'all' 
                ? 'Участники не найдены' 
                : 'На это занятие пока нет записей'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles: any = {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  classInfoCard: {
    backgroundColor: '#1B263B',
    borderRadius: 12,
    marginBottom: 16,
  },
  classTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  classSubtitle: {
    color: '#B0BEC5',
    fontSize: 14,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1B263B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    color: '#E74C3C',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#B0BEC5',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  searchBar: {
    backgroundColor: '#1B263B',
    borderRadius: 12,
    marginBottom: 16,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: '#1B263B',
  },
  filterChipText: {
    color: '#fff',
  },
  participantCard: {
    backgroundColor: '#1B263B',
    borderRadius: 12,
    marginBottom: 12,
  },
  participantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  participantAge: {
    color: '#B0BEC5',
    fontSize: 14,
  },
  statusBadge: {
    marginLeft: 8,
  },
  participantDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    color: '#B0BEC5',
    fontSize: 14,
    marginLeft: 8,
    minWidth: 100,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  declineButton: {
    backgroundColor: '#F44336',
  },
  pendingActionButton: {
    marginTop: 8,
    backgroundColor: '#FF9800',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    color: '#B0BEC5',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
};

export default ClassParticipantsPage; 