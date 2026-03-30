<?php

namespace App\Http\Requests\FamilyProfile;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFamilyProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'family_name' => ['sometimes', 'required', 'string', 'max:255'],
        ];
    }
}
