<?php

namespace Database\Factories;

use App\Models\MatchSession;
use App\Models\Team;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\GameMatch>
 */
class GameMatchFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $firstTeamScore = fake()->numberBetween(0, 8);
        $secondTeamScore = fake()->numberBetween(0, 8);

        // Determine outcome and winning team
        $outcome = 'draw';
        $winningTeamId = null;

        if ($firstTeamScore > $secondTeamScore) {
            $outcome = 'win';
            // We'll set winning_team_id in the seeder when we have actual team IDs
        } elseif ($secondTeamScore > $firstTeamScore) {
            $outcome = 'loss';
            // We'll set winning_team_id in the seeder when we have actual team IDs
        }

        return [
            'match_session_id' => MatchSession::factory(),
            'first_team_id' => Team::factory(),
            'second_team_id' => Team::factory(),
            'first_team_score' => $firstTeamScore,
            'second_team_score' => $secondTeamScore,
            'winning_team_id' => $winningTeamId,
            'outcome' => $outcome,
            'match_time' => fake()->dateTimeBetween('-2 hours', '+1 hour'),
            'status' => fake()->randomElement(['upcoming', 'in_progress', 'completed', 'postponed']),
        ];
    }

    /**
     * Create a completed match.
     */
    public function completed(): static
    {
        return $this->state(function (array $attributes) {
            $firstTeamScore = fake()->numberBetween(0, 8);
            $secondTeamScore = fake()->numberBetween(0, 8);

            $outcome = 'draw';
            if ($firstTeamScore > $secondTeamScore) {
                $outcome = 'win';
            } elseif ($secondTeamScore > $firstTeamScore) {
                $outcome = 'loss';
            }

            return [
                'first_team_score' => $firstTeamScore,
                'second_team_score' => $secondTeamScore,
                'outcome' => $outcome,
                'status' => 'completed',
                'match_time' => fake()->dateTimeBetween('-1 month', '-1 hour'),
            ];
        });
    }

    /**
     * Create an upcoming match.
     */
    public function upcoming(): static
    {
        return $this->state(fn(array $attributes) => [
            'first_team_score' => 0,
            'second_team_score' => 0,
            'outcome' => null,
            'winning_team_id' => null,
            'status' => 'upcoming',
            'match_time' => fake()->dateTimeBetween('+1 hour', '+1 week'),
        ]);
    }

    /**
     * Create a match currently in progress.
     */
    public function inProgress(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'in_progress',
            'match_time' => fake()->dateTimeBetween('-1 hour', 'now'),
        ]);
    }

    /**
     * Create a high-scoring match.
     */
    public function highScoring(): static
    {
        return $this->state(fn(array $attributes) => [
            'first_team_score' => fake()->numberBetween(5, 12),
            'second_team_score' => fake()->numberBetween(5, 12),
        ]);
    }

    /**
     * Create a low-scoring match.
     */
    public function lowScoring(): static
    {
        return $this->state(fn(array $attributes) => [
            'first_team_score' => fake()->numberBetween(0, 2),
            'second_team_score' => fake()->numberBetween(0, 2),
        ]);
    }
}
