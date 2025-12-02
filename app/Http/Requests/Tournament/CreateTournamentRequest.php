<?php

namespace App\Http\Requests\Tournament;

use App\Enums\TournamentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateTournamentRequest extends FormRequest
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
            'name' => 'required|string|max:255',
            'turf_id' => 'required|exists:turfs,id',
            'type' => ['required', Rule::enum(TournamentType::class)],
            'settings' => 'nullable|array',
            'settings.location' => 'nullable|string|max:255',
            'settings.rules' => 'nullable|string',
            'settings.prize_pool' => 'nullable|numeric|min:0',
            'starts_at' => 'required|date|after_or_equal:today',
            'ends_at' => 'nullable|date|after:starts_at',
            'stages' => 'nullable|array',
            'stages.*.name' => 'required|string|max:255',
            'stages.*.order' => 'nullable|integer|min:1',
            'stages.*.stage_type' => 'required|in:league,group,knockout,swiss,king_of_hill,custom',
            'stages.*.settings' => 'nullable|array',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Tournament name is required',
            'turf_id.required' => 'Turf selection is required',
            'turf_id.exists' => 'Selected turf does not exist',
            'starts_at.required' => 'Tournament start date is required',
            'starts_at.after_or_equal' => 'Tournament cannot start in the past',
            'ends_at.after' => 'End date must be after start date',
        ];
    }
}
