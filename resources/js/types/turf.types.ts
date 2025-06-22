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

// Enhanced TurfSwitcher Types
export type TurfSwitcherVariant = 'default' | 'compact' | 'detailed';
export type TurfSwitcherPlacement = 'bottom' | 'bottomLeft' | 'bottomRight' | 'top' | 'topLeft' | 'topRight';
export type TurfSwitcherSize = 'small' | 'middle' | 'large';

export interface TurfSwitcherProps {
  /** Dropdown placement relative to the button */
  placement?: TurfSwitcherPlacement;
  /** Button size */
  size?: TurfSwitcherSize;
  /** Whether to show the swap icon */
  showIcon?: boolean;
  /** Whether to show location information */
  showLocation?: boolean;
  /** Maximum length for display text before truncation */
  maxDisplayLength?: number;
  /** Visual variant of the switcher */
  variant?: TurfSwitcherVariant;
  /** Additional CSS classes */
  className?: string;
  /** Callback when turf selection changes */
  onTurfChange?: (turf: Turf | null) => void;
}

export interface TurfMenuItem {
  key: string;
  label: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}
