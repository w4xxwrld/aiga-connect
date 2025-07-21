import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  List,
  Divider,
  Switch,
  TextInput,
  RadioButton,
  Text,
  Chip,
} from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { useAppContext } from '../context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsPageProps {
  navigation: any;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ navigation }) => {
  const [isNotificationsEnabled, setIsNotificationsEnabled] = React.useState(true);
  const [isDarkModeEnabled, setIsDarkModeEnabled] = React.useState(false);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = React.useState(true);
  const [email, setEmail] = React.useState('ivan.dizayner@example.com');
  const [displayName, setDisplayName] = React.useState('Иван Дизайнер');
  const [bio, setBio] = React.useState('UI/UX Дизайнер, увлеченный созданием красивых и функциональных интерфейсов.');
  const [selectedLanguage, setSelectedLanguage] = React.useState('russian');
  const [fontSize, setFontSize] = React.useState(16);
  const { setHasSeenGreeting, setUserRole } = useAppContext();

  const resetApp = async () => {
    try {
      await AsyncStorage.clear();
      setHasSeenGreeting(false);
      setUserRole('parent'); // Set a default role
      console.log('App reset successfully');
      // Navigate back to greeting page
      navigation.reset({
        index: 0,
        routes: [{ name: 'Greeting' }],
      });
    } catch (error) {
      console.error('Error resetting app:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Настройки профиля</Title>
            <TextInput
              label="Отображаемое имя"
              value={displayName}
              onChangeText={setDisplayName}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
            />
            <TextInput
              label="О себе"
              value={bio}
              onChangeText={setBio}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
            />
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => console.log('Save profile')}>
              Сохранить изменения
            </Button>
          </Card.Actions>
        </Card>

        {/* App Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Настройки приложения</Title>
            <List.Item
              title="Push-уведомления"
              description="Получать уведомления о новых проектах и обновлениях"
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
              description="Использовать темную тему во всем приложении"
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
              title="Автосохранение"
              description="Автоматически сохранять вашу работу"
              left={(props: any) => <List.Icon {...props} icon="content-save" />}
              right={() => (
                <Switch
                  value={isAutoSaveEnabled}
                  onValueChange={setIsAutoSaveEnabled}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Language Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Язык</Title>
            <RadioButton.Group onValueChange={value => setSelectedLanguage(value)} value={selectedLanguage}>
              <RadioButton.Item label="Русский" value="russian" />
              <RadioButton.Item label="English" value="english" />
              <RadioButton.Item label="Қазақша" value="kazakh" />
              <RadioButton.Item label="Español" value="spanish" />
            </RadioButton.Group>
          </Card.Content>
        </Card>

        {/* Font Size */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Размер шрифта</Title>
            <Text>Текущий размер: {fontSize}px</Text>
            <Slider
              value={fontSize}
              onValueChange={setFontSize}
              minimumValue={12}
              maximumValue={24}
              step={1}
              style={styles.slider}
            />
            <View style={styles.fontPreview}>
              <Text style={{ fontSize: fontSize }}>
                Так будет выглядеть ваш текст с выбранным размером шрифта.
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Privacy Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Конфиденциальность</Title>
            <List.Item
              title="Видимость профиля"
              description="Кто может видеть ваш профиль"
              left={(props: any) => <List.Icon {...props} icon="account-eye" />}
              right={(props: any) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => console.log('Profile visibility')}
            />
            <Divider />
            <List.Item
              title="Использование данных"
              description="Управление использованием ваших данных"
              left={(props: any) => <List.Icon {...props} icon="database" />}
              right={(props: any) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => console.log('Data usage')}
            />
            <Divider />
            <List.Item
              title="Экспорт данных"
              description="Скачать ваши данные"
              left={(props: any) => <List.Icon {...props} icon="download" />}
              right={(props: any) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => console.log('Export data')}
            />
          </Card.Content>
        </Card>

        {/* Account Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Аккаунт</Title>
            <Button 
              mode="outlined" 
              icon="lock" 
              style={styles.actionButton}
              onPress={() => console.log('Change password')}
            >
              Изменить пароль
            </Button>
            <Button 
              mode="outlined" 
              icon="account-multiple" 
              style={styles.actionButton}
              onPress={() => console.log('Manage devices')}
            >
              Управление устройствами
            </Button>
            <Button 
              mode="outlined" 
              icon="delete" 
              style={styles.actionButton}
              onPress={() => console.log('Delete account')}
              textColor="red"
            >
              Удалить аккаунт
            </Button>
          </Card.Content>
        </Card>

        {/* Debug/Reset Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Отладка</Title>
            <Button 
              mode="outlined" 
              icon="refresh" 
              style={styles.actionButton}
              onPress={resetApp}
              textColor="orange"
            >
              Сбросить приложение (показать приветствие)
            </Button>
          </Card.Content>
        </Card>

        {/* About */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>О приложении</Title>
            <Paragraph>AIGA Connect v1.0.0</Paragraph>
            <Paragraph>Общайтесь с коллегами и делитесь своим творчеством.</Paragraph>
            <View style={styles.aboutLinks}>
              <Button mode="text" onPress={() => console.log('Terms of Service')}>
                Условия использования
              </Button>
              <Button mode="text" onPress={() => console.log('Privacy Policy')}>
                Политика конфиденциальности
              </Button>
              <Button mode="text" onPress={() => console.log('Help & Support')}>
                Помощь и поддержка
              </Button>
            </View>
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
  input: {
    marginBottom: 12,
  },
  slider: {
    marginVertical: 16,
  },
  fontPreview: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginTop: 8,
  },
  actionButton: {
    marginBottom: 8,
  },
  aboutLinks: {
    marginTop: 16,
  },
});

export default SettingsPage; 