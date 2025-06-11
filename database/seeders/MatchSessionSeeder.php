<?php

namespace Database\Seeders;

use App\Models\MatchSession;
use App\Models\Turf;
use Illuminate\Database\Seeder;

class MatchSessionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $turfs = Turf::where('is_active', true)->get();

        foreach ($turfs as $turf) {
            // Create past completed sessions
            MatchSession::factory()->count(fake()->numberBetween(5, 15))
                ->completed()
                ->create(['turf_id' => $turf->id]);

            // Create current active sessions (1-2 per turf)
            if (fake()->boolean(70)) { // 70% chance of having an active session
                MatchSession::factory()
                    ->active()
                    ->create(['turf_id' => $turf->id]);
            }

            // Create future scheduled sessions
            MatchSession::factory()->count(fake()->numberBetween(2, 8))
                ->create([
                    'turf_id' => $turf->id,
                    'status' => 'scheduled',
                    'session_date' => fake()->dateTimeBetween('+1 day', '+2 months'),
                ]);
        }

        // Create some morning sessions specifically
        MatchSession::factory()->count(10)->morning()->create();

        // Create some evening sessions specifically
        MatchSession::factory()->count(15)->evening()->create();
    }
}
