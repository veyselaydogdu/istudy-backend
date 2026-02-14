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
            'meal' => $this->whenLoaded('meal'),
            'school_class' => new SchoolClassResource($this->whenLoaded('schoolClass')),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
