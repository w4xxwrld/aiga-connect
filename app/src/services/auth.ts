import api from './api';
import * as SecureStore from 'expo-secure-store';

export interface User {
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

export interface LoginData {
  phone: string;
  password: string;
}

export interface RegisterData {
  phone: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  email?: string;
  birth_date: string;
  primary_role: 'athlete' | 'coach';
  password?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ParentAthleteRelationship {
  id: number;
  parent_id: number;
  athlete_id: number;
  relationship_type: 'parent' | 'guardian';
  created_at: string;
  parent: User;
  athlete: User;
}

export interface SendOTPRequest {
  phone_number: string;
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
  phone_number: string;
}

export interface VerifyOTPRequest {
  phone_number: string;
  code: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  phone_number: string;
}

export interface LoginValidationResponse {
  requires_otp: boolean;
  message: string;
  phone_number: string;
}

class AuthService {
  async validateLogin(loginData: LoginData): Promise<LoginValidationResponse> {
    try {
      console.log('🔵 [AUTH] Validating login credentials');
      const response = await api.post('/users/validate-login', loginData);
      console.log('🟢 [AUTH] Credentials validated:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('🔴 [AUTH] Validation error:', error);

      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      if (error.message) {
        throw new Error(error.message);
      }
      throw new Error('Invalid phone number or password');
    }
  }

  async login(loginData: LoginData): Promise<AuthResponse> {
    try {
      const response = await api.post('/users/login', loginData);
      const { access_token, refresh_token } = response.data;

      // Store tokens securely
      await Promise.all([
        SecureStore.setItemAsync('authToken', access_token),
        SecureStore.setItemAsync('refreshToken', refresh_token),
      ]);

      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);

      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      if (error.message) {
        throw new Error(error.message);
      }
      throw new Error('Login failed. Please check your credentials.');
    }
  }

  async register(registerData: RegisterData): Promise<User> {
    try {
      console.log('AuthService: Sending registration request to:', '/users/register');
      console.log('AuthService: Registration data:', registerData);

      const response = await api.post('/users/register', registerData);
      console.log('AuthService: Registration response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('AuthService: Registration error:', error);
      console.error('AuthService: Error response:', error.response?.data);
      console.error('AuthService: Error status:', error.response?.status);

      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      if (error.message) {
        throw new Error(error.message);
      }
      throw new Error('Registration failed. Please try again.');
    }
  }

  async sendOTP(phoneNumber: string): Promise<SendOTPResponse> {
    try{
      console.log('🔵 [AUTH] SendOTP REQUEST:', {
        timestamp: new Date().toISOString(),
        endpoint: '/users/send-otp',
        method: 'POST',
        phoneNumber: phoneNumber
      });

      const response = await api.post('/users/send-otp', {
        phone_number: phoneNumber
      });

      console.log('🟢 [AUTH] SendOTP RESPONSE:', {
        timestamp: new Date().toISOString(),
        status: response.status,
        data: response.data
      });

      return response.data;
    }catch(error: any) {
      console.error('🔴 [AUTH] SendOTP ERROR:', {
        timestamp: new Date().toISOString(),
        phoneNumber: phoneNumber,
        errorMessage: error.message,
        responseStatus: error.response?.status,
        responseData: error.response?.data
      });

      if (error.response?.status === 400) {
        throw new Error('Неверный формат номера телефона.');
      }
      throw new Error('Не удалось отправить код. Попробуйте снова.');
    }
  }

  async verifyOTP(phoneNumber: string, code: string): Promise<VerifyOTPResponse> {
    try {
      console.log('🔵 [AUTH] VerifyOTP REQUEST:', {
        timestamp: new Date().toISOString(),
        endpoint: '/users/verify-otp',
        method: 'POST',
        phoneNumber: phoneNumber,
        codeLength: code.length
      });

      const response = await api.post('/users/verify-otp', {
        phone_number: phoneNumber,
        code: code
      });

      console.log('🟢 [AUTH] VerifyOTP RESPONSE:', {
        timestamp: new Date().toISOString(),
        status: response.status,
        data: response.data
      });

      return response.data;
    } catch (error: any) {
      console.error('🔴 [AUTH] VerifyOTP ERROR:', {
        timestamp: new Date().toISOString(),
        phoneNumber: phoneNumber,
        errorMessage: error.message,
        responseStatus: error.response?.status,
        responseData: error.response?.data
      });

      if (error.response?.status === 400) {
        const detail = error.response?.data?.detail;
        if (detail) {
          throw new Error(detail);
        }
        throw new Error('Неверный или истекший код верификации.');
      } else if (error.response?.status === 429) {
        throw new Error('Слишком много попыток. Попробуйте позже.');
      }
      throw new Error('Не удалось подтвердить код. Попробуйте снова.');
    }
  }

  async verifyOTPAndLogin(phoneNumber: string, code: string): Promise<AuthResponse> {
    try {
      console.log('🔵 [AUTH] VerifyOTPAndLogin REQUEST:', {
        timestamp: new Date().toISOString(),
        endpoint: '/users/verify-otp-and-login',
        method: 'POST',
        phoneNumber: phoneNumber,
        codeLength: code.length
      });

      const response = await api.post('/users/verify-otp-and-login', {
        phone_number: phoneNumber,
        code: code
      });

      console.log('🟢 [AUTH] VerifyOTPAndLogin RESPONSE:', {
        timestamp: new Date().toISOString(),
        status: response.status,
        hasAccessToken: !!response.data.access_token,
        hasRefreshToken: !!response.data.refresh_token
      });

      const { access_token, refresh_token } = response.data;

      // Store tokens securely
      await Promise.all([
        SecureStore.setItemAsync('authToken', access_token),
        SecureStore.setItemAsync('refreshToken', refresh_token),
      ]);

      console.log('✅ [AUTH] Tokens stored successfully');

      return response.data;
    } catch (error: any) {
      console.error('🔴 [AUTH] VerifyOTPAndLogin ERROR:', {
        timestamp: new Date().toISOString(),
        phoneNumber: phoneNumber,
        errorMessage: error.message,
        responseStatus: error.response?.status,
        responseData: error.response?.data
      });

      if (error.response?.status === 400) {
        const detail = error.response?.data?.detail;
        if (detail) {
          throw new Error(detail);
        }
        throw new Error('Неверный или истекший код верификации.');
      } else if (error.response?.status === 401) {
        throw new Error('Код верификации не подтвержден.');
      } else if (error.response?.status === 429) {
        throw new Error('Слишком много попыток. Попробуйте позже.');
      }
      throw new Error('Не удалось войти. Попробуйте снова.');
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      const refresh_token = await SecureStore.getItemAsync('refreshToken');
      if (!refresh_token) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/users/refresh', { refresh_token });
      const { access_token, refresh_token: new_refresh_token } = response.data;

      // Store new tokens
      await Promise.all([
        SecureStore.setItemAsync('authToken', access_token),
        SecureStore.setItemAsync('refreshToken', new_refresh_token),
      ]);

      return response.data;
    } catch (error: any) {
      // Clear tokens if refresh fails
      await this.clearTokens();
      throw new Error('Token refresh failed. Please login again.');
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('Logging out user...');

      // Clear all stored authentication data
      await this.clearTokens();

      console.log('Logout successful - all data cleared');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, we should still try to clear the data
      await this.clearTokens();
    }
  }

  private async clearTokens(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync('authToken'),
      SecureStore.deleteItemAsync('refreshToken'),
      SecureStore.deleteItemAsync('userData'),
    ]);
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
      const userData = response.data;
      console.log('Current user data received:', userData);
      await this.storeUserData(userData);
      return userData;
    } catch (error: any) {
      console.error('Error fetching current user:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      // If token is invalid, clear stored data
      if (error.response?.status === 401) {
        await this.clearTokens();
      }
      return null;
    }
  }

