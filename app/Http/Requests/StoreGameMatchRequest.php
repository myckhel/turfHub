<?php

namespace App\Http\Requests;

use App\Models\GameMatch;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGameMatchRequest extends FormRequest
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
      'match_session_id' => ['nullable', 'required_without:turf_id', 'exists:match_sessions,id'],
      'turf_id' => ['nullable', 'required_without:match_session_id', 'exists:turfs,id'],
      'first_team_id' => ['required', 'exists:teams,id'],
      'second_team_id' => ['required', 'exists:teams,id', 'different:first_team_id'],
      'first_team_score' => ['integer', 'min:0'],
      'second_team_score' => ['integer', 'min:0'],
      'winning_team_id' => ['nullable', 'exists:teams,id'],
      'outcome' => ['nullable', 'string', Rule::in([
        GameMatch::OUTCOME_WIN,
        GameMatch::OUTCOME_LOSS,
        GameMatch::OUTCOME_DRAW,
      ])],
      'match_time' => ['nullable', 'date'],
      'starts_at' => ['nullable', 'date'],
      'status' => ['required', 'string', 'max:50'],
      'betting_enabled' => ['boolean'],
    ];
  }
}
