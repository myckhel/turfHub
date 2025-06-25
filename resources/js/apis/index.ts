import axios, { type AxiosInstance, type AxiosResponse } from 'axios';

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true, // Include credentials (cookies, authorization headers)
});

// Request interceptor for authentication and common headers
apiClient.interceptors.request.use(
  (config) => {
    // Get CSRF token from meta tag (Laravel setup)
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      config.headers['X-CSRF-TOKEN'] = csrfToken;
    }

    // Get auth token from localStorage or cookie if using Sanctum
    const token =
      localStorage.getItem('auth_token') ||
      document.cookie
        .split('; ')
        .find((row) => row.startsWith('laravel_session='))
        ?.split('=')[1];

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error) => {
    // Handle common error scenarios
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login or clear auth state
      localStorage.removeItem('auth_token');
      // You might want to trigger a redirect to login here
      // window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Forbidden - user doesn't have permission
      console.error('Access forbidden:', error.response.data);
    } else if (error.response?.status === 422) {
      // Validation errors - these are handled by forms typically
      console.warn('Validation errors:', error.response.data);
    } else if (error.response?.status >= 500) {
      // Server errors
      console.error('Server error:', error.response.data);
    }

    return Promise.reject(error);
  },
);

// Generic API response type
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  status: number;
}

// Generic API error type
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status: number;
}

// Export the axios instance for direct use if needed
export default apiClient;

// Re-export API modules
export { matchSessionApi } from './matchSession';
export { playerApi } from './player';
export { turfApi } from './turf';

// Re-export types
export type {
  AddPlayerToTeamRequest,
  CreateMatchSessionRequest,
  GameMatch,
  MatchSession,
  MatchSessionFilters,
  MatchSessionListResponse,
  QueueLogic,
  QueueStatus,
  SetGameResultRequest,
  Team,
  UpdateMatchSessionRequest,
} from '../types/matchSession.types';
export type { Player } from './player';
export type { JoinTurfRequest, Turf, TurfListResponse } from './turf';
