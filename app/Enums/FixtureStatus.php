<?php

namespace App\Enums;

enum FixtureStatus: string
{
    case SCHEDULED = 'scheduled';
    case IN_PROGRESS = 'in_progress';
    case COMPLETED = 'completed';
    case POSTPONED = 'postponed';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::SCHEDULED => 'Scheduled',
            self::IN_PROGRESS => 'In Progress',
            self::COMPLETED => 'Completed',
            self::POSTPONED => 'Postponed',
            self::CANCELLED => 'Cancelled',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::SCHEDULED => 'blue',
            self::IN_PROGRESS => 'orange',
            self::COMPLETED => 'green',
            self::POSTPONED => 'yellow',
            self::CANCELLED => 'red',
        };
    }
}
