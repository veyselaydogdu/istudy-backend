<?php

namespace App\Services;

use App\Models\Academic\AcademicYear;
use App\Models\Academic\SchoolClass;
use App\Models\Billing\EventPayment;
use App\Models\Child\Child;
use App\Models\Package\Package;
use App\Models\Package\TenantSubscription;
use App\Models\School\School;
use App\Models\Tenant\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Admin Dashboard Servisi
 *
 * Tüm sistem istatistiklerini ve yönetim işlevlerini merkezi olarak sunar.
 */
class AdminDashboardService
{
    /**
     * Genel sistem istatistikleri
     */
    public function getSystemStats(): array
    {
        return [
            'users' => [
                'total' => User::count(),
                'active' => User::whereNull('deleted_at')->count(),
                'new_today' => User::whereDate('created_at', today())->count(),
                'new_this_week' => User::where('created_at', '>=', now()->startOfWeek())->count(),
                'new_this_month' => User::where('created_at', '>=', now()->startOfMonth())->count(),
            ],
            'tenants' => [
                'total' => Tenant::count(),
                'with_active_subscription' => Tenant::whereHas('activeSubscription')->count(),
                'without_subscription' => Tenant::whereDoesntHave('subscriptions')->count(),
            ],
            'schools' => [
                'total' => School::count(),
                'active' => School::where('is_active', true)->count(),
                'inactive' => School::where('is_active', false)->count(),
            ],
            'children' => [
                'total' => Child::count(),
                'active' => Child::where('status', 'active')->count(),
            ],
            'classes' => [
                'total' => SchoolClass::count(),
            ],
            'subscriptions' => [
                'active' => TenantSubscription::where('status', 'active')->count(),
                'expired' => TenantSubscription::where('status', 'expired')->count(),
                'cancelled' => TenantSubscription::where('status', 'cancelled')->count(),
                'total_revenue' => TenantSubscription::where('status', 'active')->sum('price'),
            ],
            'packages' => [
                'total' => Package::count(),
                'active' => Package::where('is_active', true)->count(),
            ],
        ];
    }

    /**
     * Aylık gelir raporu
     */
    public function getRevenueReport(int $year, ?int $month = null): array
    {
        $query = TenantSubscription::select(
            DB::raw('YEAR(created_at) as year'),
            DB::raw('MONTH(created_at) as month'),
            DB::raw('SUM(price) as total_revenue'),
            DB::raw('COUNT(*) as subscription_count')
        )->where('status', '!=', 'cancelled');

        $query->whereYear('created_at', $year);

        if ($month) {
            $query->whereMonth('created_at', $month);
        }

        return $query->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get()
            ->toArray();
    }

    /**
     * Büyüme trendi — son 12 ay
     */
    public function getGrowthTrend(): array
    {
        $months = collect();
        for ($i = 11; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $months->push([
                'label' => $date->format('Y-m'),
                'users' => User::where('created_at', '<=', $date->endOfMonth())->count(),
                'schools' => School::where('created_at', '<=', $date->endOfMonth())->count(),
                'children' => Child::where('created_at', '<=', $date->endOfMonth())->count(),
                'new_users' => User::whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)->count(),
                'new_schools' => School::whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)->count(),
            ]);
        }

        return $months->toArray();
    }

    /**
     * En aktif okullar
     */
    public function getTopSchools(int $limit = 10): array
    {
        return School::withCount(['children', 'classes', 'teachers'])
            ->where('is_active', true)
            ->orderByDesc('children_count')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    /**
     * Paket dağılımı
     */
    public function getPackageDistribution(): array
    {
        return TenantSubscription::where('status', 'active')
            ->select('package_id', DB::raw('COUNT(*) as count'))
            ->with('package:id,name')
            ->groupBy('package_id')
            ->get()
            ->toArray();
    }

    /**
     * Son aktiviteler — sistem geneli audit log
     */
    public function getRecentActivities(int $limit = 50): array
    {
        $activities = collect();

        // Son kayıt olan okullar
        $newSchools = School::latest()->limit(10)->get()->map(fn ($s) => [
            'type' => 'school_created',
            'description' => "Yeni okul: {$s->name}",
            'data' => ['id' => $s->id, 'name' => $s->name],
            'timestamp' => $s->created_at->toISOString(),
        ]);

        // Son kayıt olan kullanıcılar
        $newUsers = User::latest()->limit(10)->get()->map(fn ($u) => [
            'type' => 'user_registered',
            'description' => "Yeni kullanıcı: {$u->name} ({$u->email})",
            'data' => ['id' => $u->id, 'name' => $u->name, 'email' => $u->email],
            'timestamp' => $u->created_at->toISOString(),
        ]);

        // Son abonelikler
        $newSubs = TenantSubscription::with('tenant', 'package')
            ->latest()->limit(10)->get()->map(fn ($s) => [
                'type' => 'subscription_created',
                'description' => "Yeni abonelik: {$s->tenant?->name} → {$s->package?->name}",
                'data' => ['id' => $s->id, 'tenant' => $s->tenant?->name, 'package' => $s->package?->name],
                'timestamp' => $s->created_at->toISOString(),
            ]);

        return $activities
            ->merge($newSchools)
            ->merge($newUsers)
            ->merge($newSubs)
            ->sortByDesc('timestamp')
            ->take($limit)
            ->values()
            ->toArray();
    }
}
