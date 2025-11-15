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
        Schema::table('teams', function (Blueprint $table) {
            $table->foreignId('tournament_id')->nullable()->after('match_session_id')->constrained()->onDelete('cascade');
            $table->json('metadata')->nullable()->after('draws');
            
            // Make match_session_id nullable
            $table->foreignId('match_session_id')->nullable()->change();
            
            $table->index('tournament_id');
        });
    }

    public function down(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->dropForeign(['tournament_id']);
            $table->dropColumn(['tournament_id', 'metadata']);
        });
    }
};
