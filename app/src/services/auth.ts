import api from './api';
import * as SecureStore from 'expo-secure-store';

export interface User {
  id: number;
  iin: string;
  full_name?: string;
  email?: string;
  role: 'parent' | 'athlete' | 'coach';
}

export interface LoginData {
  iin: string;
  password: string;
}

export interface RegisterData {
  iin: string;
  full_name?: string;
  email?: string;
  password: string;
  role: 'parent' | 'athlete' | 'coach';
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

class AuthService {
  async login(loginData: LoginData): Promise<AuthResponse> {
    try {
      const response = await api.post('/users/login', loginData);
      const { access_token } = response.data;
      
      // Store token securely
      await SecureStore.setItemAsync('authToken', access_token);
      
      return response.data;
    } catch (error) {
      throw new Error('Login failed. Please check your credentials.');
    }
  }

  async register(registerData: RegisterData): Promise<User> {
    try {
      const response = await api.post('/users/', registerData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Registration failed. Please try again.');
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('Logging out user...');
      
      // Optionally call backend logout endpoint (not required for JWT)
      try {
        await api.post('/users/logout');
        console.log('Backend logout successful');
      } catch (backendError) {
        console.log('Backend logout failed (this is normal for JWT):', backendError);
      }
      
      // Clear all stored authentication data
      await Promise.all([
        SecureStore.deleteItemAsync('authToken'),
        SecureStore.deleteItemAsync('userData'),
      ]);
      
      console.log('Logout successful - all data cleared');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, we should still try to clear the data
      try {
        await SecureStore.deleteItemAsync('authToken');
        await SecureStore.deleteItemAsync('userData');
      } catch (fallbackError) {
        console.error('Fallback logout error:', fallbackError);
      }
    }
  }

  async getStoredToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('authToken');
    } catch (error) {
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getStoredToken();
    return !!token;
  }

  async storeUserData(userData: User): Promise<void> {
    try {
      await SecureStore.setItemAsync('userData', JSON.stringify(userData));
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  }

  async getUserData(): Promise<User | null> {
    try {
      const userData = await SecureStore.getItemAsync('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  }
}

export default new AuthService(); 