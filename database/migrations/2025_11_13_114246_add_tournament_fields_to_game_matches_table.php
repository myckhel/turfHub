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
        Schema::table('game_matches', function (Blueprint $table) {
            $table->foreignId('stage_id')->nullable()->after('match_session_id')->constrained()->onDelete('cascade');
            $table->foreignId('group_id')->nullable()->after('stage_id')->constrained()->onDelete('set null');
            $table->dateTime('starts_at')->nullable()->after('match_time');
            $table->integer('duration')->nullable()->after('starts_at')->comment('Duration in minutes');
            $table->json('score')->nullable()->after('second_team_score')->comment('Detailed score data');
            
            // Make match_session_id nullable for multi-stage tournaments
            $table->foreignId('match_session_id')->nullable()->change();
            
            $table->index(['stage_id', 'group_id']);
            $table->index('starts_at');
        });
    }

    public function down(): void
    {
        Schema::table('game_matches', function (Blueprint $table) {
            $table->dropForeign(['stage_id']);
            $table->dropForeign(['group_id']);
            $table->dropColumn(['stage_id', 'group_id', 'starts_at', 'duration', 'score']);
        });
    }
};
