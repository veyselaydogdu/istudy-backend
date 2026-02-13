<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Kayıt herkese açık
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'phone' => ['nullable', 'string', 'max:20'],
            'institution_name' => ['required', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:5'],
            'currency' => ['nullable', 'string', 'max:5'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Ad soyad gereklidir.',
            'email.required' => 'E-posta adresi gereklidir.',
            'email.unique' => 'Bu e-posta adresi zaten kayıtlı.',
            'password.min' => 'Şifre en az 8 karakter olmalıdır.',
            'password.confirmed' => 'Şifre tekrarı eşleşmiyor.',
            'institution_name.required' => 'Kurum adı gereklidir.',
        ];
    }
}
