<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTurfSettingsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('turf'));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'settings' => 'sometimes|array',
            'settings.payment_methods' => 'sometimes|array',
            'settings.payment_methods.cash_enabled' => 'sometimes|boolean',
            'settings.payment_methods.wallet_enabled' => 'sometimes|boolean',
            'settings.payment_methods.online_enabled' => 'sometimes|boolean',
        ];
    }

    /**
     * Get custom validation messages.
     */
    public function messages(): array
    {
        return [
            'settings.array' => 'Settings must be a valid object.',
            'settings.payment_methods.array' => 'Payment methods must be a valid object.',
            'settings.payment_methods.cash_enabled.boolean' => 'Cash payment setting must be true or false.',
            'settings.payment_methods.wallet_enabled.boolean' => 'Wallet payment setting must be true or false.',
            'settings.payment_methods.online_enabled.boolean' => 'Online payment setting must be true or false.',
        ];
    }
}
