<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SchoolResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->ulid,
            'tenant_id' => $this->tenant_id,
            'country_id' => $this->country_id,
            'name' => $this->name,
            'description' => $this->description,
            'code' => $this->code,
            'registration_code' => $this->registration_code,
            'address' => $this->address,
            'city' => $this->city,
            'phone' => $this->phone,
            'fax' => $this->fax,
            'gsm' => $this->gsm,
            'whatsapp' => $this->whatsapp,
            'email' => $this->email,
            'website' => $this->website,
            'logo' => $this->logo,
            'timezone' => $this->timezone,
            'is_active' => $this->is_active,
            'status' => $this->is_active ? 'active' : 'inactive',
            'country' => $this->whenLoaded('country', fn () => [
                'id' => $this->country->id,
                'name' => $this->country->name,
                'iso2' => $this->country->iso2,
            ]),
            'tenant' => $this->whenLoaded('tenant', fn () => [
                'id' => $this->tenant->id,
                'name' => $this->tenant->name,
            ]),
            'classes_count' => $this->whenCounted('classes'),
            'children_count' => $this->whenCounted('children'),
            'academic_years' => SchoolClassResource::collection($this->whenLoaded('academicYears')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
