<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Turf;
use App\Models\BankAccount;
use App\Services\PaymentService;
use App\Services\WalletService;
use App\Services\PaystackTransferService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class WalletController extends Controller
{
  protected WalletService $walletService;
  protected PaystackTransferService $paystackTransferService;

  public function __construct(WalletService $walletService, PaystackTransferService $paystackTransferService)
  {
    $this->walletService = $walletService;
    $this->paystackTransferService = $paystackTransferService;
  }

  /**
   * Get wallet balance for authenticated user
   */
  public function getBalance(Request $request): JsonResponse
  {
    try {
      $user = Auth::user();
      $balance = $this->walletService->getBalance($user);

      return response()->json([
        'balance' => $balance,
        'formatted_balance' => '₦' . number_format($balance, 2)
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'error' => 'Failed to retrieve wallet balance: ' . $e->getMessage()
      ], 500);
    }
  }

  /**
   * Get wallet transactions for authenticated user
   */
  public function getTransactions(Request $request): JsonResponse
  {
    try {
      $user = Auth::user();
      $limit = $request->get('limit', 50);
      $transactions = $this->walletService->getTransactions($user, $limit);

      return response()->json($transactions);
    } catch (\Exception $e) {
      return response()->json([
        'error' => 'Failed to retrieve wallet transactions: ' . $e->getMessage()
      ], 500);
    }
  }

  /**
   * Deposit money into wallet after Paystack payment verification
   */
  public function deposit(Request $request): JsonResponse
  {
    try {
      $request->validate([
        'amount' => 'required|numeric|min:100', // Minimum ₦100
        'payment_reference' => 'required|string', // Paystack payment reference
        'metadata' => 'sometimes|array'
      ]);

      $user = Auth::user();
      $amount = $request->amount;
      $paymentReference = $request->payment_reference;

      // Verify payment with Paystack before depositing
      $paymentService = app(PaymentService::class);
      $verificationResult = $paymentService->verifyPayment($paymentReference);

      if (!$verificationResult['status']) {
        return response()->json([
          'error' => 'Payment verification failed: ' . $verificationResult['message']
        ], 400);
      }

      $payment = $verificationResult['data']['payment'];

      // Check if payment is successful and belongs to the current user
      if (!$payment->isSuccessful()) {
        return response()->json([
          'error' => 'Payment was not successful'
        ], 400);
      }

      if ($payment->user_id !== $user->id) {
        return response()->json([
          'error' => 'Payment does not belong to the current user'
        ], 403);
      }

      // Check if payment amount matches requested amount
      if (abs($payment->amount - $amount) > 0.01) {
        return response()->json([
          'error' => 'Payment amount does not match the requested amount'
        ], 400);
      }

      // Check if payment has already been processed for deposit
      if (isset($payment->metadata['wallet_deposit_processed'])) {
        return response()->json([
          'error' => 'Payment has already been processed for wallet deposit'
        ], 400);
      }

      $metadata = array_merge($request->metadata ?? [], [
        'payment_reference' => $paymentReference,
        'payment_id' => $payment->id,
        'deposit_type' => 'paystack_payment',
        'verified_at' => now()->toISOString()
      ]);

      $result = $this->walletService->deposit($user, $amount, $metadata);

      if ($result['success']) {
        // Mark payment as processed for wallet deposit
        $payment->update([
          'metadata' => array_merge($payment->metadata ?? [], [
            'wallet_deposit_processed' => true,
            'wallet_deposit_processed_at' => now()->toISOString()
          ])
        ]);
      }

      if ($result['success']) {
        return response()->json([
          'new_balance' => $result['new_balance'],
          'formatted_balance' => '₦' . number_format($result['new_balance'], 2),
          'transaction_id' => $result['transaction']->id
        ]);
      }

      return response()->json([
        'error' => $result['message']
      ], 400);
    } catch (ValidationException $e) {
      return response()->json([
        'error' => 'Validation failed',
        'errors' => $e->errors()
      ], 422);
    } catch (\Exception $e) {
      return response()->json([
        'error' => 'Deposit failed: ' . $e->getMessage()
      ], 500);
    }
  }

  /**
   * Withdraw money from wallet to bank account
   */
  public function withdraw(Request $request): JsonResponse
  {
    try {
      $request->validate([
        'amount' => 'required|numeric|min:100|max:500000', // Min ₦100, Max ₦500,000
        'bank_account_id' => 'required|exists:bank_accounts,id',
        'turf_id' => 'sometimes|exists:turfs,id',
        'metadata' => 'sometimes|array'
      ]);

      $user = Auth::user();
      $walletHolder = $user; // Default to user wallet
      $accountableType = User::class;
      $accountableId = $user->id;

      // If turf_id is specified, use turf wallet instead
      if ($request->has('turf_id')) {
        $turf = Turf::findOrFail($request->turf_id);

        // Check if user has permission to withdraw from turf wallet
        if (
          !$user->hasRoleOnTurf(User::TURF_ROLE_ADMIN, $turf->id) &&
          !$user->hasRoleOnTurf(User::TURF_ROLE_MANAGER, $turf->id)
        ) {
          return response()->json([
            'error' => 'You do not have permission to withdraw from this turf\'s wallet'
          ], 403);
        }

        $walletHolder = $turf;
        $accountableType = Turf::class;
        $accountableId = $turf->id;
      }

      $bankAccount = BankAccount::where('id', $request->bank_account_id)
        ->where('accountable_type', $accountableType)
        ->where('accountable_id', $accountableId)
        ->first();

      if (!$bankAccount) {
        $entityType = $request->has('turf_id') ? 'turf' : 'user';
        return response()->json([
          'message' => "Bank account not found or does not belong to this {$entityType}"
        ], 404);
      }

      $metadata = array_merge($request->metadata ?? [], [
        'withdrawal_type' => $request->has('turf_id') ? 'turf_withdrawal' : 'user_withdrawal',
        'initiated_by_user_id' => $user->id
      ]);

      if ($request->has('turf_id')) {
        $metadata['turf_id'] = $request->turf_id;
      }

      $result = $this->walletService->withdraw(
        $walletHolder,
        $request->amount,
        $bankAccount,
        $metadata
      );

      if ($result['success']) {
        $responseData = [
          'new_balance' => $result['new_balance'],
          'formatted_balance' => '₦' . number_format($result['new_balance'], 2),
          'transaction_id' => $result['transaction']->id,
          'transfer_code' => $result['transfer_code'],
          'transfer_reference' => $result['transfer_reference']
        ];

        if ($request->has('turf_id')) {
          $responseData['turf_id'] = $request->turf_id;
          $responseData['turf_name'] = $walletHolder->name;
        }

        return response()->json($responseData);
      }

      return response()->json([
        'error' => $result['message']
      ], 400);
    } catch (ValidationException $e) {
      return response()->json([
        'error' => 'Validation failed',
        'errors' => $e->errors()
      ], 422);
    } catch (\Exception $e) {
      return response()->json([
        'error' => 'Withdrawal failed: ' . $e->getMessage()
      ], 500);
    }
  }

  /**
   * Verify transfer status
   */
  public function verifyTransfer(Request $request): JsonResponse
  {
    try {
      $request->validate([
        'transfer_reference' => 'required|string'
      ]);

      $result = $this->walletService->verifyTransfer($request->transfer_reference);

      if ($result['success']) {
        return response()->json([
          'transfer_status' => $result['status'],
          'transfer_data' => $result['data']
        ]);
      }

      return response()->json([
        'error' => $result['message']
      ], 400);
    } catch (ValidationException $e) {
      return response()->json([
        'error' => 'Validation failed',
        'errors' => $e->errors()
      ], 422);
    } catch (\Exception $e) {
      return response()->json([
        'error' => 'Transfer verification failed: ' . $e->getMessage()
      ], 500);
    }
  }

  /**
   * Get wallet balance for a turf (only for turf owners/managers)
   */
  public function getTurfBalance(Request $request, int $turfId): JsonResponse
  {
    try {
      $user = Auth::user();
      $turf = Turf::findOrFail($turfId);

      // Check if user has permission to view turf wallet
      if (
        !$user->hasRoleOnTurf(User::TURF_ROLE_ADMIN, $turfId) &&
        !$user->hasRoleOnTurf(User::TURF_ROLE_MANAGER, $turfId)
      ) {
        return response()->json([
          'error' => 'You do not have permission to view this turf\'s wallet'
        ], 403);
      }

      $balance = $this->walletService->getBalance($turf);

      return response()->json([
        'turf_id' => $turf->id,
        'turf_name' => $turf->name,
        'balance' => $balance,
        'formatted_balance' => '₦' . number_format($balance, 2)
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'error' => 'Failed to retrieve turf wallet balance: ' . $e->getMessage()
      ], 500);
    }
  }

  /**
   * Get wallet transactions for a turf (only for turf owners/managers)
   */
  public function getTurfTransactions(Request $request, int $turfId): JsonResponse
  {
    try {
      $user = Auth::user();
      $turf = Turf::findOrFail($turfId);

      // Check if user has permission to view turf wallet transactions
      if (
        !$user->hasRoleOnTurf(User::TURF_ROLE_ADMIN, $turfId) &&
        !$user->hasRoleOnTurf(User::TURF_ROLE_MANAGER, $turfId)
      ) {
        return response()->json([
          'error' => 'You do not have permission to view this turf\'s wallet transactions'
        ], 403);
      }

      $limit = $request->get('limit', 50);
      $transactions = $this->walletService->getTransactions($turf, $limit);

      return response()->json([
        'turf_id' => $turf->id,
        'turf_name' => $turf->name,
        'transactions' => $transactions
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'error' => 'Failed to retrieve turf wallet transactions: ' . $e->getMessage()
      ], 500);
    }
  }
}
