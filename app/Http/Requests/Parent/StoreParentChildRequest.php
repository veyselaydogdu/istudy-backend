<?php

namespace App\Http\Requests\Parent;

use Illuminate\Foundation\Http\FormRequest;

class StoreParentChildRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'family_profile_ulid' => ['required', 'string'],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'birth_date' => ['required', 'date'],
            'gender' => ['nullable', 'in:male,female,other'],
            'blood_type' => ['nullable', 'string', 'max:10'],
            'identity_number' => ['nullable', 'string', 'max:50'],
            'passport_number' => ['nullable', 'string', 'max:50'],
            'nationality_country_id' => ['nullable', 'integer', 'exists:countries,id'],
            'languages' => ['nullable', 'array'],
            'languages.*' => ['string', 'max:50'],
            'parent_notes' => ['nullable', 'string'],
            'special_notes' => ['nullable', 'string'],
            'allergen_ids' => ['nullable', 'array'],
            'allergen_ids.*' => ['integer', 'exists:allergens,id'],
            'condition_ids' => ['nullable', 'array'],
            'condition_ids.*' => ['integer', 'exists:medical_conditions,id'],
            'medications' => ['nullable', 'array'],
            'medications.*.medication_id' => ['nullable', 'integer', 'exists:medications,id'],
            'medications.*.custom_name' => ['nullable', 'string', 'max:150'],
            'medications.*.dose' => ['nullable', 'string', 'max:100'],
            'medications.*.usage_time' => ['nullable', 'array'],
            'medications.*.usage_days' => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'family_profile_ulid.required' => 'Aile profili seçimi zorunludur.',
            'first_name.required' => 'Ad zorunludur.',
            'last_name.required' => 'Soyad zorunludur.',
            'birth_date.required' => 'Doğum tarihi zorunludur.',
        ];
    }
}
