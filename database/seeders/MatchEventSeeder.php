<?php

namespace Database\Seeders;

use App\Models\MatchEvent;
use App\Models\GameMatch;
use App\Models\TeamPlayer;
use Illuminate\Database\Seeder;

class MatchEventSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $completedMatches = GameMatch::where('status', 'completed')->get();
        $inProgressMatches = GameMatch::where('status', 'in_progress')->get();

        // Create events for completed matches
        foreach ($completedMatches as $match) {
            $this->createEventsForMatch($match, true);
        }

        // Create events for in-progress matches
        foreach ($inProgressMatches as $match) {
            $this->createEventsForMatch($match, false);
        }

        // Create some specific event types
        MatchEvent::factory()->count(20)->goal()->create();
        MatchEvent::factory()->count(30)->yellowCard()->create();
        MatchEvent::factory()->count(5)->redCard()->create();
        MatchEvent::factory()->count(15)->substitution()->create();
    }

    private function createEventsForMatch(GameMatch $match, bool $isCompleted): void
    {
        // Get players from both teams
        $firstTeamPlayers = TeamPlayer::where('team_id', $match->first_team_id)->get();
        $secondTeamPlayers = TeamPlayer::where('team_id', $match->second_team_id)->get();
        $allPlayers = $firstTeamPlayers->merge($secondTeamPlayers);

        if ($allPlayers->isEmpty()) {
            return;
        }

        // Create goal events based on match score
        $totalGoals = $match->first_team_score + $match->second_team_score;

        for ($i = 0; $i < $match->first_team_score; $i++) {
            $player = $firstTeamPlayers->random();
            MatchEvent::factory()->goal()->create([
                'game_match_id' => $match->id,
                'player_id' => $player->player_id,
                'team_id' => $match->first_team_id,
                'minute' => fake()->numberBetween(1, $isCompleted ? 90 : 70),
            ]);
        }

        for ($i = 0; $i < $match->second_team_score; $i++) {
            $player = $secondTeamPlayers->random();
            MatchEvent::factory()->goal()->create([
                'game_match_id' => $match->id,
                'player_id' => $player->player_id,
                'team_id' => $match->second_team_id,
                'minute' => fake()->numberBetween(1, $isCompleted ? 90 : 70),
            ]);
        }

        // Create other random events
        $eventCount = fake()->numberBetween(2, 8);

        for ($i = 0; $i < $eventCount; $i++) {
            $player = $allPlayers->random();
            $teamId = $firstTeamPlayers->contains('player_id', $player->player_id)
                ? $match->first_team_id
                : $match->second_team_id;

            $eventType = fake()->randomElement(['yellow_card', 'substitution_in', 'substitution_out']);

            $event = MatchEvent::factory()->create([
                'game_match_id' => $match->id,
                'player_id' => $player->player_id,
                'team_id' => $teamId,
                'type' => $eventType,
                'minute' => fake()->numberBetween(1, $isCompleted ? 90 : 70),
            ]);

            // For substitutions, add related player
            if (in_array($eventType, ['substitution_in', 'substitution_out'])) {
                $relatedPlayer = $allPlayers->where('player_id', '!=', $player->player_id)->random();
                $event->update(['related_player_id' => $relatedPlayer->player_id]);
            }
        }

        // Occasionally add red cards (rare events)
        if (fake()->boolean(15)) { // 15% chance
            $player = $allPlayers->random();
            $teamId = $firstTeamPlayers->contains('player_id', $player->player_id)
                ? $match->first_team_id
                : $match->second_team_id;

            MatchEvent::factory()->redCard()->create([
                'game_match_id' => $match->id,
                'player_id' => $player->player_id,
                'team_id' => $teamId,
                'minute' => fake()->numberBetween(20, $isCompleted ? 90 : 70),
            ]);
        }
    }
}
