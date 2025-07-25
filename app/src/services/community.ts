import api from './api';

export interface ChatMessage {
  id: string;
  user_id: number;
  user_name: string;
  user_role: 'parent' | 'athlete' | 'coach';
  message: string;
  timestamp: string;
  edited_at?: string;
  reply_to?: string;
  attachments?: string[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'training' | 'tournament' | 'achievement' | 'announcement' | 'reminder';
  timestamp: string;
  is_read: boolean;
  action_url?: string;
  icon: string;
}

export interface Feedback {
  id: string;
  from_user_id: number;
  from_user_name: string;
  to_user_id?: number; // For trainer feedback
  subject: string;
  message: string;
  category: 'suggestion' | 'complaint' | 'praise' | 'question';
  status: 'pending' | 'reviewed' | 'resolved';
  timestamp: string;
  response?: string;
  response_timestamp?: string;
}

export interface ForumTopic {
  id: string;
  title: string;
  description: string;
  author_id: number;
  author_name: string;
  category: 'general' | 'training' | 'tournaments' | 'equipment' | 'nutrition';
  messages_count: number;
  last_message_at: string;
  is_pinned: boolean;
  is_locked: boolean;
  timestamp: string;
}

export interface ForumMessage {
  id: string;
  topic_id: string;
  user_id: number;
  user_name: string;
  user_role: 'parent' | 'athlete' | 'coach';
  message: string;
  timestamp: string;
  edited_at?: string;
  likes_count: number;
  is_liked: boolean;
}

class CommunityService {
  // Mock data for MVP
  private mockChatMessages: ChatMessage[] = [
    {
      id: '1',
      user_id: 1,
      user_name: 'Анна Смирнова',
      user_role: 'parent',
      message: 'Добро пожаловать в чат AIGA Connect! 👋',
      timestamp: '2024-01-30T10:00:00Z'
    },
    {
      id: '2',
      user_id: 2,
      user_name: 'Тренер Максим',
      user_role: 'coach',
      message: 'Привет всем! Напоминаю, что завтра групповая тренировка в 18:00.',
      timestamp: '2024-01-30T14:30:00Z'
    },
    {
      id: '3',
      user_id: 3,
      user_name: 'Елена Казакова',
      user_role: 'parent',
      message: 'Спасибо за напоминание! Мой сын Арсен будет.',
      timestamp: '2024-01-30T14:35:00Z'
    },
    {
      id: '4',
      user_id: 4,
      user_name: 'Данияр',
      user_role: 'athlete',
      message: 'А индивидуальные тренировки на этой неделе будут?',
      timestamp: '2024-01-30T15:00:00Z'
    }
  ];

