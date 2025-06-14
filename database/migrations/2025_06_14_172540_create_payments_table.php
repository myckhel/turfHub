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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Polymorphic relationship - can be MatchSession, Team, Turf, etc.
            $table->morphs('payable'); // Creates payable_type and payable_id columns

            $table->string('reference')->unique(); // Paystack transaction reference
            $table->string('paystack_reference')->nullable(); // Paystack generated reference
            $table->decimal('amount', 10, 2); // Amount in Naira
            $table->string('currency', 3)->default('NGN');
            $table->enum('status', ['pending', 'success', 'failed', 'cancelled'])->default('pending');
            $table->string('payment_method')->nullable(); // card, bank_transfer, etc.
            $table->string('gateway_response')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->json('metadata')->nullable(); // Store additional payment metadata
            $table->string('payment_type')->default('session_fee'); // Now flexible string instead of enum
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'payable_id']);
            $table->index(['status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
