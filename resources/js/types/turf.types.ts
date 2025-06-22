export interface Turf {
  id: number;
  name: string;
  description?: string;
  location?: string;
  owner_id: number;
  requires_membership: boolean;
  membership_fee?: number;
  membership_type?: string;
  max_players_per_team: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  owner?: {
    id: number;
    name: string;
    email: string;
  };
  user_permissions?: {
    can_manage_turf: boolean;
    can_invite_players: boolean;
    can_manage_sessions: boolean;
    can_manage_teams: boolean;
    can_manage_payments: boolean;
  };
}

export interface TurfSwitcherState {
  selectedTurf: Turf | null;
  belongingTurfs: Turf[];
  isLoading: boolean;
  error: string | null;
}

export interface TurfSwitcherActions {
  setSelectedTurf: (turf: Turf | null) => void;
  setBelongingTurfs: (turfs: Turf[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchBelongingTurfs: (userId: number) => Promise<void>;
  autoSelectFirstTurf: () => void;
  clearTurfData: () => void;
}
