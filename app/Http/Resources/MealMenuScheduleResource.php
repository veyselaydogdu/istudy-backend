<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MealMenuScheduleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'class_id' => $this->class_id,
            'meal_id' => $this->meal_id,
            'menu_date' => $this->menu_date?->toDateString(),
            'schedule_type' => $this->schedule_type,
            'meal' => $this->when($this->relationLoaded('meal') && $this->meal, fn () => [
                'id' => $this->meal->id,
                'name' => $this->meal->name,
                'meal_type' => $this->meal->meal_type,
                'ingredients' => $this->meal->relationLoaded('ingredients')
                    ? $this->meal->ingredients->map(fn ($i) => [
                        'id' => $i->id,
                        'name' => $i->name,
                        'allergens' => $i->relationLoaded('allergens')
                            ? $i->allergens->map(fn ($a) => ['id' => $a->id, 'name' => $a->name])
                            : [],
                    ])
                    : [],
            ]),
            'school_class' => new SchoolClassResource($this->whenLoaded('schoolClass')),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
