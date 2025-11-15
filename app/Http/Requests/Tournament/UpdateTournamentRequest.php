<?php

namespace App\Http\Requests\Tournament;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTournamentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'settings' => 'sometimes|array',
            'settings.location' => 'nullable|string|max:255',
            'settings.rules' => 'nullable|string',
            'settings.prize_pool' => 'nullable|numeric|min:0',
            'starts_at' => 'sometimes|date',
            'ends_at' => 'sometimes|date|after:starts_at',
            'status' => 'sometimes|in:pending,active,completed,cancelled',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'ends_at.after' => 'End date must be after start date',
            'status.in' => 'Invalid tournament status',
        ];
    }
}
