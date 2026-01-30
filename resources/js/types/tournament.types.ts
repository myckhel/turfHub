// Tournament type definitions

import { GameMatch } from './gameMatch.types';
import type { ApiResponse, PaginatedResponse } from './global.types';

// ============================================================================
// Enums
// ============================================================================

export type TournamentType = 'single_session' | 'multi_stage_tournament';
export type StageType = 'league' | 'group' | 'knockout' | 'swiss' | 'king_of_hill' | 'custom';
export type StageStatus = 'pending' | 'active' | 'completed' | 'cancelled';
export type PromotionRuleType = 'top_n' | 'top_per_group' | 'points_threshold' | 'knockout_winners' | 'custom';
export type FixtureStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'postponed' | 'upcoming';

// ============================================================================
// Main Entities
// ============================================================================

export interface Tournament {
  id: number;
  name: string;
  type: TournamentType;
  status: string;
  settings: TournamentSettings;
  starts_at: string;
  ends_at?: string;
  created_at: string;
  updated_at: string;
  turf?: { id: number; name: string; location: string };
  creator?: { id: number; name: string };
  stages?: Stage[];
  teams?: TeamBasic[];
  stages_count?: number;
  teams_count?: number;
}

export interface TournamentSettings {
  location?: string;
  description?: string;
  registration_fee?: number;
  prize_pool?: number;
  [key: string]: unknown;
}

export interface Stage {
  id: number;
  tournament_id: number;
  name: string;
  order: number;
  stage_type: StageType;
  status: StageStatus;
  settings: StageSettings;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  tournament?: { id: number; name: string; teams?: StageTeam[] };
  next_stage?: { id: number; name: string; order: number };
  promotion?: StagePromotion;
  groups?: Group[];
  teams?: StageTeam[];
  fixtures?: Fixture[];
  rankings?: Ranking[];
  groups_count?: number;
  teams_count?: number;
  fixtures_count?: number;
  total_teams?: number;
  total_fixtures?: number;
  completed_fixtures?: number;
}

/**
 * Stage settings configuration for different tournament stage types
 * All settings are optional and their usage depends on the stage type
 */
export interface StageSettings {
  // Common settings for all stage types
  match_duration?: number; // Duration of each match in minutes (1-120)
  match_interval?: number; // Break time between matches in minutes (0-60)

  // League and Group stage settings
  rounds?: number; // Number of rounds/times teams play each other (min: 1)
  home_and_away?: boolean; // Enable home and away fixtures

  // Group stage specific settings
  groups_count?: number; // Number of groups to create (2-8)
  teams_per_group?: number; // Number of teams in each group (min: 2)

  // Knockout stage specific settings
  legs?: number; // Number of legs per tie (1 or 2)
  third_place_match?: boolean; // Include third place playoff match
  seeding?: boolean; // Enable seeding for bracket generation

  // Scoring system (for league, group, and swiss stages)
  scoring?: {
    win: number; // Points awarded for a win
    draw: number; // Points awarded for a draw
    loss: number; // Points awarded for a loss
  };

  // Tie breaker rules priority order (for league and group stages)
  tie_breakers?: Array<'goal_difference' | 'goals_for' | 'head_to_head' | 'fair_play' | 'random'>;
}

export interface StagePromotion {
  id: number;
  stage_id: number;
  next_stage_id: number;
  rule_type: PromotionRuleType;
  rule_config: PromotionRuleConfig;
  next_stage?: { id: number; name: string };
}

export interface PromotionRuleConfig {
  n?: number;
  threshold?: number;
  handler_class?: string;
  params?: Record<string, unknown>;
}

export interface Group {
  id: number;
  stage_id: number;
  name: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  stage?: { id: number; name: string };
  rankings?: Ranking[];
  fixtures?: Fixture[];
  teams?: StageTeam[];
  teams_count?: number;
  fixtures_count?: number;
  teams_per_group?: number;
}

export interface Ranking {
  id: number;
  stage_id: number;
  group_id?: number;
  team_id: number;
  rank: number;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  metadata?: Record<string, unknown>;
  team?: { id: number; name: string };
  stage?: { id: number; name: string };
  group?: { id: number; name: string };
}

export interface Fixture extends GameMatch {
  id: number;
}

