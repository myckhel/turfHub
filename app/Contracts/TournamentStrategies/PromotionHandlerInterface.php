<?php

namespace App\Contracts\TournamentStrategies;

use App\Models\Stage;
use Illuminate\Support\Collection;

interface PromotionHandlerInterface
{
    /**
     * Select winners from the stage based on rankings.
     *
     * @param Stage $stage
     * @param Collection $rankings
     * @return Collection Collection of team IDs to promote
     */
    public function selectWinners(Stage $stage, Collection $rankings): Collection;

    /**
     * Validate promotion rule configuration.
     *
     * @param array $config
     * @return bool
     */
    public function validateConfig(array $config): bool;
}
