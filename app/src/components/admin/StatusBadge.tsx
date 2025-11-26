import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  type: 'role' | 'status';
  value: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value }) => {
  const getColors = () => {
    if (type === 'role') {
      switch (value) {
        case 'athlete':
          return { bg: 'rgba(33, 150, 243, 0.2)', text: '#2196F3' }; // Blue
        case 'coach':
          return { bg: 'rgba(76, 175, 80, 0.2)', text: '#4CAF50' }; // Green
        case 'admin':
          return { bg: 'rgba(156, 39, 176, 0.2)', text: '#9C27B0' }; // Purple
        default:
          return { bg: 'rgba(158, 158, 158, 0.2)', text: '#9E9E9E' };
      }
    } else {
      // status
      switch (value) {
        case 'pending':
          return { bg: 'rgba(255, 193, 7, 0.2)', text: '#FFC107' }; // Yellow
        case 'approved':
          return { bg: 'rgba(76, 175, 80, 0.2)', text: '#4CAF50' }; // Green
        case 'declined':
        case 'suspended':
          return { bg: 'rgba(244, 67, 54, 0.2)', text: '#F44336' }; // Red
        default:
          return { bg: 'rgba(158, 158, 158, 0.2)', text: '#9E9E9E' };
      }
    }
  };

  const getLabel = () => {
    if (type === 'role') {
      switch (value) {
        case 'athlete':
          return 'Спортсмен';
        case 'coach':
          return 'Тренер';
        case 'admin':
          return 'Админ';
        default:
          return value;
      }
    } else {
      switch (value) {
        case 'pending':
          return 'Ожидает';
        case 'approved':
          return 'Одобрен';
        case 'declined':
          return 'Отклонен';
        case 'suspended':
          return 'Приостановлен';
        default:
          return value;
      }
    }
  };

  const colors = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>
        {getLabel()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default StatusBadge;
