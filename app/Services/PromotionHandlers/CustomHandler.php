<?php

namespace App\Services\PromotionHandlers;

use App\Contracts\TournamentStrategies\PromotionHandlerInterface;
use App\Models\Stage;
use Illuminate\Support\Collection;

class CustomHandler implements PromotionHandlerInterface
{
    public function selectWinners(Stage $stage, Collection $rankings): Collection
    {
        $promotion = $stage->promotion;
        
        if (!$promotion) {
            throw new \InvalidArgumentException('No promotion rule found for stage.');
        }

        $config = $promotion->rule_config ?? [];
        $handlerClass = $config['handler_class'] ?? null;

        if (!$handlerClass || !class_exists($handlerClass)) {
            throw new \InvalidArgumentException("Custom handler class not found: {$handlerClass}");
        }

        $handler = new $handlerClass();

        if (!$handler instanceof PromotionHandlerInterface) {
            throw new \InvalidArgumentException("Custom handler must implement PromotionHandlerInterface");
        }

        return $handler->selectWinners($stage, $rankings);
    }

    public function validateConfig(array $config): bool
    {
        return isset($config['handler_class']) && is_string($config['handler_class']);
    }
}
