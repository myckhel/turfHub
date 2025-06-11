<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreQueueLogicRequest extends FormRequest
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
            'match_session_id' => ['required', 'exists:match_sessions,id'],
            'team_id' => ['required', 'exists:teams,id'],
            'queue_position' => ['required', 'integer', 'min:1'],
            'status' => ['required', 'string', 'max:100'],
            'reason_for_current_position' => ['nullable', 'string', 'max:255'],
        ];
    }
}
