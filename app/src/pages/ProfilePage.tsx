import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Avatar,
  List,
  Divider,
  Text,
  Switch,
  TextInput,
  Chip,
} from 'react-native-paper';

interface ProfilePageProps {
  navigation: any;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ navigation }) => {
  const [isNotificationsEnabled, setIsNotificationsEnabled] = React.useState(true);
  const [isDarkModeEnabled, setIsDarkModeEnabled] = React.useState(false);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <Card style={styles.card}>
          <Card.Content style={styles.profileHeader}>
            <Avatar.Image 
              size={80} 
              source={{ uri: 'https://via.placeholder.com/80' }} 
            />
            <View style={styles.profileInfo}>
              <Title>Иван Дизайнер</Title>
              <Paragraph>UI/UX Дизайнер и Креативный директор</Paragraph>
              <View style={styles.statsContainer}>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>24</Text>
                  <Text style={styles.statLabel}>Проектов</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>156</Text>
                  <Text style={styles.statLabel}>Подписчиков</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>89</Text>
                  <Text style={styles.statLabel}>Подписок</Text>
                </View>
              </View>
            </View>
          </Card.Content>
          <Card.Actions>
            <Button mode="outlined" onPress={() => console.log('Edit profile')}>
              Редактировать профиль
            </Button>
            <Button mode="contained" onPress={() => console.log('Share profile')}>
              Поделиться
            </Button>
          </Card.Actions>
        </Card>

        {/* Skills */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Навыки и опыт</Title>
            <View style={styles.skillsContainer}>
              <Chip icon="palette" style={styles.skillChip}>UI Дизайн</Chip>
              <Chip icon="web" style={styles.skillChip}>UX Дизайн</Chip>
              <Chip icon="brush" style={styles.skillChip}>Брендинг</Chip>
              <Chip icon="code-tags" style={styles.skillChip}>Прототипирование</Chip>
              <Chip icon="chart-line" style={styles.skillChip}>Аналитика</Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Recent Work */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Недавние работы</Title>
            <List.Item
              title="Редизайн E-commerce приложения"
              description="Полный UI/UX редизайн мобильного приложения"
              left={(props: any) => <List.Icon {...props} icon="phone" />}
              right={(props: any) => <Text {...props}>2 недели назад</Text>}
            />
            <Divider />
            <List.Item
              title="Пакет брендинга"
              description="Логотип, цветовая палитра и гайдлайны бренда"
              left={(props: any) => <List.Icon {...props} icon="palette" />}
              right={(props: any) => <Text {...props}>1 месяц назад</Text>}
            />
            <Divider />
            <List.Item
              title="Дизайн веб-сайта"
              description="Адаптивный веб-сайт для IT-стартапа"
              left={(props: any) => <List.Icon {...props} icon="web" />}
              right={(props: any) => <Text {...props}>2 месяца назад</Text>}
            />
          </Card.Content>
        </Card>

        {/* Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Настройки аккаунта</Title>
            <List.Item
              title="Уведомления"
              description="Получать push-уведомления"
              left={(props: any) => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={isNotificationsEnabled}
                  onValueChange={setIsNotificationsEnabled}
                />
              )}
            />
            <Divider />
            <List.Item
              title="Темная тема"
              description="Использовать темную тему"
              left={(props: any) => <List.Icon {...props} icon="theme-light-dark" />}
              right={() => (
                <Switch
                  value={isDarkModeEnabled}
                  onValueChange={setIsDarkModeEnabled}
                />
              )}
            />
            <Divider />
            <List.Item
              title="Конфиденциальность"
              description="Управление настройками приватности"
              left={(props: any) => <List.Icon {...props} icon="shield" />}
              right={(props: any) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => console.log('Privacy settings')}
            />
            <Divider />
            <List.Item
              title="Помощь и поддержка"
              description="Получить помощь и связаться с поддержкой"
              left={(props: any) => <List.Icon {...props} icon="help-circle" />}
              right={(props: any) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => console.log('Help & Support')}
            />
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  profileHeader: {
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  skillChip: {
    marginRight: 8,
    marginBottom: 8,
  },
});

export default ProfilePage; 