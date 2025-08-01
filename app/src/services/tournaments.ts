import api from './api';

export interface Tournament {
  id: number;
  name: string;
  description?: string;
  location: string;
  event_date: string;
  registration_start?: string;
  registration_end?: string;
  max_participants?: number;
  registration_fee?: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  tournament_level: 'local' | 'regional' | 'national' | 'international';
  age_categories?: string;
  weight_categories?: string;
  belt_categories?: string;
  organizer?: string;
  contact_info?: string;
  current_participants: number;
  created_at: string;
  updated_at?: string;
}

export interface TournamentParticipant {
  id: number;
  tournament_id: number;
  athlete_id: number;
  weight_category?: string;
  belt_level?: string;
  registration_date: string;
  is_confirmed: boolean;
  payment_status: string;
  final_placement?: number;
  created_at: string;
  updated_at?: string;
  athlete?: {
    id: number;
    full_name: string;
    email: string;
  };
}

export interface TournamentCreate {
  name: string;
  description?: string;
  location: string;
  event_date: string;
  registration_start?: string;
  registration_end?: string;
  max_participants?: number;
  registration_fee?: number;
  tournament_level?: 'local' | 'regional' | 'national' | 'international';
  age_categories?: string;
  weight_categories?: string;
  belt_categories?: string;
  organizer?: string;
  contact_info?: string;
}

export interface TournamentParticipantCreate {
  tournament_id: number;
  athlete_id: number;
  weight_category?: string;
  belt_level?: string;
}

class TournamentsService {
  async getTournaments(
    skip: number = 0, 
    limit: number = 100, 
    status?: string, 
    category?: string
  ): Promise<Tournament[]> {
    try {
      const params: any = { skip, limit };
      if (status) params.status = status;
      if (category) params.category = category;
      
      const response = await api.get('/progress/tournaments', { params });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get tournaments');
    }
  }

  async getTournament(tournamentId: number): Promise<Tournament> {
    try {
      const response = await api.get(`/progress/tournaments/${tournamentId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get tournament');
    }
  }

  async createTournament(tournamentData: TournamentCreate): Promise<Tournament> {
    try {
      const response = await api.post('/progress/tournaments', tournamentData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to create tournament');
    }
  }

  async updateTournament(tournamentId: number, updateData: Partial<TournamentCreate>): Promise<Tournament> {
    try {
      const response = await api.put(`/progress/tournaments/${tournamentId}`, updateData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to update tournament');
    }
  }

  async deleteTournament(tournamentId: number): Promise<void> {
    try {
      await api.delete(`/progress/tournaments/${tournamentId}`);
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to delete tournament');
    }
  }

  async getTournamentParticipants(tournamentId: number): Promise<TournamentParticipant[]> {
    try {
      const response = await api.get(`/progress/tournaments/${tournamentId}/participants`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get tournament participants');
    }
  }

  async registerForTournament(tournamentId: number, participantData: Omit<TournamentParticipantCreate, 'tournament_id'>, athleteId?: number): Promise<TournamentParticipant> {
    try {
      const params: any = {};
      if (athleteId) {
        params.athlete_id = athleteId;
      }
      
      const response = await api.post(`/progress/tournaments/${tournamentId}/register`, participantData, { params });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to register for tournament');
    }
  }

  async getAthleteTournaments(athleteId: number): Promise<Tournament[]> {
    try {
      const response = await api.get(`/progress/athletes/${athleteId}/tournaments`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get athlete tournaments');
    }
  }

  async isAthleteRegisteredForTournament(tournamentId: number, athleteId: number): Promise<boolean> {
    try {
      // Use the new endpoint that allows athletes to check their own registration
      const response = await api.get(`/progress/tournaments/${tournamentId}/check-registration`);
      // If we get here, the athlete is registered
      return true;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // 404 means not registered
        return false;
      }
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to check tournament participation');
    }
  }

  getStatusDisplayName(status: string): string {
    const statuses = {
      upcoming: 'Предстоящий',
      ongoing: 'Проходит',
      completed: 'Завершен',
      cancelled: 'Отменен',
    };
    return statuses[status as keyof typeof statuses] || status;
  }

  getStatusColor(status: string): string {
    const colors = {
      upcoming: '#3498DB',
      ongoing: '#27AE60',
      completed: '#95A5A6',
      cancelled: '#E74C3C',
    };
    return colors[status as keyof typeof colors] || '#95A5A6';
  }

  getTournamentLevelDisplayName(level: string): string {
    const levels = {
      local: 'Местный',
      regional: 'Региональный',
      national: 'Национальный',
      international: 'Международный',
    };
    return levels[level as keyof typeof levels] || level;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatPrice(price: number): string {
    return `${price.toLocaleString()} ₸`;
  }

  isRegistrationOpen(registrationEnd: string): boolean {
    return new Date(registrationEnd) > new Date();
  }

  isTournamentActive(eventDate: string): boolean {
    const now = new Date();
    const event = new Date(eventDate);
    // Consider tournament active on the event date
    return now.toDateString() === event.toDateString();
  }
}

export default new TournamentsService(); 