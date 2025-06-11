<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePlayerRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Adjust based on your authorization logic
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'user_id' => ['required', 'exists:users,id'],
            'turf_id' => ['required', 'exists:turfs,id'],
            'is_member' => ['boolean'],
            'status' => ['required', 'string', 'max:50'],
        ];
    }

    /**
     * Get custom validation messages.
     */
    public function messages(): array
    {
        return [
            'user_id.required' => 'A user must be selected.',
            'user_id.exists' => 'The selected user does not exist.',
            'turf_id.required' => 'A turf must be selected.',
            'turf_id.exists' => 'The selected turf does not exist.',
        ];
    }
}
