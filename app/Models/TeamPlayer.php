<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeamPlayer extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'team_player'; // Explicitly define if not following laravel conventions for pivot

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'team_id',
        'player_id',
        'status', // e.g., active, benched, substituted_out
        'join_time', // Timestamp when player joined the team for the session
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'join_time' => 'datetime',
        ];
    }

    /**
     * Get the team this entry belongs to.
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    /**
     * Get the player this entry belongs to.
     */
    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }
}
