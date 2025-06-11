<?php

namespace Database\Seeders;

use App\Models\TeamPlayer;
use App\Models\Team;
use App\Models\Player;
use Illuminate\Database\Seeder;

class TeamPlayerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $teams = Team::all();

        foreach ($teams as $team) {
            $matchSession = $team->matchSession;
            $maxPlayersPerTeam = $matchSession->turf->max_players_per_team;

            // Get players from the same turf
            $availablePlayers = Player::where('turf_id', $matchSession->turf_id)
                ->where('status', 'active')
                ->get();

            if ($availablePlayers->isEmpty()) {
                continue;
            }

            // Assign 3 to max_players_per_team players to each team
            $playersInTeam = fake()->numberBetween(3, min($maxPlayersPerTeam, $availablePlayers->count()));
            $selectedPlayers = $availablePlayers->random($playersInTeam);

            foreach ($selectedPlayers as $player) {
                // Check if this player is already in this team to avoid duplicates
                $existingTeamPlayer = TeamPlayer::where('team_id', $team->id)
                    ->where('player_id', $player->id)
                    ->first();

                if (!$existingTeamPlayer) {
                    TeamPlayer::factory()->create([
                        'team_id' => $team->id,
                        'player_id' => $player->id,
                        'join_time' => fake()->dateTimeBetween('-2 hours', 'now'),
                        'status' => fake()->randomElement(['active', 'active', 'active', 'benched']), // More active players
                    ]);
                }
            }
        }

        // Create some specific team player states
        TeamPlayer::factory()->count(20)->benched()->create();
        TeamPlayer::factory()->count(10)->substitutedOut()->create();
    }
}
