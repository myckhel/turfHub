<?php

namespace Database\Seeders;

use App\Models\GameMatch;
use App\Models\MatchSession;
use App\Models\Team;
use Illuminate\Database\Seeder;

class GameMatchSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $matchSessions = MatchSession::all();

        foreach ($matchSessions as $matchSession) {
            $teams = $matchSession->teams;

            if ($teams->count() < 2) {
                continue; // Need at least 2 teams for a match
            }

            // Create matches based on session status
            if ($matchSession->status === 'completed') {
                // Create multiple completed matches for completed sessions
                $matchCount = fake()->numberBetween(3, min(8, $teams->count()));

                for ($i = 0; $i < $matchCount; $i++) {
                    $firstTeam = $teams->random();
                    $secondTeam = $teams->where('id', '!=', $firstTeam->id)->random();

                    $firstTeamScore = fake()->numberBetween(0, 8);
                    $secondTeamScore = fake()->numberBetween(0, 8);

                    $outcome = 'draw';
                    $winningTeamId = null;

                    if ($firstTeamScore > $secondTeamScore) {
                        $outcome = 'win';
                        $winningTeamId = $firstTeam->id;

                        // Update team stats
                        $firstTeam->increment('wins');
                        $secondTeam->increment('losses');
                    } elseif ($secondTeamScore > $firstTeamScore) {
                        $outcome = 'loss';
                        $winningTeamId = $secondTeam->id;

                        // Update team stats
                        $secondTeam->increment('wins');
                        $firstTeam->increment('losses');
                    } else {
                        // Draw
                        $firstTeam->increment('draws');
                        $secondTeam->increment('draws');
                    }

                    GameMatch::create([
                        'match_session_id' => $matchSession->id,
                        'first_team_id' => $firstTeam->id,
                        'second_team_id' => $secondTeam->id,
                        'first_team_score' => $firstTeamScore,
                        'second_team_score' => $secondTeamScore,
                        'winning_team_id' => $winningTeamId,
                        'outcome' => $outcome,
                        'match_time' => fake()->dateTimeBetween($matchSession->session_date, $matchSession->session_date . ' +4 hours'),
                        'status' => 'completed',
                    ]);
                }
            } elseif ($matchSession->status === 'active') {
                // Create 1-2 matches for active sessions
                $matchCount = fake()->numberBetween(1, 2);

                for ($i = 0; $i < $matchCount; $i++) {
                    $firstTeam = $teams->random();
                    $secondTeam = $teams->where('id', '!=', $firstTeam->id)->random();

                    if ($i === 0) {
                        // First match is in progress
                        GameMatch::factory()->inProgress()->create([
                            'match_session_id' => $matchSession->id,
                            'first_team_id' => $firstTeam->id,
                            'second_team_id' => $secondTeam->id,
                        ]);
                    } else {
                        // Other matches are upcoming
                        GameMatch::factory()->upcoming()->create([
                            'match_session_id' => $matchSession->id,
                            'first_team_id' => $firstTeam->id,
                            'second_team_id' => $secondTeam->id,
                        ]);
                    }
                }
            } else {
                // For scheduled sessions, create upcoming matches
                if ($teams->count() >= 2) {
                    $firstTeam = $teams->random();
                    $secondTeam = $teams->where('id', '!=', $firstTeam->id)->random();

                    GameMatch::factory()->upcoming()->create([
                        'match_session_id' => $matchSession->id,
                        'first_team_id' => $firstTeam->id,
                        'second_team_id' => $secondTeam->id,
                        'match_time' => fake()->dateTimeBetween($matchSession->session_date, $matchSession->session_date . ' +4 hours'),
                    ]);
                }
            }
        }

        // Create some specific match types
        GameMatch::factory()->count(10)->highScoring()->completed()->create();
        GameMatch::factory()->count(15)->lowScoring()->completed()->create();
    }
}
