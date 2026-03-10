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
            'color' => ['nullable', 'string', 'max:20'],
        ];
    }
}
