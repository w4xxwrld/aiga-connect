import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Card, Button, Avatar, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/admin/StatusBadge';
import CoachStatsCard from '../../components/admin/CoachStatsCard';
import { useAppContext } from '../../context/AppContext';
import adminService, { UserResponse, CoachStats } from '../../services/admin';

type CoachDetailRouteProp = RouteProp<{ params: { coachId: number } }, 'params'>;

const CoachDetailPage: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<CoachDetailRouteProp>();
  const { coachId } = route.params;
  const { isAdmin } = useAppContext();

  const [loading, setLoading] = useState(false);
  const [coach, setCoach] = useState<UserResponse | null>(null);
  const [stats, setStats] = useState<CoachStats | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert('Доступ запрещен', 'У вас нет прав для просмотра этой страницы');
      navigation.goBack();
      return;
    }
    loadCoachData();
  }, [isAdmin, coachId]);

  const loadCoachData = async () => {
    try {
      setLoading(true);
      const [coachData, coachStats] = await Promise.all([
        adminService.getUser(coachId),
        adminService.getCoachStats(coachId),
      ]);
      setCoach(coachData);
      setStats(coachStats);
    } catch (error: any) {
      console.error('Error loading coach data:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось загрузить данные тренера');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = () => {
    if (!coach) return;

    Alert.alert(
      'Подтверждение',
      `Вы уверены, что хотите приостановить тренера ${coach.first_name} ${coach.last_name}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Приостановить',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.suspendCoach(coach.id);
              Alert.alert('Успешно', 'Тренер приостановлен');
              loadCoachData();
            } catch (error: any) {
              Alert.alert('Ошибка', error.message || 'Не удалось приостановить тренера');
            }
          },
        },
      ]
    );
  };

  const handleReactivate = async () => {
    if (!coach) return;

    try {
      await adminService.reactivateCoach(coach.id);
      Alert.alert('Успешно', 'Тренер активирован');
      loadCoachData();
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось активировать тренера');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading || !coach) {
    return (
      <Layout title="Тренер" showBack onBackPress={() => navigation.goBack()}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </Layout>
    );
  }

  const fullName = `${coach.first_name} ${coach.last_name}`;
  const isSuspended = coach.role_status === 'suspended';

  return (
    <Layout title={fullName} showBack onBackPress={() => navigation.goBack()}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                {coach.photo_url ? (
                  <Avatar.Image size={80} source={{ uri: coach.photo_url }} />
                ) : (
                  <Avatar.Text
                    size={80}
                    label={coach.first_name.charAt(0)}
                    style={styles.avatarPlaceholder}
                    color="#fff"
                  />
                )}
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{fullName}</Text>
                <View style={styles.badgesRow}>
                  <StatusBadge type="role" value={coach.primary_role} />
                  {coach.role_status && (
                    <StatusBadge type="status" value={coach.role_status} />
                  )}
                  {coach.is_head_coach && (
                    <View style={styles.headCoachBadge}>
                      <Text style={styles.headCoachText}>Главный тренер</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Stats */}
        {stats && <CoachStatsCard stats={stats} />}

        {/* Contact Info */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Контактная информация</Text>

            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="phone" size={20} color="#B0BEC5" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Телефон</Text>
                <Text style={styles.infoValue}>{coach.phone}</Text>
              </View>
            </View>

            {coach.email && (
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="email" size={20} color="#B0BEC5" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{coach.email}</Text>
                </View>
              </View>
            )}

            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="cake-variant" size={20} color="#B0BEC5" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Дата рождения</Text>
                <Text style={styles.infoValue}>{formatDate(coach.birth_date)}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="calendar-plus" size={20} color="#B0BEC5" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Дата регистрации</Text>
                <Text style={styles.infoValue}>{formatDate(coach.created_at)}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Действия</Text>

            {!isSuspended ? (
              <Button
                mode="outlined"
                onPress={handleSuspend}
                style={styles.actionButton}
                textColor="#F44336"
                icon="pause-circle"
              >
                Приостановить тренера
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={handleReactivate}
                style={styles.actionButton}
                buttonColor="#4CAF50"
                icon="play-circle"
              >
                Активировать тренера
              </Button>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
  card: {
    backgroundColor: '#1B263B',
    marginBottom: 16,
    borderRadius: 12,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#6B7280',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  headCoachBadge: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headCoachText: {
    color: '#FFC107',
    fontSize: 12,
    fontWeight: '600',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    color: '#B0BEC5',
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    color: '#fff',
    fontSize: 16,
  },
  actionButton: {
    marginBottom: 12,
  },
});

export default CoachDetailPage;
