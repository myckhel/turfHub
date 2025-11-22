<?php

namespace Database\Factories;

use App\Enums\StageStatus;
use App\Enums\StageType;
use App\Models\Tournament;
use Illuminate\Database\Eloquent\Factories\Factory;

class StageFactory extends Factory
{
  public function definition(): array
  {
    return [
      'tournament_id' => Tournament::factory(),
      'name' => $this->faker->words(2, true),
      'order' => 1,
      'stage_type' => $this->faker->randomElement(StageType::cases())->value,
      'status' => StageStatus::PENDING->value,
      'settings' => [
        'rounds' => 1,
        'home_and_away' => false,
      ],
    ];
  }

  public function active(): static
  {
    return $this->state(fn(array $attributes) => [
      'status' => StageStatus::ACTIVE->value,
    ]);
  }

  public function completed(): static
  {
    return $this->state(fn(array $attributes) => [
      'status' => StageStatus::COMPLETED->value,
    ]);
  }
}
