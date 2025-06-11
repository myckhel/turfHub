<?php

namespace Database\Factories;

use App\Models\MatchSession;
use App\Models\Team;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QueueLogic>
 */
class QueueLogicFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $reasons = [
            'initial_join',
            'win',
            'loss',
            'draw_reentry_random',
            'draw_waiting_other_match'
        ];

        $statuses = [
            'waiting',
            'next_to_play',
            'played_waiting_draw_resolution'
        ];

        return [
            'match_session_id' => MatchSession::factory(),
            'team_id' => Team::factory(),
            'queue_position' => fake()->numberBetween(1, 8),
            'status' => fake()->randomElement($statuses),
            'reason_for_current_position' => fake()->randomElement($reasons),
        ];
    }

    /**
     * Create a queue entry for a team that just joined.
     */
    public function initialJoin(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'waiting',
            'reason_for_current_position' => 'initial_join',
            'queue_position' => fake()->numberBetween(3, 8),
        ]);
    }

    /**
     * Create a queue entry for a team that's next to play.
     */
    public function nextToPlay(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'next_to_play',
            'queue_position' => fake()->numberBetween(1, 2),
        ]);
    }

    /**
     * Create a queue entry for a team that won and goes to back of queue.
     */
    public function afterWin(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'waiting',
            'reason_for_current_position' => 'win',
            'queue_position' => fake()->numberBetween(5, 8),
        ]);
    }

    /**
     * Create a queue entry for a team that lost and is eliminated.
     */
    public function afterLoss(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'waiting',
            'reason_for_current_position' => 'loss',
            'queue_position' => fake()->numberBetween(6, 8),
        ]);
    }

    /**
     * Create a queue entry for a team waiting after a draw.
     */
    public function afterDraw(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'played_waiting_draw_resolution',
            'reason_for_current_position' => fake()->randomElement(['draw_reentry_random', 'draw_waiting_other_match']),
            'queue_position' => fake()->numberBetween(3, 6),
        ]);
    }
}
