// Backend API configuration
export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';

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
  return BACKEND_URL;
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