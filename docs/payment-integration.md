# TurfMate Payment Integration Setup

This document outlines the Paystack payment integration setup for TurfMate, allowing players to pay for match sessions and team joining fees.

## Setup Completed

### 1. Package Installation
- Installed `binkode/laravel-paystack` package
- Published Paystack configuration file

### 2. Database Setup
- Created `payments` table migration with the following fields:
  - `user_id` - Foreign key to users table
  - `match_session_id` - Foreign key to match_sessions table
  - `team_id` - Nullable foreign key to teams table
  - `reference` - Unique payment reference
  - `paystack_reference` - Paystack generated reference
  - `amount` - Payment amount in Naira
  - `currency` - Payment currency (default: NGN)
  - `status` - Payment status (pending, success, failed, cancelled)
  - `payment_method` - Payment method used
  - `gateway_response` - Gateway response message
  - `paid_at` - Timestamp when payment was completed
  - `metadata` - JSON field for additional payment data
  - `payment_type` - Type of payment (session_fee, team_joining_fee)
  - `description` - Payment description

### 3. Models Created
- **Payment Model** - Main payment model with relationships and helper methods
- **PaymentPolicy** - Authorization policy for payment operations
- Added payment relationships to User, MatchSession, and Team models

### 4. Services Created
- **PaymentService** - Core business logic for payment operations:
  - `initializeSessionPayment()` - Initialize payment with Paystack
  - `verifyPayment()` - Verify payment status
  - `getUserPaymentHistory()` - Get user's payment history
  - `getMatchSessionPaymentStats()` - Get payment statistics for match sessions
  - `cancelPayment()` - Cancel pending payments
  - `getSuggestedPaymentAmount()` - Get suggested payment amounts

### 5. Controllers Created
- **Web\PaymentController** - Inertia.js controller for web interface
- **Api\PaymentController** - API controller for mobile/external access
- **PaymentResource** - API resource for consistent data formatting

### 6. Routes Added
- **Web Routes** (Inertia.js):
  - `GET /payments/create` - Payment creation form
  - `POST /payments/initialize` - Initialize payment
  - `GET /payments/history` - Payment history
  - `GET /payments/{payment}/success` - Success page
  - `GET /payments/{payment}/failed` - Failed page
  - `POST /payments/{payment}/verify` - Manual verification
  - `POST /payments/{payment}/cancel` - Cancel payment
  - `GET /payment/callback` - Paystack callback (public)

- **API Routes**:
  - `POST /api/payments/initialize` - Initialize payment
  - `POST /api/payments/verify` - Verify payment
  - `GET /api/payments/history` - Payment history
  - `GET /api/payments/suggested-amount` - Get suggested amounts
  - `GET /api/payments/{payment}` - Get specific payment
  - `POST /api/payments/{payment}/cancel` - Cancel payment
  - `GET /api/match-sessions/{matchSession}/payment-stats` - Payment statistics

### 7. Form Requests
- **InitializePaymentRequest** - Validates payment initialization data

### 8. Event Handling
- **PaystackWebHookListener** - Handles Paystack webhook events
- Registered webhook listener in AppServiceProvider
- Handles charge success/failure events automatically

### 9. Frontend Components (React/TypeScript)
- **Payment/Create.tsx** - Payment initialization form
- **Payment/Success.tsx** - Payment success page
- **Payment/Failed.tsx** - Payment failure page
- **Payment/History.tsx** - Payment history table

## Configuration Required

### Environment Variables
Add the following to your `.env` file:

```env
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
PAYSTACK_URL=https://api.paystack.co
PAYSTACK_MERCHANT_EMAIL=admin@turfhub.com
```

### Paystack Dashboard Setup
1. Create a Paystack account at https://paystack.com
2. Get your API keys from the Settings > API Keys & Webhooks section
3. Set up webhook URL: `https://yourdomain.com/api/hooks`
4. Enable the following webhook events:
   - `charge.success`
   - `charge.failed`

## Usage Examples

### Initialize Payment (API)
```bash
curl -X POST https://yourdomain.com/api/payments/initialize \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "match_session_id": 1,
    "team_id": 2,
    "amount": 1000,
    "payment_type": "session_fee"
  }'
```

### Verify Payment (API)
```bash
curl -X POST https://yourdomain.com/api/payments/verify \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "TURF_ABC123_1234567890"
  }'
```

### Get Payment History (API)
```bash
curl -X GET https://yourdomain.com/api/payments/history \
  -H "Authorization: Bearer {token}"
```

## Payment Flow

1. **Player initiates payment** - Visits payment creation page or calls API
2. **Payment initialized** - System creates payment record and calls Paystack
3. **Player redirected** - To Paystack payment page
4. **Payment processed** - Player completes payment on Paystack
5. **Callback received** - Paystack calls back to verify payment
6. **Webhook processed** - System updates payment status via webhook
7. **Player redirected** - Back to success/failure page

## Payment Types

### Session Fee
- Default payment for participating in a match session
- Suggested amount: ₦1,000
- Required for session participation

### Team Joining Fee
- Payment for joining a specific team
- Suggested amount: ₦500
- Optional, based on team requirements

## Security Features

- Payment references are unique and secure
- Webhook validation using Paystack signature
- Authorization policies for payment access
- Input validation on all payment endpoints
- Secure API token authentication

## Customization

### Suggested Payment Amounts
Modify the `getSuggestedPaymentAmount()` method in `PaymentService` to customize amounts based on:
- Turf premium status
- Time of day
- Session demand
- User membership level

### Post-Payment Logic
Modify the `handleSuccessfulPayment()` method in `PaymentService` to add:
- Email notifications
- Automatic team joining
- Membership status updates
- Feature unlocking

## Testing

Use Paystack test keys for development:
- Test cards: https://paystack.com/docs/payments/test-payments/
- Webhook testing: Use tools like ngrok for local development

## Production Checklist

- [ ] Replace test API keys with live keys
- [ ] Set up proper webhook URL
- [ ] Configure SSL certificate
- [ ] Test webhook delivery
- [ ] Monitor payment logs
- [ ] Set up payment reconciliation
- [ ] Configure email notifications
- [ ] Test all payment flows
