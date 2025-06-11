<?php

namespace Database\Seeders;

use App\Models\Team;
use App\Models\MatchSession;
use App\Models\Player;
use App\Models\User;
use Illuminate\Database\Seeder;

class TeamSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $matchSessions = MatchSession::all();

        foreach ($matchSessions as $matchSession) {
            // Create 4-8 teams per match session as per spec
            $teamCount = fake()->numberBetween(4, $matchSession->max_teams);

            // Get players from the same turf
            $turfPlayers = Player::where('turf_id', $matchSession->turf_id)
                ->where('status', 'active')
                ->get();

            if ($turfPlayers->count() < $teamCount) {
                // If not enough players, create some
                $neededPlayers = $teamCount - $turfPlayers->count();
                for ($i = 0; $i < $neededPlayers; $i++) {
                    Player::factory()->create([
                        'turf_id' => $matchSession->turf_id,
                        'status' => 'active',
                    ]);
                }
                $turfPlayers = Player::where('turf_id', $matchSession->turf_id)
                    ->where('status', 'active')
                    ->get();
            }

            for ($i = 0; $i < $teamCount; $i++) {
                // Select a random captain from turf players
                $captain = $turfPlayers->random();

                $team = Team::factory()->create([
                    'match_session_id' => $matchSession->id,
                    'captain_id' => $captain->user_id,
                ]);

                // Assign realistic team status based on match session status
                if ($matchSession->status === 'completed') {
                    $team->update([
                        'status' => fake()->randomElement(['eliminated', 'waiting']),
                    ]);
                } elseif ($matchSession->status === 'active') {
                    $team->update([
                        'status' => fake()->randomElement(['active_in_match', 'waiting', 'waiting']), // More waiting teams
                    ]);
                } else {
                    $team->update([
                        'status' => 'waiting',
                    ]);
                }
            }
        }

        // Create some teams with specific performance stats
        Team::factory()->count(10)->topPerformer()->create();
        Team::factory()->count(8)->underPerformer()->create();
    }
}
