<?php

namespace App\Observers;

use App\Jobs\GameMatch\Completed as GameMatchCompletedJob;
use App\Models\GameMatch;
use Illuminate\Support\Facades\Log;

class GameMatchObserver
{
  /**
   * Handle the GameMatch "created" event.
   */
  public function created(GameMatch $gameMatch): void
  {
    //
  }

  /**
   * Handle the GameMatch "updated" event.
   */
  public function updated(GameMatch $gameMatch): void
  {
    // Check if status was changed to 'completed'
    if ($gameMatch->wasChanged('status') && $gameMatch->status === 'completed') {
      // Dispatch job to process match completion and determine next game
      GameMatchCompletedJob::dispatch($gameMatch);
    }
  }

  /**
   * Handle the GameMatch "deleted" event.
   */
  public function deleted(GameMatch $gameMatch): void
  {
    //
  }

  /**
   * Handle the GameMatch "restored" event.
   */
  public function restored(GameMatch $gameMatch): void
  {
    //
  }

  /**
   * Handle the GameMatch "force deleted" event.
   */
  public function forceDeleted(GameMatch $gameMatch): void
  {
    //
  }
}
