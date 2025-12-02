<?php

namespace App\Services\PromotionHandlers;

use App\Contracts\TournamentStrategies\PromotionHandlerInterface;
use App\Models\Stage;
use Illuminate\Support\Collection;

class TopPerGroupHandler implements PromotionHandlerInterface
{
    public function selectWinners(Stage $stage, Collection $rankings): Collection
    {
        $promotion = $stage->promotion;
        
        if (!$promotion) {
            throw new \InvalidArgumentException('No promotion rule found for stage.');
        }

        $config = $promotion->rule_config ?? [];
        $n = $config['n'] ?? 1;

        $winners = collect();

        // Group rankings by group_id
        $groupedRankings = $rankings->groupBy('group_id');

        foreach ($groupedRankings as $groupRankings) {
            // Get top N from each group
            $topTeams = $groupRankings->sortBy('rank')
                ->take($n)
                ->pluck('team_id');
            
            $winners = $winners->merge($topTeams);
        }

        return $winners;
    }

    public function validateConfig(array $config): bool
    {
        return isset($config['n']) && is_int($config['n']) && $config['n'] > 0;
    }
}
