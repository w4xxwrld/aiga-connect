import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  message: string;
  subtitle?: string;
  buttonText?: string;
  onButtonPress?: () => void;
  iconColor?: string;
  iconSize?: number;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  message,
  subtitle,
  buttonText,
  onButtonPress,
  iconColor = '#B0BEC5',
  iconSize = 48,
}) => {
  return (
    <View style={styles.emptyState}>
      {icon && <MaterialCommunityIcons name={icon} size={iconSize} color={iconColor} />}
      <Text style={styles.emptyStateText}>{message}</Text>
      {subtitle && <Text style={styles.emptyStateSubtext}>{subtitle}</Text>}
      {buttonText && onButtonPress && (
        <Button
          mode="contained"
          onPress={onButtonPress}
          style={styles.emptyStateButton}
          buttonColor="#E74C3C"
        >
          {buttonText}
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    color: '#B0BEC5',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    color: '#B0BEC5',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.8,
  },
  emptyStateButton: {
    marginTop: 24,
  },
});

export default EmptyState;
