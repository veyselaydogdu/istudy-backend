<?php

namespace App\Http\Requests\SchoolClass;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSchoolClassRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'academic_year_id' => ['sometimes', 'nullable', 'exists:academic_years,id'],
            'school_id' => ['sometimes', 'exists:schools,id'],
            'description' => ['nullable', 'string'],
            'age_min' => ['nullable', 'integer', 'min:0', 'max:18'],
            'age_max' => ['nullable', 'integer', 'min:0', 'max:18', 'gte:age_min'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'color' => ['sometimes', 'required', 'string', 'max:20'],
            'icon' => ['nullable', 'string', 'max:50'],
            'logo' => ['nullable', 'file', 'mimes:jpeg,jpg,png,gif,webp', 'max:10240'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'color.required' => 'Sınıf rengi zorunludur.',
            'logo.max' => 'Logo dosyası en fazla 10 MB olabilir.',
            'logo.mimes' => 'Logo yalnızca JPEG, PNG, GIF veya WebP formatında olabilir.',
        ];
    }
}
