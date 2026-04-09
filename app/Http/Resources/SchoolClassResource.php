<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;

class SchoolClassResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->ulid,
            'school_id' => $this->school_id,
            'academic_year_id' => $this->academic_year_id,
            'name' => $this->name,
            'color' => $this->color,
            'icon' => $this->icon,
            'logo' => $this->logo,
            'logo_url' => $this->logo
                ? URL::temporarySignedRoute(
                    'class.logo',
                    now()->addHours(2),
                    ['class' => $this->ulid]
                )
                : null,
            'capacity' => $this->capacity,
            'academic_year' => new AcademicYearResource($this->whenLoaded('academicYear')),
            'teachers' => TeacherProfileResource::collection($this->whenLoaded('teachers')),
            'children_count' => $this->whenCounted('children'),
            'is_active' => $this->is_active,
            'age_min' => $this->age_min,
            'age_max' => $this->age_max,
            'description' => $this->description,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
