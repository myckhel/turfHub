<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTeamRequest extends FormRequest
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
      'match_session_id' => ['nullable', 'required_without_all:tournament_id,turf_id', 'exists:match_sessions,id'],
      'tournament_id' => ['nullable', 'required_without_all:match_session_id,turf_id', 'exists:tournaments,id'],
      'turf_id' => ['nullable', 'required_without_all:match_session_id,tournament_id', 'exists:turfs,id'],
      'name' => ['required', 'string', 'max:255'],
      'color' => ['nullable', 'string', 'max:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
      'captain_id' => ['nullable', 'exists:players,id'],
      'status' => ['nullable', 'string', 'max:50'],
      'wins' => ['integer', 'min:0'],
      'losses' => ['integer', 'min:0'],
      'draws' => ['integer', 'min:0'],
      'metadata' => ['nullable', 'array'],
    ];
  }
}
