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

const CoachesListPage: React.FC = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const { isAdmin } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [coaches, setCoaches] = useState<UserResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const statusOptions = [
    { value: 'all', label: 'Все' },
    { value: 'approved', label: 'Активные' },
    { value: 'pending', label: 'Ожидающие' },
    { value: 'suspended', label: 'Приостановленные' },
  ];

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert('Доступ запрещен', 'У вас нет прав для просмотра этой страницы');
      navigation.goBack();
      return;
    }
    loadCoaches();
  }, [isAdmin, selectedStatus, searchQuery]);

  const loadCoaches = async () => {
    try {
      setLoading(true);
      const params: any = {
        search: searchQuery || undefined,
        role_status: selectedStatus !== 'all' ? selectedStatus : undefined,
      };
      const result = await adminService.listCoaches(params);
      setCoaches(result.users);
    } catch (error: any) {
      console.error('Error loading coaches:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось загрузить професорів');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCoaches();
    setRefreshing(false);
  };

  const handleCoachPress = (coachId: number) => {
    navigation.navigate('CoachDetail', { coachId });
  };

  if (loading && coaches.length === 0 && !refreshing) {
    return (
      <Layout title="Професори" showBack onBackPress={() => navigation.goBack()}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout title="Професори" showBack onBackPress={() => navigation.goBack()}>
      <AdminFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedRole={selectedStatus}
        onRoleChange={setSelectedStatus}
        roleOptions={statusOptions}
      />

      <FlatList
        data={coaches}
        renderItem={({ item }) => (
          <UserCard user={item} onPress={() => handleCoachPress(item.id)} />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="whistle"
            message="Професори не найдены"
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

export default CoachesListPage;
