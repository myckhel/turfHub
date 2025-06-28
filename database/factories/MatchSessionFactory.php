<?php

namespace Database\Factories;

use App\Models\Turf;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\MatchSession>
 */
class MatchSessionFactory extends Factory
{
  /**
   * Define the model's default state.
   *
   * @return array<string, mixed>
   */
  public function definition(): array
  {
    $sessionNames = [
      'Weekend Warriors',
      'Monday Night Football',
      'Evening Kick-off',
      'Morning Glory',
      'Champions League',
      'Friday Night Lights',
      'Sunday Special',
      'Midweek Madness',
      'Weekend Tournament',
      'Elite Match Series'
    ];

    $timeSlot = fake()->randomElement(['morning', 'evening']);
    $sessionDate = fake()->dateTimeBetween('-1 month', '+2 months');

    if ($timeSlot === 'morning') {
      $startTime = fake()->time('H:i', '10:00');
      $endTime = fake()->time('H:i', '14:00');
    } else {
      $startTime = fake()->time('H:i', '18:00');
      $endTime = fake()->time('H:i', '22:00');
    }

    return [
      'turf_id' => Turf::factory(),
      'name' => fake()->randomElement($sessionNames),
      'session_date' => $sessionDate,
      'time_slot' => $timeSlot,
      'start_time' => $startTime,
      'end_time' => $endTime,
      'max_teams' => fake()->numberBetween(4, 8),
      'max_players_per_team' => function (array $attributes) {
        // Get the turf's max_players_per_team or default to 6
        $turf = Turf::find($attributes['turf_id']);
        return $turf?->max_players_per_team ?? 6;
      },
      'status' => fake()->randomElement(['scheduled', 'active', 'completed', 'cancelled']),
      'is_active' => fake()->boolean(30), // 30% chance of being currently active
    ];
  }

  /**
   * Indicate that the match session is in the morning.
   */
  public function morning(): static
  {
    return $this->state(fn(array $attributes) => [
      'time_slot' => 'morning',
      'start_time' => fake()->time('H:i', '10:00'),
      'end_time' => fake()->time('H:i', '14:00'),
    ]);
  }

  /**
   * Indicate that the match session is in the evening.
   */
  public function evening(): static
  {
    return $this->state(fn(array $attributes) => [
      'time_slot' => 'evening',
      'start_time' => fake()->time('H:i', '18:00'),
      'end_time' => fake()->time('H:i', '22:00'),
    ]);
  }

  /**
   * Indicate that the match session is currently active.
   */
  public function active(): static
  {
    return $this->state(fn(array $attributes) => [
      'status' => 'active',
      'is_active' => true,
      'session_date' => now()->format('Y-m-d'),
    ]);
  }

  /**
   * Indicate that the match session is completed.
   */
  public function completed(): static
  {
    return $this->state(fn(array $attributes) => [
      'status' => 'completed',
      'is_active' => false,
      'session_date' => fake()->dateTimeBetween('-2 months', '-1 day'),
    ]);
  }
}
