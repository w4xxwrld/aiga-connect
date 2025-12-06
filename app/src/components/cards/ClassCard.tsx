import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Title, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import classesService, { Class } from '../../services/classes';

interface ClassCardProps {
  classItem: Class;
  onPress: () => void;
  onBook?: () => void;
  showBookButton?: boolean;
}

const ClassCard: React.FC<ClassCardProps> = ({
  classItem,
  onPress,
  onBook,
  showBookButton = false,
}) => {
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'amateur': return '#FF9800';
      case 'professional': return '#F44336';
      default: return '#757575';
    }
  };

  return (
    <Card style={styles.classCard} onPress={onPress}>
      <Card.Content>
        <View style={styles.classHeader}>
          <View style={styles.classInfo}>
            <Title style={styles.classTitle}>{classItem.name}</Title>
            <Text style={styles.classTime}>
              {classItem.days_of_week?.filter(day => day).map(day => classesService.formatDayOfWeek(day)).join(', ') || 'Не указано'} • {classesService.formatTime(classItem.start_time)} - {classesService.formatTime(classItem.end_time)}
            </Text>
            <Text style={styles.classDuration}>
              Длительность: {classesService.calculateDuration(classItem.start_time, classItem.end_time)}
            </Text>
          </View>
          <View style={styles.classMeta}>
            <Text style={styles.priceText}>{classItem.price} ₸</Text>
          </View>
        </View>

        {classItem.description && (
          <Text style={styles.classDescription} numberOfLines={2}>
            {classItem.description}
          </Text>
        )}

        <View style={styles.classDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="human-male-board" size={16} color="#E74C3C" />
            <Text style={styles.detailText}>
              Профессор: {classItem.coach ? `${classItem.coach.first_name} ${classItem.coach.last_name}` : `ID: ${classItem.coach_id}`}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="signal" size={16} color="#E74C3C" />
            <Text style={styles.detailText}>
              Уровень: <Text style={[styles.difficultyText, { color: getDifficultyColor(classItem.difficulty_level) }]}>
                {classesService.getDifficultyDisplayName(classItem.difficulty_level)}
              </Text>
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="account-multiple" size={16} color="#E74C3C" />
            <Text style={styles.detailText}>
              Мест: {classItem.max_capacity}
            </Text>
          </View>
        </View>

        <View style={styles.classActions}>
          <Button
            mode="outlined"
            onPress={onPress}
            style={styles.actionButton}
            textColor="#E74C3C"
          >
            Подробнее
          </Button>

          {showBookButton && onBook && (
            <Button
              mode="contained"
              onPress={onBook}
              style={[styles.actionButton, styles.bookButton]}
              buttonColor="#E74C3C"
              textColor="#fff"
            >
              Записаться
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  classCard: {
    backgroundColor: '#1B263B',
    marginBottom: 16,
    borderRadius: 12,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  classInfo: {
    flex: 1,
  },
  classTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  classTime: {
    color: '#E74C3C',
    fontSize: 14,
    marginBottom: 2,
  },
  classDuration: {
    color: '#B0BEC5',
    fontSize: 12,
  },
  classMeta: {
    alignItems: 'flex-end',
  },
  priceText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  classDescription: {
    color: '#B0BEC5',
    fontSize: 14,
    marginBottom: 12,
  },
  classDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
  },
  difficultyText: {
    fontWeight: 'bold',
  },
  classActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  bookButton: {
    marginLeft: 8,
  },
});

export default ClassCard;
