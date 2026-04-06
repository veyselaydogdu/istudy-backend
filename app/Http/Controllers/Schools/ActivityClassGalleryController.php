<?php

namespace App\Http\Controllers\Schools;

use App\Models\ActivityClass\ActivityClass;
use App\Models\ActivityClass\ActivityClassGalleryItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

class ActivityClassGalleryController extends BaseSchoolController
{
    public function index(int $school_id, int $activity_class_id): JsonResponse
    {
        try {
            $activityClass = ActivityClass::where('school_id', $school_id)->findOrFail($activity_class_id);
            $items = $activityClass->gallery()->get();

            $data = $items->map(fn ($item) => $this->formatGalleryItem($item));

            return $this->successResponse($data);
        } catch (\Throwable $e) {
            Log::error('ActivityClassGalleryController::index', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function store(Request $request, int $school_id, int $activity_class_id): JsonResponse
    {
        $request->validate([
            'image' => 'required|file|mimes:jpg,jpeg,png,webp|max:10240',
            'caption' => 'nullable|string|max:255',
            'sort_order' => 'integer|min:0',
        ]);

        try {
            $activityClass = ActivityClass::where('school_id', $school_id)->findOrFail($activity_class_id);

            $file = $request->file('image');
            $path = $file->store("activity-classes/{$activityClass->id}/gallery", 'local');

            $item = $activityClass->gallery()->create([
                'file_path' => $path,
                'original_name' => basename(str_replace(['..', '/', '\\'], '', $file->getClientOriginalName())), // L-3: sanitize
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'caption' => $request->caption,
                'sort_order' => $request->sort_order ?? 0,
                'uploaded_by' => $this->user()->id,
            ]);

            return $this->successResponse($this->formatGalleryItem($item), 'Fotoğraf yüklendi.', 201);
        } catch (\Throwable $e) {
            Log::error('ActivityClassGalleryController::store', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function destroy(int $school_id, int $activity_class_id, ActivityClassGalleryItem $galleryItem): JsonResponse
    {
        try {
            Storage::disk('local')->delete($galleryItem->file_path);
            $galleryItem->delete();

            return $this->successResponse(null, 'Fotoğraf silindi.');
        } catch (\Throwable $e) {
            Log::error('ActivityClassGalleryController::destroy', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    /**
     * Serve a gallery image via signed URL (called from signed route — no auth middleware).
     */
    public function serve(ActivityClassGalleryItem $galleryItem): \Symfony\Component\HttpFoundation\StreamedResponse|\Illuminate\Http\Response
    {
        abort_unless(Storage::disk('local')->exists($galleryItem->file_path), 404);

        return Storage::disk('local')->response($galleryItem->file_path, null, [
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
        ]);
    }

    private function formatGalleryItem(ActivityClassGalleryItem $item): array
    {
        return [
            'id' => $item->id,
            'caption' => $item->caption,
            'sort_order' => $item->sort_order,
            'original_name' => $item->original_name,
            'mime_type' => $item->mime_type,
            'file_size' => $item->file_size,
            'url' => URL::signedRoute('activity-class-gallery.serve', ['galleryItem' => $item->id], now()->addHour()), // M-2: 2h -> 1h
            'created_at' => $item->created_at,
        ];
    }
}
