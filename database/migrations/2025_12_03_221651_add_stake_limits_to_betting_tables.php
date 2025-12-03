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
        // Add stake limits to game_matches table
        Schema::table('game_matches', function (Blueprint $table) {
            $table->decimal('min_stake_amount', 10, 2)->nullable()->after('betting_enabled');
            $table->decimal('max_stake_amount', 10, 2)->nullable()->after('min_stake_amount');

            $table->index('min_stake_amount');
            $table->index('max_stake_amount');
        });

        // Add stake limits to betting_markets table
        Schema::table('betting_markets', function (Blueprint $table) {
            $table->decimal('min_stake_amount', 10, 2)->nullable()->after('metadata');
            $table->decimal('max_stake_amount', 10, 2)->nullable()->after('min_stake_amount');

            $table->index('min_stake_amount');
            $table->index('max_stake_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('game_matches', function (Blueprint $table) {
            $table->dropIndex(['min_stake_amount']);
            $table->dropIndex(['max_stake_amount']);
            $table->dropColumn(['min_stake_amount', 'max_stake_amount']);
        });

        Schema::table('betting_markets', function (Blueprint $table) {
            $table->dropIndex(['min_stake_amount']);
            $table->dropIndex(['max_stake_amount']);
            $table->dropColumn(['min_stake_amount', 'max_stake_amount']);
        });
    }
};
