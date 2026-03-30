<?php

namespace App\Http\Controllers\Parents;

use App\Models\Base\BloodType;
use App\Models\Base\Country;
use App\Models\Health\Allergen;
use App\Models\Health\MedicalCondition;
use App\Models\Health\Medication;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class ParentReferenceController extends BaseParentController
{
    /**
     * Global ve tenant'a ait alerjenler.
     *
     * Parent kullanıcılar (tenant_id=null) birden fazla tenant'a ait okula
     * kayıtlı olabileceğinden tüm approved alerjenler döndürülür.
     */
    public function allergens(): JsonResponse
    {
        try {
            $userTenantId = $this->user()->tenant_id;

            $allergens = Allergen::withoutGlobalScope('tenant')
                ->when($userTenantId, function ($q) use ($userTenantId) {
                    $q->where(function ($q2) use ($userTenantId) {
                        $q2->whereNull('tenant_id')
                            ->orWhere('tenant_id', $userTenantId);
                    });
                })
                ->where('status', 'approved')
                ->orderBy('name')
                ->get(['id', 'name', 'description', 'tenant_id']);

            return $this->successResponse($allergens, 'Alerjenler listelendi.');
        } catch (\Throwable $e) {
            Log::error('ParentReferenceController::allergens Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Global ve tenant'a ait tıbbi durumlar.
     *
     * Parent kullanıcılar (tenant_id=null) için tüm approved tıbbi durumlar döndürülür.
     */
    public function conditions(): JsonResponse
    {
        try {
            $userTenantId = $this->user()->tenant_id;

            $conditions = MedicalCondition::withoutGlobalScope('tenant')
                ->when($userTenantId, function ($q) use ($userTenantId) {
                    $q->where(function ($q2) use ($userTenantId) {
                        $q2->whereNull('tenant_id')
                            ->orWhere('tenant_id', $userTenantId);
                    });
                })
                ->where('status', 'approved')
                ->orderBy('name')
                ->get(['id', 'name', 'description', 'tenant_id']);

            return $this->successResponse($conditions, 'Tıbbi durumlar listelendi.');
        } catch (\Throwable $e) {
            Log::error('ParentReferenceController::conditions Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Tüm ilaçlar.
     */
    public function medications(): JsonResponse
    {
        try {
            $medications = Medication::withoutGlobalScope('tenant')
                ->where('status', 'approved')
                ->orderBy('name')
                ->get(['id', 'name']);

            return $this->successResponse($medications, 'İlaçlar listelendi.');
        } catch (\Throwable $e) {
            Log::error('ParentReferenceController::medications Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Aktif kan grupları.
     */
    public function bloodTypes(): JsonResponse
    {
        try {
            $bloodTypes = BloodType::query()
                ->where('is_active', true)
                ->orderByDesc('sort_order')
                ->orderBy('name')
                ->get(['id', 'name']);

            return $this->successResponse($bloodTypes, 'Kan grupları listelendi.');
        } catch (\Throwable $e) {
            Log::error('ParentReferenceController::bloodTypes Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Tüm ülkeler.
     */
    public function countries(): JsonResponse
    {
        try {
            $countries = Country::query()
                ->where('is_active', true)
                ->whereNotNull('phone_code')
                ->orderByDesc('sort_order')
                ->orderBy('name')
                ->get(['id', 'name', 'iso2', 'phone_code', 'flag_emoji']);

            return $this->successResponse($countries, 'Ülkeler listelendi.');
        } catch (\Throwable $e) {
            Log::error('ParentReferenceController::countries Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }
}
