import type { Bank, BankAccount, BankAccountCreateRequest, BankAccountVerificationRequest } from '@/types';
import api from './index';

export const bankAccountApi = {
  // Bank information
  getBanks: async (): Promise<Bank[]> => {
    return api.get(route('api.bank-accounts.banks'));
  },

  verifyAccount: async (data: BankAccountVerificationRequest): Promise<{ account_name: string; account_number: string }> => {
    return api.post(route('api.bank-accounts.verify-account'), data);
  },

  // User bank accounts
  getUserBankAccounts: async (): Promise<BankAccount[]> => {
    return api.get(route('api.bank-accounts.user.index'));
  },

  addUserBankAccount: async (data: BankAccountCreateRequest): Promise<BankAccount> => {
    return api.post(route('api.bank-accounts.user.store'), data);
  },

  removeUserBankAccount: async (bankAccountId: number): Promise<void> => {
    return api.delete(route('api.bank-accounts.user.destroy', { bankAccountId }));
  },

  // Turf bank accounts
  getTurfBankAccounts: async (turfId: number): Promise<BankAccount[]> => {
    return api.get(route('api.bank-accounts.turf.index', { turfId }));
  },

  addTurfBankAccount: async (
    turfId: number,
    data: BankAccountCreateRequest,
  ): Promise<{ turf_id: number; turf_name: string; bank_account: BankAccount }> => {
    return api.post(route('api.bank-accounts.turf.store', { turfId }), data);
  },
};
