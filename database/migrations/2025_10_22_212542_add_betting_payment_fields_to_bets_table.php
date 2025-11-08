<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('bets', function (Blueprint $table) {
            // Payment-related fields
            $table->timestamp('payment_confirmed_at')->nullable()->after('payment_status');
            $table->json('payment_metadata')->nullable()->after('payment_confirmed_at');

            // Payout-related fields
            $table->enum('payout_status', ['pending', 'completed', 'failed'])->default('pending')->after('payment_metadata');
            $table->decimal('payout_amount', 15, 2)->nullable()->after('payout_status');
            $table->timestamp('payout_processed_at')->nullable()->after('payout_amount');
            $table->string('payout_reference')->nullable()->after('payout_processed_at');

            // Cancellation-related fields
            $table->timestamp('cancelled_at')->nullable()->after('payout_reference');
            $table->text('cancellation_reason')->nullable()->after('cancelled_at');

            // Refund-related fields
            $table->decimal('refund_amount', 15, 2)->nullable()->after('cancellation_reason');
            $table->timestamp('refund_processed_at')->nullable()->after('refund_amount');
            $table->string('refund_reference')->nullable()->after('refund_processed_at');

            // Update payment_method enum to include wallet
            $table->enum('payment_method', ['online', 'offline', 'wallet'])->default('online')->change();

            // Add index for performance
            $table->index(['payment_status', 'payment_confirmed_at']);
            $table->index(['payout_status', 'payout_processed_at']);
            $table->index(['user_id', 'status', 'placed_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bets', function (Blueprint $table) {
            $table->dropIndex(['payment_status', 'payment_confirmed_at']);
            $table->dropIndex(['payout_status', 'payout_processed_at']);
            $table->dropIndex(['user_id', 'status', 'placed_at']);

            $table->dropColumn([
                'payment_confirmed_at',
                'payment_metadata',
                'payout_status',
                'payout_amount',
                'payout_processed_at',
                'payout_reference',
                'cancelled_at',
                'cancellation_reason',
                'refund_amount',
                'refund_processed_at',
                'refund_reference',
            ]);

            // Revert payment_method enum
            $table->enum('payment_method', ['online', 'offline'])->default('online')->change();
        });
    }
};
