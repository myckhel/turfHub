<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
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
            'reference' => $this->reference,
            'paystack_reference' => $this->paystack_reference,
            'amount' => [
                'value' => $this->amount,
                'formatted' => '₦' . number_format($this->amount, 2),
                'currency' => $this->currency,
            ],
            'status' => $this->status,
            'payment_type' => $this->payment_type,
            'payment_method' => $this->payment_method,
            'gateway_response' => $this->gateway_response,
            'description' => $this->description,
            'paid_at' => $this->paid_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),

            // Relationships
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ],

            // Polymorphic payable relationship
            'payable' => $this->when($this->payable, function () {
                if ($this->payable instanceof \App\Models\MatchSession) {
                    return [
                        'type' => 'match_session',
                        'id' => $this->payable->id,
                        'name' => $this->payable->name,
                        'session_date' => $this->payable->session_date->format('Y-m-d'),
                        'time_slot' => $this->payable->time_slot,
                        'turf' => $this->whenLoaded('payable.turf', [
                            'id' => $this->payable->turf->id,
                            'name' => $this->payable->turf->name,
                        ]),
                    ];
                } elseif ($this->payable instanceof \App\Models\Team) {
                    return [
                        'type' => 'team',
                        'id' => $this->payable->id,
                        'name' => $this->payable->name,
                        'match_session' => $this->whenLoaded('payable.matchSession', [
                            'id' => $this->payable->matchSession->id,
                            'name' => $this->payable->matchSession->name,
                        ]),
                    ];
                } elseif ($this->payable instanceof \App\Models\Turf) {
                    return [
                        'type' => 'turf',
                        'id' => $this->payable->id,
                        'name' => $this->payable->name,
                        'location' => $this->payable->location,
                    ];
                }

                return [
                    'type' => class_basename($this->payable),
                    'id' => $this->payable->id,
                ];
            }),

            // Legacy relationships for backward compatibility
            'match_session' => $this->when($this->isForMatchSession(), function () {
                return [
                    'id' => $this->payable->id,
                    'name' => $this->payable->name,
                    'session_date' => $this->payable->session_date->format('Y-m-d'),
                    'time_slot' => $this->payable->time_slot,
                    'turf' => $this->whenLoaded('payable.turf', [
                        'id' => $this->payable->turf->id,
                        'name' => $this->payable->turf->name,
                    ]),
                ];
            }),
            'team' => $this->when($this->isForTeam(), function () {
                return [
                    'id' => $this->payable->id,
                    'name' => $this->payable->name,
                ];
            }),

            // Status helpers
            'is_successful' => $this->isSuccessful(),
            'is_pending' => $this->isPending(),
            'has_failed' => $this->hasFailed(),

            // Metadata
            'metadata' => $this->metadata,
        ];
    }
}
