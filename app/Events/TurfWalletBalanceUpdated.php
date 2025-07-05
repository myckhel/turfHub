<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Turf;

class TurfWalletBalanceUpdated implements ShouldBroadcast
{
  use Dispatchable, InteractsWithSockets, SerializesModels;

  public Turf $turf;
  public float $newBalance;
  public float $previousBalance;
  public string $transactionType;
  public ?string $description;

  /**
   * Create a new event instance.
   */
  public function __construct(
    Turf $turf,
    float $newBalance,
    float $previousBalance,
    string $transactionType,
    ?string $description = null
  ) {
    $this->turf = $turf;
    $this->newBalance = $newBalance;
    $this->previousBalance = $previousBalance;
    $this->transactionType = $transactionType;
    $this->description = $description;
  }

  /**
   * Get the channels the event should broadcast on.
   *
   * @return array<int, \Illuminate\Broadcasting\Channel>
   */
  public function broadcastOn(): array
  {
    return [
      new PrivateChannel('turf.' . $this->turf->id . '.wallet'),
    ];
  }

  /**
   * The event's broadcast name.
   */
  public function broadcastAs(): string
  {
    return 'turf.wallet.balance.updated';
  }

  /**
   * Get the data to broadcast.
   */
  public function broadcastWith(): array
  {
    return [
      'turf_id' => $this->turf->id,
      'new_balance' => $this->newBalance,
      'previous_balance' => $this->previousBalance,
      'transaction_type' => $this->transactionType,
      'description' => $this->description,
      'timestamp' => now()->toISOString(),
    ];
  }
}
