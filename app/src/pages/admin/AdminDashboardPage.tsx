import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card, Button, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import { useAppContext } from '../../context/AppContext';
import adminService from '../../services/admin';

const AdminDashboardPage: React.FC = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const { isAdmin } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    pendingCoaches: 0,
    totalAthletes: 0,
    totalCoaches: 0,
    totalAdmins: 0,
  });

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert('Доступ запрещен', 'У вас нет прав для просмотра этой страницы');
      navigation.goBack();
      return;
    }
    loadDashboardData();
  }, [isAdmin]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load all necessary data in parallel
      const [pendingCoaches, athletes, coaches, admins] = await Promise.all([
        adminService.getPendingCoaches(),
        adminService.listUsers({ role: 'athlete' }),
        adminService.listUsers({ role: 'coach' }),
        adminService.listUsers({ role: 'admin' }),
      ]);

      setStats({
        pendingCoaches: pendingCoaches.length,
        totalAthletes: athletes.total,
        totalCoaches: coaches.total,
        totalAdmins: admins.total,
      });
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <Layout title="Панель администратора" showBack onBackPress={() => navigation.goBack()}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout title="Панель администратора" showBack onBackPress={() => navigation.goBack()}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Панель администратора</Text>
          <Text style={styles.welcomeSubtitle}>
            Управление пользователями и тренерами
          </Text>
        </View>

        {/* Pending Coaches Alert */}
        {stats.pendingCoaches > 0 && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('PendingCoaches')}
          >
            <Card style={styles.alertCard}>
              <Card.Content>
                <View style={styles.alertContent}>
                  <MaterialCommunityIcons
                    name="alert-circle"
                    size={32}
                    color="#FFC107"
                  />
                  <View style={styles.alertText}>
                    <Text style={styles.alertTitle}>
                      {stats.pendingCoaches} {stats.pendingCoaches === 1 ? 'заявка ожидает' : 'заявок ожидают'}
                    </Text>
                    <Text style={styles.alertSubtitle}>
                      Нажмите для просмотра заявок тренеров
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color="#B0BEC5"
                  />
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        )}

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Статистика пользователей</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <StatCard
                icon="run"
                value={stats.totalAthletes}
                label="Спортсмены"
                iconColor="#2196F3"
              />
              <StatCard
                icon="whistle"
                value={stats.totalCoaches}
                label="Тренеры"
                iconColor="#4CAF50"
              />
            </View>

            <View style={styles.statsRow}>
              <StatCard
                icon="shield-account"
                value={stats.totalAdmins}
                label="Админы"
                iconColor="#9C27B0"
              />
              <StatCard
                icon="account-clock"
                value={stats.pendingCoaches}
                label="Ожидающие"
                iconColor="#FFC107"
              />
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Быстрые действия</Text>

          <Card style={styles.actionCard}>
            <Card.Content>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => navigation.navigate('UsersList')}
              >
                <View style={styles.actionIconContainer}>
                  <MaterialCommunityIcons
                    name="account-group"
                    size={24}
                    color="#2196F3"
                  />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Все пользователи</Text>
                  <Text style={styles.actionSubtitle}>
                    Просмотр и управление пользователями
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color="#B0BEC5"
                />
              </TouchableOpacity>

              <View style={styles.actionDivider} />

              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => navigation.navigate('CoachesList')}
              >
                <View style={styles.actionIconContainer}>
                  <MaterialCommunityIcons
                    name="whistle"
                    size={24}
                    color="#4CAF50"
                  />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Управление тренерами</Text>
                  <Text style={styles.actionSubtitle}>
                    Просмотр статистики и управление
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color="#B0BEC5"
                />
              </TouchableOpacity>

              {stats.pendingCoaches > 0 && (
                <>
                  <View style={styles.actionDivider} />
                  <TouchableOpacity
                    style={styles.actionItem}
                    onPress={() => navigation.navigate('PendingCoaches')}
                  >
                    <View style={styles.actionIconContainer}>
                      <MaterialCommunityIcons
                        name="account-clock"
                        size={24}
                        color="#FFC107"
                      />
                    </View>
                    <View style={styles.actionContent}>
                      <Text style={styles.actionTitle}>Заявки тренеров</Text>
                      <Text style={styles.actionSubtitle}>
                        {stats.pendingCoaches} {stats.pendingCoaches === 1 ? 'заявка' : 'заявок'} ожидают одобрения
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={24}
                      color="#B0BEC5"
                    />
                  </TouchableOpacity>
                </>
              )}
            </Card.Content>
          </Card>
        </View>
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
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    color: '#B0BEC5',
    fontSize: 16,
  },
  alertCard: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    marginBottom: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertText: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  alertSubtitle: {
    color: '#B0BEC5',
    fontSize: 14,
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionsSection: {
    marginBottom: 24,
  },
  actionCard: {
    backgroundColor: '#1B263B',
    borderRadius: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionSubtitle: {
    color: '#B0BEC5',
    fontSize: 14,
  },
  actionDivider: {
    height: 1,
    backgroundColor: '#2C3E50',
    marginVertical: 8,
  },
});

export default AdminDashboardPage;
