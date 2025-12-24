<?php

namespace App\Services;

use App\Models\BankAccount;
use Binkode\Paystack\Support\Recipient;
use Binkode\Paystack\Support\Transfer;
use Binkode\Paystack\Support\Miscellaneous;
use Binkode\Paystack\Support\Verification;
use Illuminate\Support\Facades\Log;
use Exception;

class PaystackTransferService
{
  /**
   * Create a transfer recipient in Paystack
   */
  public function createRecipient(BankAccount $bankAccount): array
  {
    try {
      $response = Recipient::create([
        'type' => 'nuban',
        'name' => $bankAccount->account_name,
        'account_number' => $bankAccount->account_number,
        'bank_code' => $bankAccount->bank_code,
        'description' => config('app.name') . ' withdrawal account for ' . $bankAccount->accountable_type . ' ID: ' . $bankAccount->accountable_id,
      ]);

      if ($response['status']) {
        // Update bank account with recipient code
        $bankAccount->update([
          'paystack_recipient_code' => $response['data']['recipient_code'],
          'is_verified' => true,
          'verified_at' => now(),
          'metadata' => array_merge($bankAccount->metadata ?? [], [
            'paystack_recipient_id' => $response['data']['id'],
            'paystack_data' => $response['data']
          ])
        ]);

        return [
          'success' => true,
          'data' => $response['data'],
          'message' => 'Transfer recipient created successfully'
        ];
      }

      return [
        'success' => false,
        'message' => $response['message'] ?? 'Failed to create transfer recipient'
      ];
    } catch (Exception $e) {
      Log::error('Failed to create Paystack transfer recipient', [
        'bank_account_id' => $bankAccount->id,
        'error' => $e->getMessage()
      ]);

      return [
        'success' => false,
        'message' => 'Failed to create transfer recipient: ' . $e->getMessage()
      ];
    }
  }

  /**
   * Initiate a transfer to a bank account
   */
  public function initiateTransfer(BankAccount $bankAccount, int $amount, string $reason = 'Wallet withdrawal'): array
  {
    try {
      // Ensure recipient exists
      if (!$bankAccount->paystack_recipient_code) {
        $recipientResult = $this->createRecipient($bankAccount);
        if (!$recipientResult['success']) {
          return $recipientResult;
        }
      }

      // Convert amount to kobo (multiply by 100)
      $amountInKobo = $amount * 100;

      $response = Transfer::initiate([
        'source' => 'balance',
        'amount' => $amountInKobo,
        'recipient' => $bankAccount->paystack_recipient_code,
        'reason' => $reason,
        'reference' => $this->generateTransferReference(),
      ]);

      if ($response['status']) {
        return [
          'success' => true,
          'data' => $response['data'],
          'message' => 'Transfer initiated successfully',
          'transfer_code' => $response['data']['transfer_code'],
          'reference' => $response['data']['reference']
        ];
      }

      return [
        'success' => false,
        'message' => $response['message'] ?? 'Failed to initiate transfer'
      ];
    } catch (Exception $e) {
      Log::error('Failed to initiate Paystack transfer', [
        'bank_account_id' => $bankAccount->id,
        'amount' => $amount,
        'error' => $e->getMessage()
      ]);

      return [
        'success' => false,
        'message' => 'Failed to initiate transfer: ' . $e->getMessage()
      ];
    }
  }

  /**
   * Verify a transfer status
   */
  public function verifyTransfer(string $reference): array
  {
    try {
      $response = Transfer::verify($reference);

      if ($response['status']) {
        return [
          'success' => true,
          'data' => $response['data'],
          'status' => $response['data']['status'],
          'message' => 'Transfer verification successful'
        ];
      }

      return [
        'success' => false,
        'message' => $response['message'] ?? 'Failed to verify transfer'
      ];
    } catch (Exception $e) {
      Log::error('Failed to verify Paystack transfer', [
        'reference' => $reference,
        'error' => $e->getMessage()
      ]);

      return [
        'success' => false,
        'message' => 'Failed to verify transfer: ' . $e->getMessage()
      ];
    }
  }

  /**
   * Get list of supported banks
   */
  public function getBanks(): array
  {
    try {
      $response = Miscellaneous::listBanks();

      if ($response['status']) {
        return [
          'success' => true,
          'data' => $response['data'],
          'message' => 'Banks retrieved successfully'
        ];
      }

      return [
        'success' => false,
        'message' => $response['message'] ?? 'Failed to retrieve banks'
      ];
    } catch (Exception $e) {
      Log::error('Failed to get banks from Paystack', [
        'error' => $e->getMessage()
      ]);

      return [
        'success' => false,
        'message' => 'Failed to retrieve banks: ' . $e->getMessage()
      ];
    }
  }

  /**
   * Verify bank account details
   */
  public function verifyAccountNumber(string $accountNumber, string $bankCode): array
  {
    try {
      $response = Verification::resolve([
        'account_number' => $accountNumber,
        'bank_code' => $bankCode
      ]);

      if ($response['status']) {
        return [
          'success' => true,
          'data' => $response['data'],
          'account_name' => $response['data']['account_name'],
          'account_number' => $response['data']['account_number'],
          'message' => 'Account verification successful'
        ];
      }

      return [
        'success' => false,
        'message' => $response['message'] ?? 'Failed to verify account'
      ];
    } catch (Exception $e) {
      Log::error('Failed to verify account number', [
        'account_number' => $accountNumber,
        'bank_code' => $bankCode,
        'error' => $e->getMessage()
      ]);

      return [
        'success' => false,
        'message' => 'Failed to verify account: ' . $e->getMessage()
      ];
    }
  }

  /**
   * Generate a unique transfer reference
   */
  private function generateTransferReference(): string
  {
    return 'TM_WD_' . time() . '_' . str_pad(mt_rand(0, 9999), 4, '0', STR_PAD_LEFT);
  }
}
