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
        Schema::create('bet_outcomes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('betting_market_id')->constrained()->cascadeOnDelete();
            $table->foreignId('winning_option_id')->nullable()->constrained('market_options')->nullOnDelete();
            $table->json('actual_result')->nullable(); // Store actual match result data
            $table->foreignId('settled_by')->nullable()->constrained('users')->nullOnDelete(); // Who settled the market
            $table->timestamp('settled_at')->useCurrent();
            $table->text('settlement_notes')->nullable(); // Notes about settlement
            $table->boolean('requires_manual_review')->default(false); // Flag for disputed outcomes
            $table->timestamps();

            $table->index(['betting_market_id', 'settled_at']);
            $table->index('settled_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bet_outcomes');
    }
};
