import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';

interface RoleCardProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  role: 'athlete' | 'coach';
  onSelect: (role: 'athlete' | 'coach') => void;
  disabled?: boolean;
}

export const RoleCard: React.FC<RoleCardProps> = ({ icon, title, description, role, onSelect, disabled = false }) => {
  const handlePress = () => {
    console.log('[RoleCard] pressed role=', role);
    try {
      onSelect(role);
    } catch (e) {
      console.warn('[RoleCard] onSelect error', e);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, disabled && styles.disabled]}
      onPress={handlePress}
      disabled={disabled}
      accessibilityLabel={`Select ${title} role`}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrap}>{icon ?? null}</View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#102030',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabled: { opacity: 0.6 },
  iconWrap: { marginBottom: 8 },
  title: { color: '#fff', fontWeight: '600', fontSize: 16 },
  desc: { color: '#c0c8d0', fontSize: 13, textAlign: 'center', marginTop: 6 },
});