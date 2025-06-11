<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QueueLogic extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'match_session_id',
        'team_id',
        'queue_position',
        'status', // e.g., waiting, next_to_play, played_waiting_draw_resolution
        'reason_for_current_position', // e.g., initial_join, win, loss, draw_reentry_random, draw_waiting_other_match
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'queue_position' => 'integer',
        ];
    }

    /**
     * Get the match session this queue entry belongs to.
     */
    public function matchSession(): BelongsTo
    {
        return $this->belongsTo(MatchSession::class);
    }

    /**
     * Get the team this queue entry refers to.
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }
}
