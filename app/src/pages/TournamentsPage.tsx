import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import tournamentsService, { Tournament } from '../services/tournaments';

interface TournamentParticipation {
  id: number;
  tournament_id: number;
  athlete_id: number;
  weight_category: string;
  belt_division: string;
  result: string;
  notes: string;
}

const TournamentsPage: React.FC = () => {
  const { user, isSidebarOpen, setIsSidebarOpen } = useAppContext();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [participations, setParticipations] = useState<TournamentParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const handleSidebarClose = useCallback(() => {
    setIsSidebarOpen(false);
  }, [setIsSidebarOpen]);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      
      // Fetch tournaments from API
      const tournamentsData = await tournamentsService.getTournaments();
      setTournaments(tournamentsData);
      
      // Fetch user's tournament participations if user is athlete or parent
      if (user && (user.primary_role === 'athlete' || user.primary_role === 'parent')) {
        let athleteId = user.id;
        
        // If parent, we need to get their linked child
        if (user.primary_role === 'parent') {
          // For now, we'll use a placeholder since we need to implement child linking
          // This should be replaced with actual child linking logic
          console.log('Parent user - child linking not yet implemented');
        }
        
        if (athleteId) {
          try {
            const participationsData = await tournamentsService.getAthleteTournaments(athleteId);
            // Convert to participation format
            const participations = participationsData.map(tournament => ({
              id: tournament.id,
              tournament_id: tournament.id,
              athlete_id: athleteId,
              weight_category: '',
              belt_division: '',
              result: '',
              notes: ''
            }));
            setParticipations(participations);
          } catch (error) {
            console.error('Error fetching participations:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      // Don't show error alert, just set empty arrays
      setTournaments([]);
      setParticipations([]);
    } finally {
      setLoading(false);
    }
  };



  const getResultName = (result: string) => {
    const results = {
      gold: '🥇 Золото',
      silver: '🥈 Серебро',
      bronze: '🥉 Бронза',
      participant: 'Участник',
      dnf: 'Не финишировал',
    };
    return results[result as keyof typeof results] || result;
  };

  const isUserParticipating = (tournamentId: number) => {
    return participations.some(p => p.tournament_id === tournamentId);
  };

  const getUserParticipation = (tournamentId: number) => {
    return participations.find(p => p.tournament_id === tournamentId);
  };

  const filteredTournaments = tournaments.filter(tournament => {
    const isUpcoming = new Date(tournament.event_date) > new Date();
    return activeTab === 'upcoming' ? isUpcoming : !isUpcoming;
  });

  if (loading) {
    return (
      <Layout title="Турниры" onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>Загрузка турниров...</Text>
        </View>
        <Sidebar isVisible={isSidebarOpen} onClose={handleSidebarClose} />
      </Layout>
    );
  }

  return (
    <Layout title="Турниры" onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}>
      <ScrollView style={styles.container}>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            Предстоящие
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
            Прошедшие
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tournaments List */}
      <View style={styles.section}>
        {filteredTournaments.length > 0 ? (
          filteredTournaments.map((tournament) => {
            const participation = getUserParticipation(tournament.id);
            const isParticipating = isUserParticipating(tournament.id);
            
            return (
              <View key={tournament.id} style={styles.tournamentCard}>
                <View style={styles.tournamentHeader}>
                  <View style={styles.tournamentTitleContainer}>
                    <Text style={styles.tournamentTitle}>{tournament.name}</Text>
                    {isParticipating && (
                      <View style={styles.participationBadge}>
                        <MaterialCommunityIcons name="check-circle" size={16} color="#27AE60" />
                        <Text style={styles.participationText}>Участвую</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.tournamentLevel}>
                    <Text style={styles.levelText}>{tournamentsService.getTournamentLevelDisplayName(tournament.tournament_level)}</Text>
                  </View>
                </View>

                <Text style={styles.tournamentDescription}>{tournament.description}</Text>

                <View style={styles.tournamentDetails}>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="map-marker" size={16} color="#B0BEC5" />
                    <Text style={styles.detailText}>{tournament.location}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="calendar" size={16} color="#B0BEC5" />
                    <Text style={styles.detailText}>
                      {tournamentsService.formatDate(tournament.event_date)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="currency-usd" size={16} color="#B0BEC5" />
                    <Text style={styles.detailText}>
                      Взнос: {tournament.registration_fee ? tournamentsService.formatPrice(tournament.registration_fee) : 'Бесплатно'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="account-group" size={16} color="#B0BEC5" />
                    <Text style={styles.detailText}>
                      {tournament.current_participants || 0}/{tournament.max_participants || '∞'} участников
                    </Text>
                  </View>
                </View>

                {participation && (
                  <View style={styles.participationInfo}>
                    <Text style={styles.participationTitle}>Ваше участие:</Text>
                    <View style={styles.participationDetails}>
                      <Text style={styles.participationDetail}>
                        Категория: {participation.weight_category}
                      </Text>
                      <Text style={styles.participationDetail}>
                        Пояс: {participation.belt_division}
                      </Text>
                      <Text style={styles.participationDetail}>
                        Результат: {getResultName(participation.result)}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.tournamentStatus}>
                  <View style={[styles.statusBadge, { backgroundColor: tournamentsService.getStatusColor(tournament.status) }]}>
                    <Text style={styles.statusText}>{tournamentsService.getStatusDisplayName(tournament.status)}</Text>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="trophy-outline" size={48} color="#B0BEC5" />
            <Text style={styles.emptyText}>
              {activeTab === 'upcoming' ? 'Нет предстоящих турниров' : 'Нет прошедших турниров'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'upcoming' 
                ? 'Следите за обновлениями для новых турниров' 
                : 'Участвуйте в турнирах для пополнения истории'
              }
            </Text>
            <Text style={[styles.emptySubtext, { fontSize: 12, marginTop: 8, opacity: 0.7 }]}>
              Демо данные - функционал турниров в разработке
            </Text>
          </View>
        )}
      </View>
      </ScrollView>
      <Sidebar isVisible={isSidebarOpen} onClose={handleSidebarClose} />
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D1B2A',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    backgroundColor: '#1B263B',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#E74C3C',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0BEC5',
  },
  activeTabText: {
    color: '#fff',
  },
  section: {
    padding: 20,
  },
  tournamentCard: {
    backgroundColor: '#1B263B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tournamentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tournamentTitleContainer: {
    flex: 1,
  },
  tournamentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  participationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participationText: {
    fontSize: 12,
    color: '#27AE60',
    marginLeft: 4,
  },
  tournamentLevel: {
    backgroundColor: '#2C3E50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  levelText: {
    fontSize: 12,
    color: '#B0BEC5',
    fontWeight: '600',
  },
  tournamentDescription: {
    fontSize: 14,
    color: '#B0BEC5',
    marginBottom: 16,
    lineHeight: 20,
  },
  tournamentDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#B0BEC5',
    marginLeft: 8,
  },
  participationInfo: {
    backgroundColor: '#2C3E50',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  participationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  participationDetails: {
    gap: 4,
  },
  participationDetail: {
    fontSize: 12,
    color: '#B0BEC5',
  },
  tournamentStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#B0BEC5',
    marginTop: 16,
    fontWeight: 'bold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default TournamentsPage; 