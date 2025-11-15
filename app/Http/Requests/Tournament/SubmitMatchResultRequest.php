<?php

namespace App\Http\Requests\Tournament;

use Illuminate\Foundation\Http\FormRequest;

class SubmitMatchResultRequest extends FormRequest
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
            'home_score' => 'required|integer|min:0',
            'away_score' => 'required|integer|min:0',
            'match_events' => 'nullable|array',
            'match_events.*.type' => 'required_with:match_events|in:goal,yellow_card,red_card,substitution',
            'match_events.*.team_id' => 'required_with:match_events|exists:teams,id',
            'match_events.*.player_id' => 'nullable|exists:players,id',
            'match_events.*.minute' => 'required_with:match_events|integer|min:0',
            'match_events.*.description' => 'nullable|string|max:500',
            'metadata' => 'nullable|array',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'home_score.required' => 'Home team score is required',
            'away_score.required' => 'Away team score is required',
            'home_score.min' => 'Home team score cannot be negative',
            'away_score.min' => 'Away team score cannot be negative',
            'match_events.*.type.in' => 'Invalid match event type',
        ];
    }
}
