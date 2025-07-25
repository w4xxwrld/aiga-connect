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
  Paragraph,
  Switch,
  List,
  Divider,
  Button,
  TextInput,
  Dialog,
  Portal,
  Chip,
} from 'react-native-paper';
import { useAppContext } from '../context/AppContext';
import childrenService from '../services/children';
import notificationService from '../services/notifications';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const SettingsPage: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { userRole, linkedChildren, loadChildren } = useAppContext();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [childProfileDialogVisible, setChildProfileDialogVisible] = useState(false);
  const [childIin, setChildIin] = useState('');
  const [linkingChild, setLinkingChild] = useState(false);

  // Debug information
  console.log('SettingsPage - userRole:', userRole);
  console.log('SettingsPage - linkedChildren:', linkedChildren);
  console.log('SettingsPage - linkedChildren.length:', linkedChildren.length);

  const handleLinkChildProfile = async () => {
    if (childIin.length !== 12 || !/^\d+$/.test(childIin)) {
      Alert.alert('Ошибка', 'ИИН должен содержать ровно 12 цифр');
      return;
    }

    setLinkingChild(true);
    try {
      await childrenService.linkChild(childIin);
      
      Alert.alert(
        'Успешно',
        `Профиль ребенка с ИИН ${childIin} успешно привязан к вашему аккаунту`,
        [
          {
            text: 'OK',
            onPress: async () => {
              setChildProfileDialogVisible(false);
              setChildIin('');
              // Reload children list
              await loadChildren();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Ошибка при привязке профиля ребенка');
    } finally {
      setLinkingChild(false);
    }
  };

  const handleUnlinkChild = async (childId: number, childName: string) => {
    Alert.alert(
      'Отвязать ребенка',
      `Вы уверены, что хотите отвязать ${childName} от вашего аккаунта?`,
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Отвязать',
          style: 'destructive',
          onPress: async () => {
    try {
              await childrenService.unlinkChild(childId);
              Alert.alert('Успешно', 'Ребенок отвязан от вашего аккаунта');
              await loadChildren();
            } catch (error: any) {
              Alert.alert('Ошибка', error.message || 'Ошибка при отвязке ребенка');
            }
          },
        },
      ]
    );
  };

  const getRoleSpecificSettings = () => {
    switch (userRole) {
      case 'parent':
        return [
          {
            title: 'Привязать профиль ребенка',
            description: 'Добавить профиль ребенка для отслеживания прогресса',
            icon: 'account-child',
            action: () => setChildProfileDialogVisible(true),
          },
          {
            title: 'Уведомления о тренировках',
            description: 'Получать уведомления о расписании ребенка',
            icon: 'calendar',
            action: () => Alert.alert('Информация', 'Функция в разработке'),
          },
          {
            title: 'Отчеты о прогрессе',
            description: 'Еженедельные отчеты о достижениях',
            icon: 'chart-line',
            action: () => Alert.alert('Информация', 'Функция в разработке'),
          },
        ];
      case 'athlete':
        return [
          {
            title: 'Цели тренировок',
            description: 'Установить личные цели и задачи',
            icon: 'target',
            action: () => Alert.alert('Информация', 'Функция в разработке'),
          },
          {
            title: 'Напоминания о тренировках',
            description: 'Уведомления о предстоящих тренировках',
            icon: 'bell-ring',
            action: () => Alert.alert('Информация', 'Функция в разработке'),
          },
          {
            title: 'Дневник тренировок',
            description: 'Вести личный дневник тренировок',
            icon: 'notebook',
            action: () => Alert.alert('Информация', 'Функция в разработке'),
          },
        ];
      case 'coach':
        return [
          {
            title: 'Управление группами',
            description: 'Настройки групп и расписания',
            icon: 'account-group',
            action: () => Alert.alert('Информация', 'Функция в разработке'),
          },
          {
            title: 'Уведомления родителям',
            description: 'Автоматические уведомления о прогрессе',
            icon: 'message-text',
            action: () => Alert.alert('Информация', 'Функция в разработке'),
          },
          {
            title: 'Отчеты по группам',
            description: 'Статистика и аналитика групп',
            icon: 'chart-bar',
            action: () => Alert.alert('Информация', 'Функция в разработке'),
          },
        ];
      default:
        return [];
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Debug Information (Development Only) */}
        {__DEV__ && (
        <Card style={styles.card}>
          <Card.Content>
              <Title style={styles.cardTitle}>Debug Info</Title>
              <Text style={styles.debugText}>User Role: {userRole}</Text>
              <Text style={styles.debugText}>Children Count: {linkedChildren.length}</Text>
              <Text style={styles.debugText}>Children Data: {JSON.stringify(linkedChildren, null, 2)}</Text>
          </Card.Content>
        </Card>
        )}

        {/* App Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Настройки приложения</Title>
            <List.Item
              title="Уведомления"
              description="Настройки и управление уведомлениями"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation?.navigate('Notifications')}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Push-уведомления"
              description="Получать уведомления на устройство"
              left={(props) => <List.Icon {...props} icon="cellphone" />}
              right={() => (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#2C3E50', true: '#E74C3C' }}
                  thumbColor={notificationsEnabled ? '#fff' : '#B0BEC5'}
                />
              )}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Темная тема"
              description="Использовать темную тему"
              left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
              right={() => (
                <Switch
                  value={darkModeEnabled}
                  onValueChange={setDarkModeEnabled}
                  trackColor={{ false: '#2C3E50', true: '#E74C3C' }}
                  thumbColor={darkModeEnabled ? '#fff' : '#B0BEC5'}
                />
              )}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Язык"
              description="Русский"
              left={(props) => <List.Icon {...props} icon="translate" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Информация', 'Функция в разработке')}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
          </Card.Content>
        </Card>

        {/* Linked Children Section (Parent Only) */}
        {userRole === 'parent' && (
        <Card style={styles.card}>
          <Card.Content>
              <Title style={styles.cardTitle}>Привязанные дети</Title>
              {linkedChildren.length > 0 ? (
                linkedChildren.map((relationship, index) => (
                  <View key={relationship.id}>
                    <List.Item
                      title={relationship.child.full_name || `Ребенок ${relationship.child.iin}`}
                      description={`ИИН: ${relationship.child.iin}`}
                      left={(props) => <List.Icon {...props} icon="account-child" />}
                      right={() => (
                        <Button
                          mode="text"
                          onPress={() => handleUnlinkChild(relationship.child.id, relationship.child.full_name || 'ребенка')}
                          textColor="#E74C3C"
                          compact
                        >
                          Отвязать
                        </Button>
                      )}
                      titleStyle={styles.listTitle}
                      descriptionStyle={styles.listDescription}
                    />
                    {index < linkedChildren.length - 1 && <Divider style={styles.divider} />}
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="account-child-outline" size={48} color="#B0BEC5" />
                  <Text style={styles.emptyStateText}>Нет привязанных детей</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Нажмите "Привязать профиль ребенка" чтобы добавить ребенка
                  </Text>
                </View>
              )}
          </Card.Content>
        </Card>
        )}

        {/* Role Specific Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>
              {userRole === 'parent' ? 'Настройки родителя' :
               userRole === 'athlete' ? 'Настройки спортсмена' :
               userRole === 'coach' ? 'Настройки тренера' : 'Настройки'}
            </Title>
            {getRoleSpecificSettings().map((setting, index) => (
              <React.Fragment key={index}>
                <List.Item
                  title={setting.title}
                  description={setting.description}
                  left={(props) => <List.Icon {...props} icon={setting.icon as any} />}
                  right={(props) => <List.Icon {...props} icon="chevron-right" />}
                  onPress={setting.action}
                  titleStyle={styles.listTitle}
                  descriptionStyle={styles.listDescription}
                />
                {index < getRoleSpecificSettings().length - 1 && <Divider style={styles.divider} />}
              </React.Fragment>
            ))}
          </Card.Content>
        </Card>

        {/* Privacy & Security */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Конфиденциальность и безопасность</Title>
            <List.Item
              title="Конфиденциальность"
              description="Управление настройками приватности"
              left={(props) => <List.Icon {...props} icon="shield" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Информация', 'Функция в разработке')}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Двухфакторная аутентификация"
              description="Дополнительная защита аккаунта"
              left={(props) => <List.Icon {...props} icon="lock" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Информация', 'Функция в разработке')}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="История активности"
              description="Просмотр истории входа в аккаунт"
              left={(props) => <List.Icon {...props} icon="history" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Информация', 'Функция в разработке')}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
          </Card.Content>
        </Card>

        {/* Data & Storage */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Данные и хранилище</Title>
            <List.Item
              title="Экспорт данных"
              description="Скачать все ваши данные"
              left={(props) => <List.Icon {...props} icon="download" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Информация', 'Функция в разработке')}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Очистить кэш"
              description="Освободить место на устройстве"
              left={(props) => <List.Icon {...props} icon="delete" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Информация', 'Кэш очищен')}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
          </Card.Content>
        </Card>

        {/* Child Profile Dialog */}
        <Portal>
          <Dialog
            visible={childProfileDialogVisible}
            onDismiss={() => setChildProfileDialogVisible(false)}
            style={styles.dialog}
          >
            <Dialog.Title style={styles.dialogTitle}>Привязать профиль ребенка</Dialog.Title>
            <Dialog.Content>
              <Paragraph style={styles.dialogText}>
                Введите ИИН ребенка для привязки профиля к вашему аккаунту
              </Paragraph>
              <TextInput
                label="ИИН ребенка (12 цифр)"
                value={childIin}
                onChangeText={setChildIin}
              mode="outlined" 
                keyboardType="numeric"
                maxLength={12}
                style={styles.dialogInput}
                theme={{ 
                  colors: { 
                    primary: '#E74C3C',
                    onSurfaceVariant: '#fff',
                    placeholder: '#fff',
                    onSurface: '#fff'
                  } 
                }}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setChildProfileDialogVisible(false)} textColor="#B0BEC5">
                Отмена
              </Button>
              <Button 
                onPress={handleLinkChildProfile} 
                textColor="#E74C3C"
                loading={linkingChild}
                disabled={linkingChild}
              >
                Привязать
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
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
  listTitle: {
    color: '#fff',
  },
  listDescription: {
    color: '#B0BEC5',
  },
  divider: {
    backgroundColor: '#2C3E50',
  },
  dialog: {
    backgroundColor: '#1B263B',
  },
  dialogTitle: {
    color: '#fff',
  },
  dialogText: {
    marginBottom: 16,
    color: '#B0BEC5',
  },
  dialogInput: {
    marginTop: 8,
    backgroundColor: '#2C3E50',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  emptyStateSubtext: {
    color: '#B0BEC5',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  debugText: {
    color: '#B0BEC5',
    fontSize: 14,
    marginBottom: 5,
  },
});

export default SettingsPage; 