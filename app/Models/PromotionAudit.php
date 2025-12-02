<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PromotionAudit extends Model
{
    use HasFactory;

    protected $fillable = [
        'stage_id',
        'triggered_by',
        'simulated',
        'result',
    ];

    protected function casts(): array
    {
        return [
            'result' => 'array',
            'simulated' => 'boolean',
        ];
    }

    public function stage(): BelongsTo
    {
        return $this->belongsTo(Stage::class);
    }

    public function triggeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'triggered_by');
    }
}
