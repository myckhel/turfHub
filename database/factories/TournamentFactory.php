<?php

namespace Database\Factories;

use App\Enums\TournamentType;
use App\Models\Turf;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TournamentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'turf_id' => Turf::factory(),
            'name' => $this->faker->words(3, true) . ' Tournament',
            'type' => $this->faker->randomElement(['single_session', 'multi_stage_tournament']),
            'status' => 'pending',
            'starts_at' => $this->faker->dateTimeBetween('now', '+1 month'),
            'ends_at' => $this->faker->dateTimeBetween('+1 month', '+2 months'),
            'created_by' => User::factory(),
            'settings' => [
                'match_duration' => $this->faker->randomElement([10, 12, 15, 20]),
                'team_size' => $this->faker->numberBetween(5, 7),
            ],
        ];
    }
}
