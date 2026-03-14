<?php

namespace App\Http\Resources\Parent;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ParentChildResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
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
            'profile_photo' => $this->profile_photo,
            'status' => $this->status,
            'enrollment_date' => $this->enrollment_date?->format('Y-m-d'),
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
                ->select('child_medications.*', 'medications.name', 'medications.status as med_status')
                ->get()
                ->map(fn ($row) => [
                    'id' => $row->medication_id,
                    'name' => $row->name ?? null,
                    'custom_name' => $row->custom_name ?? null,
                    'dose' => $row->dose ?? null,
                    'usage_time' => isset($row->usage_time) ? json_decode($row->usage_time, true) : null,
                    'usage_days' => isset($row->usage_days) ? json_decode($row->usage_days, true) : null,
                    'status' => $row->med_status ?? 'approved',
                ])
                ->values(),
        ];
    }
}
