import api from './api';

export interface PendingCoach {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  created_at: string;
  photo_url?: string;
}

export interface UserListParams {
  role?: string;
  role_status?: string;
  search?: string;
  include_deleted?: boolean;
  skip?: number;
  limit?: number;
}

export interface CoachListParams {
  role_status?: string;
  search?: string;
  include_deleted?: boolean;
  skip?: number;
  limit?: number;
}

export interface UserResponse {
  id: number;
  phone: string;
  first_name: string;
  last_name: string;
  email: string;
  birth_date: string;
  primary_role: string;
  role_status?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  photo_url?: string;
  is_head_coach?: boolean;
}

export interface CoachStats {
  total_classes: number;
  active_classes: number;
  total_bookings: number;
  total_students: number;
}

class AdminService {
  // Coach approval
  async getPendingCoaches(): Promise<PendingCoach[]> {
    try {
      const response = await api.get('/admin/users/pending-coaches');
      return response.data.map((user: any) => ({
        id: user.id,
        full_name: `${user.first_name} ${user.last_name}`,
        phone: user.phone,
        email: user.email,
        created_at: user.created_at,
        photo_url: user.photo_url,
      }));
    } catch (error: any) {
      console.error('Error fetching pending coaches:', error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Не удалось загрузить заявки тренеров');
    }
  }

  async reviewCoach(userId: number, action: 'approve' | 'decline'): Promise<any> {
    try {
      const response = await api.post('/admin/users/review-coach', {
        user_id: userId,
        action,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error reviewing coach:', error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Не удалось обработать заявку');
    }
  }

  // User management
  async listUsers(params: UserListParams = {}): Promise<{ users: UserResponse[]; total: number }> {
    try {
      const response = await api.get('/admin/users/users', { params });
      return {
        users: response.data.users || response.data,
        total: response.data.total || response.data.length,
      };
    } catch (error: any) {
      console.error('Error listing users:', error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Не удалось загрузить список пользователей');
    }
  }

  async getUser(userId: number): Promise<UserResponse> {
    try {
      const response = await api.get(`/admin/users/users/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user:', error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Не удалось загрузить данные пользователя');
    }
  }

  async updateUser(userId: number, data: any): Promise<UserResponse> {
    try {
      const response = await api.put(`/admin/users/users/${userId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating user:', error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Не удалось обновить пользователя');
    }
  }

  async deleteUser(userId: number): Promise<any> {
    try {
      const response = await api.delete(`/admin/users/users/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting user:', error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Не удалось удалить пользователя');
    }
  }

  async restoreUser(userId: number): Promise<any> {
    try {
      const response = await api.post(`/admin/users/users/${userId}/restore`);
      return response.data;
    } catch (error: any) {
      console.error('Error restoring user:', error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Не удалось восстановить пользователя');
    }
  }

  async changeUserRole(userId: number, newRole: string): Promise<any> {
    try {
      const response = await api.put(`/admin/users/users/${userId}/role`, {
        new_role: newRole,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error changing user role:', error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Не удалось изменить роль пользователя');
    }
  }

  // Coach management
  async listCoaches(params: CoachListParams = {}): Promise<{ users: UserResponse[]; total: number }> {
    try {
      const response = await api.get('/admin/users/coaches', { params });
      return {
        users: response.data.users || response.data,
        total: response.data.total || response.data.length,
      };
    } catch (error: any) {
      console.error('Error listing coaches:', error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Не удалось загрузить список тренеров');
    }
  }

  async suspendCoach(coachId: number): Promise<any> {
    try {
      const response = await api.post(`/admin/users/coaches/${coachId}/suspend`);
      return response.data;
    } catch (error: any) {
      console.error('Error suspending coach:', error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Не удалось приостановить тренера');
    }
  }

  async reactivateCoach(coachId: number): Promise<any> {
    try {
      const response = await api.post(`/admin/users/coaches/${coachId}/reactivate`);
      return response.data;
    } catch (error: any) {
      console.error('Error reactivating coach:', error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Не удалось активировать тренера');
    }
  }

  async getCoachStats(coachId: number): Promise<CoachStats> {
    try {
      const response = await api.get(`/admin/users/coaches/${coachId}/stats`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching coach stats:', error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Не удалось загрузить статистику тренера');
    }
  }

  // Admin management
  async promoteToAdmin(userId: number): Promise<any> {
    try {
      const response = await api.post('/admin/users/promote-user', {
        user_id: userId,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error promoting user to admin:', error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Не удалось повысить пользователя до админа');
    }
  }

  async demoteAdmin(userId: number, newRole: string): Promise<any> {
    try {
      const response = await api.post('/admin/users/demote-admin', {
        user_id: userId,
        new_role: newRole,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error demoting admin:', error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Не удалось понизить админа');
    }
  }
}

export default new AdminService();
