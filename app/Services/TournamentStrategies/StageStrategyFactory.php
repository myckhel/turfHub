<?php

namespace App\Services\TournamentStrategies;

use App\Contracts\TournamentStrategies\StageStrategyInterface;

class StageStrategyFactory
{
  /**
   * Map of stage types to strategy classes.
   */
  protected static array $strategies = [
    'league' => LeagueStrategy::class,
    'group' => GroupStrategy::class,
    'knockout' => KnockoutStrategy::class,
    'swiss' => SwissStrategy::class,
    'king_of_hill' => KingOfHillStrategy::class,
    'custom' => CustomStrategy::class,
  ];

  /**
   * Get strategy instance for the given stage type.
   *
   * @throws \InvalidArgumentException
   */
  public static function make(string $stageType): StageStrategyInterface
  {
    if (! isset(self::$strategies[$stageType])) {
      throw new \InvalidArgumentException("Unknown stage type: {$stageType}");
    }

    $strategyClass = self::$strategies[$stageType];

    return new $strategyClass;
  }

  /**
   * Register a custom strategy.
   */
  public static function register(string $stageType, string $strategyClass): void
  {
    self::$strategies[$stageType] = $strategyClass;
  }

  /**
   * Get all registered strategies.
   */
  public static function getStrategies(): array
  {
    return self::$strategies;
  }
}
