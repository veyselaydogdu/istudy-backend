<?php

namespace App\Http\Controllers\Media;

use App\Http\Controllers\Controller;
use App\Models\Academic\SchoolClass;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * İmzalı URL ile sınıf logosunu private diskten sunar.
 * Auth middleware gerektirmez — sadece signed middleware.
 */
class ClassLogoController extends Controller
{
    public function serve(SchoolClass $class): StreamedResponse|JsonResponse
    {
        if (! $class->logo || ! Storage::disk('local')->exists($class->logo)) {
            return response()->json(['success' => false, 'message' => 'Logo bulunamadı.', 'data' => null], 404);
        }

        return Storage::disk('local')->response($class->logo);
    }
}
