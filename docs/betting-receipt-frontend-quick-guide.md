# 📱 Frontend Receipt Upload - Quick Guide

## 🚀 Quick Start

### 1. Import Components

```typescript
import ReceiptUpload from '@/components/betting/ReceiptUpload';
import BetReceiptDisplay from '@/components/betting/BetReceiptDisplay';
import { bettingApi } from '@/apis/betting';
```

### 2. Use ReceiptUpload Component

```tsx
const [receiptFile, setReceiptFile] = useState<File | null>(null);

<ReceiptUpload 
  value={receiptFile} 
  onChange={(file) => setReceiptFile(file)} 
  disabled={isLoading}
/>
```

### 3. Place Bet with Receipt

```typescript
const betData: PlaceBetRequest = {
  market_option_id: 123,
  stake_amount: 1000,
  payment_method: 'offline',
  receipt: receiptFile || undefined, // Attach receipt for offline
};

try {
  const result = await bettingApi.placeBet(betData);
  message.success('Bet placed successfully!');
} catch (error) {
  message.error('Failed to place bet');
}
```

### 4. Display Receipt (in bet details)

```tsx
{bet.has_receipt && (
  <BetReceiptDisplay bet={bet} />
)}
```

### 5. Manager Confirmation

```tsx
const handleConfirmPayment = async (betId: number) => {
  try {
    await bettingApi.confirmOfflinePayment(betId, 'Payment verified');
    message.success('Payment confirmed');
  } catch (error) {
    message.error('Failed to confirm payment');
  }
};

<BetReceiptDisplay 
  bet={bet} 
  showActions={isManager}
  onConfirmPayment={handleConfirmPayment}
/>
```

---

## 🎯 Component Props

### ReceiptUpload

```typescript
interface ReceiptUploadProps {
  value?: File | UploadFile;        // Current file
  onChange?: (file: File | null) => void; // File change handler
  disabled?: boolean;               // Disable upload
  maxSize?: number;                 // Max size in MB (default: 5)
  accept?: string;                  // Accepted file types
}
```

### BetReceiptDisplay

```typescript
interface BetReceiptDisplayProps {
  bet: Bet;                         // Bet object with receipt
  showActions?: boolean;            // Show manager actions
  onConfirmPayment?: (betId: number) => void; // Confirm handler
}
```

---

## 🔌 API Methods

### Place Bet (with receipt)
```typescript
bettingApi.placeBet({
  market_option_id: number,
  stake_amount: number,
  payment_method: 'offline',
  receipt: File, // Required for offline
});
```

### Upload Receipt (after placement)
```typescript
bettingApi.uploadReceipt(betId, receiptFile);
```

### Confirm Payment (manager)
```typescript
bettingApi.confirmOfflinePayment(betId, 'optional notes');
```

---

## 📋 Validation Rules

### File Validation
- **Types:** JPEG, JPG, PNG, WebP, PDF
- **Max Size:** 5MB
- **Required:** Only for `payment_method: 'offline'`

### Client-Side Checks
```typescript
// Check file type
const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
if (!validTypes.includes(file.type)) {
  message.error('Invalid file type');
  return;
}

// Check file size
if (file.size > 5 * 1024 * 1024) {
  message.error('File must be smaller than 5MB');
  return;
}

// Check receipt for offline payment
if (paymentMethod === 'offline' && !receiptFile) {
  message.error('Receipt required for offline payment');
  return;
}
```

---

## 🎨 Styling

### Tailwind Classes Used
```typescript
// Container
className="space-y-3 rounded-lg border-2 border-gray-200 dark:border-gray-700"

// Buttons
className="hover:scale-110 transition-all duration-200"

// Status badges
<Tag color="success" /> // Confirmed
<Tag color="warning" /> // Pending

// Dark mode
className="bg-white dark:bg-gray-800"
className="text-gray-700 dark:text-gray-300"
```

---

## 🔄 Common Patterns

### Conditional Display (Offline Only)

