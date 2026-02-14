<?php

namespace App\Http\Requests\Homework;

use Illuminate\Foundation\Http\FormRequest;

class UpdateHomeworkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'type' => 'sometimes|string|in:homework,after_school_activity',
            'assigned_date' => 'sometimes|date',
            'due_date' => 'sometimes|date',
            'priority' => 'nullable|string|in:low,normal,high',
            'attachments' => 'nullable|array',
            'class_ids' => 'nullable|array',
            'class_ids.*' => 'exists:classes,id',
        ];
    }
}
