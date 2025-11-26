import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Searchbar, Chip } from 'react-native-paper';

interface AdminFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedRole: string;
  onRoleChange: (role: string) => void;
  roleOptions: { value: string; label: string }[];
}

const AdminFilters: React.FC<AdminFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedRole,
  onRoleChange,
  roleOptions,
}) => {
  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Поиск..."
        onChangeText={onSearchChange}
        value={searchQuery}
        style={styles.searchbar}
        iconColor="#B0BEC5"
        placeholderTextColor="#B0BEC5"
        inputStyle={styles.searchInput}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {roleOptions.map((option) => (
          <Chip
            key={option.value}
            selected={selectedRole === option.value}
            onPress={() => onRoleChange(option.value)}
            style={[
              styles.chip,
              selectedRole === option.value && styles.chipSelected,
            ]}
            textStyle={[
              styles.chipText,
              selectedRole === option.value && styles.chipTextSelected,
            ]}
            selectedColor="#E74C3C"
          >
            {option.label}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0D1B2A',
    paddingBottom: 8,
  },
  searchbar: {
    backgroundColor: '#1B263B',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 8,
  },
  searchInput: {
    color: '#fff',
  },
  chipsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    backgroundColor: '#1B263B',
    borderWidth: 1,
    borderColor: '#2C3E50',
  },
  chipSelected: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    borderColor: '#E74C3C',
  },
  chipText: {
    color: '#B0BEC5',
  },
  chipTextSelected: {
    color: '#E74C3C',
    fontWeight: '600',
  },
});

export default AdminFilters;
