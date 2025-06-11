<?php

namespace Database\Factories;

use App\Models\GameMatch;
use App\Models\Player;
use App\Models\Team;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\MatchEvent>
 */
class MatchEventFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $eventTypes = ['goal', 'yellow_card', 'red_card', 'substitution_in', 'substitution_out'];
        $type = fake()->randomElement($eventTypes);

        $comments = [
            'goal' => [
                'Beautiful strike from outside the box!',
                'Header from a corner kick',
                'Counter-attack goal',
                'Penalty converted',
                'Free kick goal',
                'Solo effort',
                'Team play goal'
            ],
            'yellow_card' => [
                'Unsporting behavior',
                'Dissent by word or action',
                'Persistent fouling',
                'Delaying the restart of play',
                'Reckless challenge'
            ],
            'red_card' => [
                'Serious foul play',
                'Violent conduct',
                'Second yellow card',
                'Offensive language',
                'Serious misconduct'
            ],
            'substitution_in' => [
                'Fresh legs brought on',
                'Tactical substitution',
                'Injury replacement',
                'Strategic change'
            ],
            'substitution_out' => [
                'Player substituted',
                'Tactical withdrawal',
                'Injury substitution',
                'Rest for key player'
            ]
        ];

        return [
            'game_match_id' => GameMatch::factory(),
            'player_id' => Player::factory(),
            'team_id' => Team::factory(),
            'type' => $type,
            'minute' => fake()->numberBetween(1, 90),
            'comment' => fake()->randomElement($comments[$type] ?? ['Match event']),
            'related_player_id' => in_array($type, ['substitution_in', 'substitution_out']) ? Player::factory() : null,
        ];
    }

    /**
     * Create a goal event.
     */
    public function goal(): static
    {
        return $this->state(fn(array $attributes) => [
            'type' => 'goal',
            'comment' => fake()->randomElement([
                'Beautiful strike from outside the box!',
                'Header from a corner kick',
                'Counter-attack goal',
                'Penalty converted',
                'Free kick goal',
                'Solo effort',
                'Team play goal'
            ]),
        ]);
    }

    /**
     * Create a yellow card event.
     */
    public function yellowCard(): static
    {
        return $this->state(fn(array $attributes) => [
            'type' => 'yellow_card',
            'comment' => fake()->randomElement([
                'Unsporting behavior',
                'Dissent by word or action',
                'Persistent fouling',
                'Delaying the restart of play',
                'Reckless challenge'
            ]),
        ]);
    }

    /**
     * Create a red card event.
     */
    public function redCard(): static
    {
        return $this->state(fn(array $attributes) => [
            'type' => 'red_card',
            'comment' => fake()->randomElement([
                'Serious foul play',
                'Violent conduct',
                'Second yellow card',
                'Offensive language',
                'Serious misconduct'
            ]),
        ]);
    }

    /**
     * Create a substitution event.
     */
    public function substitution(): static
    {
        return $this->state(fn(array $attributes) => [
            'type' => fake()->randomElement(['substitution_in', 'substitution_out']),
            'related_player_id' => Player::factory(),
            'comment' => fake()->randomElement([
                'Fresh legs brought on',
                'Tactical substitution',
                'Injury replacement',
                'Strategic change'
            ]),
        ]);
    }

    /**
     * Create an early match event (first 30 minutes).
     */
    public function early(): static
    {
        return $this->state(fn(array $attributes) => [
            'minute' => fake()->numberBetween(1, 30),
        ]);
    }

    /**
     * Create a late match event (last 30 minutes).
     */
    public function late(): static
    {
        return $this->state(fn(array $attributes) => [
            'minute' => fake()->numberBetween(60, 90),
        ]);
    }
}
