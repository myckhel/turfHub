<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Turf;
use App\Models\BankAccount;
use App\Services\PaystackTransferService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class BankAccountController extends Controller
{
  protected PaystackTransferService $paystackTransferService;

  public function __construct(PaystackTransferService $paystackTransferService)
  {
    $this->paystackTransferService = $paystackTransferService;
  }

  /**
   * Get list of banks supported by Paystack
   */
  public function getBanks(): JsonResponse
  {
    try {
      $result = $this->paystackTransferService->getBanks();

      return response()->json([
        'status' => $result['success'],
        'message' => $result['message'],
        'data' => $result['success'] ? $result['data'] : null
      ], $result['success'] ? 200 : 500);
    } catch (\Exception $e) {
      return response()->json([
        'status' => false,
        'message' => 'Failed to retrieve banks',
        'error' => $e->getMessage()
      ], 500);
    }
  }

  /**
   * Verify bank account details
   */
  public function verifyAccount(Request $request): JsonResponse
  {
    try {
      $request->validate([
        'account_number' => 'required|string|size:10',
        'bank_code' => 'required|string'
      ]);

      $result = $this->paystackTransferService->verifyAccountNumber(
        $request->account_number,
        $request->bank_code
      );

      return response()->json([
        'status' => $result['success'],
        'message' => $result['message'],
        'data' => $result['success'] ? [
          'account_name' => $result['account_name'],
          'account_number' => $result['account_number']
        ] : null
      ], $result['success'] ? 200 : 400);
    } catch (ValidationException $e) {
      return response()->json([
        'status' => false,
        'message' => 'Validation failed',
        'errors' => $e->errors()
      ], 422);
    } catch (\Exception $e) {
      return response()->json([
        'status' => false,
        'message' => 'Account verification failed',
        'error' => $e->getMessage()
      ], 500);
    }
  }

  /**
   * Get user's bank accounts
   */
  public function getUserBankAccounts()
  {
    $user = Auth::user();
    $bankAccounts = $user->bankAccounts()->active()->get();

    return $bankAccounts;
  }

  /**
   * Add a new bank account for user
   */
  public function addUserBankAccount(Request $request): JsonResponse
  {
    try {
      $request->validate([
        'bank_name' => 'required|string|max:255',
        'bank_code' => 'required|string',
        'account_number' => 'required|string|size:10',
        'account_name' => 'required|string|max:255'
      ]);

      $user = Auth::user();

      // Check if account already exists
      $existingAccount = BankAccount::where('account_number', $request->account_number)
        ->where('bank_code', $request->bank_code)
        ->where('accountable_type', User::class)
        ->where('accountable_id', $user->id)
        ->first();

      if ($existingAccount) {
        return response()->json([
          'status' => false,
          'message' => 'This bank account is already added to your account'
        ], 409);
      }

      // Verify account details with Paystack
      $verificationResult = $this->paystackTransferService->verifyAccountNumber(
        $request->account_number,
        $request->bank_code
      );

      if (!$verificationResult['success']) {
        return response()->json([
          'status' => false,
          'message' => 'Failed to verify bank account details',
          'error' => $verificationResult['message']
        ], 400);
      }

      // Create bank account
      $bankAccount = BankAccount::create([
        'accountable_type' => User::class,
        'accountable_id' => $user->id,
        'bank_name' => $request->bank_name,
        'bank_code' => $request->bank_code,
        'account_number' => $request->account_number,
        'account_name' => $verificationResult['account_name'], // Use verified account name
        'is_active' => true,
        'is_verified' => false, // Will be verified when creating Paystack recipient
        'metadata' => [
          'verification_data' => $verificationResult['data']
        ]
      ]);

      // Create Paystack transfer recipient
      $recipientResult = $this->paystackTransferService->createRecipient($bankAccount);

      if (!$recipientResult['success']) {
        // Delete the bank account if recipient creation fails
        $bankAccount->delete();

        return response()->json([
          'status' => false,
          'message' => 'Failed to create transfer recipient',
          'error' => $recipientResult['message']
        ], 500);
      }

      return response()->json([
        'status' => true,
        'message' => 'Bank account added successfully',
        'data' => [
          'id' => $bankAccount->id,
          'bank_name' => $bankAccount->bank_name,
          'account_number' => $bankAccount->account_number,
          'account_name' => $bankAccount->account_name,
          'is_verified' => $bankAccount->is_verified,
          'verified_at' => $bankAccount->verified_at
        ]
      ], 201);
    } catch (ValidationException $e) {
      return response()->json([
        'status' => false,
        'message' => 'Validation failed',
        'errors' => $e->errors()
      ], 422);
    } catch (\Exception $e) {
      return response()->json([
        'status' => false,
        'message' => 'Failed to add bank account',
        'error' => $e->getMessage()
      ], 500);
    }
  }

  /**
   * Remove a user's bank account
   */
  public function removeUserBankAccount(Request $request, int $bankAccountId): JsonResponse
  {
    try {
      $user = Auth::user();
      $bankAccount = BankAccount::where('id', $bankAccountId)
        ->where('accountable_type', User::class)
        ->where('accountable_id', $user->id)
        ->first();

      if (!$bankAccount) {
        return response()->json([
          'status' => false,
          'message' => 'Bank account not found or does not belong to you'
        ], 404);
      }

      $bankAccount->update(['is_active' => false]);

      return response()->json([
        'status' => true,
        'message' => 'Bank account removed successfully'
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'status' => false,
        'message' => 'Failed to remove bank account',
        'error' => $e->getMessage()
      ], 500);
    }
  }

  /**
   * Get turf's bank accounts (only for turf owners/managers)
   */
  public function getTurfBankAccounts(int $turfId)
  {
    $user = Auth::user();
    $turf = Turf::findOrFail($turfId);

    // Check if user has permission to view turf bank accounts
    if (
      !$user->hasRoleOnTurf(User::TURF_ROLE_ADMIN, $turfId) &&
      !$user->hasRoleOnTurf(User::TURF_ROLE_MANAGER, $turfId)
    ) {
      return response()->json([
        'status' => false,
        'message' => 'You do not have permission to view this turf\'s bank accounts'
      ], 403);
    }

    $bankAccounts = $turf->bankAccounts()->active()->get();

    return [
      'turf_id' => $turf->id,
      'turf_name' => $turf->name,
      'bank_accounts' => $bankAccounts
    ];
  }

  /**
   * Add a new bank account for turf (only for turf owners/managers)
   */
  public function addTurfBankAccount(Request $request, int $turfId): JsonResponse
  {
    try {
      $user = Auth::user();
      $turf = Turf::findOrFail($turfId);

      // Check if user has permission to manage turf bank accounts
      if (
        !$user->hasRoleOnTurf(User::TURF_ROLE_ADMIN, $turfId) &&
        !$user->hasRoleOnTurf(User::TURF_ROLE_MANAGER, $turfId)
      ) {
        return response()->json([
          'status' => false,
          'message' => 'You do not have permission to manage this turf\'s bank accounts'
        ], 403);
      }

      $request->validate([
        'bank_name' => 'required|string|max:255',
        'bank_code' => 'required|string',
        'account_number' => 'required|string|size:10',
        'account_name' => 'required|string|max:255'
      ]);

      // Check if account already exists for this turf
      $existingAccount = BankAccount::where('account_number', $request->account_number)
        ->where('bank_code', $request->bank_code)
        ->where('accountable_type', Turf::class)
        ->where('accountable_id', $turf->id)
        ->first();

      if ($existingAccount) {
        return response()->json([
          'status' => false,
          'message' => 'This bank account is already added to this turf'
        ], 409);
      }

      // Verify account details with Paystack
      $verificationResult = $this->paystackTransferService->verifyAccountNumber(
        $request->account_number,
        $request->bank_code
      );

      if (!$verificationResult['success']) {
        return response()->json([
          'status' => false,
          'message' => 'Failed to verify bank account details',
          'error' => $verificationResult['message']
        ], 400);
      }

      // Create bank account
      $bankAccount = BankAccount::create([
        'accountable_type' => Turf::class,
        'accountable_id' => $turf->id,
        'bank_name' => $request->bank_name,
        'bank_code' => $request->bank_code,
        'account_number' => $request->account_number,
        'account_name' => $verificationResult['account_name'], // Use verified account name
        'is_active' => true,
        'is_verified' => false, // Will be verified when creating Paystack recipient
        'metadata' => [
          'verification_data' => $verificationResult['data'],
          'added_by_user_id' => $user->id
        ]
      ]);

      // Create Paystack transfer recipient
      $recipientResult = $this->paystackTransferService->createRecipient($bankAccount);

      if (!$recipientResult['success']) {
        // Delete the bank account if recipient creation fails
        $bankAccount->delete();

        return response()->json([
          'status' => false,
          'message' => 'Failed to create transfer recipient',
          'error' => $recipientResult['message']
        ], 500);
      }

      return response()->json([
        'status' => true,
        'message' => 'Turf bank account added successfully',
        'data' => [
          'turf_id' => $turf->id,
          'turf_name' => $turf->name,
          'bank_account' => [
            'id' => $bankAccount->id,
            'bank_name' => $bankAccount->bank_name,
            'account_number' => $bankAccount->account_number,
            'account_name' => $bankAccount->account_name,
            'is_verified' => $bankAccount->is_verified,
            'verified_at' => $bankAccount->verified_at
          ]
        ]
      ], 201);
    } catch (ValidationException $e) {
      return response()->json([
        'status' => false,
        'message' => 'Validation failed',
        'errors' => $e->errors()
      ], 422);
    } catch (\Exception $e) {
      return response()->json([
        'status' => false,
        'message' => 'Failed to add turf bank account',
        'error' => $e->getMessage()
      ], 500);
    }
  }
}
