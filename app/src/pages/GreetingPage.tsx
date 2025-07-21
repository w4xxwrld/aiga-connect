import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Image } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Text,
  Avatar,
  Divider,
} from 'react-native-paper';
import { useAppContext } from '../context/AppContext';

interface GreetingPageProps {
  navigation: any;
}

type UserRole = 'parent' | 'athlete' | 'coach';

const GreetingPage: React.FC<GreetingPageProps> = ({ navigation }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const { setHasSeenGreeting, setUserRole } = useAppContext();

  const roles = [
    {
      id: 'parent' as UserRole,
      title: 'Родитель',
      description: 'Отслеживайте прогресс вашего ребенка и управляйте расписанием тренировок',
      icon: 'account-child',
      color: '#4CAF50',
    },
    {
      id: 'athlete' as UserRole,
      title: 'Спортсмен',
      description: 'Просматривайте расписание тренировок и отслеживайте свой прогресс',
      icon: 'account',
      color: '#2196F3',
    },
    {
      id: 'coach' as UserRole,
      title: 'Тренер',
      description: 'Управляйте учениками и тренировочными сессиями',
      icon: 'account-tie',
      color: '#FF9800',
    },
  ];

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (selectedRole) {
      // Save the role and mark greeting as seen
      setUserRole(selectedRole);
      setHasSeenGreeting(true);
      navigation.navigate('Home');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Avatar.Image 
            size={80} 
            source={{ uri: 'https://via.placeholder.com/80/6200ee/ffffff?text=AIGA' }} 
          />
          <Title style={styles.appTitle}>AIGA Connect</Title>
          <Paragraph style={styles.appSubtitle}>
            Объединяем родителей, спортсменов и тренеров в одной цифровой экосистеме
          </Paragraph>
        </View>

        {/* Welcome Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Добро пожаловать в Академию AIGA</Title>
            <Paragraph style={styles.welcomeText}>
              Ведущая школа грэпплинга Казахстана теперь имеет цифровую платформу для упрощения 
              управления тренировками, отслеживания прогресса и создания сильного спортивного сообщества.
            </Paragraph>
            <View style={styles.featuresContainer}>
                             <View style={styles.feature}>
                 <Text style={styles.featureIcon}>📅</Text>
                 <Text style={styles.featureText}>Расписание тренировок</Text>
               </View>
               <View style={styles.feature}>
                 <Text style={styles.featureIcon}>🏆</Text>
                 <Text style={styles.featureText}>Отслеживание прогресса</Text>
               </View>
               <View style={styles.feature}>
                 <Text style={styles.featureIcon}>💬</Text>
                 <Text style={styles.featureText}>Чат сообщества</Text>
               </View>
               <View style={styles.feature}>
                 <Text style={styles.featureIcon}>🛍️</Text>
                 <Text style={styles.featureText}>Магазин мерча</Text>
               </View>
            </View>
          </Card.Content>
        </Card>

        {/* Role Selection */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Выберите вашу роль</Title>
            <Paragraph style={styles.roleDescription}>
              Выберите вашу роль для получения персонализированных функций и контента
            </Paragraph>
            
            <View style={styles.rolesContainer}>
              {roles.map((role) => (
                <Card
                  key={role.id}
                  style={[
                    styles.roleCard,
                    selectedRole === role.id && styles.selectedRoleCard,
                  ]}
                  onPress={() => handleRoleSelect(role.id)}
                >
                  <Card.Content style={styles.roleContent}>
                    <View style={[styles.roleIcon, { backgroundColor: role.color }]}>
                      <Text style={styles.roleIconText}>{role.icon}</Text>
                    </View>
                    <View style={styles.roleInfo}>
                      <Title style={styles.roleTitle}>{role.title}</Title>
                      <Paragraph style={styles.roleDescription}>
                        {role.description}
                      </Paragraph>
                    </View>
                    {selectedRole === role.id && (
                      <View style={[styles.checkmark, { backgroundColor: role.color }]}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </Card.Content>
                </Card>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleContinue}
            disabled={!selectedRole}
            style={styles.continueButton}
            contentStyle={styles.buttonContent}
          >
            Продолжить в AIGA Connect
          </Button>
          <Paragraph style={styles.termsText}>
            Продолжая, вы соглашаетесь с нашими Условиями использования и Политикой конфиденциальности
          </Paragraph>
        </View>
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
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#6200ee',
  },
  appSubtitle: {
    textAlign: 'center',
    marginTop: 8,
    color: '#666',
    fontSize: 16,
  },
  card: {
    marginBottom: 20,
    elevation: 4,
  },
  welcomeText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  feature: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
  roleDescription: {
    marginBottom: 16,
    color: '#666',
  },
  rolesContainer: {
    gap: 12,
  },
  roleCard: {
    marginBottom: 0,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedRoleCard: {
    borderColor: '#6200ee',
    backgroundColor: '#f3e5f5',
  },
  roleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  roleIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleIconText: {
    color: 'white',
    fontSize: 24,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    marginBottom: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
});

export default GreetingPage; 