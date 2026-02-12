<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SchoolResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'name' => $this->name,
            'code' => $this->code,
            'address' => $this->address,
            'phone' => $this->phone,
            'email' => $this->email,
            'logo' => $this->logo,
            'timezone' => $this->timezone,
            'is_active' => $this->is_active,
            'academic_years' => SchoolClassResource::collection($this->whenLoaded('academicYears')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
