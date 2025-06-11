<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MatchSession extends Model
{
    use HasFactory;

    public const TIME_SLOT_MORNING = 'morning';
    public const TIME_SLOT_EVENING = 'evening';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'turf_id',
        'name', // e.g., "Weekend Morning Kick-off"
        'session_date',
        'time_slot', // 'morning', 'evening'
        'start_time',
        'end_time',
        'max_teams', // 4-8 teams as per spec
        'status',    // e.g., scheduled, active, completed, cancelled
        'is_active', // Derived or explicit flag for current active session
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'session_date' => 'date',
            'start_time' => 'datetime:H:i',
            'end_time' => 'datetime:H:i',
            'max_teams' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the turf this match session belongs to.
     */
    public function turf(): BelongsTo
    {
        return $this->belongsTo(Turf::class);
    }

    /**
     * Get the teams participating in this match session.
     */
    public function teams(): HasMany
    {
        return $this->hasMany(Team::class);
    }

    /**
     * Get all game matches played in this session.
     */
    public function gameMatches(): HasMany
    {
        return $this->hasMany(GameMatch::class);
    }

    /**
     * Get the queue logic for this match session.
     */
    public function queueLogic(): HasMany // A session might have a history of queue states or a complex queue
    {
        return $this->hasMany(QueueLogic::class);
    }
}
