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
    Schema::table('turfs', function (Blueprint $table) {
      $table->decimal('team_slot_fee', 8, 2)->nullable()->after('membership_fee');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('turfs', function (Blueprint $table) {
      $table->dropColumn('team_slot_fee');
    });
  }
};
