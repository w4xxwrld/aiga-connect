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
import progressService, { Progress } from '../services/progress';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';

interface ChildProfilePageProps {
  navigation?: any;
  route?: any;
}

const ChildProfilePage: React.FC<ChildProfilePageProps> = ({ navigation, route }) => {
  const { isSidebarOpen, setIsSidebarOpen } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [child, setChild] = useState<Child | null>(null);
  const [childProgress, setChildProgress] = useState<Progress | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);

  const childId = route?.params?.childId;
  const childName = route?.params?.childName;

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

  const getBeltName = (beltLevel: string) => {
    const beltNames: { [key: string]: string } = {
      'white': 'Белый пояс',
      'blue': 'Синий пояс',
      'purple': 'Фиолетовый пояс',
      'brown': 'Коричневый пояс',
      'black': 'Черный пояс',
    };
    return beltNames[beltLevel] || beltLevel;
  };

  const loadChildData = async () => {
    if (!childId) return;
    
    try {
      setLoading(true);
      const childData = await childrenService.getChildById(childId);
      setChild(childData);
    } catch (error: any) {
      console.error('Error loading child data:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные ребенка');
    } finally {
      setLoading(false);
    }
  };

  const loadChildProgress = async () => {
    if (!childId) return;
    
    try {
      setLoadingProgress(true);
      const progress = await progressService.getAthleteProgress(childId);
      setChildProgress(progress);
    } catch (error: any) {
      console.error('Error loading child progress:', error);
    } finally {
      setLoadingProgress(false);
    }
  };

  useEffect(() => {
    loadChildData();
    loadChildProgress();
  }, [childId]);

  const handleSidebarClose = useCallback(() => {
    setIsSidebarOpen(false);
  }, [setIsSidebarOpen]);

  if (loading) {
    return (
      <Layout title="Профиль ребенка" onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>Загрузка профиля...</Text>
        </View>
        <Sidebar isVisible={isSidebarOpen} onClose={handleSidebarClose} />
      </Layout>
    );
  }

  if (!child) {
    return (
      <Layout title="Профиль ребенка" onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ребенок не найден</Text>
          <Button
            mode="outlined"
            onPress={() => navigation?.goBack()}
            style={styles.errorButton}
            textColor="#E74C3C"
          >
            Назад
          </Button>
        </View>
        <Sidebar isVisible={isSidebarOpen} onClose={handleSidebarClose} />
      </Layout>
    );
  }

  return (
    <Layout title={`Профиль ${child.full_name}`} onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Child Profile Header */}
        <Card style={styles.profileHeaderCard}>
          <Card.Content style={styles.profileHeaderContent}>
            <Avatar.Text 
              size={80} 
              label={child.full_name.charAt(0)} 
              style={styles.avatar}
              color="#fff"
            />
            <View style={styles.profileInfo}>
              <Title style={styles.userName}>{child.full_name}</Title>
              <View style={styles.roleContainer}>
                <MaterialCommunityIcons 
                  name="account-group" 
                  size={20} 
                  color="#E74C3C" 
                />
                <Text style={styles.roleText}>Спортсмен</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Child Information */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account-details" size={24} color="#E74C3C" />
              <Title style={styles.sectionTitle}>Информация о ребенке</Title>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="calendar" size={20} color="#E74C3C" />
                <Text style={styles.infoLabel}>Дата рождения:</Text>
                <Text style={styles.infoValue}>
                  {new Date(child.birth_date).toLocaleDateString('ru-RU')} ({calculateAge(child.birth_date)} лет)
                </Text>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="email" size={20} color="#E74C3C" />
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{child.email || 'Не указан'}</Text>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="phone" size={20} color="#E74C3C" />
                <Text style={styles.infoLabel}>Телефон:</Text>
                <Text style={styles.infoValue}>{child.phone || 'Не указан'}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Child Progress */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="trophy" size={24} color="#E74C3C" />
              <Title style={styles.sectionTitle}>Прогресс</Title>
            </View>
            
            <Divider style={styles.divider} />
            
            {loadingProgress ? (
              <ActivityIndicator size="small" color="#E74C3C" />
            ) : childProgress ? (
              <View style={styles.progressContainer}>
                <View style={styles.progressItem}>
                  <MaterialCommunityIcons name="karate" size={24} color="#E74C3C" />
                  <View style={styles.progressInfo}>
                    <Text style={styles.progressLabel}>Текущий пояс</Text>
                    <Text style={styles.progressValue}>
                      {getBeltName(childProgress.current_belt || 'white')}
                    </Text>
                    {childProgress.current_stripes && childProgress.current_stripes > 0 && (
                      <Text style={styles.stripesText}>{childProgress.current_stripes} полосы</Text>
                    )}
                  </View>
                </View>

                <View style={styles.progressItem}>
                  <MaterialCommunityIcons name="calendar-check" size={24} color="#E74C3C" />
                  <View style={styles.progressInfo}>
                    <Text style={styles.progressLabel}>Последний экзамен</Text>
                    <Text style={styles.progressValue}>
                      {childProgress.last_promotion_date 
                        ? new Date(childProgress.last_promotion_date).toLocaleDateString('ru-RU')
                        : 'Не сдавался'
                      }
                    </Text>
                  </View>
                </View>

                <View style={styles.progressItem}>
                  <MaterialCommunityIcons name="trophy" size={24} color="#E74C3C" />
                  <View style={styles.progressInfo}>
                    <Text style={styles.progressLabel}>Участие в турнирах</Text>
                    <Text style={styles.progressValue}>
                      {childProgress.total_tournaments_participated || 0} турниров
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Прогресс не найден</Text>
              </View>
            )}
          </Card.Content>
        </Card>

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
                onPress={() => navigation?.navigate('Progress', { athleteId: child.id })}
                style={styles.actionButton}
                textColor="#E74C3C"
                icon="chart-line"
              >
                Подробный прогресс
              </Button>

              <Button
                mode="outlined"
                onPress={() => navigation?.navigate('Bookings', { athleteId: child.id })}
                style={styles.actionButton}
                textColor="#E74C3C"
                icon="calendar"
              >
                Записи на тренировки
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
      <Sidebar isVisible={isSidebarOpen} onClose={handleSidebarClose} />
    </Layout>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
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
    color: '#B0BEC5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D1B2A',
    padding: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#B0BEC5',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorButton: {
    marginTop: 8,
  },
  profileHeaderCard: {
    backgroundColor: '#1B263B',
    marginBottom: 16,
    borderRadius: 12,
  },
  profileHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#E74C3C',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
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
  progressContainer: {
    gap: 16,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressInfo: {
    flex: 1,
    marginLeft: 16,
  },
  progressLabel: {
    color: '#B0BEC5',
    fontSize: 14,
    marginBottom: 4,
  },
  progressValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  stripesText: {
    color: '#E74C3C',
    fontSize: 14,
    marginTop: 2,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyStateText: {
    color: '#B0BEC5',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ChildProfilePage; 