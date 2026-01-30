<?php

namespace App\Services\PromotionHandlers;

use App\Contracts\TournamentStrategies\PromotionHandlerInterface;
use App\Models\Stage;
use Illuminate\Support\Collection;

class KnockoutWinnersHandler implements PromotionHandlerInterface
{
  public function selectWinners(Stage $stage, Collection $rankings): Collection
  {
    $promotion = $stage->promotion;

    if (! $promotion) {
      throw new \InvalidArgumentException('No promotion rule found for stage.');
    }

    // For knockout stages, promote teams that won their fixtures
    // Get all completed fixtures and extract winning team IDs
    $fixtures = $stage->fixtures()->where('status', 'completed')->get();

    // Collect unique winning team IDs from fixtures
    return $fixtures
      ->pluck('winning_team_id')
      ->filter() // Remove null values (draws)
      ->unique()
      ->values();
  }

  public function validateConfig(array $config): bool
  {
    // No configuration needed for knockout winners
    return true;
  }
}
