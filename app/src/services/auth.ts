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
  primary_role: 'parent' | 'athlete' | 'coach' | 'admin';
  roles: ('parent' | 'athlete' | 'coach' | 'admin')[];
  role_status?: 'pending' | 'approved' | 'declined' | null;
  is_head_coach: boolean;
  created_at: string;
  photo_url?: string;
}

export interface LoginData {
  phone_number: string;
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
  requires_role_selection?: boolean;
  access_token?: string;
  refresh_token?: string;
  role?: string;
  role_status?: string;
}

export interface LoginValidationResponse {
  requires_otp: boolean;
  message: string;
  phone_number: string;
}

class AuthService {
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

      // Convert frontend format to backend format
      // Backend expects phone_number (not phone) and doesn't want primary_role in /users/register
      const backendData = {
        phone_number: registerData.phone,
        first_name: registerData.first_name,
        last_name: registerData.last_name,
        email: registerData.email,
        password: registerData.password,
        birth_date: registerData.birth_date,
      };

      const response = await api.post('/users/register', backendData);
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

      // If response includes tokens (existing user), store them
      if (response.data.access_token && response.data.refresh_token) {
        console.log('✅ [AUTH] User logged in, storing tokens');
        await Promise.all([
          SecureStore.setItemAsync('authToken', response.data.access_token),
          SecureStore.setItemAsync('refreshToken', response.data.refresh_token),
        ]);
      }

      return response.data;
    } catch (error: any) {
      console.error('🔴 [AUTH] VerifyOTP ERROR:', {
        timestamp: new Date().toISOString(),
        phoneNumber: phoneNumber,
        errorMessage: error.message,
        responseStatus: error.response?.status,
        responseData: error.response?.data
      });

      if (error.response?.status === 400 || error.response?.status === 401) {
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
      const backendUser = response.data;

      // Convert backend response to frontend User format
      const userData: User = {
        id: backendUser.id,
        iin: backendUser.iin || '',
        full_name: `${backendUser.first_name} ${backendUser.last_name}`,
        email: backendUser.email,
        phone: backendUser.phone,
        birth_date: backendUser.birth_date,
        emergency_contact: backendUser.emergency_contact || '',
        primary_role: backendUser.primary_role,
        roles: [backendUser.primary_role],
        role_status: backendUser.role_status || null,
        is_head_coach: backendUser.is_head_coach || false,
        created_at: backendUser.created_at,
        photo_url: backendUser.photo_url,
      };

      await this.storeUserData(userData);
      return userData;
    } catch (error: any) {
      console.error('Error fetching current user:', error);

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
      // Get current user data
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not found');
      }

      // Split full_name into first_name and last_name
      let first_name = currentUser.full_name.split(' ')[0];
      let last_name = currentUser.full_name.split(' ').slice(1).join(' ');

      if (updateData.full_name) {
        const nameParts = updateData.full_name.trim().split(' ');
        first_name = nameParts[0] || first_name;
        last_name = nameParts.slice(1).join(' ') || last_name;
      }

      // Prepare data for backend (UserCreate schema)
      const backendUpdateData = {
        phone: updateData.phone || currentUser.phone || '',
        first_name,
        last_name,
        email: updateData.email || currentUser.email,
        birth_date: updateData.birth_date || currentUser.birth_date,
        primary_role: currentUser.primary_role,
        photo_url: currentUser.photo_url || null,
      };

      console.log('Updating profile with data:', backendUpdateData);

      // Call backend API to update profile
      const response = await api.put('/users/me', backendUpdateData);
      const updatedBackendUser = response.data;

      // Convert backend response to frontend User format
      const updatedUser: User = {
        ...currentUser,
        full_name: `${updatedBackendUser.first_name} ${updatedBackendUser.last_name}`,
        email: updatedBackendUser.email,
        phone: updatedBackendUser.phone,
        birth_date: updatedBackendUser.birth_date,
        photo_url: updatedBackendUser.photo_url,
        // Keep emergency_contact locally since backend doesn't support it
        emergency_contact: updateData.emergency_contact || currentUser.emergency_contact,
      };

      // Store updated user data
      await this.storeUserData(updatedUser);

      console.log('Profile updated successfully:', updatedUser);
      return updatedUser;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      console.error('Error response:', error.response?.data);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to update profile');
    }
  }

  async completeRegistration(registerData: RegisterData, role: 'athlete' | 'coach'): Promise<{
    access_token: string;
    refresh_token: string;
    token_type: string;
    role: string;
    role_status?: string;
    message?: string;
  }> {
    try {
      console.log('🔵 [AUTH] CompleteRegistration: Creating user with role');
      console.log('Registration data:', registerData);
      console.log('Selected role:', role);

      // Convert frontend format to backend format
      // Backend expects phone_number and all registration data plus role
      const backendData = {
        phone_number: registerData.phone,
        first_name: registerData.first_name,
        last_name: registerData.last_name,
        email: registerData.email,
        password: registerData.password,
        birth_date: registerData.birth_date,
        role: role,
      };

      const response = await api.post('/users/select-role', backendData);
      console.log('🟢 [AUTH] User created successfully:', response.data);

      // Store tokens
      if (response.data.access_token && response.data.refresh_token) {
        await Promise.all([
          SecureStore.setItemAsync('authToken', response.data.access_token),
          SecureStore.setItemAsync('refreshToken', response.data.refresh_token),
        ]);
      }

      return response.data;
    } catch (error: any) {
      console.error('🔴 [AUTH] CompleteRegistration error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      if (error.message) {
        throw new Error(error.message);
      }
      throw new Error('Failed to complete registration');
    }
  }

  async uploadPhoto(uri: string, fileType: string): Promise<string> {
    try {
      console.log('Uploading photo:', { uri, fileType });

      // Create FormData
      const formData = new FormData();

      // For React Native, we need to append the file as an object with uri, type, and name
      const filename = uri.split('/').pop() || 'photo.jpg';

      formData.append('file', {
        uri,
        type: fileType,
        name: filename,
      } as any);

      // Send to backend
      const response = await api.put('/users/me/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Photo upload response:', response.data);

      // Return the photo URL
      return response.data.photo_url;
    } catch (error: any) {
      console.error('Photo upload error:', error);
      console.error('Error response:', error.response?.data);

      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to upload photo');
    }
  }

  async deletePhoto(): Promise<void> {
    try {
      console.log('Deleting photo...');

      await api.delete('/users/me/photo');

      console.log('Photo deleted successfully');
    } catch (error: any) {
      console.error('Photo delete error:', error);
      console.error('Error response:', error.response?.data);

      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Failed to delete photo');
    }
  }
}

export default new AuthService();
