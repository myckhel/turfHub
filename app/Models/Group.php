<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Group extends Model
{
    use HasFactory;

    protected $fillable = [
        'stage_id',
        'name',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
        ];
    }

    public function stage(): BelongsTo
    {
        return $this->belongsTo(Stage::class);
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
}
