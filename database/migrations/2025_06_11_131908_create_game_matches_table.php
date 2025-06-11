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
        Schema::create('game_matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('match_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('first_team_id')->constrained('teams')->cascadeOnDelete();
            $table->foreignId('second_team_id')->constrained('teams')->cascadeOnDelete();
            $table->integer('first_team_score')->default(0);
            $table->integer('second_team_score')->default(0);
            $table->foreignId('winning_team_id')->nullable()->constrained('teams')->nullOnDelete();
            $table->string('outcome')->nullable(); // e.g., 'win', 'loss', 'draw' for first_team or specific team
            $table->timestamp('match_time')->nullable(); // Actual time the match started
            $table->string('status'); // e.g., upcoming, in_progress, completed, postponed
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('game_matches');
    }
};
