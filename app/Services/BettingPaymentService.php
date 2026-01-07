<?php

namespace App\Services;

use App\Models\Bet;
use App\Models\BettingMarket;
use App\Models\MarketOption;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BettingPaymentService
{
  public function __construct(
    protected PaymentService $paymentService,
    protected WalletService $walletService
  ) {}

  /**
   * Process bet payment using the specified method.
   */
  public function processBetPayment(
    Bet $bet,
    string $paymentMethod = Bet::PAYMENT_ONLINE,
    ?string $paymentReference = null
  ): array {
    if ($bet->payment_status === Bet::PAYMENT_CONFIRMED) {
      return [
        'status' => false,
        'message' => 'Bet payment already confirmed.',
      ];
    }

    DB::beginTransaction();

    try {
      $result = match ($paymentMethod) {
        Bet::PAYMENT_WALLET => $this->processWalletPayment($bet),
        Bet::PAYMENT_OFFLINE => $this->processOfflinePayment($bet),
        Bet::PAYMENT_ONLINE => $this->processOnlinePayment($bet, $paymentReference),
        default => throw new \Exception("Invalid payment method: {$paymentMethod}")
      };

      // Commit the transaction only if the result indicates success
      if ($result['status']) {
        DB::commit();
      } else {
        DB::rollBack();
      }

      return $result;
    } catch (\Exception $e) {
      DB::rollBack();
      Log::error('Betting payment processing failed', [
        'bet_id' => $bet->id,
        'payment_method' => $paymentMethod,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
      ]);
      throw $e;
    }
  }

  /**
   * Process wallet payment for a bet.
   */
  protected function processWalletPayment(Bet $bet): array
  {
    $user = $bet->user;
    $amount = $bet->stake_amount;

    // Check wallet balance
    if ((float) $user->wallet->balance < $amount) {
      return [
        'status' => false,
        'message' => 'Insufficient wallet balance.',
        'data' => [
          'required_amount' => $amount,
          'current_balance' => $user->wallet->balance,
          'shortfall' => $amount - (float) $user->wallet->balance,
        ]
      ];
    }

    // Get the turf from the betting market's game match
    // Load necessary relationships
    $bet->load('marketOption.bettingMarket.gameMatch.matchSession.turf', 'marketOption.bettingMarket.gameMatch.turf');

    $bettingMarket = $bet->marketOption->bettingMarket;
    $gameMatch = $bettingMarket->gameMatch;
    $turf = $gameMatch->matchSession ? $gameMatch->matchSession->turf : $gameMatch->turf;

    if (!$turf) {
      return [
        'status' => false,
        'message' => 'Unable to determine turf for this bet.',
      ];
    }

    try {
      // Use WalletService to transfer funds from user to turf
      $description = "Bet payment: {$bet->marketOption->name}";
      $metadata = [
        'type' => 'bet_payment',
        'bet_id' => $bet->id,
        'market_type' => $bettingMarket->market_type,
        'game_match_id' => $gameMatch->id,
        'turf_id' => $turf->id,
        'description' => $description,
      ];

      $transferResult = $this->walletService->processWalletPayment(
        $user,
        $turf,
        $amount,
        $description,
        $metadata
      );

      if (!$transferResult['success']) {
        return [
          'status' => false,
          'message' => $transferResult['message'],
        ];
      }

      // Update bet payment status
      $bet->update([
        'payment_method' => Bet::PAYMENT_WALLET,
        'payment_status' => Bet::PAYMENT_CONFIRMED,
        'payment_confirmed_at' => now(),
        'status' => Bet::STATUS_ACTIVE,
        'payment_reference' => $transferResult['payment']->reference,
      ]);

      return [
        'status' => true,
        'message' => 'Bet payment confirmed successfully.',
        'data' => [
          'bet' => $bet->fresh(['marketOption.bettingMarket']),
          'new_wallet_balance' => $user->fresh()->balance,
          'turf_wallet_balance' => $turf->fresh()->balance,
          'transaction_id' => $transferResult['payment']->reference,
        ]
      ];
    } catch (\Exception $e) {
      throw new \Exception("Wallet payment processing failed: {$e->getMessage()}");
    }
  }

  /**
   * Process offline payment for a bet.
   */
  protected function processOfflinePayment(Bet $bet): array
  {
    // Mark bet as pending with offline payment method
    // Payment will be confirmed manually by admin/turf manager
    $bet->update([
      'payment_method' => Bet::PAYMENT_OFFLINE,
      'payment_status' => Bet::PAYMENT_PENDING,
      'status' => Bet::STATUS_PENDING,
    ]);

    return [
      'status' => true,
      'message' => 'Bet placed successfully. Awaiting offline payment confirmation.',
      'data' => [
        'bet' => $bet->fresh(['marketOption.bettingMarket']),
        'requires_manual_confirmation' => true,
        'payment_instructions' => 'Please make payment to the turf and provide your bet reference for confirmation.',
      ]
    ];
  }

  /**
   * Process online payment for a bet.
   */
  protected function processOnlinePayment(Bet $bet, ?string $paymentReference = null): array
  {
    if ($paymentReference) {
      // Verify existing payment
      return $this->verifyBetPayment($bet, $paymentReference);
    } else {
      // Initialize new payment
      return $this->initializeBetPayment($bet);
    }
  }

  /**
   * Initialize online payment for a bet.
   */
  protected function initializeBetPayment(Bet $bet): array
  {
    $paymentResult = $this->paymentService->initializePayment(
      user: $bet->user,
      payable: $bet->bettingMarket,
      amount: $bet->stake_amount,
      paymentType: Payment::TYPE_BET ?? 'bet',
      description: "Bet: {$bet->marketOption->name} - {$bet->bettingMarket->name}"
    );

    if (!$paymentResult['status']) {
      throw new \Exception("Payment initialization failed: {$paymentResult['message']}");
    }

    // Update bet with payment reference
    $bet->update([
      'payment_method' => Bet::PAYMENT_ONLINE,
      'payment_reference' => $paymentResult['data']['reference'],
      'payment_status' => Bet::PAYMENT_PENDING,
    ]);

    return [
      'status' => true,
      'message' => 'Payment initialized successfully.',
      'data' => [
        'bet' => $bet->fresh(['marketOption.bettingMarket']),
        'payment_url' => $paymentResult['data']['authorization_url'] ?? null,
        'payment_reference' => $paymentResult['data']['reference'],
        'requires_payment' => true,
      ]
    ];
  }

  /**
   * Verify and confirm bet payment.
   */
  public function verifyBetPayment(Bet $bet, string $paymentReference): array
  {
    // Verify payment with Paystack
    $verificationResult = $this->paymentService->verifyPayment($paymentReference);

    if (!$verificationResult['status']) {
      return [
        'status' => false,
        'message' => "Payment verification failed: {$verificationResult['message']}",
      ];
    }

    $paymentData = $verificationResult['data'];

    // Validate payment amount
    if ($paymentData['amount'] / 100 != $bet->stake_amount) {
      return [
        'status' => false,
        'message' => 'Payment amount mismatch.',
      ];
    }

    // Confirm the bet
    $bet->update([
      'payment_status' => Bet::PAYMENT_CONFIRMED,
      'payment_confirmed_at' => now(),
      'status' => Bet::STATUS_ACTIVE,
      'payment_metadata' => $paymentData,
    ]);

    return [
      'status' => true,
      'message' => 'Bet payment confirmed successfully.',
      'data' => [
        'bet' => $bet->fresh(['marketOption.bettingMarket']),
        'payment_data' => $paymentData,
      ]
    ];
  }

  /**
   * Process bet payout to user wallet.
   */
  public function processBetPayout(Bet $bet): array
  {
    if ($bet->status !== Bet::STATUS_WON) {
      return [
        'status' => false,
        'message' => 'Bet is not in won status.',
      ];
    }

    if ($bet->payout_status === Bet::PAYOUT_COMPLETED) {
      return [
        'status' => false,
        'message' => 'Payout already completed.',
      ];
    }

    DB::beginTransaction();

    try {
      // Calculate payout amount
      $payoutAmount = $bet->potential_payout;

      // Deposit winnings to user wallet
      $depositResult = $this->walletService->deposit(
        $bet->user,
        $payoutAmount,
        [
          'type' => 'bet_winnings',
          'bet_id' => $bet->id,
          'market_type' => $bet->bettingMarket->market_type,
          'description' => "Bet winnings: {$bet->marketOption->name}",
          'stake_amount' => $bet->stake_amount,
          'odds' => $bet->odds_at_placement,
        ]
      );

      if (!$depositResult['success']) {
        throw new \Exception("Payout processing failed: {$depositResult['message']}");
      }

      // Update bet payout status
      $bet->update([
        'payout_status' => Bet::PAYOUT_COMPLETED,
        'payout_amount' => $payoutAmount,
        'payout_processed_at' => now(),
        'payout_reference' => $depositResult['transaction_id'],
      ]);

      DB::commit();

      return [
        'status' => true,
        'message' => 'Bet payout processed successfully.',
        'data' => [
          'bet' => $bet->fresh(),
          'payout_amount' => $payoutAmount,
          'new_wallet_balance' => $depositResult['new_balance'],
          'transaction_id' => $depositResult['transaction_id'],
        ]
      ];
    } catch (\Exception $e) {
      DB::rollBack();
      Log::error('Bet payout processing failed', [
        'bet_id' => $bet->id,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
      ]);
      throw $e;
    }
  }

  /**
   * Cancel bet and refund payment.
   */
  public function cancelBetAndRefund(Bet $bet, string $reason = 'Bet cancelled'): array
  {
    if ($bet->status === Bet::STATUS_CANCELLED) {
      return [
        'status' => false,
        'message' => 'Bet is already cancelled.',
      ];
    }

    if ($bet->payment_status !== Bet::PAYMENT_CONFIRMED) {
      // Just cancel the bet if payment not confirmed
      $bet->update([
        'status' => Bet::STATUS_CANCELLED,
        'cancelled_at' => now(),
        'cancellation_reason' => $reason,
      ]);

      return [
        'status' => true,
        'message' => 'Bet cancelled successfully.',
        'data' => ['bet' => $bet->fresh()]
      ];
    }

    DB::beginTransaction();

    try {
      // Refund the stake amount to user wallet
      $refundResult = $this->walletService->deposit(
        $bet->user,
        $bet->stake_amount,
        [
          'type' => 'bet_refund',
          'bet_id' => $bet->id,
          'description' => "Bet refund: {$reason}",
          'original_stake' => $bet->stake_amount,
        ]
      );

      if (!$refundResult['success']) {
        throw new \Exception("Refund processing failed: {$refundResult['message']}");
      }

      // Update bet status
      $bet->update([
        'status' => Bet::STATUS_CANCELLED,
        'cancelled_at' => now(),
        'cancellation_reason' => $reason,
        'refund_amount' => $bet->stake_amount,
        'refund_processed_at' => now(),
        'refund_reference' => $refundResult['transaction_id'],
      ]);

      DB::commit();

      return [
        'status' => true,
        'message' => 'Bet cancelled and refunded successfully.',
        'data' => [
          'bet' => $bet->fresh(),
          'refund_amount' => $bet->stake_amount,
          'new_wallet_balance' => $refundResult['new_balance'],
          'transaction_id' => $refundResult['transaction_id'],
        ]
      ];
    } catch (\Exception $e) {
      DB::rollBack();
      Log::error('Bet cancellation and refund failed', [
        'bet_id' => $bet->id,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
      ]);
      throw $e;
    }
  }
}
