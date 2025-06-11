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
        Schema::create('match_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('turf_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->date('session_date');
            $table->string('time_slot'); // 'morning', 'evening'
            $table->time('start_time');
            $table->time('end_time');
            $table->integer('max_teams');
            $table->string('status'); // scheduled, active, completed, cancelled
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('match_sessions');
    }
};
