import React, { useState } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import { useAppContext } from '../context/AppContext';
import authService from '../services/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Layout from '../components/Layout';

const ProfilePage: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { user, userRole, logout, refreshUser } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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

  const getRoleDisplayName = (role: string | null) => {
    switch (role) {
      case 'athlete': return 'Ученик';
      case 'coach': return user?.is_head_coach ? 'Главный профессор' : 'Профессор';
      case 'admin': return 'Администратор';
      default: return role || 'Пользователь';
    }
  };

  const getRoleIcon = (role: string | null): keyof typeof MaterialCommunityIcons.glyphMap => {
    switch (role) {
      case 'athlete': return 'account-group';
      case 'coach': return user?.is_head_coach ? 'crown' : 'account-tie';
      case 'admin': return 'shield-account';
      default: return 'account';
    }
  };

  const handleUploadPhoto = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Требуется разрешение',
          'Пожалуйста, предоставьте доступ к библиотеке фотографий в настройках'
        );
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingPhoto(true);
        try {
          // Get file type from URI
          const uri = result.assets[0].uri;
          const fileType = uri.endsWith('.png') ? 'image/png' : 'image/jpeg';

          // Upload photo
          await authService.uploadPhoto(uri, fileType);

          // Refresh user data from server
          await refreshUser();

          Alert.alert('Успешно', 'Фото профиля обновлено');
        } catch (error: any) {
          console.error('Photo upload error:', error);
          Alert.alert('Ошибка', error.message || 'Не удалось загрузить фото');
        } finally {
          setUploadingPhoto(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать фото');
    }
  };

  const handleDeletePhoto = async () => {
    if (!user?.photo_url) {
      Alert.alert('Ошибка', 'Нет фото для удаления');
      return;
    }

    Alert.alert(
      'Удалить фото',
      'Вы уверены, что хотите удалить фото профиля?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            setUploadingPhoto(true);
            try {
              await authService.deletePhoto();

              // Refresh user data from server
              await refreshUser();

              Alert.alert('Успешно', 'Фото профиля удалено');
            } catch (error: any) {
              console.error('Photo delete error:', error);
              Alert.alert('Ошибка', error.message || 'Не удалось удалить фото');
            } finally {
              setUploadingPhoto(false);
            }
          }
        }
      ]
    );
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
      showProfile={false}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <Card style={styles.profileHeaderCard}>
          <Card.Content style={styles.profileHeaderContent}>
            {user?.photo_url ? (
              <Avatar.Image
                size={80}
                source={{ uri: user.photo_url }}
                style={styles.avatar}
              />
            ) : (
              <Avatar.Text
                size={80}
                label={user?.full_name?.charAt(0) || 'U'}
                style={styles.avatar}
                color="#fff"
              />
            )}
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

            {/* Photo Action Buttons */}
            <View style={styles.photoButtonsContainer}>
              <Button
                mode="outlined"
                onPress={handleUploadPhoto}
                style={styles.photoActionButton}
                textColor="#E74C3C"
                icon="upload"
                disabled={uploadingPhoto}
                loading={uploadingPhoto}
                compact
              >
                Загрузить фото
              </Button>

              {user?.photo_url && (
                <Button
                  mode="outlined"
                  onPress={handleDeletePhoto}
                  style={styles.photoActionButton}
                  textColor="#F44336"
                  icon="delete"
                  disabled={uploadingPhoto}
                  compact
                >
                  Удалить фото
                </Button>
              )}
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

              {user?.emergency_contact && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="phone-alert" size={20} color="#E74C3C" />
                  <Text style={styles.infoLabel}>Экстренный контакт:</Text>
                  <Text style={styles.infoValue}>{user.emergency_contact}</Text>
                </View>
              )}

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="calendar-clock" size={20} color="#E74C3C" />
                <Text style={styles.infoLabel}>Дата регистрации:</Text>
                <Text style={styles.infoValue}>
                  {user?.created_at ? formatDate(user.created_at) : 'Не указана'}
                </Text>
              </View>


            </View>
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
                onPress={() => navigation?.navigate('EditProfile')}
                style={styles.actionButton}
                textColor="#E74C3C"
                icon="pencil"
              >
                Редактировать профиль
              </Button>

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
                textColor="#fff"
                icon="logout"
              >
                Выйти из аккаунта
              </Button>
            </View>
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
    backgroundColor: '#6B7280',
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
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    color: '#B0BEC5',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 12,
    textAlign: 'left',
  },
  infoValue: {
    color: '#fff',
    fontSize: 15,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  infoSpacer: {
    width: 44, // Same width as icon + margin
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
  childItemContent: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  childItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    width: '100%',
    justifyContent: 'center',
  },
  photoActionButton: {
    flex: 1,
  },
});

export default ProfilePage; 