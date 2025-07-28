import api from './api';
import { User, ParentAthleteRelationship } from './auth';

export interface Child {
  id: number;
  iin: string;
  full_name: string;
  email: string;
  phone?: string;
  birth_date: string;
  emergency_contact?: string;
  primary_role: 'parent' | 'athlete' | 'coach';
  roles: ('parent' | 'athlete' | 'coach')[];
  is_head_coach: boolean;
  created_at: string;
}

export interface ChildCreate {
  iin: string;
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  birth_date: string;
  emergency_contact?: string;
  primary_role: 'athlete';
}

export interface ChildLinkRequest {
  parent_id: number;
  athlete_id: number;
  relationship_type: 'father' | 'mother' | 'guardian';
}

class ChildrenService {
  async getMyChildren(): Promise<Child[]> {
    try {
      const response = await api.get('/users/my-athletes');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get children');
    }
  }

  async getMyParents(): Promise<Child[]> {
    try {
      const response = await api.get('/users/my-parents');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get parents');
    }
  }

  async getUserByIin(iin: string): Promise<Child> {
    try {
      console.log('ChildrenService: Getting user by IIN:', iin);
      const response = await api.get(`/users/by-iin/${iin}`);
      console.log('ChildrenService: User by IIN response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('ChildrenService: Error getting user by IIN:', error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get user by IIN');
    }
  }



  async linkChild(relationship: ChildLinkRequest): Promise<any> {
    try {
      console.log('ChildrenService: Linking child with relationship:', relationship);
      const response = await api.post('/users/relationships', relationship);
      console.log('ChildrenService: Link child response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('ChildrenService: Error linking child:', error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to link child');
    }
  }

  async createChildAccount(childData: ChildCreate): Promise<Child> {
    try {
      const response = await api.post('/users/', childData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to create child account');
    }
  }

  async getChildBookings(childId: number): Promise<any[]> {
    try {
      // This would need to be implemented when booking endpoints are available
      const response = await api.get(`/bookings/my-bookings`);
      return response.data.filter((booking: any) => booking.athlete_id === childId);
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get child bookings');
    }
  }

  // Helper methods
  calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  getAgeGroup(age: number): string {
    if (age < 8) return 'kids_4_7';
    if (age < 13) return 'kids_8_12';
    if (age < 18) return 'teens_13_17';
    return 'adults_18_plus';
  }

  formatBirthDate(birthDate: string): string {
    const date = new Date(birthDate);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  isMinor(birthDate: string): boolean {
    return this.calculateAge(birthDate) < 18;
  }

  requiresParentalConsent(birthDate: string): boolean {
    return this.calculateAge(birthDate) < 16;
  }
}

export default new ChildrenService(); 