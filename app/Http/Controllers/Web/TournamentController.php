<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Turf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TournamentController extends Controller
{
  /**
   * Display a listing of tournaments.
   */
  public function index(Request $request, ?string $turf = null): Response
  {
    // If turf is provided, load turf-specific tournaments
    if ($turf) {
      $turfModel = Turf::findOrFail($turf);
      return Inertia::render('App/Turfs/Tournaments/Index', [
        'turf' => $turfModel,
      ]);
    }

    // Otherwise, show all tournaments
    return Inertia::render('App/Tournaments/Index');
  }

  /**
   * Show the form for creating a new tournament.
   */
  public function create(string $turf): Response
  {
    $turfModel = Turf::findOrFail($turf);

    return Inertia::render('App/Turfs/Tournaments/Create', [
      'turf' => $turfModel,
    ]);
  }

  /**
   * Display the specified tournament.
   */
  public function show(?string $turf, string $tournament): Response
  {
    // If turf is provided, validate it exists
    if ($turf) {
      $turfModel = Turf::findOrFail($turf);
      return Inertia::render('App/Turfs/Tournaments/Show', [
        'turf' => $turfModel,
        'tournamentId' => (int) $tournament,
      ]);
    }

    // Standalone tournament view
    return Inertia::render('App/Tournaments/Show', [
      'tournamentId' => (int) $tournament,
    ]);
  }

  /**
   * Show the form for editing the specified tournament.
   */
  public function edit(?string $turf, string $tournament): Response
  {
    // If turf is provided, validate it exists
    if ($turf) {
      $turfModel = Turf::findOrFail($turf);
      return Inertia::render('App/Turfs/Tournaments/Edit', [
        'turf' => $turfModel,
        'tournamentId' => (int) $tournament,
      ]);
    }

    // Standalone tournament edit
    return Inertia::render('App/Tournaments/Edit', [
      'tournamentId' => (int) $tournament,
    ]);
  }
}
