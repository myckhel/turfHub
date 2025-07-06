import type { User } from '@/types/global.types';
import type {
  PaystackCallbacks,
  PaystackError,
  PaystackTransactionOptions,
  PaystackTransactionResponse,
  PaystackTransactionType,
} from '@/types/paystack';
import PaystackService from '@/utils/paystack';
import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface UsePaystackOptions {
  onSuccess?: (transaction: PaystackTransactionResponse) => void;
  onError?: (error: PaystackError) => void;
  onCancel?: () => void;
  onLoad?: (response: { id: string; accessCode: string; customer: unknown }) => void;
  autoInitialize?: boolean;
}

interface UsePaystackReturn {
  initiatePayment: (options: Partial<PaystackTransactionOptions>) => void;
  initiateAsyncPayment: (options: Partial<PaystackTransactionOptions>) => Promise<void>;
  createTransaction: (type: PaystackTransactionType, options: Partial<PaystackTransactionOptions>) => void;
  resumeTransaction: (accessCode: string) => void;
  cancelTransaction: (id: string) => void;
  generateReference: (prefix?: string) => string;
  convertToKobo: (amount: number) => number;
  convertFromKobo: (amount: number) => number;
  loading: boolean;
  error: string | null;
  transactionId: string | null;
}

/**
 * Custom hook for Paystack payment integration
 */
export const usePaystack = (options: UsePaystackOptions = {}): UsePaystackReturn => {
  const { auth } = usePage<{ auth?: { user: User | null } }>().props;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const { onSuccess, onError, onCancel, onLoad, autoInitialize = true } = options;

  // Clear error when a new payment is initiated
  const clearError = useCallback(() => setError(null), []);

  // Get user email from auth context
  const getUserEmail = useCallback(() => {
    return auth?.user?.email || '';
  }, [auth?.user?.email]);

  // Enhanced success callback
  const handleSuccess = useCallback(
    (transaction: PaystackTransactionResponse) => {
      setLoading(false);
      setTransactionId(transaction.reference);
      clearError();
      onSuccess?.(transaction);
    },
    [onSuccess, clearError],
  );

  // Enhanced error callback
  const handleError = useCallback(
    (error: PaystackError) => {
      setLoading(false);
      setError(error.message || 'Payment failed');
      onError?.(error);
    },
    [onError],
  );

  // Enhanced cancel callback
  const handleCancel = useCallback(() => {
    setLoading(false);
    setError(null);
    onCancel?.();
  }, [onCancel]);

  // Enhanced load callback
  const handleLoad = useCallback(
    (response: { id: string; accessCode: string; customer: unknown }) => {
      setLoading(true);
      setTransactionId(response.id);
      clearError();
      onLoad?.(response);
    },
    [onLoad, clearError],
  );

  const paystackService = useMemo(
    () => new PaystackService({ onSuccess: handleSuccess, onCancel: handleCancel, onLoad: handleLoad, onError: handleError }),
    [],
  );

  // Prepare transaction options with user data and callbacks
  const prepareOptions = useCallback(
    (options: Partial<PaystackTransactionOptions>): PaystackTransactionOptions & PaystackCallbacks => {
      return {
        key: '', // Will be set by paystack service
        email: options.email || getUserEmail(),
        amount: options.amount || 0,
        ...options,
      } as PaystackTransactionOptions & PaystackCallbacks;
    },
    [getUserEmail],
  );

  // Initiate payment (synchronous)
  const initiatePayment = useCallback(
    (options: Partial<PaystackTransactionOptions>) => {
      if (!getUserEmail()) {
        setError('User email is required for payment');
        return;
      }

      if (!options.amount) {
        setError('Payment amount is required');
        return;
      }

      clearError();
      const preparedOptions = prepareOptions(options);
      const result = paystackService.newTransaction(preparedOptions);
      setTransactionId(result.id);
    },
    [getUserEmail, clearError, prepareOptions, paystackService],
  );

  // Initiate payment (asynchronous)
  const initiateAsyncPayment = useCallback(
    async (options: Partial<PaystackTransactionOptions>) => {
      if (!getUserEmail()) {
        setError('User email is required for payment');
        return;
      }

      if (!options.amount) {
        setError('Payment amount is required');
        return;
      }

      clearError();
      const preparedOptions = prepareOptions(options);
      await paystackService.checkout(preparedOptions);
    },
    [getUserEmail, clearError, prepareOptions, paystackService],
  );

  // Create transaction based on type
  const createTransaction = useCallback(
    (type: PaystackTransactionType, options: Partial<PaystackTransactionOptions>) => {
      if (!getUserEmail()) {
        setError('User email is required for payment');
        return;
      }

      if (!options.amount) {
        setError('Payment amount is required');
        return;
      }

      clearError();
      const preparedOptions = prepareOptions(options);
      paystackService.createTransaction(type, preparedOptions, false);
    },
    [getUserEmail, clearError, prepareOptions, paystackService],
  );

  // Resume transaction
  const resumeTransaction = useCallback(
    (accessCode: string) => {
      clearError();
      paystackService.resumeTransaction(accessCode);
    },
    [clearError, paystackService],
  );

  // Cancel transaction
  const cancelTransaction = useCallback(
    (id: string) => {
      paystackService.cancelTransaction(id);
      setLoading(false);
      setError(null);
    },
    [paystackService],
  );

  // Utility functions
  const generateReference = useCallback(
    (prefix?: string) => {
      return paystackService.generateReference(prefix);
    },
    [paystackService],
  );

  const convertToKobo = useCallback(
    (amount: number) => {
      return paystackService.convertToKobo(amount);
    },
    [paystackService],
  );

  const convertFromKobo = useCallback(
    (amount: number) => {
      return paystackService.convertFromKobo(amount);
    },
    [paystackService],
  );

  // Warn if user is not authenticated
  useEffect(() => {
    if (autoInitialize && !auth?.user) {
      console.warn('usePaystack: User is not authenticated. Some features may not work properly.');
    }
  }, [auth?.user, autoInitialize]);

  return {
    initiatePayment,
    initiateAsyncPayment,
    createTransaction,
    resumeTransaction,
    cancelTransaction,
    generateReference,
    convertToKobo,
    convertFromKobo,
    loading,
    error,
    transactionId,
  };
};

export default usePaystack;
