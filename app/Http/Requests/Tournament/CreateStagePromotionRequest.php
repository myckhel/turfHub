<?php

namespace App\Http\Requests\Tournament;

use App\Enums\PromotionRuleType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateStagePromotionRequest extends FormRequest
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
      'next_stage_id' => 'required|exists:stages,id',
      'rule_type' => ['required', Rule::enum(PromotionRuleType::class)],
      'rule_config' => 'required|array',
      'rule_config.n' => 'required_if:rule_type,top_n,top_per_group|integer|min:1',
      'rule_config.threshold' => 'required_if:rule_type,points_threshold|integer|min:1',
    ];
  }

  /**
   * Get custom messages for validator errors.
   */
  public function messages(): array
  {
    return [
      'next_stage_id.required' => 'Next stage is required for promotion',
      'next_stage_id.exists' => 'The selected next stage does not exist',
      'rule_type.required' => 'Promotion rule type is required',
      'rule_config.n.required_if' => 'Number of teams to promote is required for this rule type',
      'rule_config.threshold.required_if' => 'Points threshold is required for this rule type',
    ];
  }
}
