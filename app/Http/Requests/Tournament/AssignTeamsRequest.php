<?php

namespace App\Http\Requests\Tournament;

use Illuminate\Foundation\Http\FormRequest;

class AssignTeamsRequest extends FormRequest
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
            'team_ids' => 'required|array|min:2',
            'team_ids.*' => 'exists:teams,id|distinct',
            'seeds' => 'nullable|array',
            'seeds.*' => 'integer|min:1',
            'group_assignments' => 'nullable|array',
            'group_assignments.*' => 'integer|min:1',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'team_ids.required' => 'At least one team is required',
            'team_ids.min' => 'At least 2 teams are required for a stage',
            'team_ids.*.exists' => 'One or more selected teams do not exist',
            'team_ids.*.distinct' => 'Duplicate teams are not allowed',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->has('seeds') && count($this->seeds) !== count($this->team_ids)) {
                $validator->errors()->add('seeds', 'Seeds count must match teams count');
            }

            if ($this->has('group_assignments') && count($this->group_assignments) !== count($this->team_ids)) {
                $validator->errors()->add('group_assignments', 'Group assignments count must match teams count');
            }
        });
    }
}
