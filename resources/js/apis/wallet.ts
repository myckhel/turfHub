import api, { type ApiResponse } from './index';

// Wallet-related types
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
  turf_id?: number;
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

export interface TransferVerificationResponse {
  transfer_status: string;
  transfer_data: Record<string, unknown>;
}

export const walletApi = {
  // User wallet operations
  getBalance: async (): Promise<ApiResponse<WalletBalance>> => {
    return api.get(route('api.wallet.balance'));
  },

  getTransactions: async (params?: {
    limit?: number;
    page?: number;
    type?: string;
    dateRange?: [string, string];
    status?: string;
    search?: string;
  }): Promise<ApiResponse<WalletTransaction[]>> => {
    return api.get(route('api.wallet.transactions'), { params });
  },

  deposit: async (data: DepositRequest): Promise<ApiResponse<DepositResponse>> => {
    return api.post(route('api.wallet.deposit'), data);
  },

  withdraw: async (data: WithdrawRequest): Promise<ApiResponse<WithdrawResponse>> => {
    return api.post(route('api.wallet.withdraw'), data);
  },

  verifyTransfer: async (data: TransferVerificationRequest): Promise<ApiResponse<TransferVerificationResponse>> => {
    return api.post(route('api.wallet.verify-transfer'), data);
  },

  // Turf wallet operations
  getTurfBalance: async (turfId: number): Promise<ApiResponse<WalletBalance & { turf_id: number; turf_name: string }>> => {
    return api.get(route('api.wallet.turf.balance', { turfId }));
  },

  getTurfTransactions: async (
    turfId: number,
    params?: {
      limit?: number;
      page?: number;
      type?: string;
      dateRange?: [string, string];
      status?: string;
      search?: string;
    },
  ): Promise<ApiResponse<{ turf_id: number; turf_name: string; transactions: WalletTransaction[] }>> => {
    return api.get(route('api.wallet.turf.transactions', { turfId }), { params });
  },
};
