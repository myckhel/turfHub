<?php

namespace App\Enums;

enum TournamentType: string
{
    case SINGLE_SESSION = 'single_session';
    case MULTI_STAGE = 'multi_stage_tournament';

    public function label(): string
    {
        return match ($this) {
            self::SINGLE_SESSION => 'Single Session',
            self::MULTI_STAGE => 'Multi-Stage Tournament',
        };
    }
}
