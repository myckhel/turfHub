<?php

namespace App\Events;

use App\Models\GameMatch;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MatchCompleted implements ShouldBroadcast
{
  use Dispatchable, InteractsWithSockets, SerializesModels;

  /**
   * Create a new event instance.
   */
  public function __construct(
    public GameMatch $fixture,
    public ?int $winnerId,
    public int $firstTeamScore,
    public int $secondTeamScore
  ) {}

  /**
   * Get the channels the event should broadcast on.
   */
  public function broadcastOn(): array
  {
    return [
      new PrivateChannel("tournament.{$this->fixture->stage_id}"),
      new PrivateChannel("match.{$this->fixture->id}"),
    ];
  }

  /**
   * The event's broadcast name.
   */
  public function broadcastAs(): string
  {
    return 'match.completed';
  }

  /**
   * Get the data to broadcast.
   */
  public function broadcastWith(): array
  {
    return [
      'fixture_id' => $this->fixture->id,
      'stage_id' => $this->fixture->stage_id,
      'winner_id' => $this->winnerId,
      'first_team_score' => $this->firstTeamScore,
      'second_team_score' => $this->secondTeamScore,
    ];
  }
}
