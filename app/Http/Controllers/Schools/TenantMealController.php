<?php

namespace App\Http\Controllers\Schools;

use App\Http\Controllers\Base\BaseController;
use App\Models\Health\FoodIngredient;
use App\Models\Health\Meal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Tenant tarafından yönetilen besin öğeleri ve yemek CRUD işlemleri.
 */
class TenantMealController extends BaseController
{
    // ──────────────────────────────────────────────────────────────
    // BESİN ÖĞELERİ
    // ──────────────────────────────────────────────────────────────

    /**
     * Besin öğeleri listesi (global + tenant'a özel)
     */
    public function ingredientIndex(Request $request): JsonResponse
    {
        try {
            $tenantId = $this->user()->tenant_id;

            $ingredients = FoodIngredient::withoutGlobalScope('tenant')
                ->with('allergens')
                ->where(function ($q) use ($tenantId) {
                    $q->whereNull('tenant_id')->orWhere('tenant_id', $tenantId);
                })
                ->when($request->search, fn ($q) => $q->where('name', 'like', '%'.$request->search.'%'))
                ->orderBy('name')
                ->get();

            return $this->successResponse($ingredients->map(fn ($i) => [
                'id' => $i->id,
                'name' => $i->name,
                'allergen_info' => $i->allergen_info,
                'is_custom' => $i->tenant_id !== null,
                'allergens' => $i->allergens->map(fn ($a) => ['id' => $a->id, 'name' => $a->name]),
            ]));
        } catch (\Throwable $e) {
            Log::error('TenantMealController::ingredientIndex Error: '.$e->getMessage());

            return $this->errorResponse('Besin öğeleri yüklenemedi.', 500);
        }
    }

