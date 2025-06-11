<?php

namespace App\Http\Requests;

use App\Models\MatchEvent;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMatchEventRequest extends FormRequest
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
            'game_match_id' => ['required', 'exists:game_matches,id'],
            'player_id' => ['required', 'exists:players,id'],
            'team_id' => ['required', 'exists:teams,id'],
            'type' => ['required', 'string', Rule::in([
                MatchEvent::TYPE_GOAL,
                MatchEvent::TYPE_YELLOW_CARD,
                MatchEvent::TYPE_RED_CARD,
                MatchEvent::TYPE_SUBSTITUTION_IN,
                MatchEvent::TYPE_SUBSTITUTION_OUT,
            ])],
            'minute' => ['required', 'integer', 'min:0', 'max:120'],
            'comment' => ['nullable', 'string', 'max:500'],
            'related_player_id' => ['nullable', 'exists:players,id'],
        ];
    }
}
