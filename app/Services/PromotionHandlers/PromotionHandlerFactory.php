<?php

namespace App\Services\PromotionHandlers;

use App\Contracts\TournamentStrategies\PromotionHandlerInterface;

class PromotionHandlerFactory
{
    /**
     * Map of rule types to handler classes.
     */
    protected static array $handlers = [
        'top_n' => TopNHandler::class,
        'top_per_group' => TopPerGroupHandler::class,
        'points_threshold' => PointsThresholdHandler::class,
        'knockout_winners' => KnockoutWinnersHandler::class,
        'custom' => CustomHandler::class,
    ];

    /**
     * Get handler instance for the given rule type.
     *
     * @throws \InvalidArgumentException
     */
    public static function make(string $ruleType): PromotionHandlerInterface
    {
        if (! isset(self::$handlers[$ruleType])) {
            throw new \InvalidArgumentException("Unknown promotion rule type: {$ruleType}");
        }

        $handlerClass = self::$handlers[$ruleType];

        return new $handlerClass;
    }

    /**
     * Register a custom handler.
     */
    public static function register(string $ruleType, string $handlerClass): void
    {
        self::$handlers[$ruleType] = $handlerClass;
    }

    /**
     * Get all registered handlers.
     */
    public static function getHandlers(): array
    {
        return self::$handlers;
    }
}
