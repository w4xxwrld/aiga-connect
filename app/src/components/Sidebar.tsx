import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useAppContext } from '../context/AppContext';

interface SidebarProps {
  isVisible: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isVisible, onClose }) => {
  const navigation = useNavigation<NavigationProp<any>>();
  const { user, userRole, setIsSidebarOpen, logout } = useAppContext();
  const slideAnim = useRef(new Animated.Value(-280)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsAnimating(false);
      });
    } else {
      setIsAnimating(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -280,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsAnimating(false);
      });
    }
  }, [isVisible, slideAnim, fadeAnim]);

  // Reset animation values when component mounts
  useEffect(() => {
    slideAnim.setValue(-280);
    fadeAnim.setValue(0);
  }, []);

  // Simple render condition
  if (!isVisible && !isAnimating) {
    return null;
  }

  const handleProfilePress = () => {
    navigation?.navigate('Profile' as never);
    onClose();
  };

  const handleQuickAction = (route: string) => {
    if (navigation) {
      // Handle tab navigation for Classes and Bookings
      if (route === 'Classes' || route === 'Bookings') {
        (navigation as any).navigate('MainTabs', { screen: route });
      } else {
        navigation.navigate(route as never);
      }
      onClose();
    }
  };

  const quickActions = [
    {
      title: 'Занятия',
      icon: 'calendar',
      route: 'Classes',
    },
    {
      title: 'Записи',
      icon: 'bookmark-check',
      route: 'Bookings',
      showFor: ['athlete', 'parent'],
    },
    {
      title: 'Прогресс',
      icon: 'trophy',
      route: 'Progress',
      showFor: ['athlete', 'parent'],
    },
    {
      title: 'Турниры',
      icon: 'medal',
      route: 'Tournaments',
    },

    {
      title: 'Рейтинг тренеров',
      icon: 'star',
      route: 'CoachRating',
      showFor: ['athlete', 'parent'],
    },
    {
      title: 'Чат',
      icon: 'chat',
      route: 'Chat',
    },
    // {
    //   title: 'Форум',
    //   icon: 'forum',
    //   route: 'Forum',
    // },
    {
      title: 'Магазин',
      icon: 'shopping',
      route: 'Store',
    },
    {
      title: 'Уведомления',
      icon: 'bell',
      route: 'Notifications',
    },
  ];



  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <TouchableOpacity 
        style={styles.backdrop} 
        onPress={onClose}
        activeOpacity={1}
      />
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Profile Section */}
          <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.8} style={styles.profileSection}>
            <View style={styles.profileHeader}>
              <MaterialCommunityIcons name="account-circle" size={60} color="#3498DB" />
              <View style={styles.profileInfo}>
                <TouchableOpacity>
                  <Text style={styles.profileName}>{user?.full_name || 'Пользователь'}</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={styles.profileEmail}>{user?.email || 'email@example.com'}</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={styles.profileRole}>
                    {userRole === 'athlete' ? 'Спортсмен' : 
                     userRole === 'parent' ? 'Родитель' : 
                     userRole === 'coach' ? 'Тренер' : 'Пользователь'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Быстрые действия</Text>
            <View style={styles.actionsGrid}>
              {quickActions.map((action, index) => {
                // Check if action should be shown for current user role
                if (action.showFor && userRole && !action.showFor.includes(userRole)) {
                  return null;
                }
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.actionButton}
                    onPress={() => handleQuickAction(action.route)}
                  >
                    <MaterialCommunityIcons name={action.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={18} color="white" />
                    <Text style={styles.actionText}>{action.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Logout Button */}
          <View style={styles.logoutSection}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => {
                Alert.alert(
                  'Выход',
                  'Вы уверены, что хотите выйти?',
                  [
                    { text: 'Отмена', style: 'cancel' },
                    { text: 'Выйти', style: 'destructive', onPress: async () => {
                      try {
                        await logout();
                        onClose();
                      } catch (error) {
                        console.error('Logout error:', error);
                        Alert.alert('Ошибка', 'Не удалось выйти из системы');
                      }
                    }},
                  ]
                );
              }}
            >
              <MaterialCommunityIcons name="logout" size={15} color="#E74C3C" />
              <Text style={styles.logoutText}>Выйти</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 280,
    backgroundColor: '#0D1B2A',
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: '#2C3E50',
    zIndex: 1001,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 15,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: '#3498DB',
    fontWeight: '500',
  },
  actionsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  actionsGrid: {
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: '#1B263B',
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 9,
  },
  logoutSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2C3E50',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    borderRadius: 8,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  logoutText: {
    color: '#E74C3C',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 9,
  },
});

export default Sidebar; 