<?php

namespace App\Models;

use App\Enums\StageStatus;
use App\Enums\StageType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Stage extends Model
{
    use HasFactory;

    protected $fillable = [
        'tournament_id',
        'name',
        'order',
        'stage_type',
        'settings',
        'next_stage_id',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'stage_type' => StageType::class,
            'status' => StageStatus::class,
            'settings' => 'array',
            'order' => 'integer',
        ];
    }

    public function tournament(): BelongsTo
    {
        return $this->belongsTo(Tournament::class);
    }

    public function groups(): HasMany
    {
        return $this->hasMany(Group::class);
    }

    public function stageTeams(): HasMany
    {
        return $this->hasMany(StageTeam::class);
    }

    public function fixtures(): HasMany
    {
        return $this->hasMany(GameMatch::class);
    }

    public function rankings(): HasMany
    {
        return $this->hasMany(Ranking::class);
    }

    public function promotion(): HasOne
    {
        return $this->hasOne(StagePromotion::class);
    }

    public function nextStage(): BelongsTo
    {
        return $this->belongsTo(Stage::class, 'next_stage_id');
    }

    public function previousStages(): HasMany
    {
        return $this->hasMany(Stage::class, 'next_stage_id');
    }

    public function isCompleted(): bool
    {
        return $this->status === StageStatus::COMPLETED;
    }

    public function canPromote(): bool
    {
        return $this->isCompleted() && $this->promotion()->exists() && $this->nextStage()->exists();
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
}
