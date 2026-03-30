<?php

namespace App\Services;

use App\Models\Billing\Transaction;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Transaction Servisi
 *
 * Transaction listeleme, filtreleme ve istatistik işlemleri.
 * Ödeme başlatma/callback işlemleri InvoiceService üzerinden yapılır.
 */
class TransactionService extends BaseService
{
    protected function model(): string
    {
        return Transaction::class;
    }

    /*
    |--------------------------------------------------------------------------
    | Listeleme
    |--------------------------------------------------------------------------
    */

    /**
     * Admin: Tüm transaction'ları listele (global scope geçilir)
     */
    public function listAll(array $filters = []): LengthAwarePaginator
    {
        $query = Transaction::withoutGlobalScope('tenant')
            ->with(['invoice', 'user', 'school', 'tenant']);

        $this->applyTransactionFilters($query, $filters);

        $perPage = $filters['per_page'] ?? 15;

        return $query->latest()->paginate($perPage);
    }

    /**
     * Kullanıcının transaction'larını listele
     */
    public function listForUser(int $userId, array $filters = []): LengthAwarePaginator
    {
        $query = Transaction::forUser($userId)
            ->with(['invoice', 'school']);

        $this->applyTransactionFilters($query, $filters);

        $perPage = $filters['per_page'] ?? 15;

        return $query->latest()->paginate($perPage);
    }

    /**
     * Okul bazlı transaction'ları listele
     */
    public function listForSchool(int $schoolId, array $filters = []): LengthAwarePaginator
    {
        $query = Transaction::forSchool($schoolId)
            ->with(['invoice', 'user']);

        $this->applyTransactionFilters($query, $filters);

        $perPage = $filters['per_page'] ?? 15;

        return $query->latest()->paginate($perPage);
    }

    /**
     * Tenant bazlı transaction'ları listele
     */
    public function listForTenant(int $tenantId, array $filters = []): LengthAwarePaginator
    {
        $query = Transaction::forTenant($tenantId)
            ->with(['invoice', 'user', 'school']);

        $this->applyTransactionFilters($query, $filters);

        $perPage = $filters['per_page'] ?? 15;

        return $query->latest()->paginate($perPage);
    }

    /*
    |--------------------------------------------------------------------------
    | İstatistikler
    |--------------------------------------------------------------------------
    */

    /**
     * Transaction istatistiklerini döndür (Admin için)
     */
    public function getStats(array $filters = []): array
    {
        $query = Transaction::withoutGlobalScope('tenant');

        if (! empty($filters['school_id'])) {
            $query->forSchool($filters['school_id']);
        }

        if (! empty($filters['tenant_id'])) {
            $query->forTenant($filters['tenant_id']);
        }

        // Tarih filtresi
        if (! empty($filters['start_date'])) {
            $query->whereDate('created_at', '>=', $filters['start_date']);
        }
        if (! empty($filters['end_date'])) {
            $query->whereDate('created_at', '<=', $filters['end_date']);
        }

        $total       = (clone $query)->count();
        $pending     = (clone $query)->pending()->count();
        $successful  = (clone $query)->successful()->count();
        $failed      = (clone $query)->failed()->count();
        $totalAmount = (clone $query)->successful()->sum('amount');

        return [
            'total_transactions'      => $total,
            'pending_count'           => $pending,
            'successful_count'        => $successful,
            'failed_count'            => $failed,
            'success_rate'            => $total > 0 ? round(($successful / $total) * 100, 2) : 0,
            'total_successful_amount' => (float) $totalAmount,
            'total_pending_amount'    => (float) (clone $query)->pending()->sum('amount'),
        ];
    }

    /**
     * Aylık transaction özeti (Admin dashboard için)
     */
    public function getMonthlyStats(int $months = 12): array
    {
        $stats = [];

        for ($i = $months - 1; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $month = $date->format('Y-m');

            $monthQuery = Transaction::withoutGlobalScope('tenant')
                ->whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month);

            $stats[] = [
                'month'            => $month,
                'label'            => $date->translatedFormat('F Y'),
                'total'            => (clone $monthQuery)->count(),
                'successful'       => (clone $monthQuery)->successful()->count(),
                'failed'           => (clone $monthQuery)->failed()->count(),
                'successful_amount' => (float) (clone $monthQuery)->successful()->sum('amount'),
            ];
        }

        return $stats;
    }

    /*
    |--------------------------------------------------------------------------
    | Filtreler
    |--------------------------------------------------------------------------
    */

    /**
     * Transaction filtrelerini uygula
     */
    private function applyTransactionFilters($query, array $filters): void
    {
        // Status filtresi (0, 1, 2)
        if (isset($filters['status']) && $filters['status'] !== '' && $filters['status'] !== 'all') {
            $query->where('status', (int) $filters['status']);
        }

        // Ödeme ağ geçidi filtresi
        if (! empty($filters['payment_gateway'])) {
            $query->where('payment_gateway', $filters['payment_gateway']);
        }

        // Okul filtresi
        if (! empty($filters['school_id'])) {
            $query->forSchool($filters['school_id']);
        }

        // Tenant filtresi
        if (! empty($filters['tenant_id'])) {
            $query->forTenant($filters['tenant_id']);
        }

        // Tarih aralığı
        if (! empty($filters['start_date'])) {
            $query->whereDate('created_at', '>=', $filters['start_date']);
        }
        if (! empty($filters['end_date'])) {
            $query->whereDate('created_at', '<=', $filters['end_date']);
        }

        // Arama (order_id, kullanıcı adı, e-posta)
        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('order_id', 'like', "%{$search}%")
                  ->orWhereHas('user', fn ($uq) => $uq->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
            });
        }
    }
}
