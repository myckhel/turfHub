<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Turf>
 */
class TurfFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $turfNames = [
            'Green Valley Football Club',
            'City Sports Arena',
            'Champions League Ground',
            'Riverside Football Complex',
            'Elite Soccer Academy',
            'Victory Sports Ground',
            'Premier Football Hub',
            'Golden Boot Arena',
            'Thunder Stadium',
            'Phoenix Sports Complex'
        ];

        $locations = [
            'Downtown District, Building A',
            'Riverside Park, Section B',
            'Sports Complex Mall, Level 2',
            'University Campus, Block C',
            'City Center Plaza, Floor 3',
            'Metropolitan Area, Zone 5',
            'Suburban Sports Hub, Wing D',
            'Commercial District, Unit 12',
            'Green Valley, Sector 7',
            'Industrial Area, Complex 9'
        ];

        return [
            'name' => fake()->randomElement($turfNames),
            'description' => fake()->paragraph(3),
            'location' => fake()->randomElement($locations),
            'owner_id' => User::factory(),
            'requires_membership' => fake()->boolean(60), // 60% chance of requiring membership
            'membership_fee' => fake()->boolean(60) ? fake()->randomFloat(2, 50, 500) : null,
            'membership_type' => fake()->randomElement(['monthly', 'yearly', 'weekly']),
            'max_players_per_team' => fake()->numberBetween(5, 11),
            'is_active' => fake()->boolean(90), // 90% chance of being active
        ];
    }

    /**
     * Indicate that the turf requires membership.
     */
    public function withMembership(): static
    {
        return $this->state(fn(array $attributes) => [
            'requires_membership' => true,
            'membership_fee' => fake()->randomFloat(2, 100, 800),
        ]);
    }

    /**
     * Indicate that the turf is free to play.
     */
    public function free(): static
    {
        return $this->state(fn(array $attributes) => [
            'requires_membership' => false,
            'membership_fee' => null,
        ]);
    }

    /**
     * Indicate that the turf is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn(array $attributes) => [
            'is_active' => false,
        ]);
    }
}