  private mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'Новая тренировка',
      message: 'Завтра в 18:00 групповая тренировка для начинающих',
      type: 'training',
      timestamp: '2024-01-30T16:00:00Z',
      is_read: false,
      icon: 'calendar-plus'
    },
    {
      id: '2',
      title: 'Турнир приближается',
      message: 'До регистрации на Almaty Open осталось 3 дня',
      type: 'tournament',
      timestamp: '2024-01-30T12:00:00Z',
      is_read: false,
      icon: 'trophy'
    },
    {
      id: '3',
      title: 'Достижение разблокировано!',
      message: 'Поздравляем! Вы получили достижение "Неделя подряд"',
      type: 'achievement',
      timestamp: '2024-01-29T20:00:00Z',
      is_read: true,
      icon: 'medal'
    },
    {
      id: '4',
      title: 'Объявление от тренера',
      message: 'Обновление расписания на следующую неделю',
      type: 'announcement',
      timestamp: '2024-01-29T15:00:00Z',
      is_read: true,
      icon: 'bullhorn'
    }
  ];

  private mockFeedback: Feedback[] = [
    {
      id: '1',
      from_user_id: 1,
      from_user_name: 'Анна Смирнова',
      to_user_id: 2,
      subject: 'Отличная тренировка!',
      message: 'Хочу поблагодарить тренера Максима за индивидуальный подход к моему сыну. Прогресс заметен!',
      category: 'praise',
      status: 'reviewed',
      timestamp: '2024-01-28T19:00:00Z',
      response: 'Спасибо за отзыв! Рад, что занятия приносят результат.',
      response_timestamp: '2024-01-29T09:00:00Z'
    },
    {
      id: '2',
      from_user_id: 3,
      from_user_name: 'Елена Казакова',
      subject: 'Предложение по расписанию',
      message: 'Было бы здорово добавить вечерние тренировки для взрослых после 19:00',
      category: 'suggestion',
      status: 'pending',
      timestamp: '2024-01-30T11:00:00Z'
    }
  ];

  private mockForumTopics: ForumTopic[] = [
    {
      id: '1',
      title: 'Подготовка к соревнованиям',
      description: 'Обсуждение стратегий и советов для турниров',
      author_id: 2,
      author_name: 'Тренер Максим',
      category: 'tournaments',
      messages_count: 15,
      last_message_at: '2024-01-30T16:30:00Z',
      is_pinned: true,
      is_locked: false,
      timestamp: '2024-01-25T10:00:00Z'
    },
    {
      id: '2',
      title: 'Рекомендации по экипировке',
      description: 'Какую форму и защиту лучше выбрать для начинающих',
      author_id: 1,
      author_name: 'Анна Смирнова',
      category: 'equipment',
      messages_count: 8,
      last_message_at: '2024-01-30T14:20:00Z',
      is_pinned: false,
      is_locked: false,
      timestamp: '2024-01-28T13:00:00Z'
    },
    {
      id: '3',
      title: 'Питание для грэпплеров',
      description: 'Советы по диете и спортивному питанию',
      author_id: 5,
      author_name: 'Спортивный диетолог',
      category: 'nutrition',
      messages_count: 23,
      last_message_at: '2024-01-29T20:15:00Z',
      is_pinned: false,
      is_locked: false,
      timestamp: '2024-01-20T12:00:00Z'
    }
  ];

  // Chat Methods
  async getChatMessages(limit: number = 50): Promise<ChatMessage[]> {
    try {
      // Mock implementation - will be replaced with API call
      return this.mockChatMessages.slice(-limit).reverse();
    } catch (error: any) {
      throw new Error('Failed to get chat messages');
    }
  }

  async sendChatMessage(message: string, replyTo?: string): Promise<ChatMessage> {
    try {
      // Mock implementation - will be replaced with API call
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        user_id: 1, // Current user ID
        user_name: 'Вы',
        user_role: 'parent',
        message,
        timestamp: new Date().toISOString(),
        reply_to: replyTo
      };
      
      this.mockChatMessages.push(newMessage);
      return newMessage;
    } catch (error: any) {
      throw new Error('Failed to send message');
    }
  }

  async editChatMessage(messageId: string, newMessage: string): Promise<void> {
    try {
      // Mock implementation
      const message = this.mockChatMessages.find(m => m.id === messageId);
      if (message) {
        message.message = newMessage;
        message.edited_at = new Date().toISOString();
      }
    } catch (error: any) {
      throw new Error('Failed to edit message');
    }
  }

  async deleteChatMessage(messageId: string): Promise<void> {
    try {
      // Mock implementation
      const index = this.mockChatMessages.findIndex(m => m.id === messageId);
      if (index > -1) {
        this.mockChatMessages.splice(index, 1);
      }
    } catch (error: any) {
      throw new Error('Failed to delete message');
    }
  }

  // Notification Methods
  async getNotifications(): Promise<Notification[]> {
    try {
      // Mock implementation - will be replaced with API call
      return this.mockNotifications.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error: any) {
      throw new Error('Failed to get notifications');
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      // Mock implementation
      const notification = this.mockNotifications.find(n => n.id === notificationId);
      if (notification) {
        notification.is_read = true;
      }
    } catch (error: any) {
      throw new Error('Failed to mark notification as read');
    }
  }

  async markAllNotificationsAsRead(): Promise<void> {
    try {
      // Mock implementation
      this.mockNotifications.forEach(n => n.is_read = true);
    } catch (error: any) {
      throw new Error('Failed to mark all notifications as read');
    }
  }

  async getUnreadNotificationsCount(): Promise<number> {
    try {
      return this.mockNotifications.filter(n => !n.is_read).length;
    } catch (error: any) {
      return 0;
    }
  }

  // Feedback Methods
  async submitFeedback(feedback: Omit<Feedback, 'id' | 'timestamp' | 'status'>): Promise<void> {
    try {
      // Mock implementation - will be replaced with API call
      const newFeedback: Feedback = {
        ...feedback,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      
      this.mockFeedback.push(newFeedback);
    } catch (error: any) {
      throw new Error('Failed to submit feedback');
    }
  }

  async getFeedback(): Promise<Feedback[]> {
    try {
      // Mock implementation
      return this.mockFeedback.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error: any) {
      throw new Error('Failed to get feedback');
    }
  }

  // Forum Methods
  async getForumTopics(category?: string): Promise<ForumTopic[]> {
    try {
      // Mock implementation
      let topics = this.mockForumTopics;
      if (category) {
        topics = topics.filter(t => t.category === category);
      }
      
      return topics.sort((a, b) => {
        // Pinned topics first, then by last message
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
      });
    } catch (error: any) {
      throw new Error('Failed to get forum topics');
    }
  }

  async createForumTopic(topic: Omit<ForumTopic, 'id' | 'timestamp' | 'messages_count' | 'last_message_at' | 'is_pinned' | 'is_locked'>): Promise<ForumTopic> {
    try {
      // Mock implementation
      const newTopic: ForumTopic = {
        ...topic,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        messages_count: 0,
        last_message_at: new Date().toISOString(),
        is_pinned: false,
        is_locked: false
      };
      
      this.mockForumTopics.push(newTopic);
      return newTopic;
    } catch (error: any) {
      throw new Error('Failed to create forum topic');
    }
  }

  async getForumMessages(topicId: string): Promise<ForumMessage[]> {
    try {
      // Mock implementation - return empty for now
      return [];
    } catch (error: any) {
      throw new Error('Failed to get forum messages');
    }
  }

  async postForumMessage(topicId: string, message: string): Promise<ForumMessage> {
    try {
      // Mock implementation
      const newMessage: ForumMessage = {
        id: Date.now().toString(),
        topic_id: topicId,
        user_id: 1, // Current user
        user_name: 'Вы',
        user_role: 'parent',
        message,
        timestamp: new Date().toISOString(),
        likes_count: 0,
        is_liked: false
      };
      
      // Update topic last message time
      const topic = this.mockForumTopics.find(t => t.id === topicId);
      if (topic) {
        topic.last_message_at = new Date().toISOString();
        topic.messages_count++;
      }
      
      return newMessage;
    } catch (error: any) {
      throw new Error('Failed to post forum message');
    }
  }

  // Helper Methods
  formatMessageTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 1) return 'сейчас';
    if (diffInMins < 60) return `${diffInMins} мин назад`;
    if (diffInHours < 24) return `${diffInHours} ч назад`;
    if (diffInDays < 7) return `${diffInDays} дн назад`;
    
    return date.toLocaleDateString('ru-RU');
  }

  getNotificationTypeDisplayName(type: string): string {
    switch (type) {
      case 'training':
        return 'Тренировка';
      case 'tournament':
        return 'Турнир';
      case 'achievement':
        return 'Достижение';
      case 'announcement':
        return 'Объявление';
      case 'reminder':
        return 'Напоминание';
      default:
        return type;
    }
  }

  getFeedbackCategoryDisplayName(category: string): string {
    switch (category) {
      case 'suggestion':
        return 'Предложение';
      case 'complaint':
        return 'Жалоба';
      case 'praise':
        return 'Благодарность';
      case 'question':
        return 'Вопрос';
      default:
        return category;
    }
  }

  getFeedbackStatusDisplayName(status: string): string {
    switch (status) {
      case 'pending':
        return 'Ожидает';
      case 'reviewed':
        return 'Рассмотрено';
      case 'resolved':
        return 'Решено';
      default:
        return status;
    }
  }

  getForumCategoryDisplayName(category: string): string {
    switch (category) {
      case 'general':
        return 'Общее';
      case 'training':
        return 'Тренировки';
      case 'tournaments':
        return 'Турниры';
      case 'equipment':
        return 'Экипировка';
      case 'nutrition':
        return 'Питание';
      default:
        return category;
    }
  }

  getUserRoleDisplayName(role: string): string {
    switch (role) {
      case 'parent':
        return 'Родитель';
      case 'athlete':
        return 'Спортсмен';
      case 'coach':
        return 'Тренер';
      default:
        return role;
    }
  }
}

export default new CommunityService(); 