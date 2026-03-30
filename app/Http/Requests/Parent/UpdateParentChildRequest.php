<?php

namespace App\Http\Requests\Parent;

use Illuminate\Foundation\Http\FormRequest;

class UpdateParentChildRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['sometimes', 'required', 'string', 'max:100'],
            'last_name' => ['sometimes', 'required', 'string', 'max:100'],
            'birth_date' => ['sometimes', 'required', 'date'],
            'gender' => ['nullable', 'in:male,female,other'],
            'blood_type' => ['nullable', 'string', 'max:10'],
            'identity_number' => ['nullable', 'string', 'max:50'],
            'passport_number' => ['nullable', 'string', 'max:50'],
            'nationality_country_id' => ['nullable', 'integer', 'exists:countries,id'],
            'languages' => ['nullable', 'array'],
            'languages.*' => ['string', 'max:50'],
            'parent_notes' => ['nullable', 'string'],
            'special_notes' => ['nullable', 'string'],
        ];
    }
}
