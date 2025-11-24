<?php

return [
  /*
    |--------------------------------------------------------------------------
    | Default Tournament Settings
    |--------------------------------------------------------------------------
    |
    | Default configuration values for tournament stages and matches.
    |
    */

  'default_settings' => [
    'match_duration' => 12, // minutes
    'team_size_min' => 3,
    'team_size_max' => 6,
    'rounds' => 1,
    'home_and_away' => false,
  ],

  /*
    |--------------------------------------------------------------------------
    | Scoring System
    |--------------------------------------------------------------------------
    |
    | Points awarded for match results.
    |
    */

  'scoring' => [
    'default' => [
      'win' => 3,
      'draw' => 1,
      'loss' => 0,
    ],
  ],

  /*
    |--------------------------------------------------------------------------
    | Tie-Breaker Rules
    |--------------------------------------------------------------------------
    |
    | Order of tie-breaker rules applied when teams have equal points.
    | Rules are applied in sequence until teams are separated.
    |
    */

  'tie_breakers' => [
    'default' => [
      \App\Utils\TieBreakers\GoalDifferenceTieBreaker::class,
      \App\Utils\TieBreakers\GoalsForTieBreaker::class,
      \App\Utils\TieBreakers\HeadToHeadTieBreaker::class,
      \App\Utils\TieBreakers\RandomTieBreaker::class,
    ],
  ],

  /*
    |--------------------------------------------------------------------------
    | Stage Strategy Mappings
    |--------------------------------------------------------------------------
    |
    | Maps stage types to their strategy implementation classes.
    |
    */

  'strategies' => [
    'league' => \App\Services\TournamentStrategies\LeagueStrategy::class,
    'group' => \App\Services\TournamentStrategies\GroupStrategy::class,
    'knockout' => \App\Services\TournamentStrategies\KnockoutStrategy::class,
    'swiss' => \App\Services\TournamentStrategies\SwissStrategy::class,
    'king_of_hill' => \App\Services\TournamentStrategies\KingOfHillStrategy::class,
  ],

  /*
    |--------------------------------------------------------------------------
    | Promotion Handler Mappings
    |--------------------------------------------------------------------------
    |
    | Maps promotion rule types to their handler implementation classes.
    |
    */

  'promotion_handlers' => [
    'top_n' => \App\Services\PromotionHandlers\TopNHandler::class,
    'top_per_group' => \App\Services\PromotionHandlers\TopPerGroupHandler::class,
    'points_threshold' => \App\Services\PromotionHandlers\PointsThresholdHandler::class,
    'custom' => \App\Services\PromotionHandlers\CustomHandler::class,
  ],

  /*
    |--------------------------------------------------------------------------
    | Fixture Scheduling
    |--------------------------------------------------------------------------
    |
    | Default settings for automatic fixture scheduling.
    |
    */

  'scheduling' => [
    'default_interval_minutes' => 15, // Time between matches
    'default_start_time' => '09:00',
    'default_end_time' => '22:00',
    'rest_days' => [], // Days of week to skip (0 = Sunday, 6 = Saturday)
  ],

  /*
    |--------------------------------------------------------------------------
    | Cache Settings
    |--------------------------------------------------------------------------
    |
    | Cache TTL for tournament-related data.
    |
    */

  'cache' => [
    'rankings_ttl' => 300, // 5 minutes
    'fixtures_ttl' => 600, // 10 minutes
    'tournament_ttl' => 3600, // 1 hour
  ],

  /*
    |--------------------------------------------------------------------------
    | Validation Rules
    |--------------------------------------------------------------------------
    |
    | Minimum requirements for tournament operations.
    |
    */

  'validation' => [
    'min_teams_per_stage' => 2,
    'min_teams_per_group' => 2,
    'max_teams_per_group' => 8,
    'min_groups' => 2,
    'max_groups' => 16,
  ],
];
