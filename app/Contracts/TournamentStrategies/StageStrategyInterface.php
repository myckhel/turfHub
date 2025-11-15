<?php

namespace App\Contracts\TournamentStrategies;

use App\Models\Stage;
use Illuminate\Support\Collection;

interface StageStrategyInterface
{
    /**
     * Generate fixtures for the given stage.
     *
     * @param Stage $stage
     * @return array Array of fixture data
     */
    public function generateFixtures(Stage $stage): array;

    /**
     * Compute rankings for the given stage.
     *
     * @param Stage $stage
     * @return Collection Collection of ranking data
     */
    public function computeRankings(Stage $stage): Collection;

    /**
     * Validate stage settings.
     *
     * @param array $settings
     * @return bool
     */
    public function validateStageSettings(array $settings): bool;
}
