<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChildResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'family_profile_id' => $this->family_profile_id,
            'school_id' => $this->school_id,
            'academic_year_id' => $this->academic_year_id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'birth_date' => $this->birth_date?->format('Y-m-d'),
            'gender' => $this->gender,
            'profile_photo' => $this->profile_photo,
            'family_profile' => new FamilyProfileResource($this->whenLoaded('familyProfile')),
            'classes' => SchoolClassResource::collection($this->whenLoaded('classes')),
            'allergens' => $this->whenLoaded('allergens'),
            'medications' => $this->whenLoaded('medications'),
            'conditions' => $this->whenLoaded('conditions'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
