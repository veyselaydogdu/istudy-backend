<?php

namespace App\Http\Controllers\Media;

use App\Http\Controllers\Controller;
use App\Models\Health\Meal;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * İmzalı URL ile yemek fotoğrafını private diskten sunar.
 */
class MealPhotoController extends Controller
{
    public function serve(Meal $meal): StreamedResponse|JsonResponse
    {
        if (! $meal->photo || ! Storage::disk('local')->exists($meal->photo)) {
            return response()->json(['success' => false, 'message' => 'Fotoğraf bulunamadı.', 'data' => null], 404);
        }

        return Storage::disk('local')->response($meal->photo);
    }
}
