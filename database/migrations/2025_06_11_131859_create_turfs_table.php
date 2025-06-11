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
        Schema::create('turfs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('location');
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->boolean('requires_membership')->default(false);
            $table->decimal('membership_fee', 8, 2)->nullable();
            $table->string('membership_type')->nullable(); // e.g., monthly, annually
            $table->integer('max_players_per_team')->default(5);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('turfs');
    }
};
