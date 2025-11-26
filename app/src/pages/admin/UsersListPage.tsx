import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import Layout from '../../components/Layout';
import EmptyState from '../../components/EmptyState';
import AdminFilters from '../../components/admin/AdminFilters';
import UserCard from '../../components/admin/UserCard';
import { useAppContext } from '../../context/AppContext';
import adminService, { UserResponse } from '../../services/admin';

const UsersListPage: React.FC = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const { isAdmin } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  const roleOptions = [
    { value: 'all', label: 'Все' },
    { value: 'athlete', label: 'Спортсмены' },
    { value: 'coach', label: 'Тренеры' },
    { value: 'admin', label: 'Админы' },
  ];

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert('Доступ запрещен', 'У вас нет прав для просмотра этой страницы');
      navigation.goBack();
      return;
    }
    loadUsers();
  }, [isAdmin, selectedRole, searchQuery]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: any = {
        search: searchQuery || undefined,
        role: selectedRole !== 'all' ? selectedRole : undefined,
      };
      const result = await adminService.listUsers(params);
      setUsers(result.users);
    } catch (error: any) {
      console.error('Error loading users:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось загрузить пользователей');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const handleUserPress = (userId: number) => {
    navigation.navigate('UserDetail', { userId });
  };

  if (loading && users.length === 0 && !refreshing) {
    return (
      <Layout title="Пользователи" showBack onBackPress={() => navigation.goBack()}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout title="Пользователи" showBack onBackPress={() => navigation.goBack()}>
      <AdminFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
        roleOptions={roleOptions}
      />

      <FlatList
        data={users}
        renderItem={({ item }) => (
          <UserCard user={item} onPress={() => handleUserPress(item.id)} />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="account-group"
            message="Пользователи не найдены"
            subtitle="Попробуйте изменить фильтры или поиск"
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
    paddingTop: 8,
    paddingBottom: 100,
  },
});

export default UsersListPage;
