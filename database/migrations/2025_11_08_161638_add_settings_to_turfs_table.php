<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('turfs', function (Blueprint $table) {
            $table->json('settings')->nullable()->after('team_slot_fee');
        });

        // Set default settings for existing turfs
        DB::table('turfs')->whereNull('settings')->update([
            'settings' => json_encode([
                'payment_methods' => [
                    'cash_enabled' => true,
                    'wallet_enabled' => true,
                    'online_enabled' => true,
                ],
            ])
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('turfs', function (Blueprint $table) {
            $table->dropColumn('settings');
        });
    }
};
