<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Team extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'match_session_id',
        'name',
        'captain_id', // User ID of the team captain
        'status',     // e.g., active_in_match, waiting, eliminated
        'wins',
        'losses',
        'draws',
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
     * Get the captain of the team.
     */
    public function captain(): BelongsTo
    {
        // Assuming captain_id refers to a User model. If it refers to a Player model, change accordingly.
        return $this->belongsTo(User::class, 'captain_id');
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
}
