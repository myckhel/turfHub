<?php

namespace App\Http\Requests;

use App\Models\MatchSession;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMatchSessionRequest extends FormRequest
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
            'turf_id' => ['sometimes', 'required', 'exists:turfs,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'session_date' => ['sometimes', 'required', 'date'],
            'time_slot' => ['sometimes', 'required', 'string', Rule::in([
                MatchSession::TIME_SLOT_MORNING,
                MatchSession::TIME_SLOT_EVENING,
            ])],
            'start_time' => ['sometimes', 'required', 'date_format:H:i'],
            'end_time' => ['sometimes', 'required', 'date_format:H:i', 'after:start_time'],
            'max_teams' => ['sometimes', 'required', 'integer', 'min:4', 'max:8'],
            'status' => ['sometimes', 'required', 'string', 'max:50'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
