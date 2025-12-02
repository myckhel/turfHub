<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Tournament;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StageController extends Controller
{
  /**
   * Show the form for creating a new stage.
   */
  public function create(Tournament $tournament): Response
  {
    return Inertia::render('App/Turfs/Tournaments/Stages/Create', [
      'tournament' => $tournament,
    ]);
  }

  /**
   * Display the specified stage.
   */
  public function show(string $tournament, string $stage): Response
  {
    return Inertia::render('App/Turfs/Tournaments/Stages/Show', [
      'tournamentId' => (int) $tournament,
      'stageId' => (int) $stage,
    ]);
  }

  /**
   * Show the form for editing the specified stage.
   */
  public function edit(string $tournament, string $stage): Response
  {
    return Inertia::render('App/Turfs/Tournaments/Stages/Edit', [
      'tournamentId' => (int) $tournament,
      'stageId' => (int) $stage,
    ]);
  }
}
