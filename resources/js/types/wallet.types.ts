// Wallet and Banking related types

export interface BankAccount {
  id: number;
  accountable_type: string;
  accountable_id: number;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  recipient_code?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Bank {
  name: string;
  code: string;
  longcode: string;
  gateway: string;
  pay_with_bank: boolean;
  active: boolean;
  country: string;
  currency: string;
  type: string;
  is_deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccountCreateRequest {
  bank_code: string;
  account_number: string;
  account_name?: string;
}

export interface BankAccountVerificationRequest {
  bank_code: string;
  account_number: string;
}

export interface WalletBalance {
  balance: number;
  formatted_balance: string;
}

export interface WalletTransaction {
  id: number;
  uuid: string;
  type: string;
  amount: number;
  formatted_amount: string;
  confirmed: boolean;
  meta?: Record<string, unknown>;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface DepositRequest {
  amount: number;
  payment_reference: string;
  metadata?: Record<string, unknown>;
}

export interface WithdrawRequest {
  amount: number;
  bank_account_id: number;
  metadata?: Record<string, unknown>;
}

export interface TransferVerificationRequest {
  transfer_reference: string;
}

export interface DepositResponse {
  new_balance: number;
  formatted_balance: string;
  transaction_id: number;
}

export interface WithdrawResponse {
  new_balance: number;
  formatted_balance: string;
  transaction_id: number;
  transfer_code: string;
  transfer_reference: string;
}
