import { PaginatedResponse, User } from './global.types';
import { Turf } from './turf.types';

export type PlayerRole = 'admin' | 'manager' | 'player';

export type PlayerStatus = 'active' | 'inactive' | 'banned';

export interface Player {
  id: number;
  user_id: number;
  turf_id: number;
  email?: string;
  is_member: boolean;
  status: PlayerStatus;
  role?: PlayerRole;
  role_label?: string;
  is_admin: boolean;
  is_manager: boolean;
  is_active: boolean;
  is_verified: boolean;
  avatar?: string;
  created_at: string;
  updated_at: string;

  // Relationships
  user?: User;
  turf?: Turf;
}

// API Response Types
export type PlayerResponse = PaginatedResponse<Player>;

// API Request Types
export interface UpdatePlayerRoleRequest {
  role: PlayerRole;
}

export interface PlayerFilters {
  search?: string;
  role?: PlayerRole;
  status?: PlayerStatus;
  is_member?: boolean;
  per_page?: number;
  page?: number;
}
