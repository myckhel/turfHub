<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\User;

class WalletBalanceUpdated implements ShouldBroadcast
{
  use Dispatchable, InteractsWithSockets, SerializesModels;

  public User $user;
  public float $newBalance;
  public float $previousBalance;
  public string $transactionType;
  public ?string $description;

  /**
   * Create a new event instance.
   */
  public function __construct(
    User $user,
    float $newBalance,
    ?float $previousBalance = 0.0,
    string $transactionType,
    ?string $description = null
  ) {
    $this->user = $user;
    $this->newBalance = $newBalance;
    $this->previousBalance = $previousBalance ?? 0;
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
      new PrivateChannel('user.' . $this->user->id . '.wallet'),
    ];
  }

  /**
   * The event's broadcast name.
   */
  public function broadcastAs(): string
  {
    return 'wallet.balance.updated';
  }

  /**
   * Get the data to broadcast.
   */
  public function broadcastWith(): array
  {
    return [
      'user_id' => $this->user->id,
      'new_balance' => $this->newBalance,
      'previous_balance' => $this->previousBalance,
      'transaction_type' => $this->transactionType,
      'description' => $this->description,
      'timestamp' => now()->toISOString(),
    ];
  }
}
