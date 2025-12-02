<?php

namespace App\Events;

use App\Models\Stage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

class StagePromoted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Stage $fromStage,
        public Collection $promotedTeams,
        public Stage $toStage
    ) {}

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("tournament.{$this->fromStage->tournament_id}"),
            new PrivateChannel("stage.{$this->fromStage->id}"),
            new PrivateChannel("stage.{$this->toStage->id}"),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'stage.promoted';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'from_stage_id' => $this->fromStage->id,
            'to_stage_id' => $this->toStage->id,
            'promoted_teams_count' => $this->promotedTeams->count(),
            'promoted_team_ids' => $this->promotedTeams->pluck('id')->toArray(),
        ];
    }
}
