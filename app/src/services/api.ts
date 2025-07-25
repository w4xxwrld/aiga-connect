import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { getBackendUrl, BACKEND_CONFIG } from '../config/backend';

// Create axios instance
const api = axios.create({
  baseURL: getBackendUrl(),
  timeout: BACKEND_CONFIG.TIMEOUT,
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

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear it
      try {
        await SecureStore.deleteItemAsync('authToken');
        await SecureStore.deleteItemAsync('userData');
      } catch (clearError) {
        console.error('Error clearing auth data:', clearError);
      }
    }
    return Promise.reject(error);
  }
);

export default api; 