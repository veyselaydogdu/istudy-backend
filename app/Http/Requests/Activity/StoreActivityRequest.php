<?php

namespace App\Http\Requests\Activity;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreActivityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->route('school_id')) {
            $this->merge(['school_id' => $this->route('school_id')]);
        }

        // Ücretli etkinliklerde kayıt zorunlu olmalı
        if ($this->boolean('is_paid')) {
            $this->merge(['is_enrollment_required' => true]);
        }

        // MySQL TIME sütunu HH:MM:SS döner; H:i doğrulaması için saniyeleri kırp
        $times = [];
        if ($this->filled('start_time')) {
            $times['start_time'] = substr($this->start_time, 0, 5);
        }
        if ($this->filled('end_time')) {
            $times['end_time'] = substr($this->end_time, 0, 5);
        }
        if (! empty($times)) {
            $this->merge($times);
        }
    }

    public function rules(): array
    {
        return [
            'school_id' => ['required', 'exists:schools,id'],
            'academic_year_id' => ['nullable', 'exists:academic_years,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_paid' => ['nullable', 'boolean'],
            'is_enrollment_required' => ['nullable', 'boolean'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'start_date' => ['nullable', 'date', 'after_or_equal:today'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'end_time' => ['nullable', 'date_format:H:i'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'address' => ['nullable', 'string', 'max:500'],
            'cancellation_allowed' => ['nullable', 'boolean'],
            'cancellation_deadline' => ['nullable', 'date', Rule::when($this->filled('start_date'), 'before_or_equal:start_date')],
            'class_ids' => ['nullable', 'array'],
            'class_ids.*' => ['exists:classes,id'],
            'materials' => ['nullable', 'array'],
            'materials.*' => ['string', 'max:255'],
        ];
    }
}
