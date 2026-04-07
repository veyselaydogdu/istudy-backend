<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChildResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->ulid,
            'family_profile_id' => $this->family_profile_id,
            'school_id' => $this->school_id,
            'academic_year_id' => $this->academic_year_id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            // Aliases for legacy frontend compatibility
            'name' => $this->first_name,
            'surname' => $this->last_name,
            'full_name' => $this->full_name,
            'birth_date' => $this->birth_date?->format('Y-m-d'),
            'gender' => $this->gender,
            'blood_type' => $this->blood_type,
            'identity_number' => $this->identity_number,
            'passport_number' => $this->passport_number,
            'parent_notes' => $this->parent_notes,
            'special_notes' => $this->special_notes,
            'languages' => $this->languages,
            'status' => $this->status,
            'profile_photo' => $this->profile_photo,
            'nationality' => $this->whenLoaded('nationality', fn () => $this->nationality ? [
                'id' => $this->nationality->id,
                'name' => $this->nationality->name,
                'flag_emoji' => $this->nationality->flag_emoji,
            ] : null),
            'family_profile' => $this->whenLoaded('familyProfile', function () {
                $fp = $this->familyProfile;
                if (! $fp || ! $fp->id) {
                    return null;
                }

                return [
                    'id' => $fp->id,
                    'family_name' => $fp->family_name,
                    'owner' => $fp->relationLoaded('owner') && $fp->owner ? [
                        'id' => $fp->owner->id,
                        'name' => $fp->owner->name,
                        'surname' => $fp->owner->surname,
                        'email' => $fp->owner->email,
                        'phone' => $fp->owner->phone,
                    ] : null,
                    'members' => $fp->relationLoaded('members')
                        ? $fp->members->map(fn ($m) => [
                            'id' => $m->id,
                            'role' => $m->role,
                            'is_active' => $m->is_active,
                            'user' => $m->relationLoaded('user') && $m->user ? [
                                'id' => $m->user->id,
                                'name' => $m->user->name,
                                'surname' => $m->user->surname,
                                'email' => $m->user->email,
                                'phone' => $m->user->phone,
                            ] : null,
                        ])->values()
                        : [],
                ];
            }),
            'classes' => SchoolClassResource::collection($this->whenLoaded('classes')),
            'allergens' => $this->whenLoaded('allergens'),
            'medications' => $this->whenLoaded('medications'),
            'conditions' => $this->whenLoaded('conditions'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