    /**
     * Yeni besin öğesi oluştur (tenant'a özel)
     */
    public function ingredientStore(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'allergen_info' => ['nullable', 'string'],
            'allergen_ids' => ['nullable', 'array'],
            'allergen_ids.*' => ['exists:allergens,id'],
        ]);

        try {
            DB::beginTransaction();

            $ingredient = FoodIngredient::create([
                'tenant_id' => $this->user()->tenant_id,
                'name' => $request->name,
                'allergen_info' => $request->allergen_info,
                'created_by' => $this->user()->id,
            ]);

            if ($request->has('allergen_ids')) {
                $ingredient->allergens()->sync($request->allergen_ids ?? []);
            }

            $ingredient->load('allergens');

            DB::commit();

            return $this->successResponse([
                'id' => $ingredient->id,
                'name' => $ingredient->name,
                'allergen_info' => $ingredient->allergen_info,
                'is_custom' => true,
                'allergens' => $ingredient->allergens->map(fn ($a) => ['id' => $a->id, 'name' => $a->name]),
            ], 'Besin öğesi oluşturuldu.', 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('TenantMealController::ingredientStore Error: '.$e->getMessage());

            return $this->errorResponse('Besin öğesi oluşturulamadı.', 500);
        }
    }

    /**
     * Besin öğesi güncelle (yalnızca tenant'a özel olanlar)
     */
    public function ingredientUpdate(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'allergen_info' => ['nullable', 'string'],
            'allergen_ids' => ['nullable', 'array'],
            'allergen_ids.*' => ['exists:allergens,id'],
        ]);

        try {
            $ingredient = FoodIngredient::where('id', $id)
                ->where('tenant_id', $this->user()->tenant_id)
                ->firstOrFail();

            $ingredient->update([
                'name' => $request->name,
                'allergen_info' => $request->allergen_info,
                'updated_by' => $this->user()->id,
            ]);

            if ($request->has('allergen_ids')) {
                $ingredient->allergens()->sync($request->allergen_ids ?? []);
            }

            $ingredient->load('allergens');

            return $this->successResponse([
                'id' => $ingredient->id,
                'name' => $ingredient->name,
                'allergen_info' => $ingredient->allergen_info,
                'is_custom' => true,
                'allergens' => $ingredient->allergens->map(fn ($a) => ['id' => $a->id, 'name' => $a->name]),
            ], 'Besin öğesi güncellendi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Besin öğesi bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('TenantMealController::ingredientUpdate Error: '.$e->getMessage());

            return $this->errorResponse('Güncelleme başarısız.', 500);
        }
    }

    /**
     * Besin öğesi sil (yalnızca tenant'a özel olanlar)
     */
    public function ingredientDestroy(int $id): JsonResponse
    {
        try {
            $ingredient = FoodIngredient::where('id', $id)
                ->where('tenant_id', $this->user()->tenant_id)
                ->firstOrFail();

            $ingredient->delete();

            return $this->successResponse(null, 'Besin öğesi silindi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Besin öğesi bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('TenantMealController::ingredientDestroy Error: '.$e->getMessage());

            return $this->errorResponse('Silme başarısız.', 500);
        }
    }

    // ──────────────────────────────────────────────────────────────
    // YEMEKLER
    // ──────────────────────────────────────────────────────────────

    /**
     * Yemek listesi (okul bazlı)
     */
    public function mealIndex(Request $request): JsonResponse
    {
        $request->validate(['school_id' => ['required', 'exists:schools,id']]);

        try {
            $meals = Meal::with('ingredients')
                ->where('school_id', $request->school_id)
                ->when($request->search, fn ($q) => $q->where('name', 'like', '%'.$request->search.'%'))
                ->orderBy('name')
                ->get();

            return $this->successResponse($meals->map(fn ($m) => [
                'id' => $m->id,
                'name' => $m->name,
                'meal_type' => $m->meal_type,
                'school_id' => $m->school_id,
                'ingredients' => $m->ingredients->map(fn ($i) => ['id' => $i->id, 'name' => $i->name]),
            ]));
        } catch (\Throwable $e) {
            Log::error('TenantMealController::mealIndex Error: '.$e->getMessage());

            return $this->errorResponse('Yemekler yüklenemedi.', 500);
        }
    }

    /**
     * Yeni yemek oluştur
     */
    public function mealStore(Request $request): JsonResponse
    {
        $request->validate([
            'school_id' => ['required', 'exists:schools,id'],
            'academic_year_id' => ['nullable', 'exists:academic_years,id'],
            'name' => ['required', 'string', 'max:255'],
            'meal_type' => ['nullable', 'string', 'max:100'],
            'ingredient_ids' => ['required', 'array', 'min:1'],
            'ingredient_ids.*' => ['exists:food_ingredients,id'],
        ]);

        try {
            DB::beginTransaction();

            $meal = Meal::create([
                'school_id' => $request->school_id,
                'academic_year_id' => $request->academic_year_id,
                'name' => $request->name,
                'meal_type' => $request->meal_type,
                'created_by' => $this->user()->id,
            ]);

            if ($request->ingredient_ids) {
                $meal->ingredients()->sync($request->ingredient_ids);
            }

            $meal->load('ingredients');

            DB::commit();

            return $this->successResponse([
                'id' => $meal->id,
                'name' => $meal->name,
                'meal_type' => $meal->meal_type,
                'school_id' => $meal->school_id,
                'ingredients' => $meal->ingredients->map(fn ($i) => ['id' => $i->id, 'name' => $i->name]),
            ], 'Yemek oluşturuldu.', 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('TenantMealController::mealStore Error: '.$e->getMessage());

            return $this->errorResponse('Yemek oluşturulamadı.', 500);
        }
    }

    /**
     * Yemek güncelle
     */
    public function mealUpdate(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'meal_type' => ['nullable', 'string', 'max:100'],
            'ingredient_ids' => ['required', 'array', 'min:1'],
            'ingredient_ids.*' => ['exists:food_ingredients,id'],
        ]);

        try {
            $meal = Meal::findOrFail($id);

            if ($meal->school->tenant_id !== $this->user()->tenant_id) {
                return $this->errorResponse('Bu yemeğe erişim yetkiniz yok.', 403);
            }

            $meal->update([
                'name' => $request->name,
                'meal_type' => $request->meal_type ?? $meal->meal_type,
                'updated_by' => $this->user()->id,
            ]);

            if ($request->has('ingredient_ids')) {
                $meal->ingredients()->sync($request->ingredient_ids ?? []);
            }

            $meal->load('ingredients');

            return $this->successResponse([
                'id' => $meal->id,
                'name' => $meal->name,
                'meal_type' => $meal->meal_type,
                'ingredients' => $meal->ingredients->map(fn ($i) => ['id' => $i->id, 'name' => $i->name]),
            ], 'Yemek güncellendi.');
        } catch (\Throwable $e) {
            Log::error('TenantMealController::mealUpdate Error: '.$e->getMessage());

            return $this->errorResponse('Güncelleme başarısız.', 500);
        }
    }

    /**
     * Yemek sil
     */
    public function mealDestroy(int $id): JsonResponse
    {
        try {
            $meal = Meal::findOrFail($id);

            if ($meal->school->tenant_id !== $this->user()->tenant_id) {
                return $this->errorResponse('Bu yemeğe erişim yetkiniz yok.', 403);
            }

            $meal->delete();

            return $this->successResponse(null, 'Yemek silindi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Yemek bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('TenantMealController::mealDestroy Error: '.$e->getMessage());

            return $this->errorResponse('Silme başarısız.', 500);
        }
    }
}
