import type {
  PaystackCallbacks,
  PaystackConfig,
  PaystackInstance,
  PaystackPaymentRequest,
  PaystackTransactionOptions,
  PaystackTransactionType,
} from '@/types/paystack';
import Paystack from '@paystack/inline-js';

/**
 * Paystack service for handling payments across the application
 */
class PaystackService {
  private instance: PaystackInstance;
  private config: PaystackConfig;

  constructor() {
    this.instance = new Paystack();
    this.config = {
      publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
      currency: 'NGN',
      channels: ['card', 'bank', 'ussd', 'mobile_money', 'bank_transfer'],
    };

    if (!this.config.publicKey) {
      console.warn('Paystack public key not found in environment variables');
    }
  }

  /**
   * Create a new transaction (synchronous)
   */
  newTransaction(options: PaystackTransactionOptions & PaystackCallbacks): { id: string } {
    const transactionOptions = this.prepareTransactionOptions(options);
    return this.instance.newTransaction(transactionOptions);
  }

  /**
   * Checkout (asynchronous)
   */
  async checkout(options: PaystackTransactionOptions & PaystackCallbacks): Promise<void> {
    const transactionOptions = this.prepareTransactionOptions(options);
    return this.instance.checkout(transactionOptions);
  }

  /**
   * Resume a transaction with access code
   */
  resumeTransaction(accessCode: string): void {
    return this.instance.resumeTransaction(accessCode);
  }

  /**
   * Cancel a transaction
   */
  cancelTransaction(id: string): void {
    return this.instance.cancelTransaction(id);
  }

  /**
   * Preload a transaction for instant loading
   */
  preloadTransaction(options: PaystackTransactionOptions): () => void {
    const transactionOptions = this.prepareTransactionOptions(options);
    return this.instance.preloadTransaction(transactionOptions);
  }

  /**
   * Handle payment requests (wallet payments like Apple Pay)
   */
  async paymentRequest(options: PaystackPaymentRequest): Promise<void> {
    const requestOptions = {
      ...this.prepareTransactionOptions(options),
      container: options.container,
      loadPaystackCheckoutButton: options.loadPaystackCheckoutButton,
      styles: options.styles,
      onElementsMount: options.onElementsMount,
    };
    return this.instance.paymentRequest(requestOptions);
  }

  /**
   * Generate a unique payment reference
   */
  generateReference(prefix = 'TM'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Convert amount to kobo (Paystack requires amounts in kobo)
   */
  convertToKobo(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Convert amount from kobo to naira
   */
  convertFromKobo(amount: number): number {
    return amount / 100;
  }

  /**
   * Prepare transaction options with defaults
   */
  private prepareTransactionOptions(
    options: PaystackTransactionOptions & Partial<PaystackCallbacks>,
  ): PaystackTransactionOptions & PaystackCallbacks {
    return {
      currency: this.config.currency,
      channels: this.config.channels,
      reference: options.reference || this.generateReference(),
      ...options,
      key: this.config.publicKey,
      amount: this.convertToKobo(options.amount),
      // Override with provided callbacks
      onSuccess: options.onSuccess || (() => {}),
      onLoad: options.onLoad || (() => {}),
      onCancel: options.onCancel || (() => {}),
      onError: options.onError || ((error) => console.error('Paystack error:', error)),
    };
  }

  /**
   * Create a transaction for specific types
   */
  createTransaction(
    type: PaystackTransactionType,
    options: PaystackTransactionOptions & PaystackCallbacks,
    useAsync = false,
  ): Promise<void> | { id: string } {
    switch (type) {
      case 'one-time':
        return useAsync ? this.checkout(options) : this.newTransaction(options);
      case 'subscription':
        if (!options.planCode && !options.planInterval) {
          throw new Error('Subscription requires either planCode or planInterval');
        }
        return useAsync ? this.checkout(options) : this.newTransaction(options);
      case 'split':
        if (!options.subaccountCode) {
          throw new Error('Split payment requires subaccountCode');
        }
        return useAsync ? this.checkout(options) : this.newTransaction(options);
      case 'multi-split':
        if (!options.split_code && !options.split) {
          throw new Error('Multi-split payment requires split_code or split configuration');
        }
        return useAsync ? this.checkout(options) : this.newTransaction(options);
      default:
        throw new Error(`Unsupported transaction type: ${type}`);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): PaystackConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PaystackConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const paystackService = new PaystackService();

// Export class for testing or custom instances
export { PaystackService };

// Export default
export default paystackService;
