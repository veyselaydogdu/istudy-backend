<?php

namespace App\Http\Controllers\Media;

use App\Http\Controllers\Controller;
use App\Models\Social\SocialPostMedia;
use App\Traits\HandlesMediaStorage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * auth:sanctum + signed URL ile sosyal post medyasını private diskten sunar.
 */
class SocialMediaController extends Controller
{
    use HandlesMediaStorage;

    public function serve(SocialPostMedia $media): StreamedResponse|\Illuminate\Http\Response
    {
        if (! $media->path) {
            abort(404);
        }

        return $this->servePrivate($media->path, $media->original_name, [
            'Content-Type' => $media->mime_type ?? 'application/octet-stream',
        ]);
    }
}
