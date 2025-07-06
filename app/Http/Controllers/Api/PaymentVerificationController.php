<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Team;
use App\Models\TeamPlayer;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PaymentVerificationController extends Controller
{
  public function __construct(
    protected PaymentService $paymentService
  ) {}

  /**
   * Verify payment and confirm team slot with race condition protection.
   */
  public function verifyTeamSlotPayment(Request $request): JsonResponse
  {
    $request->validate([
      'payment_reference' => 'required|string',
    ]);

    $paymentReference = $request->payment_reference;

    try {
      // Verify the payment with Paystack first
      $verificationResult = $this->paymentService->verifyPayment($paymentReference);

      if (!$verificationResult['status']) {
        return response()->json([
          'success' => false,
          'message' => 'Payment verification failed: ' . $verificationResult['message']
        ], 400);
      }

      $payment = $verificationResult['data']['payment'];

      // Check if payment belongs to current user
      if ($payment->user_id !== Auth::id()) {
        return response()->json([
          'success' => false,
          'message' => 'Payment does not belong to current user'
        ], 403);
      }

      // Use database transaction with locking for race condition protection
      return DB::transaction(function () use ($payment, $paymentReference) {
        // Find the pending team player record with the payment reference
        $teamPlayer = TeamPlayer::where('payment_reference', $paymentReference)
          ->where('payment_status', 'pending')
          ->lockForUpdate() // Lock this row to prevent race conditions
          ->first();

        if (!$teamPlayer) {
          return response()->json([
            'success' => false,
            'message' => 'Team slot reservation not found or already processed'
          ], 404);
        }

        // Check if reservation has expired
        if ($teamPlayer->isExpired()) {
          $teamPlayer->markAsExpired();
          return response()->json([
            'success' => false,
            'message' => 'Team slot reservation has expired'
          ], 410);
        }

        // Get the team with lock to check current capacity
        $team = Team::lockForUpdate()->findOrFail($teamPlayer->team_id);

        // Count only confirmed players
        $confirmedPlayersCount = $team->teamPlayers()->confirmed()->count();

        // Check if team is now full (excluding pending players)
        if ($confirmedPlayersCount >= $team->matchSession->max_players_per_team) {
          $teamPlayer->markAsFailed();

          Log::warning('Team slot payment verification failed - team full', [
            'team_id' => $team->id,
            'payment_reference' => $paymentReference,
            'confirmed_players' => $confirmedPlayersCount,
            'max_players' => $team->matchSession->max_players_per_team
          ]);

          return response()->json([
            'success' => false,
            'message' => 'Team is now full. Refund will be processed automatically.',
            'refund_required' => true
          ], 409);
        }

        // Confirm the team player slot
        $teamPlayer->markAsConfirmed();

        // Set as captain if team doesn't have one
        if (!$team->captain_id) {
          $team->update(['captain_id' => $teamPlayer->player->user_id]);
        }

        Log::info('Team slot payment verified successfully', [
          'team_id' => $team->id,
          'player_id' => $teamPlayer->player_id,
          'payment_reference' => $paymentReference,
          'payment_id' => $payment->id
        ]);

        return response()->json([
          'success' => true,
          'message' => 'Payment verified and team slot confirmed',
          'data' => [
            'team_id' => $team->id,
            'player_id' => $teamPlayer->player_id,
            'is_captain' => $team->captain_id === $teamPlayer->player->user_id,
            'confirmed_at' => $teamPlayer->join_time
          ]
        ]);
      });
    } catch (ValidationException $e) {
      return response()->json([
        'success' => false,
        'message' => 'Validation failed',
        'errors' => $e->errors()
      ], 422);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Payment verification failed: ' . $e->getMessage()
      ], 500);
    }
  }

  /**
   * Remove player from team (cleanup on payment failure).
   */
  public function removePlayerFromTeam(Request $request): JsonResponse
  {
    $request->validate([
      'payment_reference' => 'nullable|string',
      'team_id' => 'required|exists:teams,id',
    ]);

    try {
      return DB::transaction(function () use ($request) {
        $userId = Auth::id();
        $teamId = $request->team_id;
        $paymentReference = $request->payment_reference;

        // Find the team player record
        $teamPlayerQuery = TeamPlayer::whereHas('team', function ($query) use ($teamId) {
          $query->where('id', $teamId);
        })->whereHas('player', function ($query) use ($userId) {
          $query->where('user_id', $userId);
        });

        // If payment reference provided, filter by it
        if ($paymentReference) {
          $teamPlayerQuery->where('payment_reference', $paymentReference);
        }

        $teamPlayer = $teamPlayerQuery->lockForUpdate()->first();

        if (!$teamPlayer) {
          return response()->json([
            'success' => false,
            'message' => 'Player not found in team'
          ], 404);
        }

        $team = Team::lockForUpdate()->findOrFail($teamId);

        // Only allow removal if pending or failed, not confirmed
        if ($teamPlayer->isConfirmed() && $team->matchSession->status !== 'scheduled') {
          return response()->json([
            'success' => false,
            'message' => 'Cannot remove confirmed player after match has started'
          ], 400);
        }

        $wasCapain = $team->captain_id === $teamPlayer->player->user_id;

        // Remove the player
        $teamPlayer->delete();

        // If the removed player was captain, assign new captain
        if ($wasCapain) {
          $newCaptain = $team->teamPlayers()->confirmed()->with('player.user')->first();
          $team->update([
            'captain_id' => $newCaptain ? $newCaptain->player->user_id : null
          ]);
        }

        return response()->json([
          'success' => true,
          'message' => 'Player removed from team successfully'
        ]);
      });
    } catch (ValidationException $e) {
      return response()->json([
        'success' => false,
        'message' => 'Validation failed',
        'errors' => $e->errors()
      ], 422);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Failed to remove player from team: ' . $e->getMessage()
      ], 500);
    }
  }
}
