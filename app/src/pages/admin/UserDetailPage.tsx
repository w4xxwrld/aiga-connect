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
import RoleChangeModal from '../../components/admin/RoleChangeModal';
import { useAppContext } from '../../context/AppContext';
import adminService, { UserResponse } from '../../services/admin';

type UserDetailRouteProp = RouteProp<{ params: { userId: number } }, 'params'>;

const UserDetailPage: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<UserDetailRouteProp>();
  const { userId } = route.params;
  const { isAdmin } = useAppContext();

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [roleModalVisible, setRoleModalVisible] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert('Доступ запрещен', 'У вас нет прав для просмотра этой страницы');
      navigation.goBack();
      return;
    }
    loadUser();
  }, [isAdmin, userId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const userData = await adminService.getUser(userId);
      setUser(userData);
    } catch (error: any) {
      console.error('Error loading user:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось загрузить пользователя');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (newRole: string) => {
    if (!user) return;

    try {
      await adminService.changeUserRole(user.id, newRole);
      Alert.alert('Успешно', 'Роль пользователя изменена');
      loadUser();
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось изменить роль');
    }
  };

  const handleDelete = () => {
    if (!user) return;

    Alert.alert(
      'Подтверждение',
      `Вы уверены, что хотите удалить пользователя ${user.first_name} ${user.last_name}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deleteUser(user.id);
              Alert.alert('Успешно', 'Пользователь удален');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Ошибка', error.message || 'Не удалось удалить пользователя');
            }
          },
        },
      ]
    );
  };

  const handleRestore = async () => {
    if (!user) return;

    try {
      await adminService.restoreUser(user.id);
      Alert.alert('Успешно', 'Пользователь восстановлен');
      loadUser();
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось восстановить пользователя');
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

  if (loading || !user) {
    return (
      <Layout title="Пользователь" showBack onBackPress={() => navigation.goBack()}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </Layout>
    );
  }

  const fullName = `${user.first_name} ${user.last_name}`;

  return (
    <Layout title={fullName} showBack onBackPress={() => navigation.goBack()}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                {user.photo_url ? (
                  <Avatar.Image size={80} source={{ uri: user.photo_url }} />
                ) : (
                  <Avatar.Text
                    size={80}
                    label={user.first_name.charAt(0)}
                    style={styles.avatarPlaceholder}
                    color="#fff"
                  />
                )}
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{fullName}</Text>
                <View style={styles.badgesRow}>
                  <StatusBadge type="role" value={user.primary_role} />
                  {user.role_status && (
                    <StatusBadge type="status" value={user.role_status} />
                  )}
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Info Cards */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Контактная информация</Text>

            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="phone" size={20} color="#B0BEC5" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Телефон</Text>
                <Text style={styles.infoValue}>{user.phone}</Text>
              </View>
            </View>

            {user.email && (
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="email" size={20} color="#B0BEC5" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{user.email}</Text>
                </View>
              </View>
            )}

            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="cake-variant" size={20} color="#B0BEC5" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Дата рождения</Text>
                <Text style={styles.infoValue}>{formatDate(user.birth_date)}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="calendar-plus" size={20} color="#B0BEC5" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Дата регистрации</Text>
                <Text style={styles.infoValue}>{formatDate(user.created_at)}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Действия</Text>

            <Button
              mode="contained"
              onPress={() => setRoleModalVisible(true)}
              style={styles.actionButton}
              buttonColor="#2196F3"
              textColor="#fff"
              icon="account-switch"
            >
              Изменить роль
            </Button>

            {!user.is_deleted ? (
              <Button
                mode="outlined"
                onPress={handleDelete}
                style={styles.actionButton}
                textColor="#F44336"
                icon="delete"
              >
                Удалить пользователя
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={handleRestore}
                style={styles.actionButton}
                buttonColor="#4CAF50"
                textColor="#fff"
                icon="restore"
              >
                Восстановить пользователя
              </Button>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <RoleChangeModal
        visible={roleModalVisible}
        currentRole={user.primary_role}
        onDismiss={() => setRoleModalVisible(false)}
        onSave={handleChangeRole}
      />
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
    gap: 8,
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

export default UserDetailPage;
