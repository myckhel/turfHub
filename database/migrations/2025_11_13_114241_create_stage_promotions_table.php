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
        Schema::create('stage_promotions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stage_id')->constrained()->onDelete('cascade');
            $table->foreignId('next_stage_id')->constrained('stages')->onDelete('cascade');
            $table->enum('rule_type', ['top_n', 'top_per_group', 'points_threshold', 'custom'])->default('top_n');
            $table->json('rule_config')->nullable();
            $table->timestamps();
            
            $table->index('stage_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stage_promotions');
    }
};
