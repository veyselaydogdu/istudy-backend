<?php

namespace App\Http\Requests\ReportTemplate;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReportTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:200',
            'description' => 'nullable|string|max:1000',
            'frequency' => 'sometimes|string|in:daily,weekly,monthly',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',

            // Dinamik inputlar
            'inputs' => 'nullable|array',
            'inputs.*.label' => 'required|string|max:200',
            'inputs.*.input_type' => 'required|string|in:text,number,select,rating,boolean,textarea',
            'inputs.*.options' => 'nullable|array',
            'inputs.*.is_required' => 'nullable|boolean',
            'inputs.*.sort_order' => 'nullable|integer',
            'inputs.*.default_value' => 'nullable|string|max:500',
        ];
    }
}
