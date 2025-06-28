<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\GameMatch;
use App\Models\MatchSession;
use App\Models\Turf;
use Inertia\Inertia;
use Inertia\Response;

class GameMatchController extends Controller
{
  /**
   * Display the specified game match details.
   */
  public function show(Turf $turf, MatchSession $matchSession, GameMatch $gameMatch): Response
  {
    // Load necessary relationships
    $gameMatch->load([
      'firstTeam.teamPlayers.player.user',
      'secondTeam.teamPlayers.player.user',
      'winningTeam',
      'matchEvents.player.user',
      'matchEvents.team',
      'matchSession'
    ]);

    return Inertia::render('App/GameMatches/Show', [
      'turf' => $turf,
      'matchSession' => $matchSession,
      'gameMatch' => $gameMatch,
    ]);
  }
}
