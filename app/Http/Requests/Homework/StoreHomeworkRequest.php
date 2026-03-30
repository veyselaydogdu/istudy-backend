<?php

namespace App\Http\Requests\Homework;

use Illuminate\Foundation\Http\FormRequest;

class StoreHomeworkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'school_id' => 'required|exists:schools,id',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|string|in:homework,after_school_activity',
            'assigned_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:assigned_date',
            'priority' => 'nullable|string|in:low,normal,high',
            'attachments' => 'nullable|array',
            'class_ids' => 'nullable|array',
            'class_ids.*' => 'exists:classes,id',
        ];
    }

    public function messages(): array
    {
        return [
            'school_id.required' => 'Okul seçimi zorunludur.',
            'title.required' => 'Başlık zorunludur.',
            'type.required' => 'Tür zorunludur.',
            'assigned_date.required' => 'Atama tarihi zorunludur.',
            'due_date.required' => 'Teslim tarihi zorunludur.',
            'due_date.after_or_equal' => 'Teslim tarihi atama tarihinden sonra olmalıdır.',
        ];
    }
}
