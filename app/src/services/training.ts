import api from './api';

export interface Training {
  id: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  training_type: 'group' | 'individual' | 'competition_prep' | 'seminar';
  level: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  age_group: 'kids_4_7' | 'kids_8_12' | 'teens_13_17' | 'adults_18_plus' | 'mixed_ages';
  belt_level: 'white' | 'yellow' | 'orange' | 'green' | 'blue' | 'brown' | 'black' | 'mixed';
  capacity: number;
  location: string;
  price?: number;
  trainer_id: number;
  trainer: {
    id: number;
    full_name?: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
  available_spots: number;
  is_bookable: boolean;
}

export interface TrainingCreate {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  training_type: 'group' | 'individual' | 'competition_prep' | 'seminar';
  level: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  age_group: 'kids_4_7' | 'kids_8_12' | 'teens_13_17' | 'adults_18_plus' | 'mixed_ages';
  belt_level: 'white' | 'yellow' | 'orange' | 'green' | 'blue' | 'brown' | 'black' | 'mixed';
  capacity?: number;
  location: string;
  price?: number;
  trainer_id?: number;
}

export interface TrainingUpdate {
  title?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  training_type?: 'group' | 'individual' | 'competition_prep' | 'seminar';
  level?: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  age_group?: 'kids_4_7' | 'kids_8_12' | 'teens_13_17' | 'adults_18_plus' | 'mixed_ages';
  belt_level?: 'white' | 'yellow' | 'orange' | 'green' | 'blue' | 'brown' | 'black' | 'mixed';
  capacity?: number;
  location?: string;
  price?: number;
  is_active?: boolean;
}

export interface TrainingFilter {
  trainer_id?: number;
  training_type?: string;
  level?: string;
  age_group?: string;
  belt_level?: string;
  date_from?: string;
  date_to?: string;
}

export interface Booking {
  id: number;
  training_id: number;
  user_id: number;
  athlete_id: number;
  status: 'confirmed' | 'cancelled' | 'waitlist';
  booking_date: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  notes?: string;
  booker: {
    id: number;
    full_name?: string;
    iin: string;
  };
  athlete: {
    id: number;
    full_name?: string;
    iin: string;
  };
}

export interface BookingCreate {
  training_id: number;
  athlete_id: number;
  notes?: string;
}

export interface TrainingWithBookings extends Training {
  bookings: Booking[];
}

class TrainingService {
  // Training methods
  async createTraining(training: TrainingCreate): Promise<Training> {
    try {
      const response = await api.post('/sessions/trainings/', training);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to create training');
    }
  }

  async getTrainings(filters?: TrainingFilter): Promise<Training[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }
      
      const response = await api.get(`/sessions/trainings/?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get trainings');
    }
  }

  async getUpcomingTrainings(limit?: number): Promise<Training[]> {
    try {
      const params = limit ? `?limit=${limit}` : '';
      const response = await api.get(`/sessions/trainings/upcoming${params}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get upcoming trainings');
    }
  }

  async getMyTrainings(): Promise<TrainingWithBookings[]> {
    try {
      const response = await api.get('/sessions/trainings/my');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get your trainings');
    }
  }

  async getTraining(trainingId: number): Promise<Training> {
    try {
      const response = await api.get(`/sessions/trainings/${trainingId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get training');
    }
  }

  async updateTraining(trainingId: number, update: TrainingUpdate): Promise<Training> {
    try {
      const response = await api.put(`/sessions/trainings/${trainingId}`, update);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to update training');
    }
  }

  async deleteTraining(trainingId: number): Promise<void> {
    try {
      await api.delete(`/sessions/trainings/${trainingId}`);
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to delete training');
    }
  }

  async getTrainingBookings(trainingId: number): Promise<Booking[]> {
    try {
      const response = await api.get(`/sessions/trainings/${trainingId}/bookings`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get training bookings');
    }
  }

  // Booking methods
  async createBooking(booking: BookingCreate): Promise<Booking> {
    try {
      const response = await api.post('/sessions/bookings/', booking);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to create booking');
    }
  }

  async getMyBookings(): Promise<Booking[]> {
    try {
      const response = await api.get('/sessions/bookings/my');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get your bookings');
    }
  }

  async getAthleteBookings(athleteId: number): Promise<Booking[]> {
    try {
      const response = await api.get(`/sessions/bookings/athlete/${athleteId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get athlete bookings');
    }
  }

  async getBooking(bookingId: number): Promise<Booking> {
    try {
      const response = await api.get(`/sessions/bookings/${bookingId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get booking');
    }
  }

  async cancelBooking(bookingId: number, reason?: string): Promise<Booking> {
    try {
      const response = await api.post(`/sessions/bookings/${bookingId}/cancel`, {
        cancellation_reason: reason
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to cancel booking');
    }
  }

  // Helper methods
  getTrainingTypeDisplayName(type: string): string {
    switch (type) {
      case 'group':
        return 'Групповая';
      case 'individual':
        return 'Индивидуальная';
      case 'competition_prep':
        return 'Подготовка к соревнованиям';
      case 'seminar':
        return 'Семинар';
      default:
        return type;
    }
  }

  getLevelDisplayName(level: string): string {
    switch (level) {
      case 'beginner':
        return 'Начинающий';
      case 'intermediate':
        return 'Средний';
      case 'advanced':
        return 'Продвинутый';
      case 'mixed':
        return 'Смешанный';
      default:
        return level;
    }
  }

  getAgeGroupDisplayName(ageGroup: string): string {
    switch (ageGroup) {
      case 'kids_4_7':
        return '4-7 лет';
      case 'kids_8_12':
        return '8-12 лет';
      case 'teens_13_17':
        return '13-17 лет';
      case 'adults_18_plus':
        return '18+ лет';
      case 'mixed_ages':
        return 'Смешанные возрасты';
      default:
        return ageGroup;
    }
  }

  getBeltLevelDisplayName(beltLevel: string): string {
    switch (beltLevel) {
      case 'white':
        return 'Белый';
      case 'yellow':
        return 'Желтый';
      case 'orange':
        return 'Оранжевый';
      case 'green':
        return 'Зеленый';
      case 'blue':
        return 'Синий';
      case 'brown':
        return 'Коричневый';
      case 'black':
        return 'Черный';
      case 'mixed':
        return 'Смешанный';
      default:
        return beltLevel;
    }
  }

  getBookingStatusDisplayName(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'Подтверждено';
      case 'cancelled':
        return 'Отменено';
      case 'waitlist':
        return 'Лист ожидания';
      default:
        return status;
    }
  }

  formatDateTime(dateTimeString: string): string {
    const date = new Date(dateTimeString);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatDate(dateTimeString: string): string {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  formatTime(dateTimeString: string): string {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getTrainingLevelDisplayName(level: string): string {
    switch (level) {
      case 'beginner':
        return 'Начинающий';
      case 'intermediate':
        return 'Средний';
      case 'advanced':
        return 'Продвинутый';
      case 'expert':
        return 'Эксперт';
      default:
        return level;
    }
  }



  calculateDuration(startTime: string, endTime: string): string {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}ч ${minutes}мин`;
    }
    return `${minutes}мин`;
  }
}

export default new TrainingService(); 