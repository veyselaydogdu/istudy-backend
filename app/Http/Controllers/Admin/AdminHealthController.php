<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Base\BaseController;
use App\Models\Base\BloodType;
use App\Models\Health\Allergen;
use App\Models\Health\FoodIngredient;
use App\Models\Health\MedicalCondition;
use App\Models\Health\Medication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Admin Sağlık & Beslenme Veri Yönetimi
 *
 * Alerjenler, Tıbbi Durumlar, İlaçlar ve Yemek İçerikleri
 * için süper admin CRUD endpoint'leri.
 * Tenant scope bypass edilir (global kayıtlar yönetilir).
 */
class AdminHealthController extends BaseController
{
    // ─── Alerjenler ──────────────────────────────────────────────────────────

    /**
     * Tüm alerjenleri listele (global + tüm tenant'lar).
     */
    public function allergenIndex(Request $request): JsonResponse
    {
        try {
            $query = Allergen::withoutGlobalScopes()
                ->with('createdBy:id,name,surname')
                ->orderBy('name');

            if ($request->filled('search')) {
                $query->where('name', 'like', '%'.$request->search.'%');
            }

            if ($request->filled('tenant_id')) {
                $query->where('tenant_id', $request->tenant_id);
            }

            if ($request->boolean('global_only')) {
                $query->whereNull('tenant_id');
            }

            $allergens = $query->paginate($request->integer('per_page', 20));

            return $this->paginatedResponse($allergens);
        } catch (\Throwable $e) {
            Log::error('AdminHealthController::allergenIndex Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Alerjenler listelenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Yeni alerjen oluştur (global — tenant_id null).
     */
    public function allergenStore(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255', 'regex:/^[^<>&"\']*$/'],
            'description' => ['nullable', 'string', 'max:1000', 'regex:/^[^<>]*$/'],
            'risk_level' => 'nullable|in:low,medium,high',
        ], [
            'name.required' => 'Alerjen adı zorunludur.',
            'name.regex' => 'Alerjen adı HTML karakterleri içeremez.',
            'risk_level.in' => 'Risk seviyesi low, medium veya high olmalıdır.',
        ]);

        try {
            DB::beginTransaction();

            $allergen = Allergen::create([
                'name' => $request->name,
                'description' => $request->description,
                'risk_level' => $request->risk_level ?? 'medium',
                'tenant_id' => null,
                'created_by' => $this->user()->id,
            ]);

            DB::commit();

            return $this->successResponse($allergen, 'Alerjen başarıyla oluşturuldu.', 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('AdminHealthController::allergenStore Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Alerjen oluşturulurken bir hata oluştu.', 500);
        }
    }

    /**
     * Alerjen güncelle.
     */
    public function allergenUpdate(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'name' => ['sometimes', 'string', 'max:255', 'regex:/^[^<>&"\']*$/'],
            'description' => ['nullable', 'string', 'max:1000', 'regex:/^[^<>]*$/'],
            'risk_level' => 'nullable|in:low,medium,high',
        ]);

        try {
            DB::beginTransaction();

            $allergen = Allergen::withoutGlobalScopes()->findOrFail($id);
            $allergen->update(array_merge(
                $request->only(['name', 'description', 'risk_level']),
                ['updated_by' => $this->user()->id]
            ));

            DB::commit();

            return $this->successResponse($allergen, 'Alerjen güncellendi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('AdminHealthController::allergenUpdate Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Alerjen güncellenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Alerjen sil.
     */
    public function allergenDestroy(int $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $allergen = Allergen::withoutGlobalScopes()->findOrFail($id);
            $allergen->delete();

            DB::commit();

            return $this->successResponse(null, 'Alerjen silindi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('AdminHealthController::allergenDestroy Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Alerjen silinirken bir hata oluştu.', 500);
        }
    }

    // ─── Tıbbi Durumlar ───────────────────────────────────────────────────────

    /**
     * Tüm tıbbi durumları listele.
     */
    public function conditionIndex(Request $request): JsonResponse
    {
        try {
            $query = MedicalCondition::withoutGlobalScopes()
                ->orderBy('name');

            if ($request->filled('search')) {
                $query->where('name', 'like', '%'.$request->search.'%');
            }

            $conditions = $query->paginate($request->integer('per_page', 20));

            return $this->paginatedResponse($conditions);
        } catch (\Throwable $e) {
            Log::error('AdminHealthController::conditionIndex Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Tıbbi durumlar listelenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Yeni tıbbi durum oluştur.
     */
    public function conditionStore(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255', 'regex:/^[^<>&"\']*$/'],
            'description' => ['nullable', 'string', 'max:1000', 'regex:/^[^<>]*$/'],
        ], [
            'name.required' => 'Tıbbi durum adı zorunludur.',
            'name.regex' => 'Tıbbi durum adı HTML karakterleri içeremez.',
        ]);

        try {
            DB::beginTransaction();

            $condition = MedicalCondition::create([
                'name' => $request->name,
                'description' => $request->description,
                'tenant_id' => null,
                'created_by' => $this->user()->id,
            ]);

            DB::commit();

            return $this->successResponse($condition, 'Tıbbi durum başarıyla oluşturuldu.', 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('AdminHealthController::conditionStore Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Tıbbi durum oluşturulurken bir hata oluştu.', 500);
        }
    }

    /**
     * Tıbbi durum güncelle.
     */
    public function conditionUpdate(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'name' => ['sometimes', 'string', 'max:255', 'regex:/^[^<>&"\']*$/'],
            'description' => ['nullable', 'string', 'max:1000', 'regex:/^[^<>]*$/'],
        ]);

        try {
            DB::beginTransaction();

            $condition = MedicalCondition::withoutGlobalScopes()->findOrFail($id);
            $condition->update(array_merge(
                $request->only(['name', 'description']),
                ['updated_by' => $this->user()->id]
            ));

            DB::commit();

            return $this->successResponse($condition, 'Tıbbi durum güncellendi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('AdminHealthController::conditionUpdate Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Tıbbi durum güncellenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Tıbbi durum sil.
     */
    public function conditionDestroy(int $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $condition = MedicalCondition::withoutGlobalScopes()->findOrFail($id);
            $condition->delete();

            DB::commit();

            return $this->successResponse(null, 'Tıbbi durum silindi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('AdminHealthController::conditionDestroy Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Tıbbi durum silinirken bir hata oluştu.', 500);
        }
    }

    // ─── Yemek İçerikleri ────────────────────────────────────────────────────

    /**
     * Tüm yemek/besin içeriklerini listele.
     */
    public function ingredientIndex(Request $request): JsonResponse
    {
        try {
            $query = FoodIngredient::withoutGlobalScopes()
                ->with('allergens:id,name')
                ->orderBy('name');

            if ($request->filled('search')) {
                $query->where('name', 'like', '%'.$request->search.'%');
            }

            $ingredients = $query->paginate($request->integer('per_page', 20));

            return $this->paginatedResponse($ingredients);
        } catch (\Throwable $e) {
            Log::error('AdminHealthController::ingredientIndex Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Besin içerikleri listelenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Yeni yemek içeriği oluştur.
     */
    public function ingredientStore(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255', 'regex:/^[^<>&"\']*$/'],
            'allergen_info' => ['nullable', 'string', 'max:1000', 'regex:/^[^<>]*$/'],
            'allergen_ids' => 'nullable|array',
            'allergen_ids.*' => 'exists:allergens,id',
        ], [
            'name.required' => 'Besin adı zorunludur.',
            'name.regex' => 'Besin adı HTML karakterleri içeremez.',
            'allergen_ids.array' => 'Alerjen IDleri dizi olmalıdır.',
            'allergen_ids.*.exists' => 'Seçilen alerjen bulunamadı.',
        ]);

        try {
            DB::beginTransaction();

            $ingredient = FoodIngredient::create([
                'name' => $request->name,
                'allergen_info' => $request->allergen_info,
                'tenant_id' => null,
                'created_by' => $this->user()->id,
            ]);

            // Sync allergens if provided
            if ($request->filled('allergen_ids')) {
                $ingredient->allergens()->sync($request->allergen_ids);
            }

            // Load allergens for response
            $ingredient->load('allergens:id,name');

            DB::commit();

            return $this->successResponse($ingredient, 'Besin içeriği başarıyla oluşturuldu.', 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('AdminHealthController::ingredientStore Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Besin içeriği oluşturulurken bir hata oluştu.', 500);
        }
    }

    /**
     * Besin içeriği güncelle.
     */
    public function ingredientUpdate(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'name' => ['sometimes', 'string', 'max:255', 'regex:/^[^<>&"\']*$/'],
            'allergen_info' => ['nullable', 'string', 'max:1000', 'regex:/^[^<>]*$/'],
            'allergen_ids' => 'nullable|array',
            'allergen_ids.*' => 'exists:allergens,id',
        ]);

        try {
            DB::beginTransaction();

            $ingredient = FoodIngredient::withoutGlobalScopes()->findOrFail($id);
            $ingredient->update(array_merge(
                $request->only(['name', 'allergen_info']),
                ['updated_by' => $this->user()->id]
            ));

            // Sync allergens if provided
            if ($request->has('allergen_ids')) {
                $ingredient->allergens()->sync($request->allergen_ids ?? []);
            }

            // Load allergens for response
            $ingredient->load('allergens:id,name');

            DB::commit();

            return $this->successResponse($ingredient, 'Besin içeriği güncellendi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('AdminHealthController::ingredientUpdate Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Besin içeriği güncellenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Besin içeriği sil.
     */
    public function ingredientDestroy(int $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $ingredient = FoodIngredient::withoutGlobalScopes()->findOrFail($id);
            $ingredient->delete();

            DB::commit();

            return $this->successResponse(null, 'Besin içeriği silindi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('AdminHealthController::ingredientDestroy Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Besin içeriği silinirken bir hata oluştu.', 500);
        }
    }

    // ─── İlaçlar ─────────────────────────────────────────────────────────────

    /**
     * İlaç listesi.
     */
    public function medicationIndex(Request $request): JsonResponse
    {
        try {
            $query = Medication::withoutGlobalScopes()->orderBy('name');

            if ($request->filled('search')) {
                $query->where('name', 'like', '%'.$request->search.'%');
            }

            $medications = $query->paginate($request->integer('per_page', 20));

            return $this->paginatedResponse($medications);
        } catch (\Throwable $e) {
            Log::error('AdminHealthController::medicationIndex Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('İlaçlar listelenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Yeni ilaç oluştur.
     */
    public function medicationStore(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255', 'regex:/^[^<>&"\']*$/'],
            'usage_notes' => ['nullable', 'string', 'max:1000', 'regex:/^[^<>]*$/'],
        ]);

        try {
            DB::beginTransaction();

            $medication = Medication::create([
                'name' => $request->name,
                'usage_notes' => $request->usage_notes,
                'tenant_id' => null,
                'created_by' => $this->user()->id,
            ]);

            DB::commit();

            return $this->successResponse($medication, 'İlaç başarıyla oluşturuldu.', 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('AdminHealthController::medicationStore Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('İlaç oluşturulurken bir hata oluştu.', 500);
        }
    }

    /**
     * İlaç sil.
     */
    public function medicationDestroy(int $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $medication = Medication::withoutGlobalScopes()->findOrFail($id);
            $medication->delete();

            DB::commit();

            return $this->successResponse(null, 'İlaç silindi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('AdminHealthController::medicationDestroy Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('İlaç silinirken bir hata oluştu.', 500);
        }
    }

    // ─── Kan Grupları ─────────────────────────────────────────────────────────

    /**
     * Kan gruplarını listele.
     */
    public function bloodTypeIndex(): JsonResponse
    {
        try {
            $bloodTypes = BloodType::withTrashed()
                ->orderByDesc('sort_order')
                ->orderBy('name')
                ->get();

            return $this->successResponse($bloodTypes, 'Kan grupları listelendi.');
        } catch (\Throwable $e) {
            Log::error('AdminHealthController::bloodTypeIndex Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Kan grupları listelenirken hata oluştu.', 500);
        }
    }

    /**
     * Yeni kan grubu oluştur.
     */
    public function bloodTypeStore(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:20', 'unique:blood_types,name'],
        ]);

        try {
            $bloodType = BloodType::create([
                'name' => strtoupper(trim($request->name)),
                'is_active' => true,
                'sort_order' => 0,
                'created_by' => $this->user()->id,
            ]);

            return $this->successResponse($bloodType, 'Kan grubu oluşturuldu.', 201);
        } catch (\Throwable $e) {
            Log::error('AdminHealthController::bloodTypeStore Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Kan grubu oluşturulurken hata oluştu.', 500);
        }
    }

    /**
     * Kan grubu güncelle.
     */
    public function bloodTypeUpdate(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'name' => ['sometimes', 'string', 'max:20', "unique:blood_types,name,{$id}"],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        try {
            $bloodType = BloodType::withTrashed()->findOrFail($id);
            $bloodType->update(array_merge(
                $request->only(['name', 'is_active', 'sort_order']),
                ['updated_by' => $this->user()->id]
            ));

            return $this->successResponse($bloodType, 'Kan grubu güncellendi.');
        } catch (\Throwable $e) {
            Log::error('AdminHealthController::bloodTypeUpdate Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Kan grubu güncellenirken hata oluştu.', 500);
        }
    }

    /**
     * Kan grubu sil.
     */
    public function bloodTypeDestroy(int $id): JsonResponse
    {
        try {
            BloodType::findOrFail($id)->delete();

            return $this->successResponse(null, 'Kan grubu silindi.');
        } catch (\Throwable $e) {
            Log::error('AdminHealthController::bloodTypeDestroy Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Kan grubu silinirken hata oluştu.', 500);
        }
    }

    // ─── Veli Önerileri Onay ────────────────────────────────────────────────

    /**
     * Onay bekleyen önerileri listele (super admin — tüm tenant).
     */
    public function pendingSuggestions(Request $request): JsonResponse
    {
        try {
            $type = $request->get('type'); // allergen|condition|medication

            $result = [];

            if (! $type || $type === 'allergen') {
                $result['allergens'] = Allergen::withoutGlobalScopes()
                    ->where('status', 'pending')
                    ->with('suggestedBy:id,name,surname')
                    ->orderBy('created_at', 'desc')
                    ->get(['id', 'name', 'description', 'risk_level', 'tenant_id', 'suggested_by_user_id', 'created_at']);
            }

            if (! $type || $type === 'condition') {
                $result['conditions'] = MedicalCondition::withoutGlobalScopes()
                    ->where('status', 'pending')
                    ->with('suggestedBy:id,name,surname')
                    ->orderBy('created_at', 'desc')
                    ->get(['id', 'name', 'description', 'tenant_id', 'suggested_by_user_id', 'created_at']);
            }

            if (! $type || $type === 'medication') {
                $result['medications'] = Medication::withoutGlobalScopes()
                    ->where('status', 'pending')
                    ->with('suggestedBy:id,name,surname')
                    ->orderBy('created_at', 'desc')
                    ->get(['id', 'name', 'tenant_id', 'suggested_by_user_id', 'created_at']);
            }

            return $this->successResponse($result, 'Onay bekleyen öneriler listelendi.');
        } catch (\Throwable $e) {
            Log::error('AdminHealthController::pendingSuggestions Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Öneriler listelenirken hata oluştu.', 500);
        }
    }

    /**
     * Veli önerisini süper admin olarak onayla (global yapar).
     */
    public function approveSuggestion(Request $request): JsonResponse
    {
        $request->validate([
            'type' => ['required', 'in:allergen,condition,medication'],
            'id' => ['required', 'integer'],
        ]);

        try {
            $type = $request->type;
            $id = $request->id;

            if ($type === 'allergen') {
                $item = Allergen::withoutGlobalScopes()->where('status', 'pending')->findOrFail($id);
                $item->update(['status' => 'approved', 'tenant_id' => null, 'updated_by' => $this->user()->id]);
            } elseif ($type === 'condition') {
                $item = MedicalCondition::withoutGlobalScopes()->where('status', 'pending')->findOrFail($id);
                $item->update(['status' => 'approved', 'tenant_id' => null, 'updated_by' => $this->user()->id]);
            } else {
                $item = Medication::withoutGlobalScopes()->where('status', 'pending')->findOrFail($id);
                $item->update(['status' => 'approved', 'tenant_id' => null, 'updated_by' => $this->user()->id]);
            }

            return $this->successResponse($item, 'Öneri onaylandı ve global olarak eklendi.');
        } catch (\Throwable $e) {
            Log::error('AdminHealthController::approveSuggestion Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Onaylama sırasında hata oluştu.', 500);
        }
    }

    /**
     * Veli önerisini reddet.
     */
    public function rejectSuggestion(Request $request): JsonResponse
    {
        $request->validate([
            'type' => ['required', 'in:allergen,condition,medication'],
            'id' => ['required', 'integer'],
        ]);

        try {
            $type = $request->type;
            $id = $request->id;

            if ($type === 'allergen') {
                $item = Allergen::withoutGlobalScopes()->where('status', 'pending')->findOrFail($id);
            } elseif ($type === 'condition') {
                $item = MedicalCondition::withoutGlobalScopes()->where('status', 'pending')->findOrFail($id);
            } else {
                $item = Medication::withoutGlobalScopes()->where('status', 'pending')->findOrFail($id);
            }

            $item->update(['status' => 'rejected', 'updated_by' => $this->user()->id]);

            return $this->successResponse(null, 'Öneri reddedildi.');
        } catch (\Throwable $e) {
            Log::error('AdminHealthController::rejectSuggestion Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Reddetme sırasında hata oluştu.', 500);
        }
    }
}
