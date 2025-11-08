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
        Schema::table('bets', function (Blueprint $table) {
            // Update status enum to include 'active'
            $table->enum('status', ['pending', 'active', 'won', 'lost', 'cancelled', 'refunded'])
                ->default('pending')
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bets', function (Blueprint $table) {
            // Revert status enum to original values
            $table->enum('status', ['pending', 'won', 'lost', 'cancelled', 'refunded'])
                ->default('pending')
                ->change();
        });
    }
};
