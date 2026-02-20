<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PackageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'max_schools' => $this->max_schools,
            'max_schools_label' => $this->max_schools === 0 ? 'Sınırsız' : $this->max_schools,
            'max_classes_per_school' => $this->max_classes_per_school,
            'max_classes_label' => $this->max_classes_per_school === 0 ? 'Sınırsız' : $this->max_classes_per_school,
            'max_students' => $this->max_students,
            'max_students_label' => $this->max_students === 0 ? 'Sınırsız' : $this->max_students,
            'monthly_price' => $this->monthly_price,
            'yearly_price' => $this->yearly_price,
            'yearly_discount' => $this->monthly_price > 0
                ? round((1 - ($this->yearly_price / ($this->monthly_price * 12))) * 100).'%'
                : '0%',
            'is_active' => $this->is_active,
            'features' => $this->features,
            'sort_order' => $this->sort_order,
            'package_features' => $this->whenLoaded('packageFeatures', function () {
                return $this->packageFeatures->map(fn ($feature) => [
                    'id' => $feature->id,
                    'key' => $feature->key,
                    'label' => $feature->label,
                    'value_type' => $feature->value_type,
                    'value' => $feature->pivot->value,
                ]);
            }),
            'subscriptions_count' => $this->whenCounted('subscriptions'),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
