<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Base\BaseController;
use App\Http\Resources\TenantResource;
use App\Models\Tenant\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Admin Tenant Yönetimi Controller
 *
 * Süper Admin tüm tenant'ları listeleyebilir, detaylarını görebilir,
 * abonelik durumlarını kontrol edebilir ve durumlarını değiştirebilir.
 */
class AdminTenantController extends BaseController
{
    /**
     * Tüm tenant'ları listele
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Tenant::query();

            // Arama
            if ($search = $request->input('search')) {
                $query->where('name', 'like', "%{$search}%");
            }

            // Abonelik durumu filtresi
            if ($request->input('has_active_subscription') === 'true') {
                $query->whereHas('activeSubscription');
            } elseif ($request->input('has_active_subscription') === 'false') {
                $query->whereDoesntHave('activeSubscription');
            }

            $perPage = $request->input('per_page', 15);
            $tenants = $query->withCount(['schools', 'users', 'subscriptions'])
                ->with(['owner', 'activeSubscription.package'])
                ->latest()
                ->paginate($perPage);

            return $this->paginatedResponse(
                TenantResource::collection($tenants)
            );
        } catch (\Throwable $e) {
            Log::error('Admin tenant listeleme hatası: '.$e->getMessage());

            return $this->errorResponse('Tenant\'lar listelenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Tenant detayı (tüm ilişkiler ve istatistikler)
     */
    public function show(Tenant $tenant): JsonResponse
    {
        try {
            $tenant->load([
                'owner',
                'schools' => fn ($q) => $q->withCount(['children', 'classes', 'teachers']),
                'subscriptions.package',
                'activeSubscription.package',
            ]);

            $stats = [
                'total_schools' => $tenant->schools->count(),
                'total_children' => $tenant->schools->sum('children_count'),
                'total_classes' => $tenant->schools->sum('classes_count'),
                'total_teachers' => $tenant->schools->sum('teachers_count'),
                'total_users' => $tenant->users()->count(),
                'subscription_status' => $tenant->activeSubscription ? 'active' : 'inactive',
                'current_package' => $tenant->activeSubscription?->package?->name ?? 'Yok',
                'can_create_school' => $tenant->canCreateSchool(),
                'can_enroll_student' => $tenant->canEnrollStudent(),
            ];

            return $this->successResponse([
                'tenant' => new TenantResource($tenant),
                'stats' => $stats,
            ]);
        } catch (\Throwable $e) {
            Log::error('Admin tenant detay hatası: '.$e->getMessage());

            return $this->errorResponse('Tenant detayı getirilirken bir hata oluştu.', 500);
        }
    }

    /**
     * Tenant güncelle
     */
    public function update(Request $request, Tenant $tenant): JsonResponse
    {
        DB::beginTransaction();
        try {
            $request->validate([
                'name' => 'sometimes|string|max:255',
                'country' => 'nullable|string|max:50',
                'currency' => 'nullable|string|max:3',
            ]);

            $data = $request->only(['name', 'country', 'currency']);
            $data['updated_by'] = $this->user()->id;

            $tenant->update($data);

            DB::commit();

            return $this->successResponse(
                new TenantResource($tenant->fresh()),
                'Tenant başarıyla güncellendi.'
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Admin tenant güncelleme hatası: '.$e->getMessage());

            return $this->errorResponse('Tenant güncellenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Tenant'ın abonelik geçmişi
     */
    public function subscriptionHistory(Tenant $tenant): JsonResponse
    {
        try {
            $subscriptions = $tenant->subscriptions()
                ->with('package')
                ->latest()
                ->get();

            return $this->successResponse($subscriptions);
        } catch (\Throwable $e) {
            Log::error('Admin tenant abonelik geçmişi hatası: '.$e->getMessage());

            return $this->errorResponse('Abonelik geçmişi getirilirken bir hata oluştu.', 500);
        }
    }

    /**
     * Tenant'ın okullarını listele
     */
    public function schools(Tenant $tenant): JsonResponse
    {
        try {
            $schools = $tenant->schools()
                ->withCount(['children', 'classes', 'teachers'])
                ->get();

            return $this->successResponse($schools);
        } catch (\Throwable $e) {
            Log::error('Admin tenant okullar hatası: '.$e->getMessage());

            return $this->errorResponse('Okullar getirilirken bir hata oluştu.', 500);
        }
    }

    /**
     * Tenant sil (soft delete)
     */
    public function destroy(Tenant $tenant): JsonResponse
    {
        DB::beginTransaction();
        try {
            // Aktif aboneliği varsa uyar
            if ($tenant->hasActiveSubscription()) {
                return $this->errorResponse(
                    'Bu tenant\'ın aktif aboneliği var. Önce aboneliği iptal edin.',
                    422
                );
            }

            $tenant->delete();

            DB::commit();

            return $this->successResponse(null, 'Tenant başarıyla silindi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Admin tenant silme hatası: '.$e->getMessage());

            return $this->errorResponse('Tenant silinirken bir hata oluştu.', 500);
        }
    }
}
