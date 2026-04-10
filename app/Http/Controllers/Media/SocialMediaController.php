<?php

namespace App\Http\Controllers\Media;

use App\Http\Controllers\Controller;
use App\Models\Social\SocialPostMedia;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * İmzalı URL + auth:sanctum ile sosyal post medyasını private diskten sunar.
 */
class SocialMediaController extends Controller
{
    public function serve(SocialPostMedia $media): StreamedResponse
    {
        abort_unless($media->path && Storage::disk('local')->exists($media->path), 404);

        return Storage::disk('local')->response($media->path, $media->original_name, [
            'Content-Type' => $media->mime_type ?? 'application/octet-stream',
        ]);
    }
}
