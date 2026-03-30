<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AcademicYearResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'name' => $this->name,
            'description' => $this->description,
            'start_date' => $this->start_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'is_active' => $this->is_active,
            'is_current' => $this->is_current,

            // İlişkiler
            'school' => $this->whenLoaded('school', fn () => [
                'id' => $this->school->id,
                'name' => $this->school->name,
            ]),
            'classes' => SchoolClassResource::collection($this->whenLoaded('classes')),

            // İstatistikler
            'classes_count' => $this->when(isset($this->classes_count), $this->classes_count),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