```tsx
{paymentMethod === 'offline' && (
  <ReceiptUpload 
    value={receiptFile} 
    onChange={setReceiptFile} 
  />
)}
```

### Clear Receipt on Payment Method Change

```typescript
const handlePaymentMethodChange = (method: PaymentMethod) => {
  setPaymentMethod(method);
  if (method !== 'offline') {
    setReceiptFile(null); // Clear receipt
  }
};
```

### Check Receipt Before Submission

```typescript
const handleSubmit = () => {
  if (paymentMethod === 'offline' && !receiptFile) {
    message.error('Please upload payment receipt');
    return;
  }
  // Proceed with submission
};
```

---

## 🐛 Error Handling

### Upload Errors
```typescript
try {
  await bettingApi.placeBet(betData);
} catch (error) {
  if (error.response?.status === 422) {
    // Validation error
    const errors = error.response.data.errors;
    if (errors.receipt) {
      message.error(errors.receipt[0]);
    }
  } else {
    message.error('Failed to upload receipt');
  }
}
```

### File Validation Errors
```typescript
beforeUpload={(file) => {
  const isValidSize = file.size / 1024 / 1024 < maxSize;
  if (!isValidSize) {
    message.error(`File must be smaller than ${maxSize}MB!`);
    return Upload.LIST_IGNORE;
  }
  
  const isValidType = acceptedTypes.includes(file.type);
  if (!isValidType) {
    message.error('Invalid file type!');
    return Upload.LIST_IGNORE;
  }
  
  return false; // Prevent auto upload
}}
```

---

## 📱 Mobile Considerations

### Touch-Friendly Upload
```tsx
<Dragger
  className="!min-h-[200px]" // Larger touch target
  {...props}
>
  <p className="text-lg">Tap to upload</p>
</Dragger>
```

### Responsive Preview
```tsx
<Image 
  src={receipt.preview_url}
  className="max-h-48 sm:max-h-64 md:max-h-96" // Responsive heights
  preview={true}
/>
```

---

## ✅ Complete Example

```tsx
import { useState } from 'react';
import { App } from 'antd';
import ReceiptUpload from '@/components/betting/ReceiptUpload';
import { bettingApi } from '@/apis/betting';
import type { PaymentMethod } from '@/types/betting.types';

const BetForm = () => {
  const { message } = App.useApp();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method !== 'offline') {
      setReceiptFile(null);
    }
  };

  const handlePlaceBet = async () => {
    // Validate receipt for offline payment
    if (paymentMethod === 'offline' && !receiptFile) {
      message.error('Please upload payment receipt');
      return;
    }

    setLoading(true);

    try {
      const betData = {
        market_option_id: 123,
        stake_amount: 1000,
        payment_method: paymentMethod,
        receipt: paymentMethod === 'offline' ? receiptFile || undefined : undefined,
      };

      const result = await bettingApi.placeBet(betData);
      message.success('Bet placed successfully!');
      
      // Clear receipt after success
      setReceiptFile(null);
      
    } catch (error) {
      message.error('Failed to place bet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Select 
        value={paymentMethod} 
        onChange={handlePaymentMethodChange}
      >
        <Option value="online">Online Payment</Option>
        <Option value="wallet">Wallet</Option>
        <Option value="offline">Cash Payment</Option>
      </Select>

      {paymentMethod === 'offline' && (
        <ReceiptUpload 
          value={receiptFile} 
          onChange={setReceiptFile}
          disabled={loading}
        />
      )}

      <Button 
        onClick={handlePlaceBet}
        loading={loading}
        disabled={paymentMethod === 'offline' && !receiptFile}
      >
        Place Bet
      </Button>
    </div>
  );
};
```

---

## 🎯 Best Practices

✅ **Always validate receipt for offline payments**
✅ **Clear receipt on payment method change**
✅ **Show clear error messages**
✅ **Disable actions during loading**
✅ **Provide visual feedback**
✅ **Handle all error cases**
✅ **Test on mobile devices**
✅ **Use TypeScript for type safety**

---

**Full Documentation:** `docs/betting-receipt-frontend-implementation.md`
