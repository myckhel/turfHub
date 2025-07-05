<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BankAccountResource extends JsonResource
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
            'bank_name' => $this->bank_name,
            'bank_code' => $this->bank_code,
            'account_number' => $this->account_number,
            'account_name' => $this->account_name,
            'is_active' => $this->is_active,
            'is_verified' => $this->is_verified,
            'verified_at' => $this->verified_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Only include sensitive data for the account owner
            $this->mergeWhen($this->shouldShowSensitiveData(), [
                'paystack_recipient_code' => $this->paystack_recipient_code,
                'metadata' => $this->metadata,
            ]),
        ];
    }

    /**
     * Determine if sensitive data should be shown
     */
    private function shouldShowSensitiveData(): bool
    {
        // This logic can be expanded to check user permissions
        return true; // For now, always show if the user can access the resource
    }
}
