<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class JoinTurfRequest extends FormRequest
{
  /**
   * Determine if the user is authorized to make this request.
   */
  public function authorize(): bool
  {
    return true; // Authorization is handled by the policy
  }

  /**
   * Get the validation rules that apply to the request.
   *
   * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
   */
  public function rules(): array
  {
    return [
      'is_member' => ['boolean'],
    ];
  }

  /**
   * Get the validation messages.
   *
   * @return array<string, string>
   */
  public function messages(): array
  {
    return [
      'is_member.boolean' => 'The is_member field must be true or false.',
    ];
  }
}
