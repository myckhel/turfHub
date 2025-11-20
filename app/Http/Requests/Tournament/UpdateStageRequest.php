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
            'settings.match_duration' => 'nullable|integer|min:1|max:120',
            'settings.match_interval' => 'nullable|integer|min:0|max:60',
            'settings.rounds' => 'nullable|integer|min:1',
            'status' => ['sometimes', Rule::enum(StageStatus::class)],
        ];
    }
}
