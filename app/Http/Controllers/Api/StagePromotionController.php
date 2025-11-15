<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tournament\CreateStagePromotionRequest;
use App\Http\Requests\Tournament\UpdateStagePromotionRequest;
use App\Http\Resources\StagePromotionResource;
use App\Models\Stage;
use App\Models\StagePromotion;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class StagePromotionController extends Controller
{
  /**
   * Display a list of all stage promotions for a tournament.
   */
  public function index(): JsonResponse
  {
    $promotions = StagePromotion::with(['stage', 'nextStage'])
      ->get();

    return response()->json([
      'data' => StagePromotionResource::collection($promotions),
    ]);
  }

  /**
   * Display the promotion rule for a stage.
   */
  public function show(Stage $stage): StagePromotionResource|JsonResponse
  {
    $promotion = $stage->promotion;

    if (!$promotion) {
      return response()->json([
        'message' => 'No promotion rule configured for this stage',
      ], 404);
    }

    $promotion->load('nextStage');

    return new StagePromotionResource($promotion);
  }

  /**
   * Create a promotion rule for a stage.
   */
  public function store(CreateStagePromotionRequest $request, Stage $stage): StagePromotionResource|JsonResponse
  {
    Gate::authorize('update', $stage->tournament);

    // Check if promotion already exists
    if ($stage->promotion) {
      return response()->json([
        'message' => 'Promotion rule already exists. Use update endpoint to modify it.',
      ], 409);
    }

    $validated = $request->validated();

    $promotion = StagePromotion::create([
      'stage_id' => $stage->id,
      'next_stage_id' => $validated['next_stage_id'],
      'rule_type' => $validated['rule_type'],
      'rule_config' => $validated['rule_config'],
    ]);

    $promotion->load('nextStage');

    return new StagePromotionResource($promotion);
  }

  /**
   * Update the promotion rule for a stage.
   */
  public function update(UpdateStagePromotionRequest $request, Stage $stage): StagePromotionResource|JsonResponse
  {
    Gate::authorize('update', $stage->tournament);

    $promotion = $stage->promotion;

    if (!$promotion) {
      return response()->json([
        'message' => 'No promotion rule found. Use create endpoint first.',
      ], 404);
    }

    $validated = $request->validated();

    $promotion->update([
      'next_stage_id' => $validated['next_stage_id'] ?? $promotion->next_stage_id,
      'rule_type' => $validated['rule_type'] ?? $promotion->rule_type,
      'rule_config' => $validated['rule_config'] ?? $promotion->rule_config,
    ]);

    $promotion->load('nextStage');

    return new StagePromotionResource($promotion->fresh());
  }

  /**
   * Delete the promotion rule for a stage.
   */
  public function destroy(Stage $stage): JsonResponse
  {
    Gate::authorize('update', $stage->tournament);

    $promotion = $stage->promotion;

    if (!$promotion) {
      return response()->json([
        'message' => 'No promotion rule found',
      ], 404);
    }

    $promotion->delete();

    return response()->json([
      'message' => 'Promotion rule deleted successfully',
    ]);
  }
}
