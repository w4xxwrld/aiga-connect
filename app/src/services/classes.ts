import api from './api';

export interface Class {
  id: number;
  name: string;
  description?: string;
  difficulty_level: 'beginner' | 'amateur' | 'professional';
  coach_id: number;
  days_of_week: string[]; // Array of days like ["monday", "wednesday"]
  start_time: string;
  end_time: string;
  max_capacity: number;
  price: number; // Price in tenge
  price_per_class?: number; // Alias for price (for backward compatibility)
  duration?: number; // Duration in minutes (optional)
  is_trial_available?: boolean; // Whether trial sessions are available
  created_at: string;
  updated_at: string;
  coach?: {
    id: number;
    first_name: string;
    last_name: string;
    full_name?: string;
  };
}

export interface ClassCreate {
  name: string;
  description?: string;
  difficulty_level: 'beginner' | 'amateur' | 'professional';
  coach_id: number;
  days_of_week: string[]; // Array of days
  start_time: string;
  end_time: string;
  max_capacity: number;
  price: number; // Price in tenge
}

export interface ClassUpdate {
  name?: string;
  description?: string;
  difficulty_level?: 'beginner' | 'amateur' | 'professional';
  days_of_week?: string[];
  start_time?: string;
  end_time?: string;
  max_capacity?: number;
  price?: number;
}

class ClassesService {
  async getClasses(skip: number = 0, limit: number = 100): Promise<Class[]> {
    try {
      const response = await api.get('/classes/', {
        params: { skip, limit }
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get classes');
    }
  }

  async getClassesByCoach(coachId: number, skip: number = 0, limit: number = 100): Promise<Class[]> {
    try {
      const response = await api.get('/classes/', {
        params: { coach_id: coachId, skip, limit }
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get classes by coach');
    }
  }

  async getClass(classId: number): Promise<Class> {
    try {
      const response = await api.get(`/classes/${classId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get class');
    }
  }

  async createClass(classData: ClassCreate): Promise<Class> {
    try {
      console.log('ClassesService: Creating class with data:', classData);
      const response = await api.post('/classes/', classData);
      console.log('ClassesService: Class created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('ClassesService: Error creating class:', error);
      console.error('ClassesService: Error response:', error.response?.data);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to create class');
    }
  }

  async updateClass(classId: number, updateData: ClassUpdate): Promise<Class> {
    try {
      const response = await api.put(`/classes/${classId}`, updateData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to update class');
    }
  }

  /**
   * Get class participants.
   * @param classId - ID of the class
   * @param classDate - Optional date (YYYY-MM-DD) to filter participants for a specific session
   */
  async getClassParticipants(classId: number, classDate?: string): Promise<any[]> {
    try {
      const params: { class_date?: string } = {};
      if (classDate) {
        params.class_date = classDate;
      }
      const response = await api.get(`/classes/${classId}/participants`, { params });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get class participants');
    }
  }

  // Helper methods for display
  getDifficultyDisplayName(level: string): string {
    switch (level) {
      case 'beginner': return 'Начинающий';
      case 'amateur': return 'Любитель';
      case 'professional': return 'Профессионал';
      default: return level;
    }
  }

  formatTime(timeString: string): string {
    return timeString.substring(0, 5); // Extract HH:MM from HH:MM:SS
  }

  formatDayOfWeek(day: string): string {
    if (!day || typeof day !== 'string') return '';
    const days: { [key: string]: string } = {
      'понедельник': 'Понедельник',
      'вторник': 'Вторник',
      'среда': 'Среда',
      'четверг': 'Четверг',
      'пятница': 'Пятница',
      'суббота': 'Суббота',
      'воскресенье': 'Воскресенье',
      // Keep English mappings for backward compatibility
      'monday': 'Понедельник',
      'tuesday': 'Вторник',
      'wednesday': 'Среда',
      'thursday': 'Четверг',
      'friday': 'Пятница',
      'saturday': 'Суббота',
      'sunday': 'Воскресенье'
    };
    return days[day.toLowerCase()] || day;
  }

  convertDayToEnglish(day: string): string {
    if (!day || typeof day !== 'string') return '';
    const dayMapping: { [key: string]: string } = {
      'понедельник': 'monday',
      'вторник': 'tuesday',
      'среда': 'wednesday',
      'четверг': 'thursday',
      'пятница': 'friday',
      'суббота': 'saturday',
      'воскресенье': 'sunday'
    };
    return dayMapping[day.toLowerCase()] || day.toLowerCase();
  }

  calculateDuration(startTime: string, endTime: string): string {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}ч ${diffMinutes}м`;
    }
    return `${diffMinutes}м`;
  }
}

const classesService = new ClassesService();
export default classesService; 