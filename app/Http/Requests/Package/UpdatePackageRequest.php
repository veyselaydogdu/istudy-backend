<?php

namespace App\Http\Requests\Package;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePackageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'max_schools' => ['sometimes', 'integer', 'min:0'],
            'max_classes_per_school' => ['sometimes', 'integer', 'min:0'],
            'max_students' => ['sometimes', 'integer', 'min:0'],
            'monthly_price' => ['sometimes', 'numeric', 'min:0'],
            'yearly_price' => ['sometimes', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'features' => ['nullable', 'array'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'package_features' => ['nullable', 'array'],
            'package_features.*.feature_id' => ['required', 'exists:package_features,id'],
            'package_features.*.value' => ['nullable', 'string'],
        ];
    }
}
