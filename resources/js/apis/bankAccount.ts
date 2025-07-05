import type { ApiResponse, Bank, BankAccount, BankAccountCreateRequest, BankAccountVerificationRequest } from '@/types';
import api from './index';

export const bankAccountApi = {
  // Bank information
  getBanks: async (): Promise<ApiResponse<Bank[]>> => {
    return api.get(route('api.bank-accounts.banks'));
  },

  verifyAccount: async (data: BankAccountVerificationRequest): Promise<ApiResponse<{ account_name: string; account_number: string }>> => {
    return api.post(route('api.bank-accounts.verify-account'), data);
  },

  // User bank accounts
  getUserBankAccounts: async (): Promise<ApiResponse<BankAccount[]>> => {
    return api.get(route('api.bank-accounts.user.index'));
  },

  addUserBankAccount: async (data: BankAccountCreateRequest): Promise<ApiResponse<BankAccount>> => {
    return api.post(route('api.bank-accounts.user.store'), data);
  },

  removeUserBankAccount: async (bankAccountId: number): Promise<ApiResponse<void>> => {
    return api.delete(route('api.bank-accounts.user.destroy', { bankAccountId }));
  },

  // Turf bank accounts
  getTurfBankAccounts: async (turfId: number): Promise<ApiResponse<{ turf_id: number; turf_name: string; bank_accounts: BankAccount[] }>> => {
    return api.get(route('api.bank-accounts.turf.index', { turfId }));
  },

  addTurfBankAccount: async (
    turfId: number,
    data: BankAccountCreateRequest,
  ): Promise<ApiResponse<{ turf_id: number; turf_name: string; bank_account: BankAccount }>> => {
    return api.post(route('api.bank-accounts.turf.store', { turfId }), data);
  },
};
