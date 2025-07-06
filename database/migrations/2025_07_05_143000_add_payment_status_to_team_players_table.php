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
    Schema::table('team_players', function (Blueprint $table) {
      // Add payment status for race condition protection
      $table->enum('payment_status', ['pending', 'confirmed', 'expired', 'failed'])->default('confirmed')->after('status');

      // Add reservation timestamp for expiry logic
      $table->timestamp('reserved_at')->nullable()->after('payment_status');

      // Add payment reference for tracking
      $table->string('payment_reference')->nullable()->after('reserved_at');

      // Add index for efficient queries
      $table->index(['payment_status', 'reserved_at']);
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('team_players', function (Blueprint $table) {
      $table->dropIndex(['payment_status', 'reserved_at']);
      $table->dropColumn(['payment_status', 'reserved_at', 'payment_reference']);
    });
  }
};
