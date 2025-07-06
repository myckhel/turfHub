<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\MatchSession;
use App\Models\Team;
use App\Models\User;
use Bavix\Wallet\Models\Wallet;
use Binkode\Paystack\Support\Transaction;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentService
{
  /**
   * Initialize a payment for a payable model (MatchSession, Team, etc.).
   */
  public function initializePayment(
    User $user,
    $payable, // Can be MatchSession, Team, Turf, etc.
    float $amount,
    string $paymentType = Payment::TYPE_SESSION_FEE,
    ?string $description = null
  ): array {
    DB::beginTransaction();

    try {
      // Generate unique reference
      $reference = 'TURF_' . strtoupper(Str::random(10)) . '_' . time();

      // Create payment record with polymorphic relationship
      $payment = Payment::create([
        'user_id' => $user->id,
        'payable_type' => get_class($payable),
        'payable_id' => $payable->id,
        'reference' => $reference,
        'amount' => $amount,
        'currency' => 'NGN',
        'status' => Payment::STATUS_PENDING,
        'payment_type' => $paymentType,
        'description' => $description ?? $this->generatePaymentDescription($payable, $paymentType),
        'metadata' => $this->generatePaymentMetadata($payable, $paymentType),
      ]);

      // Initialize payment with Paystack
      $paystackResponse = Transaction::initialize([
        'amount' => $amount * 100, // Convert to kobo
        'email' => $user->email,
        'reference' => $reference,
        // 'callback_url' => route('payment.callback'),
        'channels' => ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
        'metadata' => [
          'payment_id' => $payment->id,
          'user_id' => $user->id,
          'payable_type' => get_class($payable),
          'payable_id' => $payable->id,
          'payment_type' => $paymentType,
        ],
      ]);

      if (!$paystackResponse['status']) {
        throw new \Exception('Failed to initialize payment: ' . $paystackResponse['message']);
      }

      // Update payment with Paystack reference
      $payment->update([
        'paystack_reference' => $paystackResponse['data']['reference'],
      ]);

      DB::commit();

      return [
        'status' => true,
        'data' => [
          'payment_id' => $payment->id,
          'reference' => $reference,
          'authorization_url' => $paystackResponse['data']['authorization_url'],
          'access_code' => $paystackResponse['data']['access_code'],
          'amount' => $amount,
          'currency' => 'NGN',
        ],
      ];
    } catch (\Exception $e) {
      DB::rollBack();
      Log::error('Payment initialization failed', [
        'user_id' => $user->id,
        'payable_type' => get_class($payable),
        'payable_id' => $payable->id,
        'error' => $e->getMessage(),
      ]);

      return [
        'status' => false,
        'message' => 'Payment initialization failed: ' . $e->getMessage(),
      ];
    }
  }

  /**
   * Initialize a payment for joining a match session.
   *
   * @deprecated Use initializePayment() instead
   */
  public function initializeSessionPayment(
    User $user,
    MatchSession $matchSession,
    float $amount,
    ?Team $team = null,
    string $paymentType = Payment::TYPE_SESSION_FEE
  ): array {
    // For backward compatibility, use the new polymorphic method
    $payable = $team ?? $matchSession;
    return $this->initializePayment($user, $payable, $amount, $paymentType);
  }

  /**
   * Verify payment with Paystack.
   */
  public function verifyPayment(string $reference): array
  {
    try {
      $payment = Payment::where('reference', $reference)->first();

      $paystackResponse = Transaction::verify($reference);

      if (!$paystackResponse['status']) {
        throw new \Exception('Payment verification failed: ' . $paystackResponse['message']);
      }

      $transactionData = $paystackResponse['data'];

      DB::beginTransaction();

      if (!$payment) {
        $payment = Payment::create([
          'reference' => $reference,
          'user_id' => Auth::user()->id,
          'payable_type' => Wallet::class,
          'payable_id' => Auth::user()->wallet()->firstOrCreate([], ['name' => 'default'])->id,
          'status' => $transactionData['status'] === 'success' ? Payment::STATUS_SUCCESS : Payment::STATUS_FAILED,
          'payment_method' => $transactionData['channel'] ?? null,
          'amount' => $transactionData['amount'] / 100, // Convert from kobo to naira
          'currency' => 'NGN',
          'gateway_response' => $transactionData['gateway_response'] ?? null,
          'paid_at' => $transactionData['status'] === 'success' ? now() : null,
          'metadata' => array_merge($payment->metadata ?? [], [
            'paystack_data' => $transactionData,
          ]),
        ]);
      }

      // Update payment status
      $payment->update([
        'status' => $transactionData['status'] === 'success' ? Payment::STATUS_SUCCESS : Payment::STATUS_FAILED,
        'payment_method' => $transactionData['channel'] ?? null,
        'gateway_response' => $transactionData['gateway_response'] ?? null,
        'paid_at' => $transactionData['status'] === 'success' ? now() : null,
        'metadata' => array_merge($payment->metadata ?? [], [
          'paystack_data' => $transactionData,
        ]),
      ]);

      DB::commit();

      return [
        'status' => true,
        'data' => [
          'payment' => $payment,
          'transaction_data' => $transactionData,
        ],
      ];
    } catch (\Exception $e) {
      DB::rollBack();
      Log::error('Payment verification failed', [
        'reference' => $reference,
        'error' => $e->getMessage(),
      ]);

      return [
        'status' => false,
        'message' => 'Payment verification failed: ' . $e->getMessage(),
      ];
    }
  }

  /**
   * Handle successful payment logic.
   */
  protected function handleSuccessfulPayment(Payment $payment): void
  {
    // Log successful payment
    Log::info('Payment successful', [
      'payment_id' => $payment->id,
      'user_id' => $payment->user_id,
      'amount' => $payment->amount,
      'payment_type' => $payment->payment_type,
    ]);

    // Handle team joining fee payments
    if ($payment->payment_type === Payment::TYPE_TEAM_JOINING_FEE && $payment->payable_type === Team::class) {
      // find the team player and update their status
      $payment->payable->teamPlayers()
        ->whereHas(
          'player',
          fn($query) =>
          $query->where('user_id', $payment->user_id)
        )
        ->update([
          'payment_status' => 'confirmed',
        ]);
    }

    // Handle match session fee payments
    if ($payment->payment_type === Payment::TYPE_SESSION_FEE && $payment->payable_type === MatchSession::class) {
      $playerService = app(PlayerService::class);
      $result = $playerService->handleSuccessfulMatchSessionPayment($payment->reference);

      if ($result['success']) {
        Log::info('Match session payment processed successfully', [
          'payment_id' => $payment->id,
          'match_session_id' => $result['match_session_id'],
          'team_id' => $result['team_id'],
          'player_id' => $result['player_id']
        ]);
      } else {
        Log::error('Failed to process match session payment', [
          'payment_id' => $payment->id,
          'error' => $result['message']
        ]);
      }
    }

    // Here you can add more logic for other payment types:
    // 1. Send confirmation email/notification
    // 2. Update user membership status
    // 3. Grant access to features
    // 4. Trigger other business logic based on payment type
  }

  /**
   * Generate payment description based on payable model and payment type.
   */
  protected function generatePaymentDescription(
    $payable,
    string $paymentType
  ): string {
    if ($payable instanceof MatchSession) {
      $baseDescription = "Payment for {$payable->name} on {$payable->session_date->format('M j, Y')}";

      return match ($paymentType) {
        Payment::TYPE_TEAM_JOINING_FEE => $baseDescription . " - Team joining fee",
        Payment::TYPE_SESSION_FEE => $baseDescription . " - Session participation fee",
        default => $baseDescription,
      };
    } elseif ($payable instanceof Team) {
      return "Payment for joining team: {$payable->name}";
    } elseif ($payable instanceof \App\Models\Turf) {
      return "Payment for turf booking: {$payable->name}";
    }

    return "Payment for " . class_basename($payable) . " (ID: {$payable->id})";
  }

  /**
   * Generate payment metadata based on payable model and payment type.
   */
  protected function generatePaymentMetadata($payable, string $paymentType): array
  {
    $metadata = [
      'payable_type' => get_class($payable),
      'payable_id' => $payable->id,
      'payment_type' => $paymentType,
    ];

    if ($payable instanceof MatchSession) {
      $metadata['match_session_name'] = $payable->name;
      $metadata['session_date'] = $payable->session_date->format('Y-m-d');
      $metadata['turf_name'] = $payable->turf->name ?? 'Unknown Turf';
    } elseif ($payable instanceof Team) {
      $metadata['team_name'] = $payable->name;
      if ($payable->matchSession) {
        $metadata['match_session_name'] = $payable->matchSession->name;
      }
    } elseif ($payable instanceof \App\Models\Turf) {
      $metadata['turf_name'] = $payable->name;
      $metadata['turf_location'] = $payable->location;
    }

    return $metadata;
  }

  /**
   * Get payment history for a user.
   */
  public function getUserPaymentHistory(User $user, int $limit = 10): array
  {
    $payments = $user->payments()
      ->with(['payable']) // Load polymorphic relationship
      ->orderBy('created_at', 'desc')
      ->limit($limit)
      ->get();

    return [
      'payments' => $payments,
      'total_amount' => $user->payments()
        ->where('status', Payment::STATUS_SUCCESS)
        ->sum('amount'),
      'successful_payments' => $user->payments()
        ->where('status', Payment::STATUS_SUCCESS)
        ->count(),
    ];
  }

  /**
   * Get payment statistics for a match session.
   */
  public function getMatchSessionPaymentStats(MatchSession $matchSession): array
  {
    return $matchSession->getPaymentStats();
  }

  /**
   * Cancel a pending payment.
   */
  public function cancelPayment(Payment $payment): bool
  {
    if (!$payment->isPending()) {
      return false;
    }

    return $payment->update(['status' => Payment::STATUS_CANCELLED]);
  }

  /**
   * Get suggested payment amount for a match session.
   * This can be customized based on business logic.
   */
  public function getSuggestedPaymentAmount(MatchSession $matchSession, string $paymentType): float
  {
    // This is a basic implementation - you can enhance this based on:
    // - Turf premium status
    // - Time of day
    // - Session demand
    // - User membership level
    return match ($paymentType) {
      Payment::TYPE_TEAM_JOINING_FEE => 500.00, // ₦500 for joining a team
      Payment::TYPE_SESSION_FEE => 1000.00, // ₦1000 for session participation
      default => 1000.00,
    };
  }
}
