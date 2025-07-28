import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { getBackendUrl } from '../config/backend';
import { API_TIMEOUTS } from '../utils/constants';

// Create axios instance
const api = axios.create({
  baseURL: getBackendUrl(),
  timeout: API_TIMEOUTS.REQUEST,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token directly without importing authService
        const refresh_token = await SecureStore.getItemAsync('refreshToken');
        if (!refresh_token) {
          throw new Error('No refresh token available');
        }

        const refreshResponse = await axios.post(`${getBackendUrl()}/users/refresh`, { 
          refresh_token 
        });
        
        const { access_token, refresh_token: new_refresh_token } = refreshResponse.data;
        
        // Store new tokens
        await Promise.all([
          SecureStore.setItemAsync('authToken', access_token),
          SecureStore.setItemAsync('refreshToken', new_refresh_token),
        ]);
        
        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens
        console.error('Token refresh failed:', refreshError);
        await Promise.all([
          SecureStore.deleteItemAsync('authToken'),
          SecureStore.deleteItemAsync('refreshToken'),
          SecureStore.deleteItemAsync('userData'),
        ]);
      }
    }

    return Promise.reject(error);
  }
);

export default api; 