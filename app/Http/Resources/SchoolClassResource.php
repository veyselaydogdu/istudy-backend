<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SchoolClassResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'academic_year_id' => $this->academic_year_id,
            'name' => $this->name,
            'color' => $this->color,
            'logo' => $this->logo,
            'capacity' => $this->capacity,
            'academic_year' => new AcademicYearResource($this->whenLoaded('academicYear')),
            'teachers' => TeacherProfileResource::collection($this->whenLoaded('teachers')),
            'children_count' => $this->whenCounted('children'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
