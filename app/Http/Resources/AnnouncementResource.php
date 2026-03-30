<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AnnouncementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'class_id' => $this->class_id,
            'title' => $this->title,
            'body' => $this->body,
            'type' => $this->type,
            'is_pinned' => $this->is_pinned,
            'publish_at' => $this->publish_at?->toISOString(),
            'expire_at' => $this->expire_at?->toISOString(),
            'school' => new SchoolResource($this->whenLoaded('school')),
            'school_class' => new SchoolClassResource($this->whenLoaded('schoolClass')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
