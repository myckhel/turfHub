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
        // Update status enum to include 'active' (PostgreSQL & MySQL compatible)
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            // PostgreSQL: Drop and recreate the column
            Schema::table('bets', function (Blueprint $table) {
                $table->dropColumn('status');
            });
            Schema::table('bets', function (Blueprint $table) {
                $table->enum('status', ['pending', 'active', 'won', 'lost', 'cancelled', 'refunded'])
                    ->default('pending')
                    ->after('id');
            });
        } else {
            // MySQL: Use change() method
            Schema::table('bets', function (Blueprint $table) {
                $table->enum('status', ['pending', 'active', 'won', 'lost', 'cancelled', 'refunded'])
                    ->default('pending')
                    ->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert status enum to original values (PostgreSQL & MySQL compatible)
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            // PostgreSQL: Drop and recreate the column
            Schema::table('bets', function (Blueprint $table) {
                $table->dropColumn('status');
            });
            Schema::table('bets', function (Blueprint $table) {
                $table->enum('status', ['pending', 'won', 'lost', 'cancelled', 'refunded'])
                    ->default('pending')
                    ->after('id');
            });
        } else {
            // MySQL: Use change() method
            Schema::table('bets', function (Blueprint $table) {
                $table->enum('status', ['pending', 'won', 'lost', 'cancelled', 'refunded'])
                    ->default('pending')
                    ->change();
            });
        }
    }
};
