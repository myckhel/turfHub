<?php

namespace App\Models;

use App\Observers\GameMatchObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[ObservedBy([GameMatchObserver::class])]
class GameMatch extends Model
{
  use HasFactory;

  public const OUTCOME_WIN = 'win';
  public const OUTCOME_LOSS = 'loss';
  public const OUTCOME_DRAW = 'draw';

  /**
   * The attributes that are mass assignable.
   *
   * @var array<int, string>
   */
  protected $fillable = [
    'match_session_id',
    'first_team_id',
    'second_team_id',
    'first_team_score',
    'second_team_score',
    'winning_team_id', // Can be null in case of a draw
    'outcome',         // e.g., 'win' (for first_team), 'loss', 'draw' - relative to first_team or specific team
    'match_time',      // Actual time the match started
    'status',          // e.g., upcoming, in_progress, completed, postponed
    'betting_enabled', // Whether betting is enabled for this match
  ];

  /**
   * Get the attributes that should be cast.
   *
   * @return array<string, string>
   */
  protected function casts(): array
  {
    return [
      'first_team_score' => 'integer',
      'second_team_score' => 'integer',
      'match_time' => 'datetime',
      'betting_enabled' => 'boolean',
    ];
  }

  /**
   * Get the match session this game belongs to.
   */
  public function matchSession(): BelongsTo
  {
    return $this->belongsTo(MatchSession::class);
  }

  /**
   * Get the first team in the match.
   */
  public function firstTeam(): BelongsTo
  {
    return $this->belongsTo(Team::class, 'first_team_id');
  }

  /**
   * Get the second team in the match.
   */
  public function secondTeam(): BelongsTo
  {
    return $this->belongsTo(Team::class, 'second_team_id');
  }

  /**
   * Get the winning team (if any).
   */
  public function winningTeam(): BelongsTo
  {
    return $this->belongsTo(Team::class, 'winning_team_id');
  }

  /**
   * Get all events for this game match.
   */
  public function matchEvents(): HasMany
  {
    return $this->hasMany(MatchEvent::class);
  }

  /**
   * Get all betting markets for this game match.
   */
  public function bettingMarkets(): HasMany
  {
    return $this->hasMany(BettingMarket::class);
  }

  /**
   * Check if betting is enabled for this match.
   */
  public function isBettingEnabled(): bool
  {
    return $this->betting_enabled && $this->status === 'upcoming';
  }

  /**
   * Get active betting markets for this match.
   */
  public function activeBettingMarkets(): HasMany
  {
    return $this->bettingMarkets()->active();
  }

  /**
   * Enable betting for this match and create default 1X2 market.
   */
  public function enableBetting(): void
  {
    $this->update(['betting_enabled' => true]);

    // Create default 1X2 market if it doesn't exist
    if (!$this->bettingMarkets()->where('market_type', BettingMarket::TYPE_1X2)->exists()) {
      BettingMarket::create1X2Market($this);
    }
  }

  /**
   * Disable betting for this match.
   */
  public function disableBetting(): void
  {
    $this->update(['betting_enabled' => false]);

    // Suspend all active markets
    $this->bettingMarkets()->active()->update([
      'status' => BettingMarket::STATUS_SUSPENDED
    ]);
  }
}
