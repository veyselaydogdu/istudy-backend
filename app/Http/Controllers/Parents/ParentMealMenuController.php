<?php

namespace App\Http\Controllers\Parents;

use App\Models\Child\Child;
use App\Models\Health\MealMenuSchedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ParentMealMenuController extends BaseParentController
{
    /**
     * Aile çocuklarını sınıf bilgisiyle listele (çocuk seçici için)
     */
    public function children(): JsonResponse
    {
        try {
            $familyProfile = $this->getFamilyProfile();

            if (! $familyProfile) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            $children = Child::withoutGlobalScope('tenant')
                ->where('family_profile_id', $familyProfile->id)
                ->whereNotNull('school_id')
                ->with(['classes:id,name', 'school:id,name'])
                ->get()
                ->map(fn ($child) => [
                    'id' => $child->id,
                    'name' => $child->name,
                    'surname' => $child->surname,
                    'full_name' => trim(($child->name ?? '').' '.($child->surname ?? '')),
                    'school_id' => $child->school_id,
                    'school_name' => $child->school?->name,
                    'class_id' => $child->classes->first()?->id,
                    'class_name' => $child->classes->first()?->name,
                ]);

            return $this->successResponse($children, 'Çocuklar getirildi.');
        } catch (\Throwable $e) {
            Log::error('ParentMealMenuController::children', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Çocuğun sınıfına göre yemek takvimini getir
     *
     * Query params:
     *   child_id (required)
     *   year     (required) — 4 haneli yıl
     *   month    (required) — 1-12
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'child_id' => 'required|integer',
            'year' => 'required|integer|min:2020|max:2100',
            'month' => 'required|integer|min:1|max:12',
        ]);

        try {
            $familyProfile = $this->getFamilyProfile();

            if (! $familyProfile) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            $child = $this->findOwnedChild((int) $request->child_id);

            if (! $child) {
                return $this->errorResponse('Çocuk bulunamadı.', 404);
            }

            if (! $child->school_id) {
                return $this->successResponse([], 'Çocuk henüz bir okula kayıtlı değil.');
            }

            $classId = $child->classes()->first()?->id;

            $startDate = sprintf('%04d-%02d-01', $request->year, $request->month);
            $endDate = date('Y-m-t', strtotime($startDate));

            $query = MealMenuSchedule::withoutGlobalScope('tenant')
                ->where('school_id', $child->school_id)
                ->whereBetween('menu_date', [$startDate, $endDate])
                ->with([
                    'meal.ingredients.allergens',
                ])
                ->orderBy('menu_date');

            if ($classId) {
                $query->where(function ($q) use ($classId) {
                    $q->where('class_id', $classId)
                        ->orWhereNull('class_id');
                });
            }

            $schedules = $query->get();

            // Tarihe göre grupla
            $grouped = $schedules
                ->groupBy(fn ($s) => $s->menu_date->toDateString())
                ->map(fn ($daySchedules, $date) => [
                    'date' => $date,
                    'meals' => $daySchedules->map(fn ($s) => [
                        'id' => $s->id,
                        'meal_id' => $s->meal_id,
                        'schedule_type' => $s->schedule_type,
                        'meal' => [
                            'id' => $s->meal?->id,
                            'name' => $s->meal?->name,
                            'meal_type' => $s->meal?->meal_type,
                            'ingredients' => $s->meal?->ingredients->map(fn ($ing) => [
                                'id' => $ing->id,
                                'name' => $ing->name,
                                'allergens' => $ing->allergens->map(fn ($a) => [
                                    'id' => $a->id,
                                    'name' => $a->name,
                                    'risk_level' => $a->risk_level,
                                ])->values(),
                            ])->values(),
                        ],
                    ])->values(),
                ])
                ->sortKeys()
                ->values();

            return $this->successResponse($grouped, 'Yemek takvimi getirildi.');
        } catch (\Throwable $e) {
            Log::error('ParentMealMenuController::index', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }
}
