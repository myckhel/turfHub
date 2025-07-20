<?php

namespace App\Services;

use App\Models\BankAccount;
use App\Models\User;
use App\Models\Turf;
use App\Models\Payment;
use App\Events\WalletBalanceUpdated;
use App\Events\TurfWalletBalanceUpdated;
use Bavix\Wallet\Interfaces\Wallet;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class WalletService
{
  protected PaystackTransferService $paystackTransferService;

  public function __construct(PaystackTransferService $paystackTransferService)
  {
    $this->paystackTransferService = $paystackTransferService;
  }

  /**
   * Deposit money into a wallet
   */
  public function deposit(Wallet $walletHolder, float $amount, array $metadata = []): array
  {
    try {
      DB::beginTransaction();

      // Get previous balance for event
      $previousBalance = $walletHolder->balanceFloat;

      // Create deposit transaction
      $transaction = $walletHolder->deposit($amount, $metadata);

      // Get new balance after transaction
      $wallet = $walletHolder->wallet;
      $newBalance = $wallet->balanceFloat;

      // Dispatch balance updated event
      $this->dispatchBalanceUpdatedEvent($walletHolder, $newBalance, $previousBalance, 'deposit', 'Wallet deposit');

      // Log the deposit
      Log::info('Wallet deposit successful', [
        'wallet_holder_type' => get_class($walletHolder),
        'wallet_holder_id' => $walletHolder->id,
        'amount' => $amount,
        'transaction_id' => $transaction->getKey(),
        'metadata' => $metadata
      ]);

      DB::commit();

      return [
        'success' => true,
        'transaction' => $transaction,
        'new_balance' => $newBalance,
        'message' => 'Deposit successful'
      ];
    } catch (Exception $e) {
      DB::rollBack();

      Log::error('Wallet deposit failed', [
        'wallet_holder_type' => get_class($walletHolder),
        'wallet_holder_id' => $walletHolder->id,
        'amount' => $amount,
        'error' => $e->getMessage()
      ]);

      return [
        'success' => false,
        'message' => 'Deposit failed: ' . $e->getMessage()
      ];
    }
  }

  /**
   * Withdraw money from a wallet to a bank account
   */
  public function withdraw(Wallet $walletHolder, float $amount, BankAccount $bankAccount, array $metadata = []): array
  {
    try {
      // Check if wallet has sufficient balance
      if ($walletHolder->balance < $amount) {
        return [
          'success' => false,
          'message' => 'Insufficient wallet balance'
        ];
      }

      // Verify bank account belongs to wallet holder
      if (
        $bankAccount->accountable_id !== $walletHolder->id ||
        $bankAccount->accountable_type !== get_class($walletHolder)
      ) {
        return [
          'success' => false,
          'message' => 'Bank account does not belong to this account'
        ];
      }

      // Check if bank account is active and verified
      if (!$bankAccount->is_active || !$bankAccount->is_verified) {
        return [
          'success' => false,
          'message' => 'Bank account is not active or verified'
        ];
      }

      DB::beginTransaction();

      // Get previous balance for event
      $previousBalance = $walletHolder->balanceFloat;

      // Initiate Paystack transfer
      $transferResult = $this->paystackTransferService->initiateTransfer(
        $bankAccount,
        $amount,
        'Wallet withdrawal'
      );

      if (!$transferResult['success']) {
        DB::rollBack();
        return $transferResult;
      }

      // Create withdrawal transaction (this will deduct from wallet)
      $withdrawalMetadata = array_merge($metadata, [
        'transfer_code' => $transferResult['transfer_code'],
        'transfer_reference' => $transferResult['reference'],
        'bank_account_id' => $bankAccount->id,
        'bank_account_number' => $bankAccount->account_number,
        'bank_name' => $bankAccount->bank_name
      ]);

      $transaction = $walletHolder->withdraw($amount, $withdrawalMetadata);

      // Get new balance after transaction
      $wallet = $walletHolder->wallet;
      $newBalance = $wallet->balanceFloat;

      // Dispatch balance updated event
      $this->dispatchBalanceUpdatedEvent($walletHolder, $newBalance, $previousBalance, 'withdrawal', 'Wallet withdrawal to bank account');

      // Log the withdrawal
      Log::info('Wallet withdrawal initiated', [
        'wallet_holder_type' => get_class($walletHolder),
        'wallet_holder_id' => $walletHolder->id,
        'amount' => $amount,
        'transaction_id' => $transaction->getKey(),
        'transfer_code' => $transferResult['transfer_code'],
        'bank_account_id' => $bankAccount->id
      ]);

      DB::commit();

      return [
        'success' => true,
        'transaction' => $transaction,
        'transfer_code' => $transferResult['transfer_code'],
        'transfer_reference' => $transferResult['reference'],
        'new_balance' => $newBalance,
        'message' => 'Withdrawal initiated successfully'
      ];
    } catch (Exception $e) {
      DB::rollBack();

      Log::error('Wallet withdrawal failed', [
        'wallet_holder_type' => get_class($walletHolder),
        'wallet_holder_id' => $walletHolder->id,
        'amount' => $amount,
        'bank_account_id' => $bankAccount->id,
        'error' => $e->getMessage()
      ]);

      return [
        'success' => false,
        'message' => 'Withdrawal failed: ' . $e->getMessage()
      ];
    }
  }

  /**
   * Transfer money between wallets
   */
  public function transfer(Wallet $from, Wallet $to, float $amount, array $metadata = []): array
  {
    try {
      // Check if sender has sufficient balance
      if ($from->balance < $amount) {
        return [
          'success' => false,
          'message' => 'Insufficient wallet balance'
        ];
      }

      DB::beginTransaction();

      // Get previous balances for events
      $fromPreviousBalance = $from->balanceFloat;
      $toPreviousBalance = $to->balanceFloat;

      // Perform the transfer
      $transfer = $from->transfer($to, $amount, $metadata);

      // Get new balances after transfer
      $fromWallet = $from->wallet;
      $toWallet = $to->wallet;
      $fromNewBalance = $fromWallet->balanceFloat;
      $toNewBalance = $toWallet->balanceFloat;

      // Dispatch balance updated events for both parties
      $this->dispatchBalanceUpdatedEvent($from, $fromNewBalance, $fromPreviousBalance, 'transfer_out', 'Transfer to another wallet');
      $this->dispatchBalanceUpdatedEvent($to, $toNewBalance, $toPreviousBalance, 'transfer_in', 'Transfer from another wallet');

      // Log the transfer
      Log::info('Wallet transfer successful', [
        'from_type' => get_class($from),
        'from_id' => $from->id,
        'to_type' => get_class($to),
        'to_id' => $to->id,
        'amount' => $amount,
        'transfer_id' => $transfer->getKey(),
        'metadata' => $metadata
      ]);

      DB::commit();

      return [
        'success' => true,
        'transfer' => $transfer,
        'from_balance' => $fromNewBalance,
        'to_balance' => $toNewBalance,
        'message' => 'Transfer successful'
      ];
    } catch (Exception $e) {
      DB::rollBack();

      Log::error('Wallet transfer failed', [
        'from_type' => get_class($from),
        'from_id' => $from->id,
        'to_type' => get_class($to),
        'to_id' => $to->id,
        'amount' => $amount,
        'error' => $e->getMessage()
      ]);

      return [
        'success' => false,
        'message' => 'Transfer failed: ' . $e->getMessage()
      ];
    }
  }

  /**
   * Process a payment using wallet balance
   */
  public function processWalletPayment(Wallet $payer, Wallet $payee, float $amount, string $description, array $metadata = []): array
  {
    try {
      // Check if payer has sufficient balance
      if ($payer->balance < $amount) {
        return [
          'success' => false,
          'message' => 'Insufficient wallet balance'
        ];
      }

      DB::beginTransaction();

      // Get previous balances for events
      $payerPreviousBalance = $payer->balanceFloat;
      $payeePreviousBalance = $payee->balanceFloat;

      // Create payment metadata
      $paymentMetadata = array_merge($metadata, [
        'payment_method' => 'wallet',
        'description' => $description,
        'payer_type' => get_class($payer),
        'payer_id' => $payer->id,
        'payee_type' => get_class($payee),
        'payee_id' => $payee->id
      ]);

      // Perform the transfer
      $transfer = $payer->transfer($payee, $amount, $paymentMetadata);

      // Get new balances after transfer
      $payerWallet = $payer->wallet;
      $payeeWallet = $payee->wallet;
      $payerNewBalance = $payerWallet->balanceFloat;
      $payeeNewBalance = $payeeWallet->balanceFloat;

      // Dispatch balance updated events for both parties
      $this->dispatchBalanceUpdatedEvent($payer, $payerNewBalance, $payerPreviousBalance, 'payment', $description);
      $this->dispatchBalanceUpdatedEvent($payee, $payeeNewBalance, $payeePreviousBalance, 'payment_received', 'Payment received: ' . $description);

      // Create Payment record for tracking
      $payment = Payment::create([
        'user_id' => $payer instanceof User ? $payer->id : null,
        'payable_type' => get_class($payee),
        'payable_id' => $payee->id,
        'reference' => 'TM_WALLET_' . time() . '_' . str_pad(mt_rand(0, 9999), 4, '0', STR_PAD_LEFT),
        'amount' => $amount,
        'currency' => 'NGN',
        'status' => Payment::STATUS_SUCCESS,
        'payment_method' => 'wallet',
        'description' => $description,
        'metadata' => $paymentMetadata,
        'paid_at' => now()
      ]);

      // Log the payment
      Log::info('Wallet payment processed successfully', [
        'payer_type' => get_class($payer),
        'payer_id' => $payer->id,
        'payee_type' => get_class($payee),
        'payee_id' => $payee->id,
        'amount' => $amount,
        'payment_id' => $payment->id,
        'transfer_id' => $transfer->getKey()
      ]);

      DB::commit();

      return [
        'success' => true,
        'payment' => $payment,
        'transfer' => $transfer,
        'payer_balance' => $payerNewBalance,
        'payee_balance' => $payeeNewBalance,
        'message' => 'Payment processed successfully'
      ];
    } catch (Exception $e) {
      DB::rollBack();

      Log::error('Wallet payment failed', [
        'payer_type' => get_class($payer),
        'payer_id' => $payer->id,
        'payee_type' => get_class($payee),
        'payee_id' => $payee->id,
        'amount' => $amount,
        'error' => $e->getMessage()
      ]);

      return [
        'success' => false,
        'message' => 'Payment failed: ' . $e->getMessage()
      ];
    }
  }

  /**
   * Get wallet balance
   */
  public function getBalance(Wallet $walletHolder): float
  {
    return $walletHolder->balance;
  }

  /**
   * Get wallet transactions
   */
  public function getTransactions(Wallet $walletHolder, int $limit = 50): array
  {
    $transactions = $walletHolder->transactions()
      ->orderBy('created_at', 'desc')
      ->limit($limit)
      ->get();

    return $transactions->map(function ($transaction) {
      return [
        'id' => $transaction->id,
        'uuid' => $transaction->uuid,
        'type' => $transaction->type,
        'amount' => $transaction->amount,
        'confirmed' => $transaction->confirmed,
        'meta' => $transaction->meta,
        'created_at' => $transaction->created_at,
        'updated_at' => $transaction->updated_at
      ];
    })->toArray();
  }

  /**
   * Verify transfer status and update wallet if needed
   */
  public function verifyTransfer(string $transferReference): array
  {
    try {
      $verificationResult = $this->paystackTransferService->verifyTransfer($transferReference);

      if ($verificationResult['success']) {
        $transferStatus = $verificationResult['data']['status'];

        Log::info('Transfer verification result', [
          'reference' => $transferReference,
          'status' => $transferStatus,
          'data' => $verificationResult['data']
        ]);

        // Update any related transactions or payments based on status
        // This could be expanded to handle failed transfers, refunds, etc.

        return [
          'success' => true,
          'status' => $transferStatus,
          'data' => $verificationResult['data'],
          'message' => 'Transfer verification completed'
        ];
      }

      return $verificationResult;
    } catch (Exception $e) {
      Log::error('Transfer verification failed', [
        'reference' => $transferReference,
        'error' => $e->getMessage()
      ]);

      return [
        'success' => false,
        'message' => 'Transfer verification failed: ' . $e->getMessage()
      ];
    }
  }

  /**
   * Dispatch balance updated event based on wallet holder type
   */
  protected function dispatchBalanceUpdatedEvent(
    Wallet $walletHolder,
    float $newBalance,
    ?float $previousBalance = 0.0,
    string $transactionType,
    ?string $description = null
  ): void {
    if ($walletHolder instanceof User) {
      WalletBalanceUpdated::dispatch($walletHolder, $newBalance, $previousBalance ?? 0, $transactionType, $description);
    } elseif ($walletHolder instanceof Turf) {
      TurfWalletBalanceUpdated::dispatch($walletHolder, $newBalance, $previousBalance ?? 0, $transactionType, $description);
    }
  }
}
