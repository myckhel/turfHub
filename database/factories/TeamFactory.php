<?php

namespace Database\Factories;

use App\Models\MatchSession;
use App\Models\Player;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Team>
 */
class TeamFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $teamNames = [
            'Fire Dragons',
            'Thunder Bolts',
            'Lightning Strikers',
            'Phoenix Warriors',
            'Storm Breakers',
            'Eagle Hawks',
            'Lion Hearts',
            'Tiger Claws',
            'Wolf Pack',
            'Falcon Wings',
            'Shark Attack',
            'Viper Strike',
            'Panther Force',
            'Rhino Charge',
            'Cobra Squad',
            'Titan Force',
            'Gladiators',
            'Spartans',
            'Vikings',
            'Crusaders'
        ];

        return [
            'match_session_id' => MatchSession::factory(),
            'name' => fake()->randomElement($teamNames),
            'captain_id' => Player::factory(),
            'status' => fake()->randomElement(['active_in_match', 'waiting', 'eliminated']),
            'wins' => fake()->numberBetween(0, 15),
            'losses' => fake()->numberBetween(0, 10),
            'draws' => fake()->numberBetween(0, 5),
        ];
    }

    /**
     * Indicate that the team is currently playing.
     */
    public function activeInMatch(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'active_in_match',
        ]);
    }

    /**
     * Indicate that the team is waiting to play.
     */
    public function waiting(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'waiting',
        ]);
    }

    /**
     * Indicate that the team has been eliminated.
     */
    public function eliminated(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'eliminated',
        ]);
    }

    /**
     * Create a team with good performance stats.
     */
    public function topPerformer(): static
    {
        return $this->state(fn(array $attributes) => [
            'wins' => fake()->numberBetween(10, 25),
            'losses' => fake()->numberBetween(0, 5),
            'draws' => fake()->numberBetween(2, 8),
        ]);
    }

    /**
     * Create a team with poor performance stats.
     */
    public function underPerformer(): static
    {
        return $this->state(fn(array $attributes) => [
            'wins' => fake()->numberBetween(0, 3),
            'losses' => fake()->numberBetween(8, 20),
            'draws' => fake()->numberBetween(0, 3),
        ]);
    }
}
