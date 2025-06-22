<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Turf;
use App\Services\TurfService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TurfController extends Controller
{
  protected TurfService $turfService;

  public function __construct(TurfService $turfService)
  {
    $this->turfService = $turfService;
  }

  /**
   * Display a listing of turfs.
   */
  public function index(Request $request): Response
  {

    return Inertia::render('App/Turfs/Index');
  }

  /**
   * Display the specified turf.
   */
  public function show(Request $request, Turf $turf): Response
  {
    // Load relationships for detailed view
    $includes = ['owner', 'players.user', 'activeMatchSessions'];
    $turfWithRelations = $this->turfService->getTurfWithRelations($turf, $includes);

    return Inertia::render('App/Turfs/Show', [
      'turf' => $turfWithRelations
    ]);
  }
}
