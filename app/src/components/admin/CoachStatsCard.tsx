import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title } from 'react-native-paper';
import StatCard from '../StatCard';
import { CoachStats } from '../../services/admin';

interface CoachStatsCardProps {
  stats: CoachStats;
}

const CoachStatsCard: React.FC<CoachStatsCardProps> = ({ stats }) => {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.title}>Статистика</Title>
        <View style={styles.statsGrid}>
          <View style={styles.statRow}>
            <StatCard
              icon="calendar-multiple"
              value={stats.total_classes}
              label="Всего занятий"
              iconColor="#2196F3"
            />
            <StatCard
              icon="calendar-check"
              value={stats.active_classes}
              label="Активных занятий"
              iconColor="#4CAF50"
            />
          </View>

          <View style={styles.statRow}>
            <StatCard
              icon="bookmark-multiple"
              value={stats.total_bookings}
              label="Всего бронирований"
              iconColor="#FF9800"
            />
            <StatCard
              icon="account-group"
              value={stats.total_students}
              label="Всего учеников"
              iconColor="#9C27B0"
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1B263B',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
  },
});

export default CoachStatsCard;
