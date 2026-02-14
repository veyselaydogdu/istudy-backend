<?php

namespace App\Http\Requests\EnrollmentRequest;

use Illuminate\Foundation\Http\FormRequest;

class StoreEnrollmentRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'school_id' => 'required|exists:schools,id',
            'family_profile_id' => 'nullable|exists:family_profiles,id',
            'message' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'school_id.required' => 'Okul seçimi zorunludur.',
            'school_id.exists' => 'Geçersiz okul.',
        ];
    }
}
