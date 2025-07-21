import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  Avatar,
  List,
  Divider,
  Chip,
  Text,
} from 'react-native-paper';

interface HomePageProps {
  navigation: any;
}

const HomePage: React.FC<HomePageProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Welcome Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Добро пожаловать в AIGA Connect</Title>
            <Paragraph>
              Общайтесь с коллегами, делитесь своими работами и открывайте удивительные проекты.
            </Paragraph>
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => navigation.navigate('Profile')}>
              Профиль
            </Button>
            <Button mode="contained" onPress={() => navigation.navigate('Settings')}>
              Настройки
            </Button>
          </Card.Actions>
        </Card>

        {/* Featured Projects */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Рекомендуемые проекты</Title>
            <View style={styles.chipContainer}>
              <Chip icon="star" style={styles.chip}>UI/UX Дизайн</Chip>
              <Chip icon="palette" style={styles.chip}>Брендинг</Chip>
              <Chip icon="web" style={styles.chip}>Веб-дизайн</Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Recent Activity */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Недавняя активность</Title>
            <List.Item
              title="Новый проект опубликован"
              description="Иван Иванов поделился новым проектом брендинга"
              left={(props: any) => <List.Icon {...props} icon="account" />}
              right={(props: any) => <Text {...props}>2ч назад</Text>}
            />
            <Divider />
            <List.Item
              title="Начат дизайн-челлендж"
              description="Еженедельный челлендж: Минималистичный логотип"
              left={(props: any) => <List.Icon {...props} icon="trophy" />}
              right={(props: any) => <Text {...props}>1д назад</Text>}
            />
            <Divider />
            <List.Item
              title="Событие сообщества"
              description="Встреча дизайнеров на выходных"
              left={(props: any) => <List.Icon {...props} icon="calendar" />}
              right={(props: any) => <Text {...props}>3д назад</Text>}
            />
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Быстрые действия</Title>
            <View style={styles.buttonContainer}>
                              <Button 
                  mode="outlined" 
                  icon="plus" 
                  style={styles.actionButton}
                  onPress={() => console.log('Create project')}
                >
                  Новый проект
                </Button>
                <Button 
                  mode="outlined" 
                  icon="account-group" 
                  style={styles.actionButton}
                  onPress={() => console.log('Find designers')}
                >
                  Найти дизайнеров
                </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => console.log('FAB pressed')}
      />
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
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default HomePage; 