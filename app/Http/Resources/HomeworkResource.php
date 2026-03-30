<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HomeworkResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'academic_year_id' => $this->academic_year_id,
            'title' => $this->title,
            'description' => $this->description,
            'type' => $this->type,
            'assigned_date' => $this->assigned_date?->toDateString(),
            'due_date' => $this->due_date?->toDateString(),
            'priority' => $this->priority,
            'attachments' => $this->attachments,
            'is_overdue' => $this->due_date ? $this->due_date->isPast() : false,
            'completion_rate' => $this->when($this->relationLoaded('completions'), function () {
                return $this->completionRate();
            }),
            'classes' => SchoolClassResource::collection($this->whenLoaded('classes')),
            'completions' => HomeworkCompletionResource::collection($this->whenLoaded('completions')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
