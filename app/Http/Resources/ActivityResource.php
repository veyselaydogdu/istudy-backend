<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'academic_year_id' => $this->academic_year_id,
            'name' => $this->name,
            'description' => $this->description,
            'is_paid' => $this->is_paid,
            'is_enrollment_required' => $this->is_enrollment_required,
            'cancellation_allowed' => $this->cancellation_allowed,
            'cancellation_deadline' => $this->cancellation_deadline?->toDateTimeString(),
            'price' => $this->price,
            'start_date' => $this->start_date?->toDateString(),
            'start_time' => $this->start_time,
            'end_date' => $this->end_date?->toDateString(),
            'end_time' => $this->end_time,
            'materials' => $this->materials ?? [],
            // Veliye özgü alanlar — parent controller tarafından model attribute olarak eklenir
            'enrolled_child_ids' => $this->when(
                array_key_exists('enrolled_child_ids', $this->resource->getAttributes()),
                fn () => $this->resource->getAttributes()['enrolled_child_ids']
            ),
            'enrollments_count' => $this->when(
                array_key_exists('enrollments_count', $this->resource->getAttributes()),
                fn () => $this->resource->getAttributes()['enrollments_count']
            ),
            'gallery_count' => $this->whenLoaded('gallery', fn () => $this->gallery->count()),
            'school' => $this->whenLoaded('school', fn () => [
                'id' => $this->school->id,
                'name' => $this->school->name,
            ]),
            'children' => ChildResource::collection($this->whenLoaded('children')),
            'classes' => $this->whenLoaded('classes', fn () => $this->classes->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
            ])->values()),
            'deleted_at' => $this->deleted_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
