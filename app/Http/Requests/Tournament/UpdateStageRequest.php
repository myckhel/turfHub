<?php

namespace App\Http\Requests\Tournament;

use App\Enums\StageStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStageRequest extends FormRequest
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
      'name' => 'sometimes|string|max:255',
      'order' => 'sometimes|integer|min:1',
      'settings' => 'sometimes|array',
      // Common settings
      'settings.match_duration' => 'nullable|integer|min:1|max:120',
      'settings.match_interval' => 'nullable|integer|min:0|max:60',
      // League and Group stage settings
      'settings.rounds' => 'nullable|integer|min:1',
      'settings.home_and_away' => 'nullable|boolean',
      // Group stage specific
      'settings.groups_count' => 'nullable|integer|min:2|max:8',
      'settings.teams_per_group' => 'nullable|integer|min:2',
      // Knockout stage specific
      'settings.legs' => 'nullable|integer|in:1,2',
      'settings.third_place_match' => 'nullable|boolean',
      'settings.seeding' => 'nullable|boolean',
      // Scoring system
      'settings.scoring' => 'nullable|array',
      'settings.scoring.win' => 'nullable|integer|min:0',
      'settings.scoring.draw' => 'nullable|integer|min:0',
      'settings.scoring.loss' => 'nullable|integer|min:0',
      // Tie breakers
      'settings.tie_breakers' => 'nullable|array',
      'settings.tie_breakers.*' => 'string|in:goal_difference,goals_for,head_to_head,fair_play,random',
      'status' => ['sometimes', Rule::enum(StageStatus::class)],
      // Promotion rules
      'next_stage_id' => 'sometimes|integer|exists:stages,id',
      'rule_type' => 'sometimes|string|in:top_n,top_per_group,points_threshold,custom',
      'rule_config' => 'sometimes|array',
    ];
  }
}
