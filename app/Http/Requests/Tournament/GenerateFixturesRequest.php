<?php

namespace App\Http\Requests\Tournament;

use Illuminate\Foundation\Http\FormRequest;

class GenerateFixturesRequest extends FormRequest
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
            'mode' => 'required|in:auto,manual',
            'auto_schedule' => 'sometimes|boolean',
            'start_date' => 'sometimes|date|after_or_equal:today',
            'match_duration' => 'sometimes|integer|min:1|max:120',
            'match_interval' => 'sometimes|integer|min:0|max:60',
            'manual_fixtures' => 'required_if:mode,manual|array',
            'manual_fixtures.*.home_team_id' => 'required_with:manual_fixtures|exists:teams,id',
            'manual_fixtures.*.away_team_id' => 'required_with:manual_fixtures|exists:teams,id|different:manual_fixtures.*.home_team_id',
            'manual_fixtures.*.starts_at' => 'nullable|date',
            'manual_fixtures.*.group_id' => 'nullable|exists:groups,id',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'mode.required' => 'Fixture generation mode is required',
            'mode.in' => 'Invalid fixture generation mode',
            'manual_fixtures.required_if' => 'Manual fixtures data is required when mode is manual',
            'manual_fixtures.*.away_team_id.different' => 'Home and away teams must be different',
        ];
    }
}
