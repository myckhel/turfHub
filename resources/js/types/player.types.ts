import { User } from './global.types';
import { Turf } from './turf.types';

export interface Player {
  id: number;
  user_id: number;
  turf_id: number;
  is_member: boolean;
  status: 'active' | 'inactive' | 'banned';
  created_at: string;
  updated_at: string;
  user: User;
  turf?: Turf;
}
