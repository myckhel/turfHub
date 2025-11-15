<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StageTeam extends Model
{
    use HasFactory;

    protected $fillable = [
        'stage_id',
        'team_id',
        'group_id',
        'seed',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'seed' => 'integer',
        ];
    }

    public function stage(): BelongsTo
    {
        return $this->belongsTo(Stage::class);
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }
}
