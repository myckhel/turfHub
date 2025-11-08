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
        Schema::create('bets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('betting_market_id')->constrained()->cascadeOnDelete();
            $table->foreignId('market_option_id')->constrained()->cascadeOnDelete();
            $table->decimal('stake_amount', 10, 2); // Amount user bet
            $table->decimal('odds_at_placement', 8, 2); // Odds when bet was placed
            $table->decimal('potential_payout', 10, 2); // Calculated payout if bet wins
            $table->decimal('actual_payout', 10, 2)->nullable(); // Actual payout when settled
            $table->enum('status', ['pending', 'won', 'lost', 'cancelled', 'refunded'])->default('pending');
            $table->timestamp('placed_at')->useCurrent(); // When bet was placed
            $table->timestamp('settled_at')->nullable(); // When bet was settled
            $table->string('payment_reference')->nullable(); // Reference to payment record
            $table->enum('payment_method', ['online', 'offline'])->default('online');
            $table->enum('payment_status', ['pending', 'confirmed', 'failed'])->default('pending');
            $table->text('notes')->nullable(); // Additional notes or dispute information
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['betting_market_id', 'status']);
            $table->index(['status', 'placed_at']);
            $table->index('payment_reference');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bets');
    }
};
