import React from 'react';
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
  Paragraph,
  Button,
  Avatar,
  List,
  Divider,
  Chip,
} from 'react-native-paper';
import { useAppContext } from '../context/AppContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ProfilePageProps {
  navigation: any;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ navigation }) => {
  const { user, userRole, logout, linkedChildren } = useAppContext();

  const handleLogout = () => {
    Alert.alert(
      'Выход',
      'Вы уверены, что хотите выйти из аккаунта?',
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: () => logout(navigation),
        },
      ]
    );
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'parent':
        return 'Родитель';
      case 'athlete':
        return 'Спортсмен';
      case 'coach':
        return 'Тренер';
      default:
        return 'Пользователь';
    }
  };

  const getRoleSpecificStats = () => {
    switch (userRole) {
      case 'parent':
        return [
          { label: 'Дети в академии', value: '2', icon: 'account-child' },
          { label: 'Тренировок в месяц', value: '24', icon: 'calendar' },
          { label: 'Достижений', value: '8', icon: 'trophy' },
        ];
      case 'athlete':
        return [
          { label: 'Тренировок в месяц', value: '12', icon: 'calendar' },
          { label: 'Текущий пояс', value: 'Синий', icon: 'trophy' },
          { label: 'Соревнований', value: '5', icon: 'medal' },
        ];
      case 'coach':
        return [
          { label: 'Учеников', value: '15', icon: 'account-group' },
          { label: 'Групп', value: '3', icon: 'account-multiple' },
          { label: 'Тренировок в неделю', value: '12', icon: 'calendar' },
        ];
      default:
        return [];
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <Card.Content>
            <View style={styles.profileHeader}>
              <Avatar.Text 
                size={80} 
                label={user?.full_name?.charAt(0) || 'U'} 
                style={styles.avatar}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {user?.full_name || 'Пользователь'}
                </Text>
                <Text style={styles.profileEmail}>
                  {user?.email || 'Email не указан'}
                </Text>
                <Chip 
                  mode="outlined" 
                  style={styles.roleChip}
                  textStyle={styles.roleChipText}
                >
                  {getRoleDisplayName(userRole || '')}
                </Chip>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Linked Children Section (Parent Only) */}
        {userRole === 'parent' && linkedChildren.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Мои дети</Title>
              {linkedChildren.map((relationship, index) => (
                <View key={relationship.id} style={styles.childItem}>
                  <View style={styles.childInfo}>
                    <Avatar.Text 
                      size={50} 
                      label={(relationship.child.full_name || 'C').charAt(0)} 
                      style={styles.childAvatar}
                    />
                    <View style={styles.childDetails}>
                      <Text style={styles.childName}>
                        {relationship.child.full_name || `Ребенок ${relationship.child.iin}`}
                      </Text>
                      <Text style={styles.childIin}>ИИН: {relationship.child.iin}</Text>
                      <Text style={styles.childRole}>Спортсмен</Text>
                    </View>
                  </View>
                  <Button
                    mode="outlined"
                    onPress={() => Alert.alert('Информация', 'Просмотр профиля ребенка')}
                    style={styles.viewChildButton}
                    textColor="#E74C3C"
                  >
                    Профиль
                  </Button>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Statistics */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Статистика</Title>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <MaterialCommunityIcons name="calendar-check" size={24} color="#E74C3C" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>12</Text>
                  <Text style={styles.statLabel}>Тренировок</Text>
                </View>
              </View>
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <MaterialCommunityIcons name="trophy" size={24} color="#E74C3C" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>3</Text>
                  <Text style={styles.statLabel}>Достижения</Text>
                </View>
              </View>
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <MaterialCommunityIcons name="account-group" size={24} color="#E74C3C" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{userRole === 'parent' ? linkedChildren.length : '5'}</Text>
                  <Text style={styles.statLabel}>{userRole === 'parent' ? 'Дети' : 'Группы'}</Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Profile Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Настройки профиля</Title>
            <List.Item
              title="Редактировать профиль"
              description="Изменить личную информацию"
              left={(props) => <List.Icon {...props} icon="account-edit" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Информация', 'Функция в разработке')}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Изменить пароль"
              description="Обновить пароль аккаунта"
              left={(props) => <List.Icon {...props} icon="lock" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Информация', 'Функция в разработке')}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Уведомления"
              description="Настройки уведомлений"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Информация', 'Функция в разработке')}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
          </Card.Content>
        </Card>

        {/* Account Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Аккаунт</Title>
            <List.Item
              title="Помощь и поддержка"
              description="Связаться с поддержкой"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Информация', 'Функция в разработке')}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="О приложении"
              description="Версия и информация"
              left={(props) => <List.Icon {...props} icon="information" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('О приложении', 'AIGA Connect v1.0.0\nTap. Train. Triumph.')}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
          </Card.Content>
        </Card>

        {/* Logout Button */}
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          textColor="#E74C3C"
          buttonColor="#1B263B"
        >
          Выйти из аккаунта
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  content: {
    padding: 16,
  },
  profileCard: {
    marginBottom: 16,
    backgroundColor: '#1B263B',
  },
  profileHeader: {
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
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#fff',
  },
  profileEmail: {
    fontSize: 14,
    color: '#B0BEC5',
    marginBottom: 8,
  },
  roleChip: {
    alignSelf: 'flex-start',
    borderColor: '#E74C3C',
  },
  roleChipText: {
    fontSize: 12,
    color: '#E74C3C',
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#1B263B',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C3E50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#B0BEC5',
    textAlign: 'center',
  },
  listTitle: {
    color: '#fff',
  },
  listDescription: {
    color: '#B0BEC5',
  },
  divider: {
    backgroundColor: '#2C3E50',
  },
  logoutButton: {
    marginTop: 8,
    borderColor: '#E74C3C',
  },
  childItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
  },
  childInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childAvatar: {
    backgroundColor: '#2C3E50',
    marginRight: 10,
  },
  childDetails: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  childIin: {
    fontSize: 12,
    color: '#B0BEC5',
    marginTop: 2,
  },
  childRole: {
    fontSize: 12,
    color: '#B0BEC5',
    marginTop: 2,
  },
  viewChildButton: {
    marginTop: 10,
    borderColor: '#E74C3C',
  },
});

export default ProfilePage; 