import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import tournamentsService, { Tournament } from '../../services/tournaments';

interface TournamentCardProps {
  tournament: Tournament;
  onPress: () => void;
}

const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.tournamentItem}
      onPress={onPress}
    >
      <View style={styles.tournamentInfo}>
        <Text style={styles.tournamentName}>{tournament.name}</Text>
        <Text style={styles.tournamentDate}>
          {tournamentsService.formatDate(tournament.event_date)}
        </Text>
        <Text style={styles.tournamentLocation}>{tournament.location}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tournamentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
  },
  tournamentInfo: {
    flex: 1,
  },
  tournamentName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  tournamentDate: {
    color: '#3498DB',
    fontSize: 14,
    marginBottom: 2,
  },
  tournamentLocation: {
    color: '#B0BEC5',
    fontSize: 14,
  },
});

export default TournamentCard;
