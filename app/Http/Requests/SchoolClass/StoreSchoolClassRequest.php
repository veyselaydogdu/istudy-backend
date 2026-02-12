<?php

namespace App\Http\Requests\SchoolClass;

use Illuminate\Foundation\Http\FormRequest;

class StoreSchoolClassRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Controller handles authorization via policy or BaseSchoolController
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'grade_level' => ['required', 'integer', 'min:1'],
            'branch' => ['nullable', 'string', 'max:10'],
            'academic_year_id' => ['required', 'exists:academic_years,id'],
            'school_id' => ['required', 'exists:schools,id'],
            'capacity' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
