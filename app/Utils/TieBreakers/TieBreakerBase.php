<?php

namespace App\Utils\TieBreakers;

use Illuminate\Support\Collection;

abstract class TieBreakerBase
{
    /**
     * Apply tie-breaker rule to tied teams.
     *
     * @param Collection $teams Teams with same points
     * @param Collection $fixtures All fixtures
     * @return Collection Sorted teams
     */
    abstract public function apply(Collection $teams, Collection $fixtures): Collection;
}
