<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StagePromotionResource extends JsonResource
{
  /**
   * Transform the resource into an array.
   *
   * @return array<string, mixed>
   */
  public function toArray(Request $request): array
  {
    return [
      'id' => $this->id,
      'stage_id' => $this->stage_id,
      'next_stage_id' => $this->next_stage_id,
      'rule_type' => $this->rule_type,
      'rule_config' => $this->rule_config,
      'created_at' => $this->created_at,
      'updated_at' => $this->updated_at,
      'next_stage' => new StageResource($this->whenLoaded('nextStage')),
    ];
  }
}
