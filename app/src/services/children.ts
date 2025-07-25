import api from './api';

export interface Child {
  id: number;
  iin: string;
  full_name?: string;
  role: 'parent' | 'athlete' | 'coach';
}

export interface ParentChildRelationship {
  id: number;
  parent_id: number;
  child: Child;
  created_at: string;
}

export interface ChildLinkRequest {
  child_iin: string;
}

class ChildrenService {
  async linkChild(childIin: string): Promise<ParentChildRelationship> {
    try {
      const response = await api.post('/users/children/link', {
        child_iin: childIin
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to link child');
    }
  }

  async getChildren(): Promise<ParentChildRelationship[]> {
    try {
      const response = await api.get('/users/children');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get children');
    }
  }

  async unlinkChild(childId: number): Promise<void> {
    try {
      await api.delete(`/users/children/${childId}`);
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to unlink child');
    }
  }
}

export default new ChildrenService(); 