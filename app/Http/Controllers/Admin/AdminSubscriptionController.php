<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Base\BaseController;
use App\Http\Resources\TenantSubscriptionResource;
use App\Models\Package\TenantSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Admin Abonelik Yönetimi Controller
 *
 * Süper Admin tüm abonelikleri izleyebilir, durumlarını değiştirebilir,
 * süre uzatabilir ve abonelik oluşturabilir.
 */
class AdminSubscriptionController extends BaseController
{
    /**
     * Tüm abonelikleri listele
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = TenantSubscription::with(['tenant', 'package']);

            // Durum filtresi
            if ($status = $request->input('status')) {
                $query->where('status', $status);
            }

            // Paket filtresi
            if ($packageId = $request->input('package_id')) {
                $query->where('package_id', $packageId);
            }

            // Tenant filtresi
            if ($tenantId = $request->input('tenant_id')) {
                $query->where('tenant_id', $tenantId);
            }

            // Süresi dolmak üzere olanlar
            if ($request->boolean('expiring_soon')) {
                $query->where('status', 'active')
                    ->where('end_date', '<=', now()->addDays(7))
                    ->where('end_date', '>', now());
            }

            // Süresi dolmuşlar
            if ($request->boolean('expired')) {
                $query->where('status', 'active')
                    ->where('end_date', '<', now());
            }

            $perPage = $request->input('per_page', 15);
            $subscriptions = $query->latest()->paginate($perPage);

            return $this->paginatedResponse(
                TenantSubscriptionResource::collection($subscriptions)->resource
            );
        } catch (\Throwable $e) {
            Log::error('Admin abonelik listeleme hatası: ' . $e->getMessage());

            return $this->errorResponse('Abonelikler listelenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Abonelik detayı
     */
    public function show(TenantSubscription $subscription): JsonResponse
    {
        try {
            $subscription->load(['tenant.owner', 'package', 'payments']);

            $stats = [
                'days_remaining' => $subscription->end_date?->diffInDays(now()),
                'is_expired' => $subscription->end_date?->isPast() ?? false,
                'total_paid' => $subscription->payments?->sum('amount') ?? 0,
            ];

            return $this->successResponse([
                'subscription' => new TenantSubscriptionResource($subscription),
                'stats' => $stats,
            ]);
        } catch (\Throwable $e) {
            Log::error('Admin abonelik detay hatası: ' . $e->getMessage());

            return $this->errorResponse('Abonelik detayı getirilirken bir hata oluştu.', 500);
        }
    }

    /**
     * Abonelik durumunu güncelle
     */
    public function updateStatus(Request $request, TenantSubscription $subscription): JsonResponse
    {
        DB::beginTransaction();
        try {
            $request->validate([
                'status' => 'required|string|in:active,cancelled,expired,suspended',
            ]);

            $subscription->update([
                'status' => $request->status,
                'updated_by' => $this->user()->id,
            ]);

            DB::commit();

            return $this->successResponse(
                new TenantSubscriptionResource($subscription->fresh()),
                'Abonelik durumu güncellendi.'
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Admin abonelik durum güncelleme hatası: ' . $e->getMessage());

            return $this->errorResponse('Abonelik durumu güncellenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Abonelik süresini uzat
     */
    public function extend(Request $request, TenantSubscription $subscription): JsonResponse
    {
        DB::beginTransaction();
        try {
            $request->validate([
                'days' => 'required|integer|min:1|max:365',
                'reason' => 'nullable|string|max:500',
            ]);

            $newEndDate = $subscription->end_date->addDays($request->days);

            $subscription->update([
                'end_date' => $newEndDate,
                'status' => 'active',
                'updated_by' => $this->user()->id,
            ]);

            DB::commit();

            return $this->successResponse(
                new TenantSubscriptionResource($subscription->fresh()),
                "Abonelik süresi {$request->days} gün uzatıldı. Yeni bitiş tarihi: {$newEndDate->toDateString()}"
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Admin abonelik uzatma hatası: ' . $e->getMessage());

            return $this->errorResponse('Abonelik uzatılırken bir hata oluştu.', 500);
        }
    }

    /**
     * Manuel abonelik oluştur (admin tarafından)
     */
    public function store(Request $request): JsonResponse
    {
        DB::beginTransaction();
        try {
            $request->validate([
                'tenant_id' => 'required|exists:tenants,id',
                'package_id' => 'required|exists:packages,id',
                'billing_cycle' => 'required|in:monthly,yearly',
                'price' => 'required|numeric|min:0',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after:start_date',
                'status' => 'nullable|string|in:active,pending',
            ]);

            // Mevcut aktif aboneliği kapat
            TenantSubscription::where('tenant_id', $request->tenant_id)
                ->where('status', 'active')
                ->update(['status' => 'replaced']);

            $subscription = TenantSubscription::create([
                'tenant_id' => $request->tenant_id,
                'package_id' => $request->package_id,
                'billing_cycle' => $request->billing_cycle,
                'price' => $request->price,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'status' => $request->status ?? 'active',
                'created_by' => $this->user()->id,
            ]);

            DB::commit();

            return $this->successResponse(
                new TenantSubscriptionResource($subscription),
                'Abonelik başarıyla oluşturuldu.',
                201
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Admin abonelik oluşturma hatası: ' . $e->getMessage());

            return $this->errorResponse('Abonelik oluşturulurken bir hata oluştu.', 500);
        }
    }

    /**
     * Abonelik istatistikleri
     */
    public function stats(): JsonResponse
    {
        try {
            $stats = [
                'total' => TenantSubscription::count(),
                'active' => TenantSubscription::where('status', 'active')->count(),
                'cancelled' => TenantSubscription::where('status', 'cancelled')->count(),
                'expired' => TenantSubscription::where('status', 'expired')->count(),
                'suspended' => TenantSubscription::where('status', 'suspended')->count(),
                'expiring_this_week' => TenantSubscription::where('status', 'active')
                    ->where('end_date', '<=', now()->addDays(7))
                    ->where('end_date', '>', now())
                    ->count(),
                'total_monthly_revenue' => TenantSubscription::where('status', 'active')
                    ->where('billing_cycle', 'monthly')
                    ->sum('price'),
                'total_yearly_revenue' => TenantSubscription::where('status', 'active')
                    ->where('billing_cycle', 'yearly')
                    ->sum('price'),
            ];

            return $this->successResponse($stats, 'Abonelik istatistikleri.');
        } catch (\Throwable $e) {
            Log::error('Admin abonelik istatistikleri hatası: ' . $e->getMessage());

            return $this->errorResponse('İstatistikler getirilirken bir hata oluştu.', 500);
        }
    }
}
