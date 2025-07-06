// Paystack InlineJS types based on official documentation
export interface PaystackTransactionOptions extends Record<string, unknown> {
  key: string;
  email: string;
  amount: number;
  currency?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  customerCode?: string;
  channels?: Array<'card' | 'bank' | 'ussd' | 'qr' | 'eft' | 'mobile_money' | 'bank_transfer' | 'apple_pay'>;
  metadata?: Record<string, unknown>;
  reference?: string;
  // Split payments
  subaccountCode?: string;
  bearer?: 'account' | 'subaccount';
  transactionCharge?: number;
  split_code?: string;
  split?: {
    type: 'percentage' | 'flat';
    bearer_type: 'all' | 'all-proportional' | 'account' | 'subaccount';
    subaccounts: Array<{
      subaccount: string;
      share: number;
    }>;
    bearer_subaccount?: string;
    reference?: string;
  };
  // Subscriptions
  planCode?: string;
  planInterval?: 'daily' | 'weekly' | 'monthly' | 'annually';
  subscriptionCount?: number;
  subscriptionLimit?: number;
  subscriptionStartDate?: string;
}

export interface PaystackCallbacks extends Record<string, unknown> {
  onSuccess?: (transaction: PaystackTransactionResponse) => void;
  onLoad?: (response: PaystackLoadResponse) => void;
  onCancel?: () => void;
  onError?: (error: PaystackError) => void;
}

export interface PaystackTransactionResponse {
  reference: string;
  trans: string;
  status: string;
  message: string;
  transaction: string;
  trxref: string;
}

export interface PaystackLoadResponse {
  id: string;
  accessCode: string;
  customer: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
}

export interface PaystackError {
  message: string;
  code?: string;
  type?: string;
  details?: string;
}

export interface PaystackPaymentRequest extends PaystackTransactionOptions, PaystackCallbacks {
  container: string;
  loadPaystackCheckoutButton?: string;
  styles?: {
    theme?: 'dark' | 'light';
    applePay?: {
      width?: string;
      height?: string;
      borderRadius?: string;
      type?: 'plain' | 'buy' | 'setup' | 'donate' | 'check-out' | 'book' | 'subscribe';
      locale?: string;
    };
  };
  onElementsMount?: (elements: { applePay: boolean } | null) => void;
}

export interface PaystackInstance {
  newTransaction: (options: Record<string, unknown>) => { id: string };
  checkout: (options: Record<string, unknown>) => Promise<void>;
  resumeTransaction: (accessCode: string, callbacks?: PaystackCallbacks) => void;
  cancelTransaction: (id: string) => void;
  preloadTransaction: (options: Record<string, unknown>) => () => void;
  paymentRequest: (options: Record<string, unknown>) => Promise<void>;
}

export type PaystackTransactionType = 'one-time' | 'subscription' | 'split' | 'multi-split';

export interface PaystackConfig {
  publicKey: string;
  currency: string;
  channels: Array<'card' | 'bank' | 'ussd' | 'qr' | 'eft' | 'mobile_money' | 'bank_transfer' | 'apple_pay'>;
}
