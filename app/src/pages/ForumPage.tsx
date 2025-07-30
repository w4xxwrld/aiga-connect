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

interface ForumCategory {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  is_moderated: boolean;
  min_role_to_post: string;
}

interface ForumTopic {
  id: number;
  category_id: number;
  created_by_id: number;
  author_name: string;
  title: string;
  content: string;
  views_count: number;
  replies_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  is_approved: boolean;
  last_reply_at: string;
  created_at: string;
  updated_at: string;
}

const ForumPage: React.FC = () => {
  const { user, userRole, isSidebarOpen, setIsSidebarOpen } = useAppContext();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const handleSidebarClose = useCallback(() => {
    setIsSidebarOpen(false);
  }, [setIsSidebarOpen]);

  useEffect(() => {
    fetchForumData();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchTopics();
    }
  }, [selectedCategory]);

  const fetchForumData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/chat/forum/categories');
      setCategories(response.data);
      
      // Select the first active category as default
      const activeCategory = response.data.find((cat: ForumCategory) => cat.is_active);
      if (activeCategory) {
        setSelectedCategory(activeCategory.id);
      }
    } catch (error) {
      console.error('Error fetching forum data:', error);
      // Don't show alert, just set empty array
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    if (!selectedCategory) return;
    
    try {
      const response = await api.get(`/chat/forum/categories/${selectedCategory}/topics`);
      setTopics(response.data);
    } catch (error) {
      console.error('Error fetching topics:', error);
      // Don't show alert, just set empty array
      setTopics([]);
    }
  };

  const getCategoryIcon = (iconName: string) => {
    const icons: { [key: string]: string } = {
      'general': 'forum',
      'training': 'dumbbell',
      'competitions': 'trophy',
      'equipment': 'shopping',
      'technique': 'karate',
      'news': 'newspaper',
      'default': 'chat',
    };
    return icons[iconName] || icons.default;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}ч назад`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}д назад`;
    } else {
      return date.toLocaleDateString('ru-RU');
    }
  };

  const canPostInCategory = (category: ForumCategory) => {
    const roleHierarchy = {
      'athlete': 1,
      'parent': 2,
      'coach': 3,
    };
    
    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[category.min_role_to_post as keyof typeof roleHierarchy] || 0;
    
    return userLevel >= requiredLevel;
  };

  if (loading) {
    return (
      <Layout title="Форум AIGA" onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>Загрузка форума...</Text>
        </View>
        <Sidebar isVisible={isSidebarOpen} onClose={handleSidebarClose} />
      </Layout>
    );
  }

  return (
    <Layout title="Форум AIGA" onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}>
      <ScrollView style={styles.container}>
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>Обсуждения и новости</Text>
        </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Категории</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.filter(cat => cat.is_active).map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                selectedCategory === category.id && styles.activeCategoryCard
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <View style={[
                styles.categoryIcon,
                { backgroundColor: category.color || '#E74C3C' }
              ]}>
                <MaterialCommunityIcons 
                  name={getCategoryIcon(category.icon) as any} 
                  size={24} 
                  color="#fff" 
                />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryDescription} numberOfLines={2}>
                {category.description}
              </Text>
              {category.is_moderated && (
                <View style={styles.moderatedBadge}>
                  <MaterialCommunityIcons name="shield-check" size={12} color="#27AE60" />
                  <Text style={styles.moderatedText}>Модерация</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Topics */}
      <View style={styles.section}>
        <View style={styles.topicsHeader}>
          <Text style={styles.sectionTitle}>Темы</Text>
          {selectedCategory && canPostInCategory(categories.find(c => c.id === selectedCategory)!) && (
            <TouchableOpacity style={styles.newTopicButton}>
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.newTopicText}>Новая тема</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {topics.length > 0 ? (
          topics.map((topic) => (
            <TouchableOpacity key={topic.id} style={styles.topicCard}>
              <View style={styles.topicHeader}>
                <View style={styles.topicTitleContainer}>
                  <Text style={styles.topicTitle} numberOfLines={2}>
                    {topic.title}
                  </Text>
                  {topic.is_pinned && (
                    <MaterialCommunityIcons name="pin" size={16} color="#FFD700" />
                  )}
                  {topic.is_locked && (
                    <MaterialCommunityIcons name="lock" size={16} color="#E74C3C" />
                  )}
                </View>
                <View style={styles.topicMeta}>
                  <Text style={styles.authorName}>{topic.author_name}</Text>
                  <Text style={styles.topicDate}>{formatDate(topic.created_at)}</Text>
                </View>
              </View>
              
              <Text style={styles.topicContent} numberOfLines={3}>
                {topic.content}
              </Text>
              
              <View style={styles.topicStats}>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="eye" size={14} color="#B0BEC5" />
                  <Text style={styles.statText}>{topic.views_count}</Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="comment" size={14} color="#B0BEC5" />
                  <Text style={styles.statText}>{topic.replies_count}</Text>
                </View>
                {topic.last_reply_at && (
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons name="clock" size={14} color="#B0BEC5" />
                    <Text style={styles.statText}>{formatDate(topic.last_reply_at)}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="forum-outline" size={48} color="#B0BEC5" />
            <Text style={styles.emptyText}>Нет тем для обсуждения</Text>
            <Text style={styles.emptySubtext}>
              {selectedCategory 
                ? 'Создайте первую тему в этой категории' 
                : 'Выберите категорию для просмотра тем'
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
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitleContainer: {
    padding: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#B0BEC5',
  },
  section: {
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  categoryCard: {
    width: 140,
    marginRight: 16,
    backgroundColor: '#1B263B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  activeCategoryCard: {
    backgroundColor: '#E74C3C',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  categoryDescription: {
    fontSize: 12,
    color: '#B0BEC5',
    textAlign: 'center',
    lineHeight: 16,
  },
  moderatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  moderatedText: {
    fontSize: 10,
    color: '#27AE60',
    marginLeft: 4,
  },
  topicsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  newTopicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E74C3C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  newTopicText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  topicCard: {
    backgroundColor: '#1B263B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  topicHeader: {
    marginBottom: 12,
  },
  topicTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  topicMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 12,
    color: '#E74C3C',
    fontWeight: '600',
  },
  topicDate: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  topicContent: {
    fontSize: 14,
    color: '#B0BEC5',
    lineHeight: 20,
    marginBottom: 12,
  },
  topicStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#B0BEC5',
    marginLeft: 4,
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

export default ForumPage; 