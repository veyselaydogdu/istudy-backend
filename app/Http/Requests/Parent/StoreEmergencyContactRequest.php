<?php

namespace App\Http\Requests\Parent;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmergencyContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'phone' => ['required', 'string', 'max:30'],
            'phone_country_code' => ['nullable', 'string', 'max:10'],
            'relationship' => ['required', 'string', 'max:100'],
            'photo' => ['nullable', 'string', 'max:500'],
            'identity_number' => ['nullable', 'string', 'max:50'],
            'passport_number' => ['nullable', 'string', 'max:50'],
            'nationality_country_id' => ['nullable', 'integer', 'exists:countries,id'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.required' => 'Ad zorunludur.',
            'last_name.required' => 'Soyad zorunludur.',
            'phone.required' => 'Telefon numarası zorunludur.',
            'relationship.required' => 'İlişki türü zorunludur.',
        ];
    }
}
