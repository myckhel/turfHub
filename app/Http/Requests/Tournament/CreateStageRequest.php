<?php

namespace App\Http\Requests\Tournament;

use App\Enums\StageType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateStageRequest extends FormRequest
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
      'order' => 'required|integer|min:1',
      'stage_type' => ['required', Rule::enum(StageType::class)],
      'settings' => 'nullable|array',
      'settings.match_duration' => 'nullable|integer|min:1|max:120',
      'settings.match_interval' => 'nullable|integer|min:0|max:60',
      'settings.rounds' => 'nullable|integer|min:1',
      'settings.groups_count' => 'nullable|integer|min:2|max:8',
      'settings.teams_per_group' => 'nullable|integer|min:2',
    ];
  }

  /**
   * Get custom messages for validator errors.
   */
  public function messages(): array
  {
    return [
      'name.required' => 'Stage name is required',
      'order.required' => 'Stage order is required',
      'stage_type.required' => 'Stage type is required',
    ];
  }
}
