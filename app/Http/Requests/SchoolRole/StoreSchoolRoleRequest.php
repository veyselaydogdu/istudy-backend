<?php

namespace App\Http\Requests\SchoolRole;

use Illuminate\Foundation\Http\FormRequest;

class StoreSchoolRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'school_id' => 'required|exists:schools,id',
            'class_id' => 'nullable|exists:classes,id',
            'name' => 'required|string|max:100',
            'slug' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:500',
            'is_active' => 'nullable|boolean',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|max:100',
        ];
    }

    public function messages(): array
    {
        return [
            'school_id.required' => 'Okul seçimi zorunludur.',
            'name.required' => 'Rol adı zorunludur.',
        ];
    }
}
