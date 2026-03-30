<?php

namespace App\Http\Controllers\Schools;

use App\Http\Controllers\Base\BaseController;
use App\Models\Health\MedicalCondition;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Tenant tarafından yönetilen tıbbi durum CRUD işlemleri.
 * Global tıbbi durumlar (tenant_id=null) listelenir ama düzenlenemez/silinemez.
 */
class TenantMedicalConditionController extends BaseController
{
    /**
     * Global + tenant'a özel tıbbi durumlar
     */
    public function index(): JsonResponse
    {
        try {
            $tenantId = $this->user()->tenant_id;

            $conditions = MedicalCondition::withoutGlobalScope('tenant')
                ->where(function ($q) use ($tenantId) {
                    $q->whereNull('tenant_id')->orWhere('tenant_id', $tenantId);
                })
                ->where('status', 'approved')
                ->orderBy('name')
                ->get();

            return $this->successResponse($conditions->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'description' => $c->description,
                'tenant_id' => $c->tenant_id,
            ]));
        } catch (\Throwable $e) {
            Log::error('TenantMedicalConditionController::index Error: '.$e->getMessage());

            return $this->errorResponse('Tıbbi durumlar yüklenemedi.', 500);
        }
    }

    /**
     * Tenant'a özel yeni tıbbi durum oluştur
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
        ]);

        try {
            $condition = MedicalCondition::create([
                'tenant_id' => $this->user()->tenant_id,
                'name' => $request->name,
                'description' => $request->description,
                'status' => 'approved',
                'created_by' => $this->user()->id,
            ]);

            return $this->successResponse([
                'id' => $condition->id,
                'name' => $condition->name,
                'description' => $condition->description,
                'tenant_id' => $condition->tenant_id,
            ], 'Tıbbi durum oluşturuldu.', 201);
        } catch (\Throwable $e) {
            Log::error('TenantMedicalConditionController::store Error: '.$e->getMessage());

            return $this->errorResponse('Tıbbi durum oluşturulamadı.', 500);
        }
    }

    /**
     * Tenant'a özel tıbbi durum güncelle
     */
    public function update(Request $request, int $condition_id): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
        ]);

        try {
            $condition = MedicalCondition::where('id', $condition_id)
                ->where('tenant_id', $this->user()->tenant_id)
                ->firstOrFail();

            $condition->update([
                'name' => $request->name,
                'description' => $request->description,
                'updated_by' => $this->user()->id,
            ]);

            return $this->successResponse([
                'id' => $condition->id,
                'name' => $condition->name,
                'description' => $condition->description,
                'tenant_id' => $condition->tenant_id,
            ], 'Tıbbi durum güncellendi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Tıbbi durum bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('TenantMedicalConditionController::update Error: '.$e->getMessage());

            return $this->errorResponse('Güncelleme başarısız.', 500);
        }
    }

    /**
     * Tenant'a özel tıbbi durum sil
     */
    public function destroy(int $condition_id): JsonResponse
    {
        try {
            $condition = MedicalCondition::where('id', $condition_id)
                ->where('tenant_id', $this->user()->tenant_id)
                ->firstOrFail();

            $condition->delete();

            return $this->successResponse(null, 'Tıbbi durum silindi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Tıbbi durum bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('TenantMedicalConditionController::destroy Error: '.$e->getMessage());

            return $this->errorResponse('Silme başarısız.', 500);
        }
    }
}
