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
        // Drop role column from users table
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });

        // Drop role column from players table
        Schema::table('players', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore role column to users table
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->nullable()->after('password');
        });

        // Restore role column to players table
        Schema::table('players', function (Blueprint $table) {
            $table->string('role')->nullable()->after('status')
                ->comment('Legacy role field - will be deprecated in favor of Spatie permissions');
        });
    }
};
