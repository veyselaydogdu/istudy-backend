<?php

namespace App\Http\Resources\ActivityClass;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityClassResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->ulid,
            'school_id' => $this->school_id,
            'name' => $this->name,
            'description' => $this->description,
            'language' => $this->language,
            'age_min' => $this->age_min,
            'age_max' => $this->age_max,
            'capacity' => $this->capacity,
            'active_enrollments_count' => $this->active_enrollments_count ?? null,
            'is_school_wide' => $this->is_school_wide,
            'is_global' => $this->is_global,
            'is_active' => $this->is_active,
            'is_paid' => $this->is_paid,
            'price' => $this->price,
            'currency' => $this->currency,
            'invoice_required' => $this->invoice_required,
            'start_date' => $this->start_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'schedule' => $this->schedule,
            'location' => $this->location,
            'address' => $this->address,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'school_classes' => $this->whenLoaded('schoolClasses', fn () => $this->schoolClasses->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
            ])),
            'teachers' => $this->whenLoaded('teachers', fn () => $this->teachers->map(fn ($t) => [
                'id' => $t->id,
                'name' => $t->user->name.' '.$t->user->surname,
                'role' => $t->pivot->role,
            ])),
            'materials' => $this->whenLoaded('materials', fn () => $this->materials),
            'gallery' => $this->whenLoaded('gallery', fn () => $this->gallery),
            'enrollments' => $this->whenLoaded('activeEnrollments', fn () => ActivityClassEnrollmentResource::collection($this->activeEnrollments)),
        ];
    }
}
