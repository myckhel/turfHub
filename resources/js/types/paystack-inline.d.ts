declare module '@paystack/inline-js' {
  interface PaystackInstance {
    newTransaction: (options: Record<string, unknown>) => { id: string };
    checkout: (options: Record<string, unknown>) => Promise<void>;
    resumeTransaction: (accessCode: string) => void;
    cancelTransaction: (id: string) => void;
    preloadTransaction: (options: Record<string, unknown>) => () => void;
    paymentRequest: (options: Record<string, unknown>) => Promise<void>;
  }

  const Paystack: new () => PaystackInstance;
  export default Paystack;
}
