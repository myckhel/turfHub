<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Player extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'turf_id',
        'is_member', // Indicates if the player is a paying member of the turf
        'status',    // e.g., active, inactive, banned
        // 'role' - removed as roles are now managed through Laravel Permission package
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_member' => 'boolean',
        ];
    }

    /**
     * Get the user record associated with this player.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the turf this player is associated with.
     */
    public function turf(): BelongsTo
    {
        return $this->belongsTo(Turf::class);
    }

    /**
     * Get the team player entries for this player.
     * A player can be part of multiple teams across different match sessions or over time.
     */
    public function teamPlayers(): HasMany
    {
        return $this->hasMany(TeamPlayer::class);
    }

    /**
     * Get the match events involving this player.
     */
    public function matchEvents(): HasMany
    {
        return $this->hasMany(MatchEvent::class);
    }

    /**
     * Check if this player has a specific role in their turf.
     */
    public function hasRoleInTurf(string $role): bool
    {
        return $this->user->hasRoleOnTurf($role, $this->turf_id);
    }

    /**
     * Check if this player is an admin in their turf.
     */
    public function isTurfAdmin(): bool
    {
        return $this->hasRoleInTurf(User::TURF_ROLE_ADMIN);
    }

    /**
     * Check if this player is a manager in their turf.
     */
    public function isTurfManager(): bool
    {
        return $this->hasRoleInTurf(User::TURF_ROLE_MANAGER);
    }

    /**
     * Check if this player is a regular player in their turf.
     */
    public function isTurfPlayer(): bool
    {
        return $this->hasRoleInTurf(User::TURF_ROLE_PLAYER);
    }

    /**
     * Assign a role to this player in their turf.
     */
    public function assignTurfRole(string $role): void
    {
        $currentTeamId = getPermissionsTeamId();
        setPermissionsTeamId($this->turf_id);

        $this->user->assignRole($role);

        setPermissionsTeamId($currentTeamId);
    }

    /**
     * Remove a role from this player in their turf.
     */
    public function removeTurfRole(string $role): void
    {
        $currentTeamId = getPermissionsTeamId();
        setPermissionsTeamId($this->turf_id);

        $this->user->removeRole($role);

        setPermissionsTeamId($currentTeamId);
    }
}
