import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StatCardProps {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  value: number | string;
  label: string;
  iconColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  iconColor = '#E74C3C',
}) => {
  return (
    <Card style={styles.statCard}>
      <View style={styles.statContent}>
        {icon && <MaterialCommunityIcons name={icon} size={24} color={iconColor} />}
        <Text style={styles.statNumber}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    backgroundColor: '#1B263B',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statContent: {
    alignItems: 'center',
    padding: 16,
  },
  statNumber: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    color: '#B0BEC5',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default StatCard;
