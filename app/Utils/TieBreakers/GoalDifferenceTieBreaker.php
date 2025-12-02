<?php

namespace App\Utils\TieBreakers;

use Illuminate\Support\Collection;

class GoalDifferenceTieBreaker extends TieBreakerBase
{
    /**
     * Sort by goal difference (already calculated in rankings).
     */
    public function apply(Collection $teams, Collection $fixtures): Collection
    {
        return $teams->sortByDesc('goal_difference')->values();
    }
}
