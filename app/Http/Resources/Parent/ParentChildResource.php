<?php

namespace App\Http\Resources\Parent;

use App\Models\School\SchoolChildEnrollmentRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;

class ParentChildResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->ulid,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'birth_date' => $this->birth_date?->format('Y-m-d'),
            'gender' => $this->gender,
            'blood_type' => $this->blood_type,
            'identity_number' => $this->identity_number,
            'passport_number' => $this->passport_number,
            'parent_notes' => $this->parent_notes,
            'special_notes' => $this->special_notes,
            'languages' => $this->languages,
            'profile_photo' => $this->profile_photo
                ? URL::signedRoute('parent.child.photo', ['child' => $this->ulid], now()->addHours(1))
                : null,
            'family_profile_id' => $this->family_profile_id,
            'family_name' => $this->whenLoaded('familyProfile', fn () => $this->familyProfile?->family_name),
            'status' => $this->status,
            'enrollment_date' => $this->enrollment_date?->format('Y-m-d'),
            'school_id' => $this->school_id,
            'school' => $this->whenLoaded('school', function () {
                if (! $this->school || ! $this->school->id) {
                    return null;
                }

                return [
                    'id' => $this->school->id,
                    'name' => $this->school->name,
                ];
            }),
            'nationality' => $this->whenLoaded('nationality', function () {
                if (! $this->nationality || ! $this->nationality->id) {
                    return null;
                }

                return [
                    'id' => $this->nationality->id,
                    'name' => $this->nationality->name ?? null,
                    'name_tr' => $this->nationality->name_tr ?? null,
                    'iso2' => $this->nationality->iso2 ?? null,
                    'flag_emoji' => $this->nationality->flag_emoji ?? null,
                ];
            }),
            'allergens' => $this->whenLoaded('allergens', function () {
                return $this->allergens->map(fn ($allergen) => [
                    'id' => $allergen->id,
                    'name' => $allergen->name,
                    'description' => $allergen->description,
                    'status' => $allergen->status ?? 'approved',
                ]);
            }),
            'conditions' => $this->whenLoaded('conditions', function () {
                return $this->conditions->map(fn ($condition) => [
                    'id' => $condition->id,
                    'name' => $condition->name,
                    'description' => $condition->description,
                    'status' => $condition->status ?? 'approved',
                ]);
            }),
            'medications' => \Illuminate\Support\Facades\DB::table('child_medications')
                ->leftJoin('medications', 'child_medications.medication_id', '=', 'medications.id')
                ->where('child_medications.child_id', $this->id)
                ->select('child_medications.*', 'medications.name as med_name', 'medications.status as med_status')
                ->get()
                ->map(fn ($row) => [
                    'id' => $row->id,
                    'medication_id' => $row->medication_id,
                    'name' => $row->med_name ?? $row->custom_name ?? null,
                    'custom_name' => $row->custom_name ?? null,
                    'dose' => $row->dose ?? null,
                    'usage_time' => isset($row->usage_time) ? json_decode($row->usage_time, true) : null,
                    'usage_days' => isset($row->usage_days) ? json_decode($row->usage_days, true) : null,
                    'status' => $row->med_status ?? 'approved',
                ])
                ->values(),
            'classes' => $this->whenLoaded('classes', fn () => $this->classes->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
            ])->values()),
            'class_info' => $this->whenLoaded('classes', function () {
                $class = $this->classes->first();

                if (! $class || ! $class->relationLoaded('children')) {
                    return null;
                }

                $classChildren = $class->children;

                return [
                    'id' => $class->id,
                    'name' => $class->name,
                    'color' => $class->color,
                    'age_min' => $class->age_min,
                    'age_max' => $class->age_max,
                    'capacity' => $class->capacity,
                    'student_count' => $classChildren->count(),
                    'male_count' => $classChildren->where('gender', 'male')->count(),
                    'female_count' => $classChildren->where('gender', 'female')->count(),
                    'teachers' => $class->teachers->map(fn ($t) => [
                        'id' => $t->id,
                        'name' => trim(($t->user->name ?? '').' '.($t->user->surname ?? '')),
                    ])->values(),
                ];
            }),
            'pending_enrollment' => (function () {
                $req = SchoolChildEnrollmentRequest::where('child_id', $this->id)
                    ->where('status', 'pending')
                    ->with('school:id,name')
                    ->first();

                if (! $req) {
                    return null;
                }

                return [
                    'id' => $req->id,
                    'school_id' => $req->school_id,
                    'school_name' => $req->school?->name,
                    'created_at' => $req->created_at,
                ];
            })(),
        ];
    }
}
