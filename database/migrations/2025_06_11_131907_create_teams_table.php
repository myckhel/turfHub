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
    Schema::create('teams', function (Blueprint $table) {
      $table->id();
      $table->foreignId('match_session_id')->constrained()->cascadeOnDelete();
      $table->string('name');
      $table->foreignId('captain_id')->nullable()->constrained('players')->cascadeOnDelete(); // Assuming captain is a User
      $table->string('status'); // active_in_match, waiting, eliminated
      $table->integer('wins')->default(0);
      $table->integer('losses')->default(0);
      $table->integer('draws')->default(0);
      $table->timestamps();
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('teams');
  }
};
