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
        Schema::create('rankings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stage_id')->constrained()->onDelete('cascade');
            $table->foreignId('group_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('team_id')->constrained()->onDelete('cascade');
            $table->integer('points')->default(0);
            $table->integer('played')->default(0);
            $table->integer('wins')->default(0);
            $table->integer('draws')->default(0);
            $table->integer('losses')->default(0);
            $table->integer('goals_for')->default(0);
            $table->integer('goals_against')->default(0);
            $table->integer('goal_difference')->default(0);
            $table->integer('rank')->default(0);
            $table->json('metadata')->nullable();
            $table->timestamps();
            
            $table->unique(['stage_id', 'group_id', 'team_id']);
            $table->index(['stage_id', 'rank']);
            $table->index(['group_id', 'rank']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rankings');
    }
};
