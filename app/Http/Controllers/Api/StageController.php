<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tournament\AssignTeamsRequest;
use App\Http\Requests\Tournament\CreateStageRequest;
use App\Http\Requests\Tournament\GenerateFixturesRequest;
use App\Http\Requests\Tournament\UpdateStageRequest;
use App\Http\Resources\StageResource;
use App\Jobs\GenerateFixturesJob;
use App\Jobs\PromoteStageJob;
use App\Models\Stage;
use App\Models\Tournament;
use App\Services\FixtureGenerationService;
use App\Services\PromotionService;
use App\Services\StageService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class StageController extends Controller
{
  use AuthorizesRequests;

  public function __construct(
    private readonly StageService $stageService,
    private readonly FixtureGenerationService $fixtureService,
    private readonly PromotionService $promotionService
  ) {}

  public function index(Tournament $tournament): AnonymousResourceCollection
  {
    $stages = $tournament->stages()
      ->with(['groups', 'promotion', 'promotion.nextStage'])
      ->orderBy('order')
      ->paginate(15);

    return StageResource::collection($stages);
  }

  /**
   * Store a newly created stage.
   */
  public function store(CreateStageRequest $request, Tournament $tournament): JsonResponse
  {
    $this->authorize('update', $tournament);

    $stage = $this->stageService->createStage($tournament, $request->validated());

    return response()->json(new StageResource($stage), Response::HTTP_CREATED);
  }

  /**
   * Display the specified stage.
   */
  public function show(Stage $stage): StageResource
  {
    $stage->load([
      'tournament',
      'groups.rankings',
      'groups.stageTeams',
      'stageTeams.team',
      'fixtures',
      'promotion.nextStage',
      'nextStage',
    ]);

    return new StageResource($stage);
  }

  /**
   * Update the specified stage.
   */
  public function update(UpdateStageRequest $request, Stage $stage): StageResource
  {
    $this->authorize('update', $stage->tournament);

    $stage = $this->stageService->updateStage($stage, $request->validated());

    return new StageResource($stage);
  }

  /**
   * Delete the specified stage.
   */
  public function destroy(Stage $stage): Response
  {
    $this->authorize('delete', $stage->tournament);

    $this->stageService->deleteStage($stage);

    return response()->noContent();
  }

  /**
   * Assign teams to a stage.
   */
  public function assignTeams(AssignTeamsRequest $request, Stage $stage): JsonResponse
  {
    $this->authorize('update', $stage->tournament);

    $validated = $request->validated();
    $this->stageService->assignTeamsToStage($stage, $validated['team_ids'], $validated);

    return response()->json(['message' => 'Teams assigned successfully']);
  }

  /**
   * Simulate fixture generation (preview).
   */
  public function simulateFixtures(Stage $stage): JsonResponse
  {
    $this->authorize('view', $stage->tournament);

    $fixtures = $this->fixtureService->simulateFixtures($stage);

    return response()->json([
      'fixtures' => $fixtures,
      'count' => count($fixtures),
    ]);
  }

  /**
   * Generate fixtures for a stage.
   */
  public function generateFixtures(GenerateFixturesRequest $request, Stage $stage): JsonResponse
  {
    $this->authorize('update', $stage->tournament);

    $validated = $request->validated();

    if ($validated['mode'] === 'auto') {
      GenerateFixturesJob::dispatch(
        $stage->id,
        $validated['auto_schedule'] ?? true
      );

      return response()->json(['message' => 'Fixture generation queued']);
    }

    // Manual mode would require additional fixture data
    return response()->json(['message' => 'Manual fixture creation not yet implemented']);
  }

  /**
   * Simulate promotion (preview).
   */
  public function simulatePromotion(Stage $stage): JsonResponse
  {
    $this->authorize('view', $stage->tournament);

    $result = $this->promotionService->simulatePromotion($stage);

    return response()->json($result);
  }

  /**
   * Execute promotion to next stage.
   */
  public function executePromotion(Request $request, Stage $stage): JsonResponse
  {
    $this->authorize('update', $stage->tournament);

    $validated = $request->validate([
      'manual_override' => 'nullable|array',
      'manual_override.team_ids' => 'sometimes|array',
      'manual_override.seeds' => 'sometimes|array',
    ]);

    PromoteStageJob::dispatch(
      $stage->id,
      $validated['manual_override'] ?? null
    );

    return response()->json(['message' => 'Promotion queued']);
  }

  /**
   * Activate the specified stage.
   */
  public function activate(Stage $stage): StageResource
  {
    $this->authorize('update', $stage->tournament);

    $updated = $this->stageService->activateStage($stage);

    return new StageResource($updated);
  }

  /**
   * Complete the specified stage.
   */
  public function complete(Stage $stage): StageResource|JsonResponse
  {
    $this->authorize('update', $stage->tournament);

    $updated = $this->stageService->completeStage($stage);

    return new StageResource($updated);
  }
}
