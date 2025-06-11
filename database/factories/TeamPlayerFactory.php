<?php

namespace Database\Factories;

use App\Models\Team;
use App\Models\Player;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TeamPlayer>
 */
class TeamPlayerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'team_id' => Team::factory(),
            'player_id' => Player::factory(),
            'status' => fake()->randomElement(['active', 'benched', 'substituted_out']),
            'join_time' => fake()->dateTimeBetween('-2 hours', 'now'),
        ];
    }

    /**
     * Indicate that the player is actively playing.
     */
    public function active(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'active',
        ]);
    }

    /**
     * Indicate that the player is on the bench.
     */
    public function benched(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'benched',
        ]);
    }

    /**
     * Indicate that the player has been substituted out.
     */
    public function substitutedOut(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'substituted_out',
        ]);
    }
}
