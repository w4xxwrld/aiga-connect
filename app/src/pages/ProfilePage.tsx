import React, { useState, useEffect, useCallback } from 'react';
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
  ActivityIndicator,
  Avatar,
  Divider,
} from 'react-native-paper';
import { useAppContext } from '../context/AppContext';
import childrenService, { Child } from '../services/children';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';

const ProfilePage: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { user, userRole, logout, isSidebarOpen, setIsSidebarOpen } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [linkedChildren, setLinkedChildren] = useState<Child[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Выйти из аккаунта',
      'Вы уверены, что хотите выйти?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await logout();
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось выйти из аккаунта');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const loadLinkedChildren = async () => {
    if (userRole !== 'parent') return;
    
    try {
      setLoadingChildren(true);
      const children = await childrenService.getMyChildren();
      setLinkedChildren(children);
    } catch (error: any) {
      console.error('Error loading linked children:', error);
    } finally {
      setLoadingChildren(false);
    }
  };

  useEffect(() => {
    loadLinkedChildren();
  }, [userRole]);

  const handleSidebarClose = useCallback(() => {
    setIsSidebarOpen(false);
  }, [setIsSidebarOpen]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E74C3C" />
        <Text style={styles.loadingText}>Выход из аккаунта...</Text>
      </View>
    );
  }

    return (
    <Layout
      title="Профиль"
      onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <Card style={styles.profileHeaderCard}>
          <Card.Content style={styles.profileHeaderContent}>
            <Avatar.Text 
              size={80} 
              label={user?.full_name?.charAt(0) || 'U'} 
              style={styles.avatar}
              color="#fff"
            />
            <View style={styles.profileInfo}>
              <Title style={styles.userName}>{user?.full_name || 'Пользователь'}</Title>
              <View style={styles.roleContainer}>
                <MaterialCommunityIcons 
                  name={getRoleIcon(userRole || '')} 
                  size={20} 
                  color="#E74C3C" 
                />
                <Text style={styles.roleText}>{getRoleDisplayName(userRole || '')}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Personal Information */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account-details" size={24} color="#E74C3C" />
              <Title style={styles.sectionTitle}>Личная информация</Title>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="email" size={20} color="#E74C3C" />
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{user?.email || 'Не указан'}</Text>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="phone" size={20} color="#E74C3C" />
                <Text style={styles.infoLabel}>Телефон:</Text>
                <Text style={styles.infoValue}>{user?.phone || 'Не указан'}</Text>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="calendar" size={20} color="#E74C3C" />
                <Text style={styles.infoLabel}>Дата рождения:</Text>
                <Text style={styles.infoValue}>
                  {user?.birth_date ? formatDate(user.birth_date) : 'Не указана'}
                </Text>
              </View>

              {user?.birth_date && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="cake" size={20} color="#E74C3C" />
                  <Text style={styles.infoLabel}>Возраст:</Text>
                  <Text style={styles.infoValue}>{calculateAge(user.birth_date)} лет</Text>
                </View>
              )}

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="card-account-details" size={20} color="#E74C3C" />
                <Text style={styles.infoLabel}>ИИН:</Text>
                <Text style={styles.infoValue}>{user?.iin || 'Не указан'}</Text>
              </View>

              {user?.emergency_contact && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="phone-alert" size={20} color="#E74C3C" />
                  <Text style={styles.infoLabel}>Экстренный контакт:</Text>
                  <Text style={styles.infoValue}>{user.emergency_contact}</Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Account Information */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account-cog" size={24} color="#E74C3C" />
              <Title style={styles.sectionTitle}>Информация об аккаунте</Title>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="account" size={20} color="#E74C3C" />
                <Text style={styles.infoLabel}>ID:</Text>
                <Text style={styles.infoValue}>{user?.id || 'Не указан'}</Text>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="calendar-clock" size={20} color="#E74C3C" />
                <Text style={styles.infoLabel}>Дата регистрации:</Text>
                <Text style={styles.infoValue}>
                  {user?.created_at ? formatDate(user.created_at) : 'Не указана'}
                </Text>
              </View>

              {user?.is_head_coach && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="crown" size={20} color="#E74C3C" />
                  <Text style={styles.infoLabel}>Статус:</Text>
                  <Text style={styles.infoValue}>Главный тренер</Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Linked Children Section (for parents) */}
        {userRole === 'parent' && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="account-child" size={24} color="#E74C3C" />
                <Title style={styles.sectionTitle}>Мои дети</Title>
              </View>
              
              <Divider style={styles.divider} />
              
              {loadingChildren ? (
                <ActivityIndicator size="small" color="#E74C3C" />
              ) : linkedChildren.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>У вас пока нет связанных детей</Text>
                  <Button
                    mode="outlined"
                    onPress={() => navigation?.navigate('LinkChild')}
                    style={styles.emptyStateButton}
                    textColor="#E74C3C"
                    icon="plus"
                  >
                    Связать ребенка
                  </Button>
                </View>
              ) : (
                <View style={styles.childrenContainer}>
                  {linkedChildren.map((child) => (
                    <View key={child.id} style={styles.childItem}>
                      <Avatar.Text 
                        size={40} 
                        label={child.full_name.charAt(0)} 
                        style={styles.childAvatar}
                        color="#fff"
                      />
                      <View style={styles.childInfo}>
                        <Text style={styles.childName}>{child.full_name}</Text>
                        <Text style={styles.childAge}>{calculateAge(child.birth_date)} лет</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Actions */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="cog" size={24} color="#E74C3C" />
              <Title style={styles.sectionTitle}>Действия</Title>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.actionsContainer}>
              <Button
                mode="outlined"
                onPress={() => navigation?.navigate('EditProfile')}
                style={styles.actionButton}
                textColor="#E74C3C"
                icon="pencil"
              >
                Редактировать профиль
              </Button>

              {userRole === 'parent' && (
                <Button
                  mode="outlined"
                  onPress={() => navigation?.navigate('LinkChild')}
                  style={styles.actionButton}
                  textColor="#E74C3C"
                  icon="account-child"
                >
                  Связать ребенка
                </Button>
              )}

              <Button
                mode="outlined"
                onPress={() => {
                  // TODO: Implement change password functionality
                  Alert.alert('Информация', 'Функция смены пароля будет добавлена позже');
                }}
                style={styles.actionButton}
                textColor="#E74C3C"
                icon="lock"
              >
                Сменить пароль
              </Button>

              <Button
                mode="contained"
                onPress={handleLogout}
                style={[styles.actionButton, styles.logoutButton]}
                buttonColor="#F44336"
                icon="logout"
              >
                Выйти из аккаунта
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Sidebar */}
      <Sidebar
        isVisible={isSidebarOpen}
        onClose={handleSidebarClose}
      />
    </Layout>
  );
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileHeaderCard: {
    backgroundColor: '#1B263B',
    marginBottom: 16,
    borderRadius: 12,
  },
  profileHeaderContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    backgroundColor: '#E74C3C',
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C3E50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  sectionCard: {
    backgroundColor: '#1B263B',
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  divider: {
    backgroundColor: '#2C3E50',
    marginBottom: 16,
  },
  infoContainer: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    color: '#B0BEC5',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 24,
    minWidth: 140,
  },
  infoValue: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    marginTop: 4,
  },
  logoutButton: {
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyStateText: {
    color: '#B0BEC5',
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateButton: {
    marginTop: 8,
  },
  childrenContainer: {
    gap: 12,
  },
  childItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  childAvatar: {
    backgroundColor: '#E74C3C',
    marginRight: 12,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  childAge: {
    color: '#B0BEC5',
    fontSize: 14,
  },
});

export default ProfilePage; 