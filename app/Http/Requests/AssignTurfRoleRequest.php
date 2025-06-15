<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class AssignTurfRoleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var \App\Models\Turf $turf */
        $turf = $this->route('turf');

        // Check if user can invite players or is the owner
        if ($turf && $turf->owner_id === Auth::id()) {
            return true;
        }

        // Check if user has permission to invite players
        if ($turf) {
            $turfPermissionService = app(\App\Services\TurfPermissionService::class);
            return $turfPermissionService->userCanInTurf(Auth::user(), 'invite players', $turf->id);
        }

        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'user_id' => [
                'required',
                'integer',
                'exists:users,id',
            ],
            'role' => [
                'required',
                'string',
                Rule::in([
                    User::TURF_ROLE_ADMIN,
                    User::TURF_ROLE_MANAGER,
                    User::TURF_ROLE_PLAYER,
                ]),
            ],
        ];
    }

    /**
     * Get custom messages for validation errors.
     */
    public function messages(): array
    {
        return [
            'user_id.required' => 'A user must be selected.',
            'user_id.exists' => 'The selected user does not exist.',
            'role.required' => 'A role must be selected.',
            'role.in' => 'The selected role is invalid.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'user_id' => 'user',
            'role' => 'role',
        ];
    }
}
