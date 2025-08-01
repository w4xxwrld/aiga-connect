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
  Searchbar,
  Chip,
  ActivityIndicator,
  Avatar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import authService from '../services/auth';
import { setBackendUrl, getBackendUrl } from '../config/backend';

interface User {
  id: number;
  iin: string;
  full_name: string;
  email: string;
  phone?: string;
  birth_date: string;
  emergency_contact?: string;
  primary_role: 'parent' | 'athlete' | 'coach';
  roles: ('parent' | 'athlete' | 'coach')[];
  is_head_coach: boolean;
  created_at: string;
}

const UsersManagementPage: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { user, userRole, isSidebarOpen, setIsSidebarOpen } = useAppContext();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'parent' | 'athlete' | 'coach'>('all');

  // Check if current user is head coach
  const isHeadCoach = user?.is_head_coach === true;

  useEffect(() => {
    if (isHeadCoach) {
      loadUsers();
    }
  }, [isHeadCoach]);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, selectedRole]);

  const loadUsers = async () => {
    if (!isHeadCoach) return;
    
    try {
      setLoading(true);
      const usersData = await authService.getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить пользователей');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.iin.includes(searchQuery)
      );
    }

    // Filter by role
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.primary_role === selectedRole);
    }

    setFilteredUsers(filtered);
  };

  const makeUserCoach = async (userId: number) => {
    try {
      await authService.makeUserCoach(userId);
      Alert.alert('Успех', 'Пользователь назначен тренером');
      loadUsers(); // Reload users to get updated data
    } catch (error: any) {
      console.error('Error making user coach:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось назначить тренера');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'parent': return 'Родитель';
      case 'athlete': return 'Спортсмен';
      case 'coach': return 'Тренер';
      default: return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'parent': return 'account-child';
      case 'athlete': return 'account-group';
      case 'coach': return 'account-tie';
      default: return 'account';
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

  // If not head coach, show access denied
  if (!isHeadCoach) {
    return (
      <Layout
        title="Управление пользователями"
        onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <View style={styles.accessDenied}>
          <MaterialCommunityIcons name="shield-alert" size={64} color="#E74C3C" />
          <Title style={styles.accessDeniedTitle}>Доступ запрещен</Title>
          <Paragraph style={styles.accessDeniedText}>
            Только главные тренеры могут управлять пользователями
          </Paragraph>
        </View>
      </Layout>
    );
  }

  return (
    <Layout
      title="Управление пользователями"
      onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}
    >
      <Searchbar
        placeholder="Поиск пользователей..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        iconColor="#E74C3C"
        placeholderTextColor="#B0BEC5"
      />

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip
            selected={selectedRole === 'all'}
            onPress={() => setSelectedRole('all')}
            style={styles.filterChip}
            textStyle={styles.filterChipText}
          >
            Все
          </Chip>
          <Chip
            selected={selectedRole === 'parent'}
            onPress={() => setSelectedRole('parent')}
            style={styles.filterChip}
            textStyle={styles.filterChipText}
          >
            Родители
          </Chip>
          <Chip
            selected={selectedRole === 'athlete'}
            onPress={() => setSelectedRole('athlete')}
            style={styles.filterChip}
            textStyle={styles.filterChipText}
          >
            Спортсмены
          </Chip>
          <Chip
            selected={selectedRole === 'coach'}
            onPress={() => setSelectedRole('coach')}
            style={styles.filterChip}
            textStyle={styles.filterChipText}
          >
            Тренеры
          </Chip>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E74C3C" />
            <Text style={styles.loadingText}>Загрузка пользователей...</Text>
          </View>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((userItem) => (
            <Card key={userItem.id} style={styles.userCard}>
              <Card.Content>
                <View style={styles.userHeader}>
                  <Avatar.Text 
                    size={50} 
                    label={userItem.full_name.charAt(0)} 
                    style={styles.userAvatar}
                    color="#fff"
                  />
                  <View style={styles.userInfo}>
                    <Title style={styles.userName}>{userItem.full_name}</Title>
                    <Text style={styles.userEmail}>{userItem.email}</Text>
                    <View style={styles.userMeta}>
                      <View style={styles.roleContainer}>
                        <MaterialCommunityIcons 
                          name={getRoleIcon(userItem.primary_role)} 
                          size={16} 
                          color="#E74C3C" 
                        />
                        <Text style={styles.roleText}>
                          {getRoleDisplayName(userItem.primary_role)}
                          {userItem.is_head_coach && ' (Главный тренер)'}
                        </Text>
                      </View>
                      <Text style={styles.userAge}>{calculateAge(userItem.birth_date)} лет</Text>
                    </View>
                  </View>
                </View>

                {userItem.primary_role !== 'coach' && !userItem.is_head_coach && (
                  <View style={styles.actionContainer}>
                    <Button
                      mode="contained"
                      onPress={() => {
                        Alert.alert(
                          'Назначить тренером',
                          `Вы уверены, что хотите назначить ${userItem.full_name} тренером?`,
                          [
                            { text: 'Отмена', style: 'cancel' },
                            { 
                              text: 'Назначить', 
                              onPress: () => makeUserCoach(userItem.id)
                            },
                          ]
                        );
                      }}
                      buttonColor="#E74C3C"
                      icon="account-tie"
                      style={styles.makeCoachButton}
                    >
                      Назначить тренером
                    </Button>
                  </View>
                )}
              </Card.Content>
            </Card>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-group" size={48} color="#B0BEC5" />
            <Text style={styles.emptyStateText}>
              {searchQuery || selectedRole !== 'all' 
                ? 'Пользователи не найдены' 
                : 'Нет пользователей'
              }
            </Text>
          </View>
        )}
      </ScrollView>

      <Sidebar isVisible={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </Layout>
  );
};

const styles = StyleSheet.create({
  searchBar: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#1B263B',
    borderRadius: 8,
  },
  filterContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: '#1B263B',
  },
  filterChipText: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    color: '#B0BEC5',
    fontSize: 16,
  },
  userCard: {
    marginBottom: 16,
    backgroundColor: '#1B263B',
    borderRadius: 12,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatar: {
    backgroundColor: '#E74C3C',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    color: '#B0BEC5',
    fontSize: 14,
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleText: {
    color: '#E74C3C',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  userAge: {
    color: '#B0BEC5',
    fontSize: 14,
  },
  actionContainer: {
    borderTopWidth: 1,
    borderTopColor: '#2C3E50',
    paddingTop: 16,
  },
  makeCoachButton: {
    borderRadius: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    marginTop: 16,
    color: '#B0BEC5',
    fontSize: 16,
    textAlign: 'center',
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  accessDeniedTitle: {
    color: '#E74C3C',
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedText: {
    color: '#B0BEC5',
    textAlign: 'center',
    fontSize: 16,
  },
  configCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#1B263B',
    borderRadius: 12,
  },
  configTitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  configText: {
    color: '#B0BEC5',
    fontSize: 12,
    marginBottom: 12,
  },
  configButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  configButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default UsersManagementPage; 