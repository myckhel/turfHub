<?php

namespace App\Utils\TieBreakers;

use Illuminate\Support\Collection;

class RandomTieBreaker extends TieBreakerBase
{
    /**
     * Random tie-breaker (last resort).
     * Shuffles teams randomly.
     */
    public function apply(Collection $teams, Collection $fixtures): Collection
    {
        return $teams->shuffle()->values();
    }
}
