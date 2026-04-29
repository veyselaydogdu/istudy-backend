<?php

namespace App\Http\Controllers\Teachers;

use App\Models\Academic\SchoolClass;
use App\Models\Child\Child;
use App\Models\Health\MealMenuSchedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * TeacherMealMenuController — Yemek Menüsü
 *
 * Öğretmenin sınıfına ait yemek menüsü ve öğrenci alerjen uyarılarını getirir.
 */
class TeacherMealMenuController extends BaseTeacherController
{
    /**
     * Sınıfın yemek menüsü ve öğrenci alerjen uyarıları
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'class_id' => ['required', 'integer', 'exists:classes,id'],
            'date' => ['nullable', 'date'],
        ]);

        try {
            $profile = $this->teacherProfile();

            if ($profile instanceof JsonResponse) {
                return $profile;
            }

            $classId = (int) $request->class_id;
            $date = $request->date ? Carbon::parse($request->date)->toDateString() : Carbon::today()->toDateString();

            // Öğretmenin bu sınıfa atanmış olup olmadığını kontrol et
            $isAssigned = SchoolClass::whereHas('teachers', fn ($q) => $q->where('teacher_profile_id', $profile->id))
                ->where('id', $classId)
                ->exists();

            if (! $isAssigned) {
                return $this->errorResponse('Bu sınıfa erişim yetkiniz yok.', 403);
            }

            // Sınıfa ait yemek menüsünü getir (sınıfa özel + okul geneli)
            $schedules = MealMenuSchedule::with([
                'meal.ingredients.allergens',
            ])
                ->where('school_id', fn ($q) => $q->select('school_id')->from('classes')->where('id', $classId))
                ->where(function ($q) use ($classId) {
                    $q->where('class_id', $classId)->orWhereNull('class_id');
                })
                ->where('menu_date', $date)
                ->get();

            // Sınıf öğrencilerinin alerjenlerini yükle
            $children = Child::whereHas('classes', fn ($q) => $q->where('classes.id', $classId))
                ->active()
                ->with(['allergens' => fn ($q) => $q->withoutGlobalScope('tenant')])
                ->get();

            // Her yemek için alerjen listesi oluştur
            $meals = $schedules->map(function ($schedule) {
                $meal = $schedule->meal;

                return [
                    'id' => $meal->id,
                    'name' => $meal->name,
                    'meal_type' => $meal->meal_type,
                    'ingredients' => $meal->ingredients->map(fn ($ingredient) => [
                        'name' => $ingredient->name,
                        'allergens' => $ingredient->allergens->map(fn ($allergen) => [
                            'name' => $allergen->name,
                            'risk_level' => $allergen->risk_level ?? null,
                        ]),
                    ]),
                ];
            });

            // Alerjen eşleştirme — schedule modelleri üzerinden
            $allergenAlerts = $children->filter(fn ($child) => $child->allergens->isNotEmpty())
                ->map(function ($child) use ($schedules) {
                    $childAllergenIds = $child->allergens->pluck('id')->toArray();
                    $childAllergenNames = $child->allergens->pluck('name')->toArray();
                    $warnedMeals = [];

                    foreach ($schedules as $schedule) {
                        $meal = $schedule->meal;
                        foreach ($meal->ingredients as $ingredient) {
                            $ingredientAllergenIds = $ingredient->allergens->pluck('id')->toArray();
                            $matched = array_intersect($childAllergenIds, $ingredientAllergenIds);
                            if (! empty($matched)) {
                                $warnedMeals[] = $meal->name;
                                break;
                            }
                        }
                    }

                    if (empty($warnedMeals)) {
                        return null;
                    }

                    return [
                        'child_id' => $child->id,
                        'child_name' => $child->full_name,
                        'allergens' => $childAllergenNames,
                        'warned_meals' => array_unique($warnedMeals),
                    ];
                })->filter()->values();

            return $this->successResponse([
                'date' => $date,
                'meals' => $meals->values(),
                'alerts' => $allergenAlerts,
            ], 'Yemek menüsü ve uyarılar getirildi.');
        } catch (\Throwable $e) {
            Log::error('TeacherMealMenuController::index Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Yemek menüsü alınamadı.', 500);
        }
    }
}
