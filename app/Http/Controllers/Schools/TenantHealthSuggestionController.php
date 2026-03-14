<?php

namespace App\Http\Controllers\Schools;

use App\Http\Controllers\Base\BaseController;
use App\Models\Health\Allergen;
use App\Models\Health\MedicalCondition;
use App\Models\Health\Medication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Tenant admin'in veli önerilerini onaylama/reddetme işlemleri.
 */
class TenantHealthSuggestionController extends BaseController
{
    /**
     * Tenant'a ait onay bekleyen önerileri listele.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $tenantId = $this->user()->tenant_id;
            $type = $request->get('type');

            $result = [];

            if (! $type || $type === 'allergen') {
                $result['allergens'] = Allergen::withoutGlobalScopes()
                    ->where('status', 'pending')
                    ->where('tenant_id', $tenantId)
                    ->orderBy('created_at', 'desc')
                    ->get(['id', 'name', 'description', 'risk_level', 'suggested_by_user_id', 'created_at']);
            }

            if (! $type || $type === 'condition') {
                $result['conditions'] = MedicalCondition::withoutGlobalScopes()
                    ->where('status', 'pending')
                    ->where('tenant_id', $tenantId)
                    ->orderBy('created_at', 'desc')
                    ->get(['id', 'name', 'description', 'suggested_by_user_id', 'created_at']);
            }

            if (! $type || $type === 'medication') {
                $result['medications'] = Medication::withoutGlobalScopes()
                    ->where('status', 'pending')
                    ->where('tenant_id', $tenantId)
                    ->orderBy('created_at', 'desc')
                    ->get(['id', 'name', 'suggested_by_user_id', 'created_at']);
            }

            return $this->successResponse($result, 'Bekleyen öneriler listelendi.');
        } catch (\Throwable $e) {
            Log::error('TenantHealthSuggestionController::index Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Öneriler listelenirken hata oluştu.', 500);
        }
    }

    /**
     * Tenant admin olarak öneriyi onayla (tenant-scoped yapar).
     */
    public function approve(Request $request): JsonResponse
    {
        $request->validate([
            'type' => ['required', 'in:allergen,condition,medication'],
            'id' => ['required', 'integer'],
        ]);

        try {
            $tenantId = $this->user()->tenant_id;
            $type = $request->type;
            $id = $request->id;

            if ($type === 'allergen') {
                $item = Allergen::withoutGlobalScopes()
                    ->where('status', 'pending')
                    ->where('tenant_id', $tenantId)
                    ->findOrFail($id);
                $item->update(['status' => 'approved', 'updated_by' => $this->user()->id]);
            } elseif ($type === 'condition') {
                $item = MedicalCondition::withoutGlobalScopes()
                    ->where('status', 'pending')
                    ->where('tenant_id', $tenantId)
                    ->findOrFail($id);
                $item->update(['status' => 'approved', 'updated_by' => $this->user()->id]);
            } else {
                $item = Medication::withoutGlobalScopes()
                    ->where('status', 'pending')
                    ->where('tenant_id', $tenantId)
                    ->findOrFail($id);
                $item->update(['status' => 'approved', 'updated_by' => $this->user()->id]);
            }

            return $this->successResponse($item, 'Öneri onaylandı ve tenant kütüphanesine eklendi.');
        } catch (\Throwable $e) {
            Log::error('TenantHealthSuggestionController::approve Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Onaylama sırasında hata oluştu.', 500);
        }
    }

    /**
     * Tenant admin olarak öneriyi reddet.
     */
    public function reject(Request $request): JsonResponse
    {
        $request->validate([
            'type' => ['required', 'in:allergen,condition,medication'],
            'id' => ['required', 'integer'],
        ]);

        try {
            $tenantId = $this->user()->tenant_id;
            $type = $request->type;
            $id = $request->id;

            if ($type === 'allergen') {
                $item = Allergen::withoutGlobalScopes()
                    ->where('status', 'pending')
                    ->where('tenant_id', $tenantId)
                    ->findOrFail($id);
            } elseif ($type === 'condition') {
                $item = MedicalCondition::withoutGlobalScopes()
                    ->where('status', 'pending')
                    ->where('tenant_id', $tenantId)
                    ->findOrFail($id);
            } else {
                $item = Medication::withoutGlobalScopes()
                    ->where('status', 'pending')
                    ->where('tenant_id', $tenantId)
                    ->findOrFail($id);
            }

            $item->update(['status' => 'rejected', 'updated_by' => $this->user()->id]);

            return $this->successResponse(null, 'Öneri reddedildi.');
        } catch (\Throwable $e) {
            Log::error('TenantHealthSuggestionController::reject Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Reddetme sırasında hata oluştu.', 500);
        }
    }
}
