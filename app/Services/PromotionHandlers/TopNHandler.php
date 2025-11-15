<?php

namespace App\Services\PromotionHandlers;

use App\Contracts\TournamentStrategies\PromotionHandlerInterface;
use App\Models\Stage;
use Illuminate\Support\Collection;

class TopNHandler implements PromotionHandlerInterface
{
    public function selectWinners(Stage $stage, Collection $rankings): Collection
    {
        $promotion = $stage->promotion;
        
        if (!$promotion) {
            throw new \InvalidArgumentException('No promotion rule found for stage.');
        }

        $config = $promotion->rule_config ?? [];
        $n = $config['n'] ?? 1;

        // Get top N teams
        return $rankings->sortBy('rank')
            ->take($n)
            ->pluck('team_id');
    }

    public function validateConfig(array $config): bool
    {
        return isset($config['n']) && is_int($config['n']) && $config['n'] > 0;
    }
}
