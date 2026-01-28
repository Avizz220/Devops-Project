// API configuration - use relative path for nginx proxy
export const API_BASE_URL = '';

// API endpoints
export const API_ENDPOINTS = {
  SIGNUP: `${API_BASE_URL}/api/auth/signup`,
  LOGIN: `${API_BASE_URL}/api/auth/login`,
};

// Storage keys
export const STORAGE_KEYS = {
  USER: 'community_events_user',
};
