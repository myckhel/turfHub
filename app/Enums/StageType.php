<?php

namespace App\Enums;

enum StageType: string
{
    case LEAGUE = 'league';
    case GROUP = 'group';
    case KNOCKOUT = 'knockout';
    case SWISS = 'swiss';
    case KING_OF_HILL = 'king_of_hill';
    case CUSTOM = 'custom';

    public function label(): string
    {
        return match ($this) {
            self::LEAGUE => 'League (Round Robin)',
            self::GROUP => 'Group Stage',
            self::KNOCKOUT => 'Knockout (Elimination)',
            self::SWISS => 'Swiss System',
            self::KING_OF_HILL => 'King of the Hill',
            self::CUSTOM => 'Custom Format',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::LEAGUE => 'All teams play each other in a round-robin format',
            self::GROUP => 'Teams divided into groups with round-robin within each group',
            self::KNOCKOUT => 'Single or double elimination bracket',
            self::SWISS => 'Teams paired based on performance without elimination',
            self::KING_OF_HILL => 'Queue-based matches with dynamic rankings',
            self::CUSTOM => 'Custom tournament format',
        };
    }
}
