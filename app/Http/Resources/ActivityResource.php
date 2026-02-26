<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'academic_year_id' => $this->academic_year_id,
            'name' => $this->name,
            'description' => $this->description,
            'is_paid' => $this->is_paid,
            'price' => $this->price,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'children' => ChildResource::collection($this->whenLoaded('children')),
            'classes' => $this->whenLoaded('classes', fn () => $this->classes->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
            ])),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
