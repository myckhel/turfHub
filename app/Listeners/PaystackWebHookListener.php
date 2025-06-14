<?php

namespace App\Listeners;

use App\Models\Payment;
use App\Services\PaymentService;
use Binkode\Paystack\Events\Hook;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class PaystackWebHookListener implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct(
        protected PaymentService $paymentService
    ) {}

    /**
     * Handle the event.
     */
    public function handle(Hook $event): void
    {
        $eventType = $event->event['event'] ?? null;
        $eventData = $event->event['data'] ?? [];

        Log::info('Paystack webhook received', [
            'event_type' => $eventType,
            'reference' => $eventData['reference'] ?? 'unknown',
        ]);

        match ($eventType) {
            'charge.success' => $this->handleChargeSuccess($eventData),
            'charge.failed' => $this->handleChargeFailed($eventData),
            'transfer.success' => $this->handleTransferSuccess($eventData),
            'transfer.failed' => $this->handleTransferFailed($eventData),
            default => $this->handleUnknownEvent($eventType, $eventData),
        };
    }

    /**
     * Handle successful charge event.
     */
    protected function handleChargeSuccess(array $data): void
    {
        $reference = $data['reference'] ?? null;

        if (!$reference) {
            Log::warning('Charge success webhook missing reference');
            return;
        }

        try {
            $payment = Payment::where('reference', $reference)
                ->orWhere('paystack_reference', $reference)
                ->first();

            if (!$payment) {
                Log::warning('Payment not found for reference', ['reference' => $reference]);
                return;
            }

            if ($payment->isSuccessful()) {
                Log::info('Payment already marked as successful', ['payment_id' => $payment->id]);
                return;
            }

            // Update payment status
            $payment->update([
                'status' => Payment::STATUS_SUCCESS,
                'payment_method' => $data['channel'] ?? null,
                'gateway_response' => $data['gateway_response'] ?? null,
                'paid_at' => now(),
                'metadata' => array_merge($payment->metadata ?? [], [
                    'webhook_data' => $data,
                    'webhook_processed_at' => now()->toISOString(),
                ]),
            ]);

            Log::info('Payment marked as successful via webhook', [
                'payment_id' => $payment->id,
                'reference' => $reference,
            ]);

            // Handle post-payment logic
            $this->handleSuccessfulPayment($payment);
        } catch (\Exception $e) {
            Log::error('Error processing charge success webhook', [
                'reference' => $reference,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle failed charge event.
     */
    protected function handleChargeFailed(array $data): void
    {
        $reference = $data['reference'] ?? null;

        if (!$reference) {
            Log::warning('Charge failed webhook missing reference');
            return;
        }

        try {
            $payment = Payment::where('reference', $reference)
                ->orWhere('paystack_reference', $reference)
                ->first();

            if (!$payment) {
                Log::warning('Payment not found for failed charge', ['reference' => $reference]);
                return;
            }

            $payment->update([
                'status' => Payment::STATUS_FAILED,
                'gateway_response' => $data['gateway_response'] ?? 'Payment failed',
                'metadata' => array_merge($payment->metadata ?? [], [
                    'webhook_data' => $data,
                    'webhook_processed_at' => now()->toISOString(),
                ]),
            ]);

            Log::info('Payment marked as failed via webhook', [
                'payment_id' => $payment->id,
                'reference' => $reference,
            ]);
        } catch (\Exception $e) {
            Log::error('Error processing charge failed webhook', [
                'reference' => $reference,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle successful transfer event.
     */
    protected function handleTransferSuccess(array $data): void
    {
        Log::info('Transfer successful', $data);
        // Handle transfer success logic if needed
    }

    /**
     * Handle failed transfer event.
     */
    protected function handleTransferFailed(array $data): void
    {
        Log::info('Transfer failed', $data);
        // Handle transfer failure logic if needed
    }

    /**
     * Handle unknown event types.
     */
    protected function handleUnknownEvent(?string $eventType, array $data): void
    {
        Log::info('Unknown Paystack webhook event', [
            'event_type' => $eventType,
            'data' => $data,
        ]);
    }

    /**
     * Handle post-successful payment logic.
     */
    protected function handleSuccessfulPayment(Payment $payment): void
    {
        // Send notifications, update user status, etc.
        Log::info('Processing successful payment webhook', [
            'payment_id' => $payment->id,
            'user_id' => $payment->user_id,
            'amount' => $payment->amount,
        ]);

        // You can add additional logic here:
        // - Send email notifications
        // - Update user membership status
        // - Grant access to features
        // - Add user to team automatically
    }
}
