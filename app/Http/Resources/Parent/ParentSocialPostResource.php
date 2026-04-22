<?php

namespace App\Http\Resources\Parent;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ParentSocialPostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'title' => $this->title,
            'content' => $this->content,
            'visibility' => $this->visibility,
            'is_pinned' => $this->is_pinned,
            'is_global' => $this->is_global,
            'published_at' => $this->published_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'author' => $this->whenLoaded('author', function () {
                return $this->author ? [
                    'id' => $this->author->id,
                    'name' => $this->author->name,
                    'surname' => $this->author->surname,
                ] : null;
            }),
            'media' => $this->whenLoaded('media', function () {
                return $this->media->map(fn ($media) => [
                    'id' => $media->id,
                    'type' => $media->type ?? null,
                    'url' => \Illuminate\Support\Facades\URL::signedRoute('social-media.serve', ['media' => $media->id], now()->addHours(2)),
                    'sort_order' => $media->sort_order ?? 0,
                ]);
            }),
            'reactions_count' => $this->whenLoaded('reactions', fn () => $this->reactions->count()),
            'comments_count' => $this->whenLoaded('comments', fn () => $this->comments->count()),
        ];
    }
}
