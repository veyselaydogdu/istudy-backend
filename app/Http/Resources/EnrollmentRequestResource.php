<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EnrollmentRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'user_id' => $this->user_id,
            'family_profile_id' => $this->family_profile_id,
            'parent_name' => $this->parent_name,
            'parent_surname' => $this->parent_surname,
            'parent_email' => $this->parent_email,
            'parent_phone' => $this->parent_phone,
            'status' => $this->status,
            'message' => $this->message,
            'rejection_reason' => $this->rejection_reason,
            'reviewed_by' => $this->reviewed_by,
            'reviewed_at' => $this->reviewed_at?->toISOString(),
            'school' => new SchoolResource($this->whenLoaded('school')),
            'user' => new UserResource($this->whenLoaded('user')),
            'family_profile' => new FamilyProfileResource($this->whenLoaded('familyProfile')),
            'reviewer' => new UserResource($this->whenLoaded('reviewer')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
