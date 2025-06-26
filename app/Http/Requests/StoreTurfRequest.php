<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTurfRequest extends FormRequest
{
  /**
   * Determine if the user is authorized to make this request.
   */
  public function authorize(): bool
  {
    return true; // Adjust based on your authorization logic
  }

  /**
   * Get the validation rules that apply to the request.
   *
   * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
   */
  public function rules(): array
  {
    return [
      'name' => ['required', 'string', 'max:255'],
      'description' => ['nullable', 'string', 'max:1000'],
      'location' => ['required', 'string', 'max:255'],
      'owner_id' => ['exists:users,id'],
      'requires_membership' => ['boolean'],
      'membership_fee' => ['nullable', 'numeric', 'min:0'],
      'membership_type' => ['nullable', 'string', 'max:100'],
      'max_players_per_team' => ['required', 'integer', 'min:1', 'max:15'],
      'team_slot_fee' => ['nullable', 'numeric', 'min:0'],
      'is_active' => ['boolean'],
    ];
  }
}
