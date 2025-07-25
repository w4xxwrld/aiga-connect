import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  FlatList,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  ActivityIndicator,
  IconButton,
  Menu,
  Divider,
  SegmentedButtons,
  Badge,
} from 'react-native-paper';
import { useAppContext } from '../context/AppContext';
import notificationService, { Notification } from '../services/notifications';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface NotificationsPageProps {
  navigation?: any;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ navigation }) => {
  const { user } = useAppContext();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const allNotifications = await notificationService.getNotifications();
      
      let filteredNotifications = allNotifications;
      if (filter === 'unread') {
        filteredNotifications = allNotifications.filter(n => !n.is_read);
      } else if (filter !== 'all') {
        filteredNotifications = allNotifications.filter(n => n.type === filter);
      }
      
      setNotifications(filteredNotifications);
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось загрузить уведомления');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      await loadNotifications();
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось отметить как прочитанное');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      await loadNotifications();
      Alert.alert('Успешно', 'Все уведомления отмечены как прочитанные');
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось отметить все как прочитанные');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    Alert.alert(
      'Удалить уведомление',
      'Вы уверены, что хотите удалить это уведомление?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationService.deleteNotification(notificationId);
              await loadNotifications();
            } catch (error: any) {
              Alert.alert('Ошибка', error.message || 'Не удалось удалить уведомление');
            }
          }
        }
      ]
    );
  };

  const handleClearAll = async () => {
    Alert.alert(
      'Очистить все уведомления',
      'Вы уверены, что хотите удалить все уведомления?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Очистить',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationService.clearAllNotifications();
              await loadNotifications();
              Alert.alert('Успешно', 'Все уведомления удалены');
            } catch (error: any) {
              Alert.alert('Ошибка', error.message || 'Не удалось очистить уведомления');
            }
          }
        }
      ]
    );
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read when pressed
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    // Handle navigation based on notification type and action data
    if (notification.action_data && navigation) {
      switch (notification.type) {
        case 'training':
          if (notification.action_data.training_id) {
            navigation.navigate('ScheduleTab', {
              screen: 'TrainingDetail',
              params: { trainingId: notification.action_data.training_id.toString() }
            });
          }
          break;
        case 'tournament':
          navigation.navigate('ProgressTab', { screen: 'ProgressMain' });
          break;
        case 'achievement':
          navigation.navigate('ProgressTab', { screen: 'ProgressMain' });
          break;
        default:
          // No specific action
          break;
      }
    }
  };

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <SegmentedButtons
        value={filter}
        onValueChange={setFilter}
        buttons={[
          { value: 'all', label: 'Все' },
          { value: 'unread', label: 'Непрочитанные' },
          { value: 'training', label: 'Тренировки' },
          { value: 'tournament', label: 'Турниры' },
          { value: 'achievement', label: 'Достижения' },
        ]}
        style={styles.segmentedButtons}
      />
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Title style={styles.headerTitle}>Уведомления</Title>
      <View style={styles.headerActions}>
        <Button
          mode="text"
          onPress={handleMarkAllAsRead}
          textColor="#E74C3C"
          disabled={notifications.length === 0}
        >
          Прочитать все
        </Button>
        <Menu
          visible={menuVisible === 'main'}
          onDismiss={() => setMenuVisible(null)}
          anchor={
            <IconButton
              icon="dots-vertical"
              iconColor="#fff"
              onPress={() => setMenuVisible('main')}
            />
          }
        >
          <Menu.Item
            onPress={() => {
              setMenuVisible(null);
              handleClearAll();
            }}
            title="Очистить все"
            leadingIcon="delete"
          />
          <Menu.Item
            onPress={() => {
              setMenuVisible(null);
              navigation?.navigate('SettingsTab', { screen: 'SettingsMain' });
            }}
            title="Настройки уведомлений"
            leadingIcon="cog"
          />
        </Menu>
      </View>
    </View>
  );

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <Card 
      style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
      onPress={() => handleNotificationPress(item)}
    >
      <Card.Content>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationInfo}>
            <View style={styles.notificationTitleRow}>
              <MaterialCommunityIcons
                name={notificationService.getNotificationTypeIcon(item.type) as any}
                size={20}
                color={notificationService.getPriorityColor(item.priority)}
              />
              <Text style={styles.notificationTitle}>{item.title}</Text>
              {!item.is_read && <Badge style={styles.unreadBadge} />}
            </View>
            <Text style={styles.notificationTimestamp}>
              {notificationService.formatTimestamp(item.created_at)}
            </Text>
          </View>
          
          <Menu
            visible={menuVisible === item.id}
            onDismiss={() => setMenuVisible(null)}
            anchor={
              <IconButton
                icon="dots-vertical"
                iconColor="#B0BEC5"
                size={16}
                onPress={() => setMenuVisible(item.id)}
              />
            }
          >
            {!item.is_read && (
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  handleMarkAsRead(item.id);
                }}
                title="Отметить как прочитанное"
                leadingIcon="check"
              />
            )}
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                handleDeleteNotification(item.id);
              }}
              title="Удалить"
              leadingIcon="delete"
            />
          </Menu>
        </View>

        <Paragraph style={styles.notificationMessage}>{item.message}</Paragraph>

        <View style={styles.notificationFooter}>
          <Chip
            mode="outlined"
            style={styles.typeChip}
            textStyle={styles.chipText}
          >
            {notificationService.getNotificationTypeDisplayName(item.type)}
          </Chip>
          
          {item.priority === 'high' && (
            <Chip
              mode="flat"
              style={styles.priorityChip}
              textStyle={styles.priorityChipText}
            >
              Важно
            </Chip>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="bell-off" size={64} color="#B0BEC5" />
      <Text style={styles.emptyStateText}>
        {filter === 'unread' 
          ? 'Нет непрочитанных уведомлений'
          : filter === 'all'
            ? 'У вас пока нет уведомлений'
            : `Нет уведомлений типа "${notificationService.getNotificationTypeDisplayName(filter)}"`
        }
      </Text>
      <Text style={styles.emptyStateSubtext}>
        {filter === 'all' 
          ? 'Здесь будут отображаться важные обновления и напоминания'
          : 'Попробуйте изменить фильтр или обновить страницу'
        }
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E74C3C" />
        <Text style={styles.loadingText}>Загрузка уведомлений...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderFilterButtons()}
      
      {notifications.length === 0 ? (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {renderEmptyState()}
        </ScrollView>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          style={styles.notificationsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1B263B',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterContainer: {
    padding: 16,
    backgroundColor: '#1B263B',
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  notificationsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  notificationCard: {
    backgroundColor: '#1B263B',
    marginVertical: 4,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  unreadCard: {
    borderLeftColor: '#E74C3C',
    backgroundColor: '#1E2A3F',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    backgroundColor: '#E74C3C',
  },
  notificationTimestamp: {
    fontSize: 12,
    color: '#B0BEC5',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#B0BEC5',
    lineHeight: 20,
    marginBottom: 12,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeChip: {
    borderColor: '#2196F3',
  },
  chipText: {
    fontSize: 11,
    color: '#fff',
  },
  priorityChip: {
    backgroundColor: '#E74C3C',
  },
  priorityChipText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 400,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#B0BEC5',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationsPage; 