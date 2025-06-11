<?php

namespace Database\Seeders;

use App\Models\Turf;
use App\Models\User;
use Illuminate\Database\Seeder;

class TurfSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create some managers/owners first
        $managers = User::factory()->count(5)->manager()->create();

        // Create turfs with realistic data
        foreach ($managers as $manager) {
            // Each manager can own 1-3 turfs
            $turfCount = fake()->numberBetween(1, 3);

            for ($i = 0; $i < $turfCount; $i++) {
                Turf::factory()->create([
                    'owner_id' => $manager->id,
                ]);
            }
        }

        // Create some additional turfs with random owners
        Turf::factory()->count(8)->create();

        // Create some premium turfs with membership
        Turf::factory()->count(3)->withMembership()->create();

        // Create a couple of inactive turfs
        Turf::factory()->count(2)->inactive()->create();
    }
}
