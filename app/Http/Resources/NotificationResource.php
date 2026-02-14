<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'class_id' => $this->class_id,
            'type' => $this->type,
            'title' => $this->title,
            'body' => $this->body,
            'action_type' => $this->action_type,
            'action_id' => $this->action_id,
            'priority' => $this->priority,
            'target_roles' => $this->target_roles,
            'scheduled_at' => $this->scheduled_at?->toISOString(),
            'sent_at' => $this->sent_at?->toISOString(),
            'is_read' => $this->whenPivotLoaded('notification_user', function () {
                return (bool) $this->pivot->is_read;
            }),
            'read_at' => $this->whenPivotLoaded('notification_user', function () {
                return $this->pivot->read_at;
            }),
            'school' => new SchoolResource($this->whenLoaded('school')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
