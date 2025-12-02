<?php

namespace App\Services\PromotionHandlers;

use App\Contracts\TournamentStrategies\PromotionHandlerInterface;

class PromotionHandlerFactory
{
    /**
     * Map of rule types to handler classes.
     *
     * @var array
     */
    protected static array $handlers = [
        'top_n' => TopNHandler::class,
        'top_per_group' => TopPerGroupHandler::class,
        'points_threshold' => PointsThresholdHandler::class,
        'custom' => CustomHandler::class,
    ];

    /**
     * Get handler instance for the given rule type.
     *
     * @param string $ruleType
     * @return PromotionHandlerInterface
     * @throws \InvalidArgumentException
     */
    public static function make(string $ruleType): PromotionHandlerInterface
    {
        if (!isset(self::$handlers[$ruleType])) {
            throw new \InvalidArgumentException("Unknown promotion rule type: {$ruleType}");
        }

        $handlerClass = self::$handlers[$ruleType];

        return new $handlerClass();
    }

    /**
     * Register a custom handler.
     *
     * @param string $ruleType
     * @param string $handlerClass
     * @return void
     */
    public static function register(string $ruleType, string $handlerClass): void
    {
        self::$handlers[$ruleType] = $handlerClass;
    }

    /**
     * Get all registered handlers.
     *
     * @return array
     */
    public static function getHandlers(): array
    {
        return self::$handlers;
    }
}
