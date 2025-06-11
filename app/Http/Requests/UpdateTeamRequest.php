<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTeamRequest extends FormRequest
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
            'match_session_id' => ['sometimes', 'required', 'exists:match_sessions,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'captain_id' => ['sometimes', 'required', 'exists:users,id'],
            'status' => ['sometimes', 'required', 'string', 'max:50'],
            'wins' => ['sometimes', 'integer', 'min:0'],
            'losses' => ['sometimes', 'integer', 'min:0'],
            'draws' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
