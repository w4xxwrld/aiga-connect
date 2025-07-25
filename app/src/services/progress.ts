import api from './api';

export interface BeltLevel {
  id: string;
  name: string;
  color: string;
  order: number;
  requirements: string[];
  description: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'tournament' | 'training' | 'progress' | 'special';
  points: number;
  earned_date?: string;
  is_earned: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  date: string;
  location: string;
  type: 'local' | 'regional' | 'national' | 'international';
  status: 'upcoming' | 'ongoing' | 'completed';
  registration_deadline?: string;
  age_groups: string[];
  weight_categories: string[];
  description?: string;
}

export interface TournamentResult {
  id: string;
  tournament: Tournament;
  athlete_id: number;
  place: number;
  division: string;
  weight_category: string;
  points_earned: number;
  notes?: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  target_value: number;
  current_value: number;
  points_reward: number;
  deadline?: string;
  is_completed: boolean;
  is_active: boolean;
  icon: string;
}

export interface AthleteProgress {
  athlete_id: number;
  current_belt: BeltLevel;
  next_belt?: BeltLevel;
  progress_to_next: number; // percentage 0-100
  total_points: number;
  rank: number;
  achievements: Achievement[];
  tournament_results: TournamentResult[];
  active_challenges: Challenge[];
  training_stats: {
    total_sessions: number;
    this_month_sessions: number;
    streak_days: number;
    last_training_date?: string;
  };
}

class ProgressService {
  // Mock data for MVP - will be replaced with API calls later
  private mockBeltLevels: BeltLevel[] = [
    {
      id: 'white',
      name: 'Белый пояс',
      color: '#FFFFFF',
      order: 1,
      requirements: ['Базовые стойки', 'Простые броски', '30 дней тренировок'],
      description: 'Начальный уровень для новичков'
    },
    {
      id: 'yellow',
      name: 'Желтый пояс',
      color: '#FFEB3B',
      order: 2,
      requirements: ['Техника падений', 'Базовые удержания', '60 дней тренировок'],
      description: 'Первые навыки грэпплинга'
    },
    {
      id: 'orange',
      name: 'Оранжевый пояс',
      color: '#FF9800',
      order: 3,
      requirements: ['Эскейпы из позиций', 'Простые сабмишены', '90 дней тренировок'],
      description: 'Развитие защитных навыков'
    },
    {
      id: 'green',
      name: 'Зеленый пояс',
      color: '#4CAF50',
      order: 4,
      requirements: ['Гард контроль', 'Свипы', 'Участие в турнире'],
      description: 'Активная игра в партере'
    },
    {
      id: 'blue',
      name: 'Синий пояс',
      color: '#2196F3',
      order: 5,
      requirements: ['Техника с гарда', 'Проходы гарда', '2 года тренировок'],
      description: 'Средний технический уровень'
    },
    {
      id: 'brown',
      name: 'Коричневый пояс',
      color: '#795548',
      order: 6,
      requirements: ['Преподавание', 'Высокий технический уровень', 'Турнирные результаты'],
      description: 'Продвинутый уровень'
    },
    {
      id: 'black',
      name: 'Черный пояс',
      color: '#212121',
      order: 7,
      requirements: ['Мастерство техники', 'Преподавательский опыт', 'Вклад в развитие спорта'],
      description: 'Мастерский уровень'
    }
  ];

  private mockAchievements: Achievement[] = [
    {
      id: 'first_training',
      title: 'Первая тренировка',
      description: 'Прошел первую тренировку по грэпплингу',
      icon: 'account-star',
      category: 'training',
      points: 10,
      is_earned: true,
      earned_date: '2024-01-15'
    },
    {
      id: 'week_streak',
      title: 'Неделя подряд',
      description: 'Тренировался 7 дней подряд',
      icon: 'fire',
      category: 'training',
      points: 50,
      is_earned: false
    },
    {
      id: 'first_tournament',
      title: 'Первый турнир',
      description: 'Участвовал в первом турнире',
      icon: 'trophy',
      category: 'tournament',
      points: 100,
      is_earned: false
    },
    {
      id: 'belt_promotion',
      title: 'Повышение пояса',
      description: 'Получил новый пояс',
      icon: 'medal',
      category: 'progress',
      points: 200,
      is_earned: false
    },
    {
      id: 'month_training',
      title: 'Месяц тренировок',
      description: 'Тренировался целый месяц',
      icon: 'calendar-check',
      category: 'training',
      points: 75,
      is_earned: false
    }
  ];

