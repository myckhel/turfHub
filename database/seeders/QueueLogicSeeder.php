<?php

namespace Database\Seeders;

use App\Models\QueueLogic;
use App\Models\MatchSession;
use App\Models\Team;
use Illuminate\Database\Seeder;

class QueueLogicSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $activeSessions = MatchSession::where('status', 'active')->get();

        foreach ($activeSessions as $session) {
            $teams = $session->teams;

            if ($teams->isEmpty()) {
                continue;
            }

            // Create queue logic for each team in active sessions
            $queuePosition = 1;

            foreach ($teams as $index => $team) {
                if ($index < 2) {
                    // First two teams are next to play or playing
                    QueueLogic::factory()->nextToPlay()->create([
                        'match_session_id' => $session->id,
                        'team_id' => $team->id,
                        'queue_position' => $queuePosition++,
                    ]);
                } else {
                    // Other teams are waiting with different reasons
                    $reasons = ['initial_join', 'win', 'loss', 'draw_reentry_random'];
                    $reason = fake()->randomElement($reasons);

                    $status = 'waiting';
                    if ($reason === 'draw_reentry_random') {
                        $status = 'played_waiting_draw_resolution';
                    }

                    QueueLogic::factory()->create([
                        'match_session_id' => $session->id,
                        'team_id' => $team->id,
                        'queue_position' => $queuePosition++,
                        'status' => $status,
                        'reason_for_current_position' => $reason,
                    ]);
                }
            }
        }

        // Create some queue entries for scheduled sessions
        $scheduledSessions = MatchSession::where('status', 'scheduled')->take(10)->get();

        foreach ($scheduledSessions as $session) {
            $teams = $session->teams->take(6); // Limit to 6 teams for scheduled sessions

            foreach ($teams as $index => $team) {
                QueueLogic::factory()->initialJoin()->create([
                    'match_session_id' => $session->id,
                    'team_id' => $team->id,
                    'queue_position' => $index + 1,
                ]);
            }
        }

        // Create some specific queue states
        QueueLogic::factory()->count(15)->afterWin()->create();
        QueueLogic::factory()->count(10)->afterLoss()->create();
        QueueLogic::factory()->count(8)->afterDraw()->create();
    }
}
