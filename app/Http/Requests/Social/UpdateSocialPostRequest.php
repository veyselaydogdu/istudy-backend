<?php

namespace App\Http\Requests\Social;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSocialPostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'visibility' => ['sometimes', 'in:school,class'],
            'title' => ['sometimes', 'nullable', 'string', 'max:100'],
            'content' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'class_ids' => ['sometimes', 'nullable', 'array'],
            'class_ids.*' => ['string'],
            'is_pinned' => ['sometimes', 'nullable', 'boolean'],
            'published_at' => ['sometimes', 'nullable', 'date'],
        ];
    }
}
