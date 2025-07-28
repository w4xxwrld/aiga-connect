// Navigation constants
export const NAVIGATION = {
  GREETING: 'Greeting',
  AUTH: 'Auth',
  HOME: 'Home',
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

// User roles
export const USER_ROLES = {
  PARENT: 'parent',
  ATHLETE: 'athlete',
  COACH: 'coach',
};

// Training types
export const TRAINING_TYPES = {
  GROUP: 'group',
  INDIVIDUAL: 'individual',
  COMPETITION_PREP: 'competition_prep',
  SEMINAR: 'seminar',
};

// Training levels
export const TRAINING_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  MIXED: 'mixed',
};

// Age groups
export const AGE_GROUPS = {
  KIDS_4_7: 'kids_4_7',
  KIDS_8_12: 'kids_8_12',
  TEENS_13_17: 'teens_13_17',
  ADULTS_18_PLUS: 'adults_18_plus',
  MIXED_AGES: 'mixed_ages',
};

// Belt levels
export const BELT_LEVELS = {
  WHITE: 'white',
  YELLOW: 'yellow',
  ORANGE: 'orange',
  GREEN: 'green',
  BLUE: 'blue',
  BROWN: 'brown',
  BLACK: 'black',
  MIXED: 'mixed',
};

// Booking statuses
export const BOOKING_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

// Booking types
export const BOOKING_TYPES = {
  REGULAR: 'regular',
  TRIAL: 'trial',
  MAKEUP: 'makeup',
};

// Class statuses
export const CLASS_STATUSES = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

// Colors
export const COLORS = {
  PRIMARY: '#E74C3C',
  SECONDARY: '#2C3E50',
  BACKGROUND: '#0D1B2A',
  CARD_BACKGROUND: '#1B263B',
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: '#B0BEC5',
  SUCCESS: '#4CAF50',
  WARNING: '#FF9800',
  ERROR: '#F44336',
  INFO: '#2196F3',
};

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
  GREETING_SEEN: 'greetingSeenThisInstall',
  USER_ROLE: 'userRole',
  CHILDREN: 'children',
};

// Validation rules
export const VALIDATION = {
  IIN_LENGTH: 12,
  MIN_PASSWORD_LENGTH: 6,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'dd.MM.yyyy',
  API: 'yyyy-MM-dd',
  DATETIME: 'dd.MM.yyyy HH:mm',
  TIME: 'HH:mm',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// Animation durations
export const ANIMATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
};

// API timeouts
export const API_TIMEOUTS = {
  REQUEST: 10000,
  REFRESH: 5000,
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Ошибка сети. Проверьте подключение к интернету.',
  SERVER_ERROR: 'Ошибка сервера. Попробуйте позже.',
  AUTH_ERROR: 'Ошибка авторизации. Войдите снова.',
  VALIDATION_ERROR: 'Проверьте правильность введенных данных.',
  UNKNOWN_ERROR: 'Произошла неизвестная ошибка.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Успешный вход в систему.',
  REGISTER_SUCCESS: 'Регистрация завершена успешно.',
  BOOKING_SUCCESS: 'Запись на тренировку создана.',
  BOOKING_CANCELLED: 'Запись на тренировку отменена.',
  PROFILE_UPDATED: 'Профиль обновлен.',
  SETTINGS_SAVED: 'Настройки сохранены.',
};

// App configuration
export const APP_CONFIG = {
  NAME: 'AIGA Connect',
  VERSION: '1.0.0',
  DESCRIPTION: 'Система управления грэпплинг клубом',
  SUPPORT_EMAIL: 'support@aiga-connect.com',
  WEBSITE: 'https://aiga-connect.com',
}; 