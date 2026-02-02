export const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export const API_ENDPOINTS = {
  SIGNUP: `${API_BASE_URL}/api/auth/signup`,
  LOGIN: `${API_BASE_URL}/api/auth/login`,
};

export const STORAGE_KEYS = {
  USER: 'community_events_user',
};
