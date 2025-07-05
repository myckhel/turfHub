<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WalletTransactionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'type' => $this->type,
            'amount' => $this->amount,
            'formatted_amount' => '₦' . number_format($this->amount, 2),
            'confirmed' => $this->confirmed,
            'meta' => $this->meta,
            'description' => $this->getDescription(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    /**
     * Get a human-readable description for the transaction
     */
    private function getDescription(): string
    {
        $meta = $this->meta ?? [];

        if (isset($meta['description'])) {
            return $meta['description'];
        }

        switch ($this->type) {
            case 'deposit':
                return 'Wallet deposit';
            case 'withdraw':
                return 'Wallet withdrawal';
            default:
                return ucfirst($this->type) . ' transaction';
        }
    }
}