  private mockTournaments: Tournament[] = [
    {
      id: 'almaty_open_2024',
      name: 'Almaty Grappling Open 2024',
      date: '2024-02-15',
      location: 'Алматы, Спорткомплекс "Жастар"',
      type: 'regional',
      status: 'upcoming',
      registration_deadline: '2024-02-10',
      age_groups: ['kids_4_7', 'kids_8_12', 'teens_13_17', 'adults_18_plus'],
      weight_categories: ['до 50кг', '50-60кг', '60-70кг', '70-80кг', '80+кг'],
      description: 'Региональный турнир по грэпплингу среди всех возрастных категорий'
    },
    {
      id: 'nur_sultan_championship',
      name: 'Чемпионат Нур-Султана',
      date: '2024-03-20',
      location: 'Нур-Султан, Дворец спорта',
      type: 'regional',
      status: 'upcoming',
      registration_deadline: '2024-03-15',
      age_groups: ['teens_13_17', 'adults_18_plus'],
      weight_categories: ['до 60кг', '60-70кг', '70-80кг', '80+кг'],
      description: 'Городской чемпионат по грэпплингу'
    },
    {
      id: 'winter_cup_2023',
      name: 'Зимний кубок 2023',
      date: '2023-12-10',
      location: 'Алматы, Центр единоборств',
      type: 'local',
      status: 'completed',
      age_groups: ['kids_4_7', 'kids_8_12'],
      weight_categories: ['до 30кг', '30-40кг', '40+кг']
    }
  ];

  private mockChallenges: Challenge[] = [
    {
      id: 'daily_training',
      title: 'Ежедневная тренировка',
      description: 'Тренируйся каждый день этой недели',
      type: 'weekly',
      target_value: 7,
      current_value: 3,
      points_reward: 100,
      deadline: '2024-02-04',
      is_completed: false,
      is_active: true,
      icon: 'calendar-today'
    },
    {
      id: 'technique_practice',
      title: 'Мастер техники',
      description: 'Отработай 50 технических приемов',
      type: 'monthly',
      target_value: 50,
      current_value: 23,
      points_reward: 200,
      deadline: '2024-02-29',
      is_completed: false,
      is_active: true,
      icon: 'karate'
    },
    {
      id: 'sparring_sessions',
      title: 'Спарринг мастер',
      description: 'Проведи 10 спаррингов',
      type: 'monthly',
      target_value: 10,
      current_value: 4,
      points_reward: 150,
      deadline: '2024-02-29',
      is_completed: false,
      is_active: true,
      icon: 'account-multiple'
    }
  ];

  // Progress methods
  async getAthleteProgress(athleteId: number): Promise<AthleteProgress> {
    try {
      // Mock implementation - will be replaced with API call
      const currentBelt = this.mockBeltLevels[1]; // Yellow belt
      const nextBelt = this.mockBeltLevels[2]; // Orange belt
      
      return {
        athlete_id: athleteId,
        current_belt: currentBelt,
        next_belt: nextBelt,
        progress_to_next: 65,
        total_points: 485,
        rank: 12,
        achievements: this.mockAchievements,
        tournament_results: [],
        active_challenges: this.mockChallenges,
        training_stats: {
          total_sessions: 45,
          this_month_sessions: 12,
          streak_days: 3,
          last_training_date: '2024-01-30'
        }
      };
    } catch (error: any) {
      throw new Error('Failed to get athlete progress');
    }
  }

  // Belt methods
  async getBeltLevels(): Promise<BeltLevel[]> {
    try {
      // Mock implementation
      return this.mockBeltLevels;
    } catch (error: any) {
      throw new Error('Failed to get belt levels');
    }
  }

