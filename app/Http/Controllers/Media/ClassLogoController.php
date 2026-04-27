<?php

namespace App\Http\Controllers\Media;

use App\Http\Controllers\Controller;
use App\Models\Academic\SchoolClass;
use App\Traits\HandlesMediaStorage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * auth:sanctum + signed URL ile sınıf logosunu private diskten sunar.
 */
class ClassLogoController extends Controller
{
    use HandlesMediaStorage;

    public function serve(SchoolClass $class): StreamedResponse|\Illuminate\Http\Response
    {
        if (! $class->logo) {
            abort(404);
        }

        return $this->servePrivate($class->logo);
    }
}