  async updateProfile(updateData: {
    full_name?: string;
    email?: string;
    phone?: string;
    birth_date?: string;
    emergency_contact?: string;
  }): Promise<User> {
    try {
      // Since backend doesn't have update endpoint, we'll update locally
      // Get current user data
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not found');
      }

      // Create updated user object
      const updatedUser: User = {
        ...currentUser,
        ...updateData,
      };

      // Store updated user data locally
      await this.storeUserData(updatedUser);

      console.log('Profile updated locally:', updatedUser);
      return updatedUser;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to update profile');
    }
  }

  async getMyAthletes(): Promise<User[]> {
    try {
      const response = await api.get('/users/my-athletes');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get athletes');
    }
  }

  async getMyParents(): Promise<User[]> {
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

  async createParentAthleteRelationship(relationship: {
    parent_id: number;
    athlete_id: number;
    relationship_type: 'parent' | 'guardian';
  }): Promise<ParentAthleteRelationship> {
    try {
      const response = await api.post('/users/relationships', relationship);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to create relationship');
    }
  }

  async addRoleToUser(role: 'parent' | 'athlete' | 'coach', targetUserId?: number): Promise<User> {
    try {
      const response = await api.post('/users/add-role', {
        role,
        target_user_id: targetUserId,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to add role');
    }
  }

  async createHeadCoach(userData: RegisterData): Promise<User> {
    try {
      const response = await api.post('/users/create-head-coach', userData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to create head coach');
    }
  }

  async makeUserHeadCoach(userId: number): Promise<User> {
    try {
      const response = await api.post(`/users/make-head-coach/${userId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to make user head coach');
    }
  }

  async getHeadCoach(): Promise<User> {
    try {
      const response = await api.get('/users/head-coach');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get head coach');
    }
  }

  async makeUserCoach(userId: number): Promise<any> {
    try {
      const response = await api.post(`/users/${userId}/make-coach`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to make user coach');
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const response = await api.get('/users/all');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to get all users');
    }
  }
}

export default new AuthService();
