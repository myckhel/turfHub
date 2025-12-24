# Paystack InlineJS Implementation Guide

This guide covers the implementation of a reusable Paystack InlineJS payment system for TurfHub.

## Overview

The implementation provides:
- Reusable `usePaystack` hook for payment logic
- Generic `PaymentModal` component for different payment types
- Centralized Paystack service with utility functions
- TypeScript definitions for type safety
- Updated `DepositModal` using the new system

## Architecture

### 1. Paystack Service (`utils/paystack.ts`)
Centralized service that handles all Paystack operations:
- Transaction initialization (sync/async)
- Payment configuration management
- Utility functions (reference generation, amount conversion)
- Support for different transaction types

### 2. Paystack Hook (`hooks/usePaystack.ts`)
Custom React hook that provides:
- State management for payment flow
- User context integration (email from auth)
- Error handling and loading states
- Callback management

### 3. Payment Components
- `PaymentModal`: Generic payment modal for any payment type
- `DepositModal`: Updated wallet deposit modal
- `PaymentExamples`: Example implementations

## Usage Examples

### Basic Payment with Hook

```tsx
import { usePaystack } from '@/hooks/usePaystack';

const MyComponent = () => {
  const { initiatePayment, loading, error } = usePaystack({
    onSuccess: (transaction) => {
      console.log('Payment successful:', transaction);
    },
    onError: (error) => {
      console.error('Payment failed:', error);
    },
  });

  const handlePay = () => {
    initiatePayment({
      amount: 5000, // ₦50.00
      currency: 'NGN',
      metadata: {
        payment_type: 'custom',
      },
    });
  };

  return (
    <button onClick={handlePay} disabled={loading}>
      {loading ? 'Processing...' : 'Pay ₦5,000'}
    </button>
  );
};
```

### Using PaymentModal

```tsx
import PaymentModal from '@/components/payment/PaymentModal';

const MyComponent = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button onClick={() => setModalOpen(true)}>
        Make Payment
      </button>
      
      <PaymentModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onSuccess={(transaction) => {
          console.log('Success:', transaction);
          setModalOpen(false);
        }}
        title="Custom Payment"
        description="Enter payment amount"
        showAmountInput={true}
        minAmount={100}
        maxAmount={50000}
      />
    </>
  );
};
```

### Fixed Amount Payment

```tsx
<PaymentModal
  open={open}
  onCancel={onCancel}
  onSuccess={onSuccess}
  title="Team Slot Fee"
  amount={2500}
  fixedAmount={true}
  showAmountInput={false}
  metadata={{
    team_id: 123,
    payment_type: 'team_slot_fee',
  }}
/>
```

### Wallet Deposit

```tsx
import { DepositModal } from '@/components/wallet/DepositModal';

// The DepositModal now uses the new Paystack implementation
<DepositModal
  open={depositModalOpen}
  onCancel={() => setDepositModalOpen(false)}
  onSuccess={() => {
    // Handle successful deposit
    setDepositModalOpen(false);
    refreshWalletBalance();
  }}
/>
```

## Configuration

### Environment Variables
Add to your `.env` file:
```env
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
```

### TypeScript Configuration
The implementation includes proper TypeScript definitions:
- `types/paystack.ts` - Main Paystack types
- `types/paystack-inline.d.ts` - Module declaration for @paystack/inline-js

## Features

### 1. Type Safety
- Full TypeScript support
- Comprehensive interfaces for all payment options
- Proper error types

### 2. User Context Integration
- Automatically gets user email from auth context
- Validates user authentication before payment

### 3. Error Handling
- Comprehensive error catching and reporting
- User-friendly error messages
- Loading state management

### 4. Flexible Payment Options
- One-time payments
- Subscription payments
- Split payments
- Multi-split payments
- Custom metadata support

### 5. Reusable Components
- `PaymentModal` for any payment type
- Customizable UI and behavior
- Consistent styling with Ant Design

## API Reference

### usePaystack Hook

```tsx
interface UsePaystackOptions {
  onSuccess?: (transaction: PaystackTransactionResponse) => void;
  onError?: (error: PaystackError) => void;
  onCancel?: () => void;
  onLoad?: (response: PaystackLoadResponse) => void;
  autoInitialize?: boolean;
}

const {
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
} = usePaystack(options);
```

### PaymentModal Props

```tsx
interface PaymentModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: (transaction: PaystackTransactionResponse) => void;
  title?: string;
  description?: string;
  amount?: number;
  currency?: string;
  minAmount?: number;
  maxAmount?: number;
  showAmountInput?: boolean;
  fixedAmount?: boolean;
  showCurrencySelector?: boolean;
  reference?: string;
  metadata?: Record<string, unknown>;
  channels?: PaymentChannel[];
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  width?: number;
}
```

## Migration Guide

### From Legacy DepositModal

Before:
```tsx
// Old implementation using window.PaystackPop
const paystackHandler = window.PaystackPop.setup({
  key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
  email: 'user@example.com',
  amount: amount * 100,
  // ...
});
```

After:
```tsx
// New implementation using usePaystack hook
const { initiatePayment } = usePaystack({
  onSuccess: handleSuccess,
  onError: handleError,
});

initiatePayment({
  amount,
  currency: 'NGN',
  // email is automatically added from auth context
});
```

## Security Considerations

1. **Environment Variables**: Public key is safely stored in environment variables
2. **User Validation**: Ensures user is authenticated before payment
3. **Type Safety**: Prevents common errors through TypeScript
4. **Error Handling**: Secure error reporting without exposing sensitive data

## Testing

### Test Payment
Use Paystack test keys for development:
- Test cards: https://paystack.com/docs/payments/test-payments/
- Use test public key: `pk_test_...`

### Example Test Card
```
Card: 4084084084084081
CVV: 408
Expiry: Any future date
PIN: 0000
OTP: 123456
```

## Best Practices

1. **Always handle errors gracefully**
2. **Validate payment amounts on both client and server**
3. **Use meaningful payment references**
4. **Include relevant metadata for tracking**
5. **Test thoroughly with different payment methods**
6. **Monitor payment success rates**

## Troubleshooting

### Common Issues

1. **"User email is required"**
   - Ensure user is authenticated
   - Check auth context is properly set up

2. **"Payment initialization failed"**
   - Verify Paystack public key is set
   - Check network connectivity
   - Validate payment amount

3. **TypeScript errors**
   - Ensure all required types are imported
   - Check that @paystack/inline-js is properly installed

## Next Steps

1. Implement webhook handling for payment verification
2. Add payment history tracking
3. Implement refund functionality
4. Add support for recurring payments
5. Implement payment analytics dashboard
