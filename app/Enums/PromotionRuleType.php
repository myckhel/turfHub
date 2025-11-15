<?php

namespace App\Enums;

enum PromotionRuleType: string
{
    case TOP_N = 'top_n';
    case TOP_PER_GROUP = 'top_per_group';
    case POINTS_THRESHOLD = 'points_threshold';
    case CUSTOM = 'custom';

    public function label(): string
    {
        return match ($this) {
            self::TOP_N => 'Top N Teams',
            self::TOP_PER_GROUP => 'Top N Per Group',
            self::POINTS_THRESHOLD => 'Points Threshold',
            self::CUSTOM => 'Custom Rule',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::TOP_N => 'Promote the top N ranked teams from the stage',
            self::TOP_PER_GROUP => 'Promote the top N teams from each group',
            self::POINTS_THRESHOLD => 'Promote teams that reach a minimum points threshold',
            self::CUSTOM => 'Custom promotion logic via handler class',
        };
    }
}
