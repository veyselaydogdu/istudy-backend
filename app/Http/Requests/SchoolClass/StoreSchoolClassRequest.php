<?php

namespace App\Http\Requests\SchoolClass;

use Illuminate\Foundation\Http\FormRequest;

class StoreSchoolClassRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->route('school_id')) {
            $this->merge(['school_id' => $this->route('school_id')]);
        }
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'academic_year_id' => ['nullable', 'exists:academic_years,id'],
            'school_id' => ['required', 'exists:schools,id'],
            'description' => ['nullable', 'string'],
            'age_min' => ['nullable', 'integer', 'min:0', 'max:18'],
            'age_max' => ['nullable', 'integer', 'min:0', 'max:18', 'gte:age_min'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'color' => ['required', 'string', 'max:20'],
            'icon' => ['nullable', 'string', 'max:50'],
            'logo' => ['nullable', 'file', 'mimes:jpeg,jpg,png,gif,webp', 'max:10240'],
        ];
    }

    public function withValidator(\Illuminate\Validation\Validator $validator): void
    {
        $validator->after(function (\Illuminate\Validation\Validator $v) {
            if (! $this->filled('icon') && ! $this->hasFile('logo')) {
                $v->errors()->add('icon', 'Sınıf için ikon veya logo seçilmelidir.');
            }
        });
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
