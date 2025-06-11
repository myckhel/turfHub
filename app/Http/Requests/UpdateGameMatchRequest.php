<?php

namespace App\Http\Requests;

use App\Models\GameMatch;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateGameMatchRequest extends FormRequest
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
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'match_session_id' => ['sometimes', 'required', 'exists:match_sessions,id'],
            'first_team_id' => ['sometimes', 'required', 'exists:teams,id'],
            'second_team_id' => ['sometimes', 'required', 'exists:teams,id', 'different:first_team_id'],
            'first_team_score' => ['sometimes', 'integer', 'min:0'],
            'second_team_score' => ['sometimes', 'integer', 'min:0'],
            'winning_team_id' => ['sometimes', 'nullable', 'exists:teams,id'],
            'outcome' => ['sometimes', 'nullable', 'string', Rule::in([
                GameMatch::OUTCOME_WIN,
                GameMatch::OUTCOME_LOSS,
                GameMatch::OUTCOME_DRAW,
            ])],
            'match_time' => ['sometimes', 'nullable', 'date'],
            'status' => ['sometimes', 'required', 'string', 'max:50'],
        ];
    }
}
