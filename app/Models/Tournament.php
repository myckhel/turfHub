<?php

namespace App\Models;

use App\Enums\TournamentType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tournament extends Model
{
    use HasFactory;

    protected $fillable = [
        'turf_id',
        'name',
        'type',
        'settings',
        'starts_at',
        'ends_at',
        'status',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'type' => TournamentType::class,
            'settings' => 'array',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function turf(): BelongsTo
    {
        return $this->belongsTo(Turf::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function stages(): HasMany
    {
        return $this->hasMany(Stage::class)->orderBy('order');
    }

    public function teams(): HasMany
    {
        return $this->hasMany(Team::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeUpcoming($query)
    {
        return $query->where('status', 'pending')->where('starts_at', '>', now());
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function isMultiStage(): bool
    {
        return $this->type === TournamentType::MULTI_STAGE;
    }
}
