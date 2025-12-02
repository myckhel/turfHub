<?php

namespace App\Models;

use App\Traits\Payable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Team extends Model
{
  use HasFactory, Payable;

  /**
   * The attributes that are mass assignable.
   *
   * @var array<int, string>
   */
  protected $fillable = [
    'match_session_id',
    'turf_id',        // For standalone teams not tied to sessions
    'tournament_id',
    'name',
    'color',          // Team color for UI display
    'captain_id',     // User ID of the team captain
    'status',         // e.g., active_in_match, waiting, eliminated
    'wins',
    'losses',
    'draws',
    'metadata',
  ];

  /**
   * Get the attributes that should be cast.
   *
   * @return array<string, string>
   */
  protected function casts(): array
  {
    return [
      'wins' => 'integer',
      'losses' => 'integer',
      'draws' => 'integer',
      'metadata' => 'array',
    ];
  }

  /**
   * Get the match session this team belongs to.
   */
  public function matchSession(): BelongsTo
  {
    return $this->belongsTo(MatchSession::class);
  }

  /**
   * Get the turf this team belongs to (for standalone teams).
   */
  public function turf(): BelongsTo
  {
    return $this->belongsTo(Turf::class);
  }

  /**
   * Get the tournament this team belongs to.
   */
  public function tournament(): BelongsTo
  {
    return $this->belongsTo(Tournament::class);
  }

  /**
   * Get the stage assignments for this team.
   */
  public function stageTeams(): HasMany
  {
    return $this->hasMany(StageTeam::class);
  }

  /**
   * Get the captain of the team.
   */
  public function captain(): BelongsTo
  {
    return $this->belongsTo(Player::class, 'captain_id');
  }

  /**
   * Get the players in this team through the pivot table.
   */
  public function teamPlayers(): HasMany
  {
    return $this->hasMany(TeamPlayer::class);
  }

  /**
   * Get the game matches this team has participated in (as first team).
   */
  public function gameMatchesAsFirstTeam(): HasMany
  {
    return $this->hasMany(GameMatch::class, 'first_team_id');
  }

  /**
   * Get the game matches this team has participated in (as second team).
   */
  public function gameMatchesAsSecondTeam(): HasMany
  {
    return $this->hasMany(GameMatch::class, 'second_team_id');
  }

  /**
   * Get confirmed team players only.
   */
  public function confirmedTeamPlayers(): HasMany
  {
    return $this->teamPlayers()->where('payment_status', 'confirmed');
  }

  /**
   * Get the count of confirmed players in this team.
   */
  public function getConfirmedPlayersCountAttribute(): int
  {
    return $this->confirmedTeamPlayers()->count();
  }

  /**
   * Check if team has available slots for new players.
   */
  public function hasAvailableSlots(): bool
  {
    $maxPlayers = $this->matchSession->max_players_per_team;
    $confirmedPlayers = $this->confirmedTeamPlayers()->count();

    return $confirmedPlayers < $maxPlayers;
  }

  /**
   * Get available slots count.
   */
  public function getAvailableSlotsCount(): int
  {
    $maxPlayers = $this->matchSession->max_players_per_team;
    $confirmedPlayers = $this->confirmedTeamPlayers()->count();

    return max(0, $maxPlayers - $confirmedPlayers);
  }
}
