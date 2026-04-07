<?php

namespace App\Services;

use App\Models\Package\Package;
use App\Models\Package\TenantPayment;
use App\Models\Package\TenantSubscription;
use App\Models\Tenant\Tenant;
use Carbon\Carbon;

class TenantSubscriptionService
{
    /**
     * Tenant için paket aboneliği oluştur veya mevcut aboneliği uzat.
     *
     * - Aktif abonelik yoksa: yeni abonelik oluştur.
     * - Aktif abonelik VAR ve aynı paket: bitiş tarihini bir dönem uzat.
     * - Aktif abonelik VAR ve farklı paket: mevcutu iptal et, yenisini oluştur.
     */
    public function subscribe(Tenant $tenant, array $data): array
    {
        $package = Package::findOrFail($data['package_id']);

        if (! $package->is_active) {
            throw new \Exception('Seçilen paket aktif değil.', 400);
        }

        $billingCycle = $data['billing_cycle'] ?? 'monthly';
        $price = $package->priceFor($billingCycle);

        $existingSubscription = $tenant->activeSubscription;

        if ($existingSubscription) {
            if ($existingSubscription->package_id === $package->id) {
                // Aynı paket — bitiş tarihini bir dönem uzat
                $newEndDate = $billingCycle === 'yearly'
                    ? Carbon::parse($existingSubscription->end_date)->addYear()
                    : Carbon::parse($existingSubscription->end_date)->addMonth();

                $existingSubscription->update([
                    'end_date' => $newEndDate,
                    'billing_cycle' => $billingCycle,
                    'updated_by' => auth()->id(),
                ]);

                $subscription = $existingSubscription->fresh()->load('package');
            } else {
                // Farklı paket — mevcutu iptal et, yeni oluştur
                $existingSubscription->update([
                    'status' => 'cancelled',
                    'updated_by' => auth()->id(),
                ]);

                $subscription = $this->createSubscription($tenant, $package, $billingCycle, $data, $price);
            }
        } else {
            // Abonelik yok — yeni oluştur
            $subscription = $this->createSubscription($tenant, $package, $billingCycle, $data, $price);
        }

        // Ödeme kaydı oluştur
        $payment = TenantPayment::create([
            'tenant_subscription_id' => $subscription->id,
            'amount' => $price,
            'currency' => $tenant->currency ?? 'TRY',
            'payment_method' => $data['payment_method'] ?? 'credit_card',
            'status' => 'completed',
            'paid_at' => now(),
            'created_by' => auth()->id(),
        ]);

        return [
            'subscription' => $subscription,
            'payment' => $payment,
        ];
    }

    /**
     * Yeni TenantSubscription kaydı oluştur (iç yardımcı)
     */
    private function createSubscription(Tenant $tenant, Package $package, string $billingCycle, array $data, float $price): TenantSubscription
    {
        $startDate = Carbon::today();
        $endDate = $billingCycle === 'yearly'
            ? $startDate->copy()->addYear()
            : $startDate->copy()->addMonth();

        return TenantSubscription::create([
            'tenant_id' => $tenant->id,
            'package_id' => $package->id,
            'billing_cycle' => $billingCycle,
            'price' => $price,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'status' => 'active',
            'auto_renew' => $data['auto_renew'] ?? true,
            'created_by' => auth()->id(),
        ])->load('package');
    }

    /**
     * Mevcut aktif aboneliği iptal et
     */
    public function cancelExistingSubscription(Tenant $tenant): void
    {
        $activeSubscription = $tenant->activeSubscription;

        if ($activeSubscription) {
            $activeSubscription->update([
                'status' => 'cancelled',
                'updated_by' => auth()->id(),
            ]);
        }
    }

    /**
     * Abonelik durumunu görüntüle
     */
    public function getCurrentSubscription(Tenant $tenant): ?TenantSubscription
    {
        return $tenant->activeSubscription?->load('package', 'payments');
    }

    /**
     * Abonelik geçmişini listele
     */
    public function getSubscriptionHistory(Tenant $tenant)
    {
        return TenantSubscription::where('tenant_id', $tenant->id)
            ->with('package')
            ->latest()
            ->paginate(15);
    }

    /**
     * Tenant'ın limit bilgilerini al (usage raporu)
     */
    public function getUsageReport(Tenant $tenant): ?array
    {
        $subscription = $tenant->activeSubscription?->load('package');
        $package = $subscription?->package;

        if (! $package) {
            return null;
        }

        $schoolCount = $tenant->schools()->count();

        $totalStudents = \App\Models\Child\Child::whereIn(
            'school_id',
            $tenant->schools()->pluck('id')
        )->count();

        $totalClasses = \App\Models\Academic\SchoolClass::whereIn(
            'school_id',
            $tenant->schools()->pluck('id')
        )->count();

        // Sınıf limiti: okul başına sınıf * okul sayısı (0 = sınırsız)
        $classLimit = ($package->max_classes_per_school > 0 && $schoolCount > 0)
            ? $package->max_classes_per_school * $schoolCount
            : 0;

        return [
            'has_subscription' => true,
            'package_name' => $package->name,
            'billing_cycle' => $subscription->billing_cycle,
            'end_date' => $subscription->end_date->toDateString(),
            'schools' => ['used' => $schoolCount,    'limit' => $package->max_schools ?? 0],
            'students' => ['used' => $totalStudents,  'limit' => $package->max_students ?? 0],
            'classes' => ['used' => $totalClasses,   'limit' => $classLimit],
        ];
    }
}
