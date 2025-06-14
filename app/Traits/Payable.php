<?php

namespace App\Traits;

use App\Models\Payment;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait Payable
{
    /**
     * Get all payments for this model.
     */
    public function payments(): MorphMany
    {
        return $this->morphMany(Payment::class, 'payable');
    }

    /**
     * Get successful payments for this model.
     */
    public function successfulPayments(): MorphMany
    {
        return $this->payments()->where('status', Payment::STATUS_SUCCESS);
    }

    /**
     * Get pending payments for this model.
     */
    public function pendingPayments(): MorphMany
    {
        return $this->payments()->where('status', Payment::STATUS_PENDING);
    }

    /**
     * Get the total amount paid for this model.
     */
    public function getTotalPaidAmount(): float
    {
        return (float) $this->successfulPayments()->sum('amount');
    }

    /**
     * Get the total pending payment amount for this model.
     */
    public function getTotalPendingAmount(): float
    {
        return (float) $this->pendingPayments()->sum('amount');
    }

    /**
     * Check if this model has any successful payments.
     */
    public function hasSuccessfulPayments(): bool
    {
        return $this->successfulPayments()->exists();
    }

    /**
     * Check if this model has any pending payments.
     */
    public function hasPendingPayments(): bool
    {
        return $this->pendingPayments()->exists();
    }

    /**
     * Get payment statistics for this model.
     */
    public function getPaymentStats(): array
    {
        $payments = $this->payments();

        return [
            'total_payments' => $payments->count(),
            'successful_payments' => $this->successfulPayments()->count(),
            'pending_payments' => $this->pendingPayments()->count(),
            'failed_payments' => $payments->where('status', Payment::STATUS_FAILED)->count(),
            'cancelled_payments' => $payments->where('status', Payment::STATUS_CANCELLED)->count(),
            'total_amount_collected' => $this->getTotalPaidAmount(),
            'total_amount_pending' => $this->getTotalPendingAmount(),
        ];
    }
}
