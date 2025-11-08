<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Turf;
use App\Services\TurfService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TurfController extends Controller
{
  use AuthorizesRequests;

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
   * Show the form for creating a new turf.
   */
  public function create(): Response
  {
    return Inertia::render('App/Turfs/Create');
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

  /**
   * Show the form for editing the specified turf.
   */
  public function edit(Turf $turf): Response
  {
    // Check authorization - only owner or users with can_manage_turf permission
    $this->authorize('update', $turf);

    // Load relationships if needed
    $includes = ['owner'];
    $turfWithRelations = $this->turfService->getTurfWithRelations($turf, $includes);

    return Inertia::render('App/Turfs/Edit', [
      'turf' => $turfWithRelations
    ]);
  }

  /**
   * Show the settings page for the specified turf.
   */
  public function settings(Turf $turf): Response
  {
    // Check authorization - only owner or users with can_manage_turf permission
    $this->authorize('update', $turf);

    // Load relationships if needed
    $includes = ['owner'];
    $turfWithRelations = $this->turfService->getTurfWithRelations($turf, $includes);

    return Inertia::render('App/Turfs/Settings', [
      'turf' => $turfWithRelations
    ]);
  }
}
