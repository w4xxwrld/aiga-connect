import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { Card, Button, Avatar, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Layout from '../../components/Layout';
import EmptyState from '../../components/EmptyState';
import { useAppContext } from '../../context/AppContext';
import adminService, { PendingCoach } from '../../services/admin';

const PendingCoachesPage: React.FC = () => {
  const navigation = useNavigation();
  const { isAdmin } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingCoaches, setPendingCoaches] = useState<PendingCoach[]>([]);

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert('Доступ запрещен', 'У вас нет прав для просмотра этой страницы');
      navigation.goBack();
      return;
    }
    loadPendingCoaches();
  }, [isAdmin]);

  const loadPendingCoaches = async () => {
    try {
      setLoading(true);
      const coaches = await adminService.getPendingCoaches();
      setPendingCoaches(coaches);
    } catch (error: any) {
      console.error('Error loading pending coaches:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось загрузить заявки');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPendingCoaches();
    setRefreshing(false);
  };

  const handleReview = async (coach: PendingCoach, action: 'approve' | 'decline') => {
    const actionText = action === 'approve' ? 'одобрить' : 'отклонить';
    const actionTextPast = action === 'approve' ? 'одобрена' : 'отклонена';

    Alert.alert(
      'Подтверждение',
      `Вы уверены, что хотите ${actionText} заявку ${coach.full_name}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: actionText.charAt(0).toUpperCase() + actionText.slice(1),
          style: action === 'approve' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await adminService.reviewCoach(coach.id, action);
              Alert.alert('Успешно', `Заявка ${actionTextPast}`);
              loadPendingCoaches();
            } catch (error: any) {
              Alert.alert('Ошибка', error.message || `Не удалось ${actionText} заявку`);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderCoachCard = ({ item }: { item: PendingCoach }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.avatarContainer}>
            {item.photo_url ? (
              <Avatar.Image size={64} source={{ uri: item.photo_url }} />
            ) : (
              <Avatar.Text
                size={64}
                label={item.full_name.charAt(0)}
                style={styles.avatarPlaceholder}
                color="#fff"
              />
            )}
          </View>

          <View style={styles.coachInfo}>
            <Text style={styles.coachName}>{item.full_name}</Text>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="phone" size={14} color="#B0BEC5" />
              <Text style={styles.infoText}>{item.phone}</Text>
            </View>

            {item.email && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="email" size={14} color="#B0BEC5" />
                <Text style={styles.infoText}>{item.email}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="calendar" size={14} color="#B0BEC5" />
              <Text style={styles.infoText}>Регистрация: {formatDate(item.created_at)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Button
            mode="contained"
            onPress={() => handleReview(item, 'approve')}
            style={styles.approveButton}
            buttonColor="#4CAF50"
            textColor="#fff"
            icon="check"
          >
            Одобрить
          </Button>

          <Button
            mode="outlined"
            onPress={() => handleReview(item, 'decline')}
            style={styles.declineButton}
            textColor="#F44336"
            icon="close"
          >
            Отклонить
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading && !refreshing) {
    return (
      <Layout title="Заявки професорів" showBack onBackPress={() => navigation.goBack()}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout title="Заявки професорів" showBack onBackPress={() => navigation.goBack()}>
      <FlatList
        data={pendingCoaches}
        renderItem={renderCoachCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="account-clock"
            message="Нет заявок"
            subtitle="Новые заявки професорів появятся здесь"
          />
        }
      />
    </Layout>
  );
};

const styles = StyleSheet.create({
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#1B263B',
    marginBottom: 16,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#6B7280',
  },
  coachInfo: {
    flex: 1,
  },
  coachName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    color: '#B0BEC5',
    fontSize: 14,
    marginLeft: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  approveButton: {
    flex: 1,
  },
  declineButton: {
    flex: 1,
    borderColor: '#F44336',
  },
});

export default PendingCoachesPage;
