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
        Schema::create('market_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('betting_market_id')->constrained()->cascadeOnDelete();
            $table->string('key'); // 'home', 'draw', 'away', 'yes', 'no', '1-0', etc.
            $table->string('name'); // 'Team A Win', 'Draw', 'Team B Win', 'Yes', 'No'
            $table->decimal('odds', 8, 2)->default(1.00); // Current odds (e.g., 2.50)
            $table->decimal('total_stake', 10, 2)->default(0.00); // Total amount staked on this option
            $table->integer('bet_count')->default(0); // Number of bets placed on this option
            $table->boolean('is_active')->default(true);
            $table->boolean('is_winning_option')->default(false); // Set when market is settled
            $table->timestamps();

            $table->unique(['betting_market_id', 'key']);
            $table->index(['betting_market_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('market_options');
    }
};
