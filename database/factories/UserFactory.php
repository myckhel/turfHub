<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            // 'role' - removed as roles are now managed through Laravel Permission package
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn(array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Indicate that the user is an admin.
     * Note: This is now just for backward compatibility during seeding.
     * Actual roles are assigned through the permission system.
     */
    public function admin(): static
    {
        return $this->state(fn(array $attributes) => [
            // Role assignment handled by permission system
        ]);
    }

    /**
     * Indicate that the user is a manager.
     * Note: This is now just for backward compatibility during seeding.
     * Actual roles are assigned through the permission system.
     */
    public function manager(): static
    {
        return $this->state(fn(array $attributes) => [
            // Role assignment handled by permission system
        ]);
    }

    /**
     * Indicate that the user is a player.
     * Note: This is now just for backward compatibility during seeding.
     * Actual roles are assigned through the permission system.
     */
    public function player(): static
    {
        return $this->state(fn(array $attributes) => [
            // Role assignment handled by permission system
        ]);
    }
}
