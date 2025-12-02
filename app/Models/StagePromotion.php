<?php

namespace App\Models;

use App\Enums\PromotionRuleType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StagePromotion extends Model
{
    use HasFactory;

    protected $fillable = [
        'stage_id',
        'next_stage_id',
        'rule_type',
        'rule_config',
    ];

    protected function casts(): array
    {
        return [
            'rule_type' => PromotionRuleType::class,
            'rule_config' => 'array',
        ];
    }

    public function stage(): BelongsTo
    {
        return $this->belongsTo(Stage::class);
    }

    public function nextStage(): BelongsTo
    {
        return $this->belongsTo(Stage::class, 'next_stage_id');
    }

    public function getRuleConfigAttribute($value): array
    {
        return json_decode($value, true) ?? [];
    }
}
