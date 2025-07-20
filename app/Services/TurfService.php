<?php

namespace App\Services;

use App\Models\Turf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TurfService
{
  /**
   * Get filtered and paginated turfs.
   */
  public function getTurfs(Request $request): LengthAwarePaginator
  {
    $query = $this->buildTurfQuery($request);

    return $query->paginate($request->get('per_page', 15));
  }

  /**
   * Get a single turf with optional relationships.
   */
  public function getTurfWithRelations(Turf $turf, array $includes = []): Turf
  {
    if (!empty($includes)) {
      $turf->load($includes);
    }

    return $turf;
  }

  /**
   * Create a new turf.
   */
  public function createTurf(array $data): Turf
  {
    if (!isset($data['owner_id'])) {
      $data['owner_id'] = Auth::id(); // Default to authenticated user if no owner specified
    }
    return Turf::create($data);
  }

  /**
   * Update an existing turf.
   */
  public function updateTurf(Turf $turf, array $data): Turf
  {
    $turf->update($data);

    return $turf;
  }

  /**
   * Delete a turf.
   */
  public function deleteTurf(Turf $turf): bool
  {
    return $turf->delete();
  }

  /**
   * Build query for filtering turfs.
   */
  private function buildTurfQuery(Request $request): Builder
  {
    $query = Turf::query();

    // Filter by owner
    if ($request->filled('owner_id')) {
      $query->where('owner_id', $request->owner_id);
    }

    // Filter by active status
    if ($request->filled('is_active')) {
      $query->where('is_active', $request->boolean('is_active'));
    }

    // Filter by membership requirement
    if ($request->filled('requires_membership')) {
      $query->where('requires_membership', $request->boolean('requires_membership'));
    }

    // Filter by team slot fee requirement
    if ($request->filled('has_team_slot_fee')) {
      if ($request->boolean('has_team_slot_fee')) {
        $query->whereNotNull('team_slot_fee')->where('team_slot_fee', '>', 0);
      } else {
        $query->where(function ($q) {
          $q->whereNull('team_slot_fee')->orWhere('team_slot_fee', '<=', 0);
        });
      }
    }

    // Filter by maximum team slot fee
    if ($request->filled('max_team_slot_fee')) {
      $query->where(function ($q) use ($request) {
        $q->whereNull('team_slot_fee')
          ->orWhere('team_slot_fee', '<=', $request->max_team_slot_fee);
      });
    }

    // Search by name or location
    if ($request->filled('search')) {
      $search = $request->search;
      $query->where(function ($q) use ($search) {
        $q->where('name', 'LIKE', "%{$search}%")
          ->orWhere('location', 'LIKE', "%{$search}%");
      });
    }

    // Load relationships if requested
    if ($request->filled('include')) {
      $includes = explode(',', $request->include);

      if (!empty($includes)) {
        $query->with($includes);
      }
    }

    return $query;
  }

  /**
   * Join a turf as a player.
   */
  public function joinTurf(\App\Models\User $user, Turf $turf, array $data = []): \App\Models\Player
  {
    // Check if user is already a player in this turf
    $existingPlayer = \App\Models\Player::where('user_id', $user->id)
      ->where('turf_id', $turf->id)
      ->first();

    if ($existingPlayer) {
      // If player exists but is inactive, reactivate them
      if ($existingPlayer->status !== 'active') {
        $existingPlayer->update(['status' => 'active']);
      }
      return $existingPlayer;
    }

    // Check if payment is required and process if needed
    $costBreakdown = $this->getJoinCostBreakdown($turf, $user);
    if ($costBreakdown['requires_payment']) {
      // If payment processing is enabled, process payments here
      // For now, we'll assume payment has been handled separately
      // or will be handled by the calling code
    }

    // Create new player record with optional membership status
    $turfPermissionService = app(\App\Services\TurfPermissionService::class);

    // Prepare player data
    $playerData = [
      'is_member' => $data['is_member'] ?? false,
      'status' => 'active'
    ];

    // If membership fee was required and is being paid, mark as member
    if ($turf->requires_membership && isset($data['pay_membership']) && $data['pay_membership']) {
      $playerData['is_member'] = true;
    }

    // Use TurfPermissionService to create player with proper role assignment
    $player = \App\Models\Player::create([
      'user_id' => $user->id,
      'turf_id' => $turf->id,
      'is_member' => $playerData['is_member'],
      'status' => $playerData['status'],
    ]);

    // Assign player role to user in turf context
    $turfPermissionService->assignRoleToUserInTurf($user, \App\Models\User::TURF_ROLE_PLAYER, $turf->id);

    return $player;
  }

  /**
   * Leave a turf (remove player record).
   */
  public function leaveTurf(\App\Models\User $user, Turf $turf): void
  {
    $turfPermissionService = app(\App\Services\TurfPermissionService::class);
    $turfPermissionService->removePlayerFromTurf($user, $turf);
  }

  /**
   * Calculate the total cost for joining a team in this turf.
   */
  public function calculateTeamJoinCost(Turf $turf, bool $isMember = false): float
  {
    $totalCost = 0;

    // Add membership fee if required and user is not already a member
    if ($turf->requires_membership && !$isMember && $turf->membership_fee) {
      $totalCost += $turf->membership_fee;
    }

    // Add team slot fee if required
    if ($turf->requiresTeamSlotFee()) {
      $totalCost += $turf->getTeamSlotFee();
    }

    return $totalCost;
  }

  /**
   * Get team slot fee information for a turf.
   */
  public function getTeamSlotFeeInfo(Turf $turf): array
  {
    return [
      'has_team_slot_fee' => $turf->requiresTeamSlotFee(),
      'team_slot_fee' => $turf->getTeamSlotFee(),
      'formatted_fee' => $turf->requiresTeamSlotFee() ?
        number_format($turf->getTeamSlotFee(), 2) : null,
    ];
  }

  /**
   * Process team slot fee payment when joining a team.
   */
  public function processTeamSlotPayment(\App\Models\User $user, Turf $turf, string $paymentMethod = 'paystack'): array
  {
    if (!$turf->requiresTeamSlotFee()) {
      return [
        'success' => true,
        'message' => 'No payment required for this turf.',
        'amount_charged' => 0
      ];
    }

    $amount = $turf->getTeamSlotFee();

    try {
      if ($paymentMethod === 'wallet') {
        // Process wallet payment
        $walletService = app(\App\Services\WalletService::class);
        $result = $walletService->processWalletPayment(
          $user,
          $turf,
          $amount,
          "Team slot fee for {$turf->name}",
          [
            'turf_id' => $turf->id,
            'payment_type' => \App\Models\Payment::TYPE_TEAM_JOINING_FEE
          ]
        );

        if ($result['success']) {
          return [
            'success' => true,
            'message' => 'Team slot fee payment successful via wallet.',
            'amount_charged' => $amount,
            'payment_method' => 'wallet',
            'payment_id' => $result['payment']->id,
            'new_wallet_balance' => $result['payer_balance']
          ];
        } else {
          return [
            'success' => false,
            'message' => 'Wallet payment failed: ' . $result['message'],
            'amount_charged' => 0
          ];
        }
      } else {
        // Process Paystack payment
        $paymentService = app(\App\Services\PaymentService::class);
        $paymentResult = $paymentService->initializePayment(
          $user,
          $turf,
          $amount,
          \App\Models\Payment::TYPE_TEAM_JOINING_FEE,
          "Team slot fee for {$turf->name}"
        );

        if ($paymentResult['status']) {
          return [
            'success' => true,
            'message' => 'Paystack payment initialized successfully.',
            'amount_charged' => $amount,
            'payment_method' => 'paystack',
            'payment_id' => $paymentResult['data']['payment_id'],
            'payment_url' => $paymentResult['data']['authorization_url'],
            'reference' => $paymentResult['data']['reference']
          ];
        } else {
          return [
            'success' => false,
            'message' => 'Payment initialization failed: ' . $paymentResult['message'],
            'amount_charged' => 0
          ];
        }
      }
    } catch (\Exception $e) {
      return [
        'success' => false,
        'message' => 'Payment processing error: ' . $e->getMessage(),
        'amount_charged' => 0
      ];
    }
  }

  /**
   * Get cost breakdown for joining a team in this turf.
   */
  public function getJoinCostBreakdown(Turf $turf, \App\Models\User $user): array
  {
    $breakdown = [
      'membership_fee' => 0,
      'team_slot_fee' => 0,
      'total' => 0,
      'requires_payment' => false,
      'breakdown_details' => []
    ];

    // Check if user is already a member
    $existingPlayer = \App\Models\Player::where('user_id', $user->id)
      ->where('turf_id', $turf->id)
      ->first();

    $isMember = $existingPlayer && $existingPlayer->is_member;

    // Add membership fee if required and user is not a member
    if ($turf->requires_membership && !$isMember && $turf->membership_fee) {
      $breakdown['membership_fee'] = $turf->membership_fee;
      $breakdown['breakdown_details'][] = [
        'type' => 'membership_fee',
        'description' => 'Turf membership fee',
        'amount' => $turf->membership_fee
      ];
    }

    // Add team slot fee if required
    if ($turf->requiresTeamSlotFee()) {
      $breakdown['team_slot_fee'] = $turf->getTeamSlotFee();
      $breakdown['breakdown_details'][] = [
        'type' => 'team_slot_fee',
        'description' => 'Team slot fee',
        'amount' => $turf->getTeamSlotFee()
      ];
    }

    $breakdown['total'] = $breakdown['membership_fee'] + $breakdown['team_slot_fee'];
    $breakdown['requires_payment'] = $breakdown['total'] > 0;

    return $breakdown;
  }
}
