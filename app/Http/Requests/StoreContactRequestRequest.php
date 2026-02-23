<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreContactRequestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
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
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'email' => ['required', 'email', 'max:255'],
            'subject' => ['required', 'string', 'min:3', 'max:200'],
            'message' => ['required', 'string', 'min:10', 'max:5000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Ad alanı zorunludur.',
            'name.min' => 'Ad en az 2 karakter olmalıdır.',
            'email.required' => 'E-posta alanı zorunludur.',
            'email.email' => 'Geçerli bir e-posta adresi giriniz.',
            'subject.required' => 'Konu alanı zorunludur.',
            'subject.min' => 'Konu en az 3 karakter olmalıdır.',
            'message.required' => 'Mesaj alanı zorunludur.',
            'message.min' => 'Mesaj en az 10 karakter olmalıdır.',
        ];
    }
}
