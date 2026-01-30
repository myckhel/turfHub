<?php

namespace App\Services\TournamentStrategies;

use App\Contracts\TournamentStrategies\StageStrategyInterface;
use App\Models\Stage;
use Illuminate\Support\Collection;

class CustomStrategy implements StageStrategyInterface
{
  public function generateFixtures(Stage $stage): array
  {
    // Custom stages don't auto-generate fixtures
    // Fixtures should be manually created by the organizer
    return [];
  }

  public function computeRankings(Stage $stage): Collection
  {
    // For custom stages, return empty rankings
    // Rankings should be manually managed
    return collect();
  }

  public function validateStageSettings(array $settings): bool
  {
    // Custom stages have flexible settings
    return true;
  }
}
