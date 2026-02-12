<?php

namespace App\Http\Requests\FamilyProfile;

use Illuminate\Foundation\Http\FormRequest;

class StoreFamilyProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'owner_user_id' => ['required', 'exists:users,id'],
            'tenant_id' => ['required', 'exists:tenants,id'],
            'family_name' => ['nullable', 'string', 'max:255'],
        ];
    }
}
