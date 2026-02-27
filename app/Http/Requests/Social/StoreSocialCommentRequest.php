<?php

namespace App\Http\Requests\Social;

use Illuminate\Foundation\Http\FormRequest;

class StoreSocialCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'content' => ['required', 'string', 'max:2000'],
            'parent_id' => ['nullable', 'exists:social_post_comments,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'content.required' => 'Yorum içeriği zorunludur.',
            'content.max' => 'Yorum en fazla 2000 karakter olabilir.',
        ];
    }
}
