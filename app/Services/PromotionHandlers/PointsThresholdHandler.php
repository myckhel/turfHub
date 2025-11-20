<?php

namespace App\Services\PromotionHandlers;

use App\Contracts\TournamentStrategies\PromotionHandlerInterface;
use App\Models\Stage;
use Illuminate\Support\Collection;

class PointsThresholdHandler implements PromotionHandlerInterface
{
    public function selectWinners(Stage $stage, Collection $rankings): Collection
    {
        $promotion = $stage->promotion;
        
        if (!$promotion) {
            throw new \InvalidArgumentException('No promotion rule found for stage.');
        }

        $config = $promotion->rule_config ?? [];
        $threshold = $config['threshold'] ?? 0;

        // Get teams meeting or exceeding the threshold
        return $rankings->where('points', '>=', $threshold)
            ->sortBy('rank')
            ->pluck('team_id');
    }

    public function validateConfig(array $config): bool
    {
        return isset($config['threshold']) && is_numeric($config['threshold']);
    }
}
