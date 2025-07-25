import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  TextInput,
  Chip,
  ActivityIndicator,
  Badge,
  Avatar,
  IconButton,
  Divider,
  SegmentedButtons,
} from 'react-native-paper';
import { useAppContext } from '../context/AppContext';
import communityService, { 
  ChatMessage, 
  Notification, 
  ForumTopic, 
  Feedback 
} from '../services/community';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const CommunityPage: React.FC = () => {
  const { user, userRole } = useAppContext();
  const [activeTab, setActiveTab] = useState('chat');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatScrollRef = useRef<FlatList>(null);
  
  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Forum state
  const [forumTopics, setForumTopics] = useState<ForumTopic[]>([]);
  
  // Feedback state
  const [feedback, setFeedback] = useState<Feedback[]>([]);

  useEffect(() => {
    loadCommunityData();
  }, [activeTab]);

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      
      switch (activeTab) {
        case 'chat':
          const messages = await communityService.getChatMessages();
          setChatMessages(messages);
          break;
        case 'notifications':
          const notifs = await communityService.getNotifications();
          setNotifications(notifs);
          setUnreadCount(communityService.getUnreadNotificationsCount());
          break;
        case 'forum':
          const topics = await communityService.getForumTopics();
          setForumTopics(topics);
          break;
        case 'feedback':
          const feedbackData = await communityService.getFeedback();
          setFeedback(feedbackData);
          break;
      }
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCommunityData();
    setRefreshing(false);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      const newMessage = await communityService.sendChatMessage(messageText.trim());
      setChatMessages(prev => [newMessage, ...prev]);
      setMessageText('');
      
      // Scroll to top to show new message
      setTimeout(() => {
        chatScrollRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось отправить сообщение');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      await communityService.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось отметить уведомление');
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      await communityService.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось отметить уведомления');
    }
  };

  const handleSubmitFeedback = () => {
    Alert.alert(
      'Обратная связь',
      'Выберите тип обращения:',
      [
        { text: 'Предложение', onPress: () => showFeedbackForm('suggestion') },
        { text: 'Благодарность', onPress: () => showFeedbackForm('praise') },
        { text: 'Вопрос', onPress: () => showFeedbackForm('question') },
        { text: 'Отмена', style: 'cancel' }
      ]
    );
  };

  const showFeedbackForm = (category: string) => {
    Alert.prompt(
      'Обратная связь',
      `Введите ваше ${communityService.getFeedbackCategoryDisplayName(category).toLowerCase()}:`,
      async (text) => {
        if (text && text.trim() && user) {
          try {
            await communityService.submitFeedback({
              from_user_id: user.id,
              from_user_name: user.full_name || 'Пользователь',
              subject: `${communityService.getFeedbackCategoryDisplayName(category)} от ${user.full_name}`,
              message: text.trim(),
              category: category as any
            });
            Alert.alert('Успешно', 'Ваше обращение отправлено!');
            if (activeTab === 'feedback') {
              loadCommunityData();
            }
          } catch (error: any) {
            Alert.alert('Ошибка', error.message || 'Не удалось отправить обращение');
          }
        }
      },
      'plain-text'
    );
  };

  const renderTabButtons = () => (
    <View style={styles.tabContainer}>
      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          { value: 'chat', label: 'Чат', icon: 'chat' },
          { 
            value: 'notifications', 
            label: 'Уведомления', 
            icon: 'bell',
            showSelectedCheck: true,
          },
          { value: 'forum', label: 'Форум', icon: 'forum' },
          { value: 'feedback', label: 'Связь', icon: 'message-text' },
        ]}
        style={styles.segmentedButtons}
        theme={{ colors: { primary: '#E74C3C' } }}
      />
      {unreadCount > 0 && activeTab !== 'notifications' && (
        <Badge 
          style={styles.notificationBadge}
          size={20}
        >
          {unreadCount}
        </Badge>
      )}
    </View>
  );

  const renderChatMessage = ({ item }: { item: ChatMessage }) => {
    const isOwnMessage = item.user_name === 'Вы';
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <View style={styles.messageHeader}>
          <Text style={[
            styles.userName,
            isOwnMessage ? styles.ownUserName : styles.otherUserName
          ]}>
            {item.user_name}
          </Text>
          <Chip 
            mode="outlined" 
            style={styles.roleChip}
            textStyle={styles.roleChipText}
          >
            {communityService.getUserRoleDisplayName(item.user_role)}
          </Chip>
        </View>
        <Text style={[
          styles.messageText,
          isOwnMessage ? styles.ownMessageText : styles.otherMessageText
        ]}>
          {item.message}
        </Text>
        <Text style={styles.messageTime}>
          {communityService.formatMessageTime(item.timestamp)}
          {item.edited_at && ' (ред.)'}
        </Text>
      </View>
    );
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <Card 
      style={[
        styles.notificationCard,
        !item.is_read && styles.unreadNotification
      ]}
      onPress={() => !item.is_read && handleMarkNotificationAsRead(item.id)}
    >
      <Card.Content>
        <View style={styles.notificationHeader}>
          <MaterialCommunityIcons 
            name={item.icon as any} 
            size={24} 
            color="#E74C3C" 
          />
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationMessage}>{item.message}</Text>
            <Text style={styles.notificationTime}>
              {communityService.formatMessageTime(item.timestamp)}
            </Text>
          </View>
          {!item.is_read && (
            <Badge style={styles.unreadBadge} size={8} />
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const renderForumTopic = ({ item }: { item: ForumTopic }) => (
    <Card style={styles.forumTopicCard}>
      <Card.Content>
        <View style={styles.forumTopicHeader}>
          <View style={styles.forumTopicInfo}>
            {item.is_pinned && (
              <MaterialCommunityIcons name="pin" size={16} color="#E74C3C" />
            )}
            <Text style={[
              styles.forumTopicTitle,
              item.is_pinned && styles.pinnedTopicTitle
            ]}>
              {item.title}
            </Text>
          </View>
          <Chip 
            mode="outlined" 
            style={styles.categoryChip}
            textStyle={styles.categoryChipText}
          >
            {communityService.getForumCategoryDisplayName(item.category)}
          </Chip>
        </View>
        
        <Text style={styles.forumTopicDescription}>{item.description}</Text>
        
        <View style={styles.forumTopicMeta}>
          <Text style={styles.forumTopicAuthor}>
            {item.author_name} • {communityService.formatMessageTime(item.timestamp)}
          </Text>
          <Text style={styles.forumTopicStats}>
            {item.messages_count} сообщений • {communityService.formatMessageTime(item.last_message_at)}
          </Text>
        </View>
        
        <Button
          mode="outlined"
          onPress={() => Alert.alert('Информация', 'Просмотр темы будет добавлен в следующем обновлении')}
          style={styles.viewTopicButton}
          textColor="#E74C3C"
        >
          Открыть тему
        </Button>
      </Card.Content>
    </Card>
  );

  const renderFeedbackItem = ({ item }: { item: Feedback }) => (
    <Card style={styles.feedbackCard}>
      <Card.Content>
        <View style={styles.feedbackHeader}>
          <View style={styles.feedbackInfo}>
            <Text style={styles.feedbackSubject}>{item.subject}</Text>
            <Text style={styles.feedbackAuthor}>
              {item.from_user_name} • {communityService.formatMessageTime(item.timestamp)}
            </Text>
          </View>
          <Chip 
            mode="outlined" 
            style={[
              styles.statusChip,
              item.status === 'resolved' && styles.resolvedChip,
              item.status === 'reviewed' && styles.reviewedChip
            ]}
            textStyle={styles.statusChipText}
          >
            {communityService.getFeedbackStatusDisplayName(item.status)}
          </Chip>
        </View>
        
        <Text style={styles.feedbackMessage}>{item.message}</Text>
        
        {item.response && (
          <View style={styles.feedbackResponse}>
            <Divider style={styles.responseDivider} />
            <Text style={styles.responseLabel}>Ответ:</Text>
            <Text style={styles.responseText}>{item.response}</Text>
            {item.response_timestamp && (
              <Text style={styles.responseTime}>
                {communityService.formatMessageTime(item.response_timestamp)}
              </Text>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'chat':
        return (
          <KeyboardAvoidingView 
            style={styles.chatContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <FlatList
              ref={chatScrollRef}
              data={chatMessages}
              renderItem={renderChatMessage}
              keyExtractor={(item) => item.id}
              style={styles.messagesList}
              inverted
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
            <View style={styles.messageInputContainer}>
              <TextInput
                value={messageText}
                onChangeText={setMessageText}
                placeholder="Написать сообщение..."
                style={styles.messageInput}
                multiline
                maxLength={500}
                theme={{ colors: { primary: '#E74C3C' } }}
              />
              <IconButton
                icon="send"
                size={24}
                iconColor="#E74C3C"
                onPress={handleSendMessage}
                disabled={!messageText.trim() || sendingMessage}
                style={styles.sendButton}
              />
            </View>
          </KeyboardAvoidingView>
        );

      case 'notifications':
        return (
          <View style={styles.notificationsContainer}>
            {unreadCount > 0 && (
              <Button
                mode="outlined"
                onPress={handleMarkAllNotificationsAsRead}
                style={styles.markAllButton}
                textColor="#E74C3C"
              >
                Отметить все как прочитанные ({unreadCount})
              </Button>
            )}
            <FlatList
              data={notifications}
              renderItem={renderNotification}
              keyExtractor={(item) => item.id}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <Text style={styles.emptyText}>Нет уведомлений</Text>
              }
            />
          </View>
        );

      case 'forum':
        return (
          <View style={styles.forumContainer}>
            <Button
              mode="contained"
              onPress={() => Alert.alert('Информация', 'Создание темы будет добавлено в следующем обновлении')}
              style={styles.createTopicButton}
              buttonColor="#E74C3C"
            >
              Создать тему
            </Button>
            <FlatList
              data={forumTopics}
              renderItem={renderForumTopic}
              keyExtractor={(item) => item.id}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <Text style={styles.emptyText}>Нет тем для обсуждения</Text>
              }
            />
          </View>
        );

      case 'feedback':
        return (
          <View style={styles.feedbackContainer}>
            <Button
              mode="contained"
              onPress={handleSubmitFeedback}
              style={styles.submitFeedbackButton}
              buttonColor="#E74C3C"
            >
              Отправить обращение
            </Button>
            <FlatList
              data={feedback}
              renderItem={renderFeedbackItem}
              keyExtractor={(item) => item.id}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <Text style={styles.emptyText}>Нет обращений</Text>
              }
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderTabButtons()}
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  tabContainer: {
    padding: 16,
    position: 'relative',
  },
  segmentedButtons: {
    backgroundColor: '#1B263B',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 60,
    backgroundColor: '#E74C3C',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
  
  // Chat styles
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageContainer: {
    marginVertical: 4,
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#E74C3C',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#1B263B',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  userName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  ownUserName: {
    color: '#fff',
  },
  otherUserName: {
    color: '#E74C3C',
  },
  roleChip: {
    height: 20,
    borderColor: 'transparent',
  },
  roleChipText: {
    fontSize: 10,
    color: '#B0BEC5',
  },
  messageText: {
    fontSize: 14,
    marginBottom: 4,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 10,
    color: '#B0BEC5',
    textAlign: 'right',
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#1B263B',
    borderTopWidth: 1,
    borderTopColor: '#2C3E50',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#0D1B2A',
    marginRight: 8,
  },
  sendButton: {
    margin: 0,
  },
  
  // Notifications styles
  notificationsContainer: {
    flex: 1,
    padding: 16,
  },
  markAllButton: {
    marginBottom: 16,
    borderColor: '#E74C3C',
  },
  notificationCard: {
    backgroundColor: '#1B263B',
    marginBottom: 8,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#E74C3C',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#B0BEC5',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 11,
    color: '#666',
  },
  unreadBadge: {
    backgroundColor: '#E74C3C',
  },
  
  // Forum styles
  forumContainer: {
    flex: 1,
    padding: 16,
  },
  createTopicButton: {
    marginBottom: 16,
  },
  forumTopicCard: {
    backgroundColor: '#1B263B',
    marginBottom: 12,
  },
  forumTopicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  forumTopicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  forumTopicTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  pinnedTopicTitle: {
    color: '#E74C3C',
  },
  categoryChip: {
    borderColor: '#4CAF50',
  },
  categoryChipText: {
    fontSize: 11,
    color: '#fff',
  },
  forumTopicDescription: {
    fontSize: 13,
    color: '#B0BEC5',
    marginBottom: 8,
  },
  forumTopicMeta: {
    marginBottom: 12,
  },
  forumTopicAuthor: {
    fontSize: 12,
    color: '#E74C3C',
    marginBottom: 2,
  },
  forumTopicStats: {
    fontSize: 11,
    color: '#666',
  },
  viewTopicButton: {
    borderColor: '#E74C3C',
  },
  
  // Feedback styles
  feedbackContainer: {
    flex: 1,
    padding: 16,
  },
  submitFeedbackButton: {
    marginBottom: 16,
  },
  feedbackCard: {
    backgroundColor: '#1B263B',
    marginBottom: 12,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  feedbackInfo: {
    flex: 1,
  },
  feedbackSubject: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  feedbackAuthor: {
    fontSize: 12,
    color: '#B0BEC5',
  },
  statusChip: {
    borderColor: '#FF9800',
  },
  reviewedChip: {
    borderColor: '#2196F3',
  },
  resolvedChip: {
    borderColor: '#4CAF50',
  },
  statusChipText: {
    fontSize: 11,
    color: '#fff',
  },
  feedbackMessage: {
    fontSize: 13,
    color: '#B0BEC5',
    marginBottom: 8,
  },
  feedbackResponse: {
    marginTop: 8,
  },
  responseDivider: {
    backgroundColor: '#2C3E50',
    marginBottom: 8,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginBottom: 4,
  },
  responseText: {
    fontSize: 13,
    color: '#fff',
    marginBottom: 4,
  },
  responseTime: {
    fontSize: 11,
    color: '#666',
  },
  
  // Common styles
  emptyText: {
    fontSize: 16,
    color: '#B0BEC5',
    textAlign: 'center',
    marginTop: 32,
  },
});

export default CommunityPage; 