  getBeltByOrder(order: number): BeltLevel | undefined {
    return this.mockBeltLevels.find(belt => belt.order === order);
  }

  getNextBelt(currentBeltId: string): BeltLevel | undefined {
    const currentBelt = this.mockBeltLevels.find(belt => belt.id === currentBeltId);
    if (!currentBelt) return undefined;
    return this.mockBeltLevels.find(belt => belt.order === currentBelt.order + 1);
  }

  // Achievement methods
  async getAchievements(athleteId?: number): Promise<Achievement[]> {
    try {
      // Mock implementation
      return this.mockAchievements;
    } catch (error: any) {
      throw new Error('Failed to get achievements');
    }
  }

  async unlockAchievement(athleteId: number, achievementId: string): Promise<void> {
    try {
      // Mock implementation - will be API call
      const achievement = this.mockAchievements.find(a => a.id === achievementId);
      if (achievement) {
        achievement.is_earned = true;
        achievement.earned_date = new Date().toISOString().split('T')[0];
      }
    } catch (error: any) {
      throw new Error('Failed to unlock achievement');
    }
  }

  // Tournament methods
  async getTournaments(): Promise<Tournament[]> {
    try {
      // Mock implementation
      return this.mockTournaments;
    } catch (error: any) {
      throw new Error('Failed to get tournaments');
    }
  }

  async getUpcomingTournaments(): Promise<Tournament[]> {
    try {
      const tournaments = await this.getTournaments();
      return tournaments.filter(t => t.status === 'upcoming');
    } catch (error: any) {
      throw new Error('Failed to get upcoming tournaments');
    }
  }

  async getTournamentResults(athleteId: number): Promise<TournamentResult[]> {
    try {
      // Mock implementation - will be API call
      return [];
    } catch (error: any) {
      throw new Error('Failed to get tournament results');
    }
  }

  // Challenge methods
  async getChallenges(athleteId: number): Promise<Challenge[]> {
    try {
      // Mock implementation
      return this.mockChallenges.filter(c => c.is_active);
    } catch (error: any) {
      throw new Error('Failed to get challenges');
    }
  }

  async updateChallengeProgress(challengeId: string, newValue: number): Promise<void> {
    try {
      // Mock implementation
      const challenge = this.mockChallenges.find(c => c.id === challengeId);
      if (challenge) {
        challenge.current_value = Math.min(newValue, challenge.target_value);
        if (challenge.current_value >= challenge.target_value) {
          challenge.is_completed = true;
        }
      }
    } catch (error: any) {
      throw new Error('Failed to update challenge progress');
    }
  }

  async completeChallenge(challengeId: string): Promise<void> {
    try {
      // Mock implementation
      const challenge = this.mockChallenges.find(c => c.id === challengeId);
      if (challenge) {
        challenge.is_completed = true;
        challenge.current_value = challenge.target_value;
      }
    } catch (error: any) {
      throw new Error('Failed to complete challenge');
    }
  }

  // Helper methods
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getTournamentTypeDisplayName(type: string): string {
    switch (type) {
      case 'local':
        return 'Местный';
      case 'regional':
        return 'Региональный';
      case 'national':
        return 'Национальный';
      case 'international':
        return 'Международный';
      default:
        return type;
    }
  }

  getTournamentStatusDisplayName(status: string): string {
    switch (status) {
      case 'upcoming':
        return 'Предстоящий';
      case 'ongoing':
        return 'Идет';
      case 'completed':
        return 'Завершен';
      default:
        return status;
    }
  }

  getChallengeTypeDisplayName(type: string): string {
    switch (type) {
      case 'daily':
        return 'Ежедневный';
      case 'weekly':
        return 'Еженедельный';
      case 'monthly':
        return 'Ежемесячный';
      case 'special':
        return 'Специальный';
      default:
        return type;
    }
  }

  calculateProgressPercentage(current: number, target: number): number {
    return Math.min(Math.round((current / target) * 100), 100);
  }
}

export default new ProgressService(); 