<?php

return [

  /*
  |--------------------------------------------------------------------------
  | Default Minimum Stake Amount
  |--------------------------------------------------------------------------
  |
  | The default minimum amount a user can stake on a bet.
  | This value is used as a fallback when no specific limits are set
  | on the betting market or game match.
  |
  */

  'min_stake_amount' => env('BETTING_MIN_STAKE', 10),

  /*
  |--------------------------------------------------------------------------
  | Default Maximum Stake Amount
  |--------------------------------------------------------------------------
  |
  | The default maximum amount a user can stake on a bet.
  | This value is used as a fallback when no specific limits are set
  | on the betting market or game match.
  |
  */

  'max_stake_amount' => env('BETTING_MAX_STAKE', 50000),

  /*
  |--------------------------------------------------------------------------
  | Currency Symbol
  |--------------------------------------------------------------------------
  |
  | The currency symbol to display for betting amounts.
  |
  */

  'currency_symbol' => '₦',

  /*
  |--------------------------------------------------------------------------
  | Quick Amount Presets
  |--------------------------------------------------------------------------
  |
  | Predefined stake amounts for quick selection in the betting interface.
  | These are filtered dynamically based on market limits.
  |
  */

  'quick_amounts' => [50, 100, 200, 500, 1000, 2000, 5000],

  /*
  |--------------------------------------------------------------------------
  | Market Auto-Settlement
  |--------------------------------------------------------------------------
  |
  | Whether betting markets should be automatically settled when a
  | game match is completed and a winner is determined.
  |
  */

  'auto_settle_markets' => env('BETTING_AUTO_SETTLE', true),

];
