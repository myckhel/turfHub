<?php

namespace App\Services\TournamentStrategies;

use App\Contracts\TournamentStrategies\StageStrategyInterface;

class StageStrategyFactory
{
    /**
     * Map of stage types to strategy classes.
     *
     * @var array
     */
    protected static array $strategies = [
        'league' => LeagueStrategy::class,
        'group' => GroupStrategy::class,
        'knockout' => KnockoutStrategy::class,
        'swiss' => SwissStrategy::class,
        'king_of_hill' => KingOfHillStrategy::class,
    ];

    /**
     * Get strategy instance for the given stage type.
     *
     * @param string $stageType
     * @return StageStrategyInterface
     * @throws \InvalidArgumentException
     */
    public static function make(string $stageType): StageStrategyInterface
    {
        if (!isset(self::$strategies[$stageType])) {
            throw new \InvalidArgumentException("Unknown stage type: {$stageType}");
        }

        $strategyClass = self::$strategies[$stageType];

        return new $strategyClass();
    }

    /**
     * Register a custom strategy.
     *
     * @param string $stageType
     * @param string $strategyClass
     * @return void
     */
    public static function register(string $stageType, string $strategyClass): void
    {
        self::$strategies[$stageType] = $strategyClass;
    }

    /**
     * Get all registered strategies.
     *
     * @return array
     */
    public static function getStrategies(): array
    {
        return self::$strategies;
    }
}
