<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Turf;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Player>
 */
class PlayerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'turf_id' => Turf::factory(),
            'is_member' => fake()->boolean(70), // 70% chance of being a member
            'status' => fake()->randomElement(['active', 'inactive', 'banned']),
        ];
    }

    /**
     * Indicate that the player is a member.
     */
    public function member(): static
    {
        return $this->state(fn(array $attributes) => [
            'is_member' => true,
        ]);
    }

    /**
     * Indicate that the player is not a member.
     */
    public function nonMember(): static
    {
        return $this->state(fn(array $attributes) => [
            'is_member' => false,
        ]);
    }

    /**
     * Indicate that the player is active.
     */
    public function active(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'active',
        ]);
    }

    /**
     * Indicate that the player is banned.
     */
    public function banned(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'banned',
        ]);
    }
}
