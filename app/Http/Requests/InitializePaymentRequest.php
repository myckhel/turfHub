<?php

namespace App\Http\Requests;

use App\Models\Payment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InitializePaymentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'match_session_id' => ['required', 'exists:match_sessions,id'],
            'team_id' => ['nullable', 'exists:teams,id'],
            'amount' => ['required', 'numeric', 'min:100', 'max:100000'], // ₦100 to ₦100,000
            'payment_type' => [
                'required',
                'string',
                Rule::in([
                    Payment::TYPE_SESSION_FEE,
                    Payment::TYPE_TEAM_JOINING_FEE,
                    Payment::TYPE_TURF_BOOKING,
                    Payment::TYPE_MEMBERSHIP_FEE,
                    Payment::TYPE_EQUIPMENT_RENTAL,
                    Payment::TYPE_TOURNAMENT_FEE,
                ])
            ],
            'description' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     */
    public function messages(): array
    {
        return [
            'match_session_id.required' => 'Match session is required.',
            'match_session_id.exists' => 'Selected match session does not exist.',
            'team_id.exists' => 'Selected team does not exist.',
            'amount.required' => 'Payment amount is required.',
            'amount.numeric' => 'Payment amount must be a valid number.',
            'amount.min' => 'Payment amount must be at least ₦100.',
            'amount.max' => 'Payment amount cannot exceed ₦50,000.',
            'payment_type.required' => 'Payment type is required.',
            'payment_type.in' => 'Invalid payment type selected.',
        ];
    }
}
