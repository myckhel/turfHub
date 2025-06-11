<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MatchEvent extends Model
{
    use HasFactory;

    public const TYPE_GOAL = 'goal';
    public const TYPE_YELLOW_CARD = 'yellow_card';
    public const TYPE_RED_CARD = 'red_card';
    public const TYPE_SUBSTITUTION_IN = 'substitution_in';
    public const TYPE_SUBSTITUTION_OUT = 'substitution_out';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'game_match_id',
        'player_id', // The player who is the subject of the event
        'team_id', // The team of the player involved in the event
        'type',      // e.g., goal, yellow_card, red_card, substitution
        'minute',    // Minute of the match when the event occurred
        'comment',   // Optional comment about the event
        'related_player_id', // e.g., for assists in goals, or player coming in for substitution
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'minute' => 'integer',
        ];
    }

    /**
     * Get the game match this event belongs to.
     */
    public function gameMatch(): BelongsTo
    {
        return $this->belongsTo(GameMatch::class);
    }

    /**
     * Get the player involved in this event.
     */
    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }

    /**
     * Get the team involved in this event.
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    /**
     * Get the related player (e.g., for assists or substitutions).
     */
    public function relatedPlayer(): BelongsTo
    {
        return $this->belongsTo(Player::class, 'related_player_id');
    }
}
