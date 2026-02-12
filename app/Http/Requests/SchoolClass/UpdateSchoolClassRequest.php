<?php

namespace App\Http\Requests\SchoolClass;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSchoolClassRequest extends FormRequest
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
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'grade_level' => ['sometimes', 'integer', 'min:1'],
            'branch' => ['nullable', 'string', 'max:10'],
            'academic_year_id' => ['sometimes', 'exists:academic_years,id'],
            'school_id' => ['sometimes', 'exists:schools,id'],
            'capacity' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
