<?php

namespace App\Http\Controllers\Schools;

use App\Http\Controllers\Base\BaseController;
use App\Models\Health\Allergen;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Tenant tarafından yönetilen allerjen CRUD işlemleri.
 * Global allerjenler (tenant_id=null) listelenir ama düzenlenemez/silinemez.
 */
class TenantAllergenController extends BaseController
{
    /**
     * Global + tenant'a özel allerjenler
     */
    public function index(): JsonResponse
    {
        try {
            $tenantId = $this->user()->tenant_id;

            $allergens = Allergen::withoutGlobalScope('tenant')
                ->where(function ($q) use ($tenantId) {
                    $q->whereNull('tenant_id')->orWhere('tenant_id', $tenantId);
                })
                ->where('status', 'approved')
                ->orderBy('name')
                ->get();

            return $this->successResponse($allergens->map(fn ($a) => [
                'id' => $a->id,
                'name' => $a->name,
                'description' => $a->description,
                'risk_level' => $a->risk_level,
                'tenant_id' => $a->tenant_id,
            ]));
        } catch (\Throwable $e) {
            Log::error('TenantAllergenController::index Error: '.$e->getMessage());

            return $this->errorResponse('Allerjenler yüklenemedi.', 500);
        }
    }

    /**
     * Tenant'a özel yeni allerjen oluştur
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'risk_level' => ['nullable', 'string', 'in:low,medium,high'],
        ]);

        try {
            DB::beginTransaction();

            $allergen = Allergen::create([
                'tenant_id' => $this->user()->tenant_id,
                'name' => $request->name,
                'description' => $request->description,
                'risk_level' => $request->risk_level,
                'created_by' => $this->user()->id,
            ]);

            DB::commit();

            return $this->successResponse([
                'id' => $allergen->id,
                'name' => $allergen->name,
                'description' => $allergen->description,
                'risk_level' => $allergen->risk_level,
                'tenant_id' => $allergen->tenant_id,
            ], 'Allerjen oluşturuldu.', 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('TenantAllergenController::store Error: '.$e->getMessage());

            return $this->errorResponse('Allerjen oluşturulamadı.', 500);
        }
    }

    /**
     * Tenant'a özel allerjen güncelle
     */
    public function update(Request $request, int $allergen_id): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'risk_level' => ['nullable', 'string', 'in:low,medium,high'],
        ]);

        try {
            $allergen = Allergen::where('id', $allergen_id)
                ->where('tenant_id', $this->user()->tenant_id)
                ->firstOrFail();

            $allergen->update([
                'name' => $request->name,
                'description' => $request->description,
                'risk_level' => $request->risk_level,
                'updated_by' => $this->user()->id,
            ]);

            return $this->successResponse([
                'id' => $allergen->id,
                'name' => $allergen->name,
                'description' => $allergen->description,
                'risk_level' => $allergen->risk_level,
                'tenant_id' => $allergen->tenant_id,
            ], 'Allerjen güncellendi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Allerjen bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('TenantAllergenController::update Error: '.$e->getMessage());

            return $this->errorResponse('Güncelleme başarısız.', 500);
        }
    }

    /**
     * Tenant'a özel allerjen sil
     */
    public function destroy(int $allergen_id): JsonResponse
    {
        try {
            $allergen = Allergen::where('id', $allergen_id)
                ->where('tenant_id', $this->user()->tenant_id)
                ->firstOrFail();

            $allergen->delete();

            return $this->successResponse(null, 'Allerjen silindi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Allerjen bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('TenantAllergenController::destroy Error: '.$e->getMessage());

            return $this->errorResponse('Silme başarısız.', 500);
        }
    }
}
