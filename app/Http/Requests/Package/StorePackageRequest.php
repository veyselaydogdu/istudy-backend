<?php

namespace App\Http\Requests\Package;

use Illuminate\Foundation\Http\FormRequest;

class StorePackageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Route middleware ile Super Admin kontrolü yapılır
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'max_schools' => ['required', 'integer', 'min:0'],
            'max_classes_per_school' => ['required', 'integer', 'min:0'],
            'max_students' => ['required', 'integer', 'min:0'],
            'monthly_price' => ['required', 'numeric', 'min:0'],
            'yearly_price' => ['required', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'features' => ['nullable', 'array'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Paket adı gereklidir.',
            'max_schools.required' => 'Maksimum okul sayısı gereklidir.',
            'max_classes_per_school.required' => 'Okul başına maksimum sınıf sayısı gereklidir.',
            'max_students.required' => 'Maksimum öğrenci sayısı gereklidir.',
            'monthly_price.required' => 'Aylık fiyat gereklidir.',
            'yearly_price.required' => 'Yıllık fiyat gereklidir.',
        ];
    }
}
