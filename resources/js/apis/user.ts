import api from './index';

// User-related types
export interface ProfileUpdateData {
  name: string;
  email: string;
}

export interface UserStats {
  total_matches: number;
  total_turfs: number;
  total_goals: number;
  win_rate: number;
  favorite_position?: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  stats?: UserStats;
}

/**
 * User API module
 */
export const userApi = {
  /**
   * Get current authenticated user profile
   */
  getProfile: (): Promise<UserProfile> => api.get(route('api.auth.user')),

  /**
   * Get a specific user by ID
   */
  getUser: (userId: number): Promise<UserProfile> => api.get(route('api.users.show', { user: userId })),

  /**
   * Update user profile
   */
  updateProfile: (userId: number, data: ProfileUpdateData): Promise<UserProfile> => api.patch(route('api.users.update', { user: userId }), data),

  /**
   * Get user statistics (placeholder - implement backend endpoint if needed)
   */
  getUserStats: (): Promise<UserStats> => api.get(route('api.user.stats')),

  /**
   * Get turfs that the user belongs to
   */
  getBelongingTurfs: (userId: number) => api.get(route('api.users.belonging-turfs', { user: userId })),
};
