import api from './api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'training' | 'tournament' | 'achievement' | 'general' | 'system';
  target_role?: 'parent' | 'athlete' | 'coach' | 'all';
  user_id?: number;
  is_read: boolean;
  created_at: string;
  action_url?: string;
  action_data?: any;
  priority: 'low' | 'medium' | 'high';
  expires_at?: string;
}

export interface NotificationSettings {
  push_enabled: boolean;
  email_enabled: boolean;
  training_reminders: boolean;
  tournament_announcements: boolean;
  achievement_notifications: boolean;
  general_announcements: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // HH:MM format
  quiet_hours_end: string; // HH:MM format
}

class NotificationService {
  // Mock data for MVP
  private mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'Новая тренировка',
      message: 'Запланирована групповая тренировка на завтра в 18:00',
      type: 'training',
      target_role: 'all',
      is_read: false,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      priority: 'medium',
      action_data: { training_id: 1 }
    },
    {
      id: '2',
      title: 'Турнир приближается',
      message: 'До турнира "Кубок AIGA" осталось 3 дня. Подготовьтесь!',
      type: 'tournament',
      target_role: 'all',
      is_read: false,
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      priority: 'high',
      action_data: { tournament_id: 1 }
    },
    {
      id: '3',
      title: 'Новое достижение!',
      message: 'Поздравляем! Вы получили достижение "Регулярный посетитель"',
      type: 'achievement',
      is_read: true,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      priority: 'medium',
      action_data: { achievement_id: 'regular_visitor' }
    },
    {
      id: '4',
      title: 'Обновление расписания',
      message: 'Тренировка в среду перенесена на 19:00',
      type: 'training',
      target_role: 'all',
      is_read: true,
      created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      priority: 'medium'
    },
    {
      id: '5',
      title: 'Новые товары в магазине',
      message: 'Поступили новые кимоно и рашгарды. Ознакомьтесь с ассортиментом!',
      type: 'general',
      target_role: 'all',
      is_read: false,
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      priority: 'low'
    }
  ];

  private defaultSettings: NotificationSettings = {
    push_enabled: true,
    email_enabled: true,
    training_reminders: true,
    tournament_announcements: true,
    achievement_notifications: true,
    general_announcements: true,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00'
  };

  // Notification management methods
  async getNotifications(limit: number = 50): Promise<Notification[]> {
    try {
      // Mock implementation - will be replaced with API call
      return this.mockNotifications
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
    } catch (error: any) {
      throw new Error('Failed to get notifications');
    }
  }

  async getUnreadNotifications(): Promise<Notification[]> {
    try {
      const notifications = await this.getNotifications();
      return notifications.filter(n => !n.is_read);
    } catch (error: any) {
      throw new Error('Failed to get unread notifications');
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const unreadNotifications = await this.getUnreadNotifications();
      return unreadNotifications.length;
    } catch (error: any) {
      return 0;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      // Mock implementation - will be replaced with API call
      const notification = this.mockNotifications.find(n => n.id === notificationId);
      if (notification) {
        notification.is_read = true;
      }
    } catch (error: any) {
      throw new Error('Failed to mark notification as read');
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      // Mock implementation - will be replaced with API call
      this.mockNotifications.forEach(n => n.is_read = true);
    } catch (error: any) {
      throw new Error('Failed to mark all notifications as read');
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      // Mock implementation - will be replaced with API call
      const index = this.mockNotifications.findIndex(n => n.id === notificationId);
      if (index !== -1) {
        this.mockNotifications.splice(index, 1);
      }
    } catch (error: any) {
      throw new Error('Failed to delete notification');
    }
  }

  async clearAllNotifications(): Promise<void> {
    try {
      // Mock implementation - will be replaced with API call
      this.mockNotifications.length = 0;
    } catch (error: any) {
      throw new Error('Failed to clear notifications');
    }
  }

  // Settings management
  async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      // Mock implementation - will be replaced with API call
      return { ...this.defaultSettings };
    } catch (error: any) {
      throw new Error('Failed to get notification settings');
    }
  }

  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    try {
      // Mock implementation - will be replaced with API call
      Object.assign(this.defaultSettings, settings);
      return { ...this.defaultSettings };
    } catch (error: any) {
      throw new Error('Failed to update notification settings');
    }
  }

  // Push notification methods (for future implementation)
  async requestPermissions(): Promise<boolean> {
    try {
      // Mock implementation - will be replaced with actual push notification setup
      return true;
    } catch (error: any) {
      return false;
    }
  }

  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Mock implementation - will be replaced with actual push notification registration
      return 'mock_push_token';
    } catch (error: any) {
      return null;
    }
  }

  async sendLocalNotification(title: string, message: string, data?: any): Promise<void> {
    try {
      // Mock implementation - will be replaced with local notification
      console.log('Local notification:', { title, message, data });
    } catch (error: any) {
      throw new Error('Failed to send local notification');
    }
  }

  // Helper methods
  getNotificationTypeDisplayName(type: string): string {
    switch (type) {
      case 'training':
        return 'Тренировки';
      case 'tournament':
        return 'Турниры';
      case 'achievement':
        return 'Достижения';
      case 'general':
        return 'Общие';
      case 'system':
        return 'Системные';
      default:
        return type;
    }
  }

  getNotificationTypeIcon(type: string): string {
    switch (type) {
      case 'training':
        return 'dumbbell';
      case 'tournament':
        return 'trophy';
      case 'achievement':
        return 'medal';
      case 'general':
        return 'information';
      case 'system':
        return 'cog';
      default:
        return 'bell';
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high':
        return '#E74C3C';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#4CAF50';
      default:
        return '#2196F3';
    }
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return 'только что';
    } else if (diffMins < 60) {
      return `${diffMins} мин назад`;
    } else if (diffHours < 24) {
      return `${diffHours} ч назад`;
    } else if (diffDays < 7) {
      return `${diffDays} дн назад`;
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  }

  isInQuietHours(settings: NotificationSettings): boolean {
    if (!settings.quiet_hours_enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = settings.quiet_hours_start.split(':').map(Number);
    const [endHour, endMin] = settings.quiet_hours_end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }
}

export default new NotificationService(); 