<?php

namespace App\Http\Resources\Social;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SocialPostCommentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'is_deleted' => ! is_null($this->deleted_at),
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'avatar' => $this->user->profile_photo ?? null,
            ],
            'content' => $this->is_deleted ? null : $this->content,
            'parent_id' => $this->parent_id,
            'replies' => SocialPostCommentResource::collection($this->whenLoaded('replies')),
            'created_at' => $this->created_at,
            'deleted_at' => $this->deleted_at,
        ];
    }
}
