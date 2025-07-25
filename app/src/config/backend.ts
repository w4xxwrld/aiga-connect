// Backend configuration
export const BACKEND_CONFIG = {
  // Base URL for the backend API
  BASE_URL: 'http://localhost:8000',
  
  // API endpoints
  ENDPOINTS: {
    // Authentication
    LOGIN: '/users/login',
    REGISTER: '/users/',
    
    // User management
    USERS: '/users/',
    USER_PROFILE: '/users/profile',
    
    // Sessions (training sessions)
    SESSIONS: '/sessions/',
    SESSION_BOOKINGS: '/sessions/bookings',
    
    // Progress tracking
    PROGRESS: '/progress/',
    ACHIEVEMENTS: '/progress/achievements/',
    TOURNAMENTS: '/progress/tournaments/',
    TOURNAMENT_REGISTRATIONS: '/progress/tournaments/registrations',
    
    // Community
    CHAT_MESSAGES: '/community/chat/messages/',
    FORUM_POSTS: '/community/forum/posts/',
    FORUM_REPLIES: '/community/forum/replies/',
    NOTIFICATIONS: '/community/notifications/',
    COMMUNITY_STATS: '/community/stats',
    
    // Merchandise
    PRODUCTS: '/merchandise/products/',
    ORDERS: '/merchandise/orders/',
    PRODUCT_CATEGORIES: '/merchandise/categories',
    STORE_STATS: '/merchandise/stats',
    USER_STORE_STATS: '/merchandise/user-stats',
    SEARCH_PRODUCTS: '/merchandise/search',
  },
  
  // Request timeout in milliseconds
  TIMEOUT: 10000,
  
  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000,
  },
};

// Environment-specific configurations
export const getBackendUrl = () => {
  // In development, use localhost
  if (__DEV__) {
    return BACKEND_CONFIG.BASE_URL;
  }
  
  // In production, use your actual backend URL
  return 'https://your-backend-url.com';
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