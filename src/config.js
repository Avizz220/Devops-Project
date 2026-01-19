// API configuration
// Use the nginx proxy path for API calls
const REACT_APP_API_URL = process.env.REACT_APP_API_URL || 'http://44.200.5.19:4000';
export const API_BASE_URL = REACT_APP_API_URL;

// API endpoints
export const API_ENDPOINTS = {
  SIGNUP: `${API_BASE_URL}/api/auth/signup`,
  LOGIN: `${API_BASE_URL}/api/auth/login`,
};

// Storage keys
export const STORAGE_KEYS = {
  USER: 'community_events_user',
};
