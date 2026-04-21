<?php

namespace App\Services;

use App\Models\Social\SocialPost;
use App\Models\Social\SocialPostComment;
use App\Models\Social\SocialPostMedia;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class SocialPostService
{
    /**
     * Kullanıcı için görünür postları sayfalı listele.
     *
     * @param  array<string, mixed>  $filters
     */
    public function getPostsForUser(User $user, int $schoolId, array $filters = []): LengthAwarePaginator
    {
        $query = SocialPost::query()
            ->forSchool($schoolId)
            ->visibleTo($user)
            ->with(['author', 'media', 'classes'])
            ->withCount('reactions')
            ->orderByDesc('is_pinned')
            ->orderByDesc('published_at')
            ->orderByDesc('created_at');

        if (! empty($filters['visibility'])) {
            $query->where('visibility', $filters['visibility']);
        }

        $perPage = $filters['per_page'] ?? 15;

        return $query->paginate($perPage);
    }

    /**
     * Yeni post oluştur.
     *
     * @param  array<string, mixed>  $data
     * @param  array<int>  $classIds
     * @param  UploadedFile[]  $mediaFiles
     */
    public function createPost(array $data, array $classIds = [], array $mediaFiles = []): SocialPost
    {
        $post = SocialPost::create($data);

        if (! empty($classIds)) {
            $post->classes()->sync($classIds);
        }

        foreach ($mediaFiles as $index => $file) {
            $this->storeMedia($post, $file, $index);
        }

        return $post->load(['author', 'media', 'classes']);
    }

    /**
     * Post güncelle — düzenleme öncesi mevcut içeriği edit_history'e ekle.
     *
     * @param  array<string, mixed>  $data
     * @param  array<int>  $classIds
     */
    public function updatePost(SocialPost $post, array $data, array $classIds = []): SocialPost
    {
        $snapshot = [
            'edited_at' => now()->toISOString(),
            'title' => $post->title,
            'content' => $post->content,
            'visibility' => $post->visibility,
            'is_pinned' => $post->is_pinned,
        ];

        $history = $post->edit_history ?? [];
        $history[] = $snapshot;

        $post->update(array_merge($data, ['edit_history' => $history]));

        if (array_key_exists('class_ids', $data) || ! empty($classIds)) {
            $post->classes()->sync($classIds);
        }

        return $post->fresh(['author', 'media', 'classes']);
    }

    /**
     * Post sil.
     */
    public function deletePost(SocialPost $post): void
    {
        // Medya dosyalarını fiziksel olarak sil
        foreach ($post->media as $media) {
            $this->deleteMedia($media);
        }

        $post->delete();
    }

    /**
     * Medya dosyasını kaydet ve ilişkilendir.
     */
    public function storeMedia(SocialPost $post, UploadedFile $file, int $sortOrder = 0): SocialPostMedia
    {
        $mimeType = $file->getMimeType() ?? '';
        $type = $this->resolveMediaType($mimeType);

        $tenantId = $post->tenant_id;
        $path = Storage::disk('local')->putFile("tenants/{$tenantId}/social/posts/{$post->id}", $file);

        return SocialPostMedia::create([
            'post_id' => $post->id,
            'type' => $type,
            'disk' => 'local',
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
            'mime_type' => $mimeType,
            'sort_order' => $sortOrder,
        ]);
    }

    /**
     * Medya dosyasını sil.
     */
    public function deleteMedia(SocialPostMedia $media): void
    {
        Storage::disk($media->disk)->delete($media->path);

        if ($media->thumbnail_path) {
            Storage::disk($media->disk)->delete($media->thumbnail_path);
        }

        $media->delete();
    }

    /**
     * Tepki ekle / kaldır (toggle).
     */
    public function toggleReaction(SocialPost $post, User $user, string $type): void
    {
        $existing = $post->reactions()->where('user_id', $user->id)->first();

        if ($existing) {
            if ($existing->type === $type) {
                // Aynı tepki → kaldır
                $existing->delete();
            } else {
                // Farklı tepki → güncelle
                $existing->update(['type' => $type]);
            }
        } else {
            $post->reactions()->create([
                'user_id' => $user->id,
                'type' => $type,
            ]);
        }
    }

    /**
     * Yorum ekle.
     *
     * @param  array<string, mixed>  $data
     */
    public function addComment(SocialPost $post, User $user, array $data): SocialPostComment
    {
        return $post->comments()->create([
            'user_id' => $user->id,
            'parent_id' => $data['parent_id'] ?? null,
            'content' => $data['content'],
        ]);
    }

    /**
     * Yorum sil.
     */
    public function deleteComment(SocialPostComment $comment): void
    {
        $comment->delete();
    }

    /**
     * MIME type'a göre medya tipini belirle.
     */
    private function resolveMediaType(string $mimeType): string
    {
        if (str_starts_with($mimeType, 'image/')) {
            return 'image';
        }

        if (str_starts_with($mimeType, 'video/')) {
            return 'video';
        }

        return 'file';
    }
}
