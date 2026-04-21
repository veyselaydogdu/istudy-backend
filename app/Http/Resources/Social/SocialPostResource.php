<?php

namespace App\Http\Resources\Social;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SocialPostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $userId = auth()->id();

        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'title' => $this->title,
            'visibility' => $this->visibility,
            'content' => $this->content,
            'edit_history' => $this->edit_history ?? [],
            'is_pinned' => $this->is_pinned,
            'published_at' => $this->published_at?->toDateTimeString(),
            'author' => [
                'id' => $this->author->id,
                'name' => $this->author->name,
                'avatar' => $this->author->profile_photo ?? null,
            ],
            'media' => SocialPostMediaResource::collection($this->whenLoaded('media')),
            'classes' => $this->whenLoaded('classes', fn () => $this->classes->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
            ])),
            'reactions_count' => $this->reactions_count ?? $this->reactions()->count(),
            'user_reaction' => $this->whenLoaded(
                'reactions',
                fn () => $this->reactions->where('user_id', $userId)->first()?->type
            ),
            'comments_count' => $this->comments()->whereNull('parent_id')->count(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
