<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SetGameResultRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization is handled by the policy in the controller
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'game_match_id' => ['required', 'integer', 'exists:game_matches,id'],
            'first_team_score' => ['required', 'integer', 'min:0', 'max:50'],
            'second_team_score' => ['required', 'integer', 'min:0', 'max:50'],
        ];
    }

    /**
     * Get custom error messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'game_match_id.required' => 'Game match ID is required.',
            'game_match_id.exists' => 'The selected game match does not exist.',
            'first_team_score.required' => 'First team score is required.',
            'first_team_score.min' => 'First team score must be at least 0.',
            'first_team_score.max' => 'First team score cannot exceed 50.',
            'second_team_score.required' => 'Second team score is required.',
            'second_team_score.min' => 'Second team score must be at least 0.',
            'second_team_score.max' => 'Second team score cannot exceed 50.',
        ];
    }
}
