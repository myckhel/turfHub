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
        Schema::create('stages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tournament_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->integer('order')->default(1);
            $table->enum('stage_type', ['league', 'group', 'knockout', 'swiss', 'king_of_hill', 'custom'])->default('league');
            $table->json('settings')->nullable();
            $table->foreignId('next_stage_id')->nullable()->constrained('stages')->onDelete('set null');
            $table->enum('status', ['pending', 'active', 'completed', 'cancelled'])->default('pending');
            $table->timestamps();
            
            $table->index(['tournament_id', 'order']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stages');
    }
};