export interface StageTeam {
  id: number;
  name: string;
  seed?: number;
  group_id?: number;
  metadata?: Record<string, unknown>;
  captain?: { id: number; name: string };
  is_guest?: boolean;
  players_count?: number;
}

export interface TeamBasic {
  id: number;
  name: string;
}

export interface TieBreaker {
  id: number;
  stage_id: number;
  type: 'head_to_head' | 'goal_difference' | 'goals_scored' | 'goals_conceded' | 'wins' | 'away_goals' | 'fair_play' | 'drawing_lots';
  priority: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Request Types
// ============================================================================

export interface CreateTournamentRequest {
  name: string;
  turf_id: number;
  type: TournamentType;
  settings?: TournamentSettings;
  starts_at: string;
  ends_at?: string;
}

export interface UpdateTournamentRequest {
  name?: string;
  type?: TournamentType;
  settings?: TournamentSettings;
  starts_at?: string;
  ends_at?: string;
  status?: string;
}

export interface CreateStageRequest {
  name: string;
  order: number;
  stage_type: StageType;
  settings?: StageSettings;
  rule_type?: PromotionRuleType;
  rule_config?: PromotionRuleConfig;
}

export interface UpdateStageRequest {
  name?: string;
  order?: number;
  stage_type?: StageType;
  settings?: StageSettings;
  status?: StageStatus;
  rule_type?: PromotionRuleType;
  rule_config?: PromotionRuleConfig;
}

export interface CreateStagePromotionRequest {
  next_stage_id: number;
  rule_type: PromotionRuleType;
  rule_config: PromotionRuleConfig;
}

export interface UpdateStagePromotionRequest {
  next_stage_id?: number;
  rule_type?: PromotionRuleType;
  rule_config?: PromotionRuleConfig;
}

export interface AssignTeamsRequest {
  team_ids: number[];
  auto_seed?: boolean;
  group_assignment?: 'auto' | 'manual';
  seeds?: Record<number, number>;
  group_ids?: Record<number, number>;
}

export interface GenerateFixturesRequest {
  mode: 'auto' | 'manual';
  auto_schedule?: boolean;
  manual_fixtures?: ManualFixture[];
}

export interface ManualFixture {
  home_team_id: number;
  away_team_id: number;
  starts_at?: string;
  group_id?: number;
}

export interface ExecutePromotionRequest {
  team_ids?: number[];
  override_reason?: string;
}

// ============================================================================
// Filter Types
// ============================================================================

export interface TournamentFilters {
  turf_id?: number;
  status?: string;
  type?: TournamentType;
  per_page?: number;
  include?: string;
  search?: string;
  starts_after?: string;
  starts_before?: string;
}

export interface StageFilters {
  tournament_id?: number;
  stage_type?: StageType;
  status?: StageStatus;
  include?: string;
}

export interface FixtureFilters {
  stage_id?: number;
  group_id?: number;
  status?: FixtureStatus;
  team_id?: number;
  starts_after?: string;
  starts_before?: string;
  include?: string;
}

// ============================================================================
// Simulation Results
// ============================================================================

export interface FixtureSimulation {
  fixtures: Fixture[];
  total_matches: number;
  estimated_duration: number;
  warnings?: string[];
}

export interface PromotionSimulation {
  promoted_teams: StageTeam[];
  promotion_rule: string;
  next_stage: { id: number; name: string };
  explanation: string;
}

// ============================================================================
// Type Helpers
// ============================================================================

/**
 * Keys of StageSettings for type-safe indexed access
 */
export type StageSettingsKey = keyof StageSettings;

/**
 * Helper type for accessing nested scoring settings
 */
export type ScoringSettingsKey = keyof NonNullable<StageSettings['scoring']>;

/**
 * Helper type for tie breaker values
 */
export type TieBreakerType = NonNullable<StageSettings['tie_breakers']>[number];

// ============================================================================
// Response Types
// ============================================================================

export type TournamentListResponse = PaginatedResponse<Tournament>;
export type TournamentResponse = Tournament;
export type StageListResponse = ApiResponse<Stage[]>;
export type StageResponse = Stage;
export type RankingListResponse = ApiResponse<Ranking[]>;
export type FixtureListResponse = ApiResponse<Fixture[]>;
export type FixtureSimulationResponse = ApiResponse<FixtureSimulation>;
export type PromotionSimulationResponse = PromotionSimulation;
export type GroupListResponse = ApiResponse<Group[]>;
