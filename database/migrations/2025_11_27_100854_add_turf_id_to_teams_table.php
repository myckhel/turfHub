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
      $table->foreignId('turf_id')->nullable()->after('match_session_id')->constrained()->onDelete('cascade');
      $table->string('color', 7)->nullable()->after('name')->comment('Hex color code for team (e.g., #FF5733)');
      $table->index('turf_id');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('teams', function (Blueprint $table) {
      $table->dropForeign(['turf_id']);
      $table->dropIndex(['turf_id']);
      $table->dropColumn(['turf_id', 'color']);
    });
  }
};
