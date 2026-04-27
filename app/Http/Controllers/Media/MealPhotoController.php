<?php

namespace App\Http\Controllers\Media;

use App\Http\Controllers\Controller;
use App\Models\Health\Meal;
use App\Traits\HandlesMediaStorage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * auth:sanctum + signed URL ile yemek fotoğrafını private diskten sunar.
 */
class MealPhotoController extends Controller
{
    use HandlesMediaStorage;

    public function serve(Meal $meal): StreamedResponse|\Illuminate\Http\Response
    {
        if (! $meal->photo) {
            abort(404);
        }

        return $this->servePrivate($meal->photo);
    }
}
