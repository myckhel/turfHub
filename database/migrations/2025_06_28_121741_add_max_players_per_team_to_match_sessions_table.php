<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
  /**
   * Run the migrations.
   */
  public function up(): void
  {
    Schema::table('match_sessions', function (Blueprint $table) {
      $table->integer('max_players_per_team')->after('max_teams')->default(6);
    });

    // Update existing match sessions to use their turf's max_players_per_team
    DB::statement('
            UPDATE match_sessions
            SET max_players_per_team = (
                SELECT turfs.max_players_per_team
                FROM turfs
                WHERE turfs.id = match_sessions.turf_id
            )
        ');
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('match_sessions', function (Blueprint $table) {
      $table->dropColumn('max_players_per_team');
    });
  }
};
