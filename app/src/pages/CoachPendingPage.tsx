import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Button, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';

const CoachPendingPage: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, refreshUser, logout } = useAppContext();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E74C3C"
          />
        }
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={80}
              color="#FFC107"
            />
          </View>

          <Text style={styles.title}>Заявка на рассмотрении</Text>

          <Text style={styles.subtitle}>
            Ваша заявка на регистрацию в качестве профессора находится на рассмотрении администратором.
          </Text>

          <Card style={styles.infoCard}>
            <Card.Content>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="account"
                  size={24}
                  color="#2196F3"
                />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Имя</Text>
                  <Text style={styles.infoValue}>{user?.full_name}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="phone"
                  size={24}
                  color="#4CAF50"
                />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Телефон</Text>
                  <Text style={styles.infoValue}>{user?.phone}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="shield-check"
                  size={24}
                  color="#FFC107"
                />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Статус</Text>
                  <Text style={[styles.infoValue, styles.pendingStatus]}>
                    Ожидает подтверждения
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.hintCard}>
            <Card.Content>
              <View style={styles.hintHeader}>
                <MaterialCommunityIcons
                  name="information"
                  size={24}
                  color="#2196F3"
                />
                <Text style={styles.hintTitle}>Что дальше?</Text>
              </View>
              <Text style={styles.hintText}>
                Администратор проверит вашу заявку и примет решение в ближайшее время.
                После одобрения вы получите полный доступ к функциям профессора.
              </Text>
              <Text style={styles.hintText}>
                Потяните вниз, чтобы проверить статус заявки.
              </Text>
            </Card.Content>
          </Card>

          <Button
            mode="outlined"
            icon="logout"
            onPress={handleLogout}
            style={styles.logoutButton}
            textColor="#E74C3C"
          >
            Выйти из аккаунта
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#B0BEC5',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  infoCard: {
    backgroundColor: '#1B263B',
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoText: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#B0BEC5',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  pendingStatus: {
    color: '#FFC107',
  },
  divider: {
    height: 1,
    backgroundColor: '#2C3E50',
    marginVertical: 8,
  },
  hintCard: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 12,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.3)',
  },
  hintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hintTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
    marginLeft: 8,
  },
  hintText: {
    fontSize: 14,
    color: '#B0BEC5',
    lineHeight: 22,
    marginBottom: 8,
  },
  logoutButton: {
    borderColor: '#E74C3C',
    width: '100%',
  },
});

export default CoachPendingPage;
