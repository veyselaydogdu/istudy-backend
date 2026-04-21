<?php

namespace App\Http\Requests\Social;

use Illuminate\Foundation\Http\FormRequest;

class StoreSocialPostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'visibility' => ['required', 'in:school,class'],
            'title' => ['nullable', 'string', 'max:100'],
            'content' => ['nullable', 'string', 'max:10000'],
            'class_ids' => ['required_if:visibility,class', 'nullable', 'array'],
            'class_ids.*' => ['exists:classes,id'],
            'media' => ['nullable', 'array'],
            'media.*' => [
                'nullable',
                'file',
                'mimes:jpg,jpeg,png,gif,webp,mp4,mov,avi,pdf,doc,docx,xls,xlsx',
                'max:51200',
            ],
            'is_pinned' => ['nullable', 'boolean'],
            'published_at' => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'visibility.required' => 'Görünürlük alanı zorunludur.',
            'visibility.in' => 'Görünürlük "school" veya "class" olmalıdır.',
            'class_ids.required_if' => 'Sınıfa özel paylaşımda en az bir sınıf seçilmelidir.',
        ];
    }
}
