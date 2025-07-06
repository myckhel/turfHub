<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
  $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule Telescope data pruning
Schedule::command('telescope:prune')->daily();

// Schedule team slot cleanup every 5 minutes
Schedule::command('team-slots:cleanup-expired')->everyFiveMinutes();
