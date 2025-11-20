<?php

namespace App\Utils\TieBreakers;

use Illuminate\Support\Collection;

class GoalsForTieBreaker extends TieBreakerBase
{
    /**
     * Sort by total goals scored.
     */
    public function apply(Collection $teams, Collection $fixtures): Collection
    {
        return $teams->sortByDesc('goals_for')->values();
    }
}
