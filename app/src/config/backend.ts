// Backend API configuration
// You can change this URL to match your current ngrok URL or local IP
export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://15fe51d4942a.ngrok-free.app';

// Alternative URLs for different environments
export const BACKEND_URLS = {
  NGROK: 'https://15fe51d4942a.ngrok-free.app',
  LOCAL: 'http://localhost:8000',
  LOCAL_IP: 'http://192.168.1.100:8000', // Change this to your computer's IP
};

// Function to get the current backend URL
export const getCurrentBackendUrl = (): string => {
  // You can modify this function to return different URLs based on environment
  return BACKEND_URL;
};

// Function to set a new backend URL (for development/testing)
let currentBackendUrl = BACKEND_URL;
export const setBackendUrl = (url: string) => {
  currentBackendUrl = url;
};

// Function to get the current backend URL with override capability
export const getBackendUrlWithOverride = (): string => {
  return currentBackendUrl;
};

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/users/login',
  REGISTER: '/users/',
  REFRESH_TOKEN: '/users/refresh',
  
  // Users
  USERS: '/users/',
  USER_PROFILE: '/users/me',
  MY_ATHLETES: '/users/my-athletes',
  MY_PARENTS: '/users/my-parents',
  ADD_ROLE: '/users/add-role',
  CREATE_HEAD_COACH: '/users/create-head-coach',
  MAKE_HEAD_COACH: '/users/make-head-coach',
  HEAD_COACH: '/users/head-coach',
  PARENT_ATHLETE_RELATIONSHIP: '/users/relationships',
  
  // Classes
  CLASSES: '/classes/',
  CLASS_DETAIL: '/classes/{id}',
  CREATE_CLASS: '/classes/',
  UPDATE_CLASS: '/classes/{id}',
  
  // Bookings
  BOOKINGS: '/bookings/',
  MY_BOOKINGS: '/bookings/my-bookings',
  BOOKING_DETAIL: '/bookings/{id}',
  CREATE_BOOKING: '/bookings/',
  CANCEL_BOOKING: '/bookings/{id}/cancel',
};

// Helper function to get full URL for an endpoint
export const getBackendUrl = (): string => {
  return getBackendUrlWithOverride();
};

// Helper function to get full URL for an endpoint with path parameters
export const getEndpointUrl = (endpoint: string, params?: Record<string, string | number>): string => {
  let url = `${BACKEND_URL}${endpoint}`;
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, String(value));
    });
  }
  
  return url;
};

// API response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} 