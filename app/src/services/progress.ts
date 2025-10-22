import { api } from './api';

export interface Progress {
  id: string;
  athlete_id: string;
  current_belt: string;
  current_stripes: number;
  last_promotion_date: string | null;
  total_tournaments_participated: number;
  achievements: string[];
  created_at: string;
  updated_at: string;
}

class ProgressService {
  async getAthleteProgress(athleteId: string): Promise<Progress> {
    try {
      const response = await api.get(`/progress/${athleteId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching athlete progress:', error);
      throw error;
    }
  }

  async updateAthleteProgress(athleteId: string, progressData: Partial<Progress>): Promise<Progress> {
    try {
      const response = await api.put(`/progress/${athleteId}`, progressData);
      return response.data;
    } catch (error) {
      console.error('Error updating athlete progress:', error);
      throw error;
    }
  }

  async addAchievement(athleteId: string, achievement: string): Promise<Progress> {
    try {
      const response = await api.post(`/progress/${athleteId}/achievements`, { achievement });
      return response.data;
    } catch (error) {
      console.error('Error adding achievement:', error);
      throw error;
    }
  }

  async promoteAthlete(athleteId: string, newBelt: string, stripes?: number): Promise<Progress> {
    try {
      const response = await api.post(`/progress/${athleteId}/promote`, {
        new_belt: newBelt,
        stripes: stripes || 0
      });
      return response.data;
    } catch (error) {
      console.error('Error promoting athlete:', error);
      throw error;
    }
  }
}

const progressService = new ProgressService();
export default progressService;
