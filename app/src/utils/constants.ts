// Navigation constants
export const NAVIGATION = {
  AUTH: 'Auth',
  HOME: 'Home',
};

// User roles
export const USER_ROLES = {
  ATHLETE: 'athlete',
  COACH: 'coach',
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