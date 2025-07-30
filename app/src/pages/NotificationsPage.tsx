import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  priority: string;
  data: any;
  is_read: boolean;
  is_sent: boolean;
  scheduled_for: string;
  sent_at: string;
  read_at: string;
  created_at: string;
  expires_at: string;
}

const NotificationsPage: React.FC = () => {
  const { user, isSidebarOpen, setIsSidebarOpen } = useAppContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const handleSidebarClose = useCallback(() => {
    setIsSidebarOpen(false);
  }, [setIsSidebarOpen]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications/');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Don't show alert, just set empty array
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true, read_at: new Date().toISOString() }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'tournament': 'trophy',
      'training': 'calendar',
      'achievement': 'star',
      'reminder': 'bell',
      'announcement': 'megaphone',
      'booking': 'bookmark',
      'payment': 'credit-card',
      'system': 'cog',
      'default': 'bell',
    };
    return icons[type] || icons.default;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: '#27AE60',
      normal: '#3498DB',
      high: '#E74C3C',
      urgent: '#E67E22',
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Только что';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}ч назад`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}д назад`;
    } else {
      return date.toLocaleDateString('ru-RU');
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'unread') {
      return !notification.is_read;
    }
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <Layout title="Уведомления" onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>Загрузка уведомлений...</Text>
        </View>
        <Sidebar isVisible={isSidebarOpen} onClose={handleSidebarClose} />
      </Layout>
    );
  }

  return (
    <Layout title="Уведомления" onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}>
      <ScrollView style={styles.container}>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{unreadCount}</Text>
          </View>
        )}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            Все
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'unread' && styles.activeTab]}
          onPress={() => setActiveTab('unread')}
        >
          <Text style={[styles.tabText, activeTab === 'unread' && styles.activeTabText]}>
            Непрочитанные ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Actions */}
      {unreadCount > 0 && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.markAllReadButton} onPress={markAllAsRead}>
            <MaterialCommunityIcons name="check-all" size={16} color="#fff" />
            <Text style={styles.markAllReadText}>Отметить все как прочитанные</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications List */}
      <View style={styles.section}>
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.is_read && styles.unreadCard
              ]}
              onPress={() => markAsRead(notification.id)}
            >
              <View style={styles.notificationHeader}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons 
                    name={getNotificationIcon(notification.type) as any} 
                    size={24} 
                    color={getPriorityColor(notification.priority)} 
                  />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationMessage} numberOfLines={3}>
                    {notification.message}
                  </Text>
                  <View style={styles.notificationMeta}>
                    <Text style={styles.notificationDate}>
                      {formatDate(notification.created_at)}
                    </Text>
                    {notification.priority !== 'normal' && (
                      <View style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(notification.priority) }
                      ]}>
                        <Text style={styles.priorityText}>
                          {notification.priority === 'high' ? 'Важно' : 
                           notification.priority === 'urgent' ? 'Срочно' : 
                           notification.priority === 'low' ? 'Низкий' : 'Обычное'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                {!notification.is_read && (
                  <View style={styles.unreadIndicator} />
                )}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bell-outline" size={48} color="#B0BEC5" />
            <Text style={styles.emptyText}>
              {activeTab === 'unread' ? 'Нет непрочитанных уведомлений' : 'Нет уведомлений'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'unread' 
                ? 'Все уведомления прочитаны' 
                : 'Новые уведомления появятся здесь'
              }
            </Text>
          </View>
        )}
      </View>
      </ScrollView>
      <Sidebar isVisible={isSidebarOpen} onClose={handleSidebarClose} />
    </Layout>
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
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  unreadBadge: {
    backgroundColor: '#E74C3C',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 12,
  },
  unreadCount: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#1B263B',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#E74C3C',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0BEC5',
  },
  activeTabText: {
    color: '#fff',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  markAllReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27AE60',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  markAllReadText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    padding: 20,
  },
  notificationCard: {
    backgroundColor: '#1B263B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#E74C3C',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#B0BEC5',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationDate: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E74C3C',
    marginLeft: 8,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#B0BEC5',
    marginTop: 16,
    fontWeight: 'bold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default NotificationsPage; 