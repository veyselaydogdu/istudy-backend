<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class StoreTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'owner_user_id' => ['required', 'exists:users,id'],
            'country' => ['nullable', 'string', 'max:5'],
            'currency' => ['nullable', 'string', 'max:5'],
        ];
    }
}
