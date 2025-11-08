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
        Schema::create('betting_markets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_match_id')->constrained()->cascadeOnDelete();
            $table->string('market_type'); // '1x2', 'player_scoring', 'correct_score', 'total_goals'
            $table->string('name'); // e.g., '1X2 Match Result', 'John to Score'
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('opens_at')->nullable(); // When betting opens
            $table->timestamp('closes_at')->nullable(); // When betting closes (usually match start)
            $table->timestamp('settled_at')->nullable(); // When market was settled
            $table->enum('status', ['active', 'suspended', 'settled', 'cancelled'])->default('active');
            $table->json('metadata')->nullable(); // Store additional market-specific data
            $table->timestamps();

            $table->index(['game_match_id', 'market_type']);
            $table->index(['status', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('betting_markets');
    }
};
