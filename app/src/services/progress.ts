import api from './api';

export interface Progress {
  id: number;
  athlete_id: number;
  current_belt: string;
  current_stripes: number;
  total_classes_attended: number;
  total_tournaments_participated: number;
  total_wins: number;
  total_losses: number;
  belt_received_date: string | null;
  last_promotion_date: string | null;
  created_at: string;
  updated_at: string;
}

class ProgressService {
  async getAthleteProgress(athleteId: number): Promise<Progress | null> {
    try {
      const response = await api.get(`/progress/progress/${athleteId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching athlete progress:', error);
      return null;
    }
  }

  getBeltDisplayName(belt: string): string {
    switch (belt) {
      case 'white': return 'Белый пояс';
      case 'yellow': return 'Желтый пояс';
      case 'orange': return 'Оранжевый пояс';
      case 'green': return 'Зеленый пояс';
      case 'blue': return 'Синий пояс';
      case 'brown': return 'Коричневый пояс';
      case 'black': return 'Черный пояс';
      case 'mixed': return 'Смешанный пояс';
      default: return 'Белый пояс';
    }
  }

  getBeltWithStripes(belt: string, stripes: number): string {
    const beltName = this.getBeltDisplayName(belt);
    if (stripes > 0) {
      return `${beltName} (${stripes} полос${stripes === 1 ? 'а' : stripes < 5 ? 'ы' : 'ок'})`;
    }
    return beltName;
  }
}

export default new ProgressService(); 