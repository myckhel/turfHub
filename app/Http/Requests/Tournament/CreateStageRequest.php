<?php

namespace App\Http\Requests\Tournament;

use App\Enums\PromotionRuleType;
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
            'next_stage_id' => 'nullable|exists:stages,id',
            'promotion_rule' => 'nullable|array',
            'promotion_rule.rule_type' => ['required_with:promotion_rule', Rule::enum(PromotionRuleType::class)],
            'promotion_rule.rule_config' => 'required_with:promotion_rule|array',
            'promotion_rule.rule_config.n' => 'required_if:promotion_rule.rule_type,top_n,top_per_group|integer|min:1',
            'promotion_rule.rule_config.threshold' => 'required_if:promotion_rule.rule_type,points_threshold|integer|min:1',
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
            'promotion_rule.rule_config.n.required_if' => 'Number of teams to promote is required',
            'promotion_rule.rule_config.threshold.required_if' => 'Points threshold is required',
        ];
    }
}
