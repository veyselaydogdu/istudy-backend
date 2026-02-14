<?php

namespace App\Services;

use App\Models\Base\ActivityLog;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Activity Log Servisi
 *
 * Activity loglarını listeleme, filtreleme, istatistikler,
 * arşivleme ve temizleme işlemlerini yönetir.
 */
class ActivityLogService
{
    /**
     * Audit DB bağlantısı
     */
    protected function connection(): string
    {
        return config('audit.connection', 'audit');
    }

    /*
    |--------------------------------------------------------------------------
    | Listeleme / Filtreleme
    |--------------------------------------------------------------------------
    */

    /**
     * Activity loglarını kapsamlı filtrelerle listele
     */
    public function list(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = ActivityLog::query()->orderByDesc('created_at');

        // Model filtresi
        if (! empty($filters['model_type'])) {
            $query->where('model_type', $filters['model_type']);
        }

        if (! empty($filters['model_label'])) {
            $query->forModelLabel($filters['model_label']);
        }

        if (! empty($filters['model_id'])) {
            $query->where('model_id', $filters['model_id']);
        }

        // İşlem filtresi
        if (! empty($filters['action'])) {
            $query->byAction($filters['action']);
        }

        // Kullanıcı filtresi
        if (! empty($filters['user_id'])) {
            $query->byUser($filters['user_id']);
        }

        // Tenant filtresi
        if (! empty($filters['tenant_id'])) {
            $query->forTenant($filters['tenant_id']);
        }

        // Okul filtresi
        if (! empty($filters['school_id'])) {
            $query->forSchool($filters['school_id']);
        }

        // Tarih filtresi
        if (! empty($filters['date_from']) && ! empty($filters['date_to'])) {
            $query->betweenDates($filters['date_from'], $filters['date_to']);
        } elseif (! empty($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        } elseif (! empty($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        // Bugün
        if (! empty($filters['today'])) {
            $query->today();
        }

        // Son N gün
        if (! empty($filters['last_days'])) {
            $query->lastDays((int) $filters['last_days']);
        }

        // Metin araması
        if (! empty($filters['search'])) {
            $query->search($filters['search']);
        }

        return $query->paginate($perPage);
    }

    /**
     * Belirli bir kaydın tüm geçmişini getir
     */
    public function getModelHistory(string $modelType, int $modelId, int $perPage = 20): LengthAwarePaginator
    {
        return ActivityLog::forModel($modelType, $modelId)
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    /**
     * Belirli bir kullanıcının tüm işlemlerini getir
     */
    public function getUserActivity(int $userId, int $perPage = 20): LengthAwarePaginator
    {
        return ActivityLog::byUser($userId)
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    /**
     * Tek bir activity log detayı
     */
    public function getDetail(int $id): ?ActivityLog
    {
        return ActivityLog::findOrFail($id);
    }

    /**
     * Bir kaydın belirli bir versiyonunu getir
     * (old_values + new_values üzerinden tarihsel veri)
     */
    public function getVersionAt(string $modelType, int $modelId, int $logId): array
    {
        $log = ActivityLog::forModel($modelType, $modelId)
            ->where('id', $logId)
            ->firstOrFail();

        return [
            'log_id'     => $log->id,
            'action'     => $log->action,
            'old_values' => $log->old_values,
            'new_values' => $log->new_values,
            'changed_by' => $log->user_name,
            'changed_at' => $log->created_at->format('Y-m-d H:i:s'),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | İstatistikler
    |--------------------------------------------------------------------------
    */

    /**
     * Genel activity istatistikleri
     */
    public function getStats(array $filters = []): array
    {
        $query = ActivityLog::query();

        if (! empty($filters['tenant_id'])) {
            $query->forTenant($filters['tenant_id']);
        }

        if (! empty($filters['last_days'])) {
            $query->lastDays((int) $filters['last_days']);
        }

        return [
            'total_logs'       => (clone $query)->count(),
            'today'            => (clone $query)->today()->count(),
            'this_week'        => (clone $query)->lastDays(7)->count(),
            'this_month'       => (clone $query)->lastDays(30)->count(),
            'by_action'        => (clone $query)
                ->select('action', DB::raw('COUNT(*) as count'))
                ->groupBy('action')
                ->orderByDesc('count')
                ->get()
                ->pluck('count', 'action')
                ->toArray(),
            'by_model'         => (clone $query)
                ->select('model_label', DB::raw('COUNT(*) as count'))
                ->groupBy('model_label')
                ->orderByDesc('count')
                ->limit(15)
                ->get()
                ->pluck('count', 'model_label')
                ->toArray(),
            'most_active_users' => (clone $query)
                ->select('user_id', 'user_name', DB::raw('COUNT(*) as count'))
                ->whereNotNull('user_id')
                ->groupBy('user_id', 'user_name')
                ->orderByDesc('count')
                ->limit(10)
                ->get()
                ->toArray(),
            'hourly_distribution' => (clone $query)
                ->lastDays(7)
                ->select(DB::raw('HOUR(created_at) as hour'), DB::raw('COUNT(*) as count'))
                ->groupBy('hour')
                ->orderBy('hour')
                ->get()
                ->pluck('count', 'hour')
                ->toArray(),
        ];
    }

    /**
     * Günlük özet (timeline grafiği için)
     */
    public function getDailySummary(int $days = 30, ?int $tenantId = null): array
    {
        $query = ActivityLog::query()
            ->select(
                DB::raw('DATE(created_at) as log_date'),
                'action',
                DB::raw('COUNT(*) as count')
            )
            ->where('created_at', '>=', now()->subDays($days))
            ->groupBy('log_date', 'action')
            ->orderBy('log_date');

        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        $results = $query->get();

        // Tarihler bazlı düzenle
        $summary = [];
        foreach ($results as $row) {
            $date = $row->log_date;
            if (! isset($summary[$date])) {
                $summary[$date] = ['date' => $date, 'total' => 0, 'created' => 0, 'updated' => 0, 'deleted' => 0];
            }
            $summary[$date][$row->action] = ($summary[$date][$row->action] ?? 0) + $row->count;
            $summary[$date]['total'] += $row->count;
        }

        return array_values($summary);
    }

    /**
     * Mevcut modellerin okunabilir isimleri
     */
    public function getAvailableModels(): array
    {
        return ActivityLog::query()
            ->select('model_label', 'model_type')
            ->distinct()
            ->orderBy('model_label')
            ->get()
            ->map(fn ($row) => [
                'label' => $row->model_label,
                'type'  => $row->model_type,
            ])
            ->toArray();
    }

    /*
    |--------------------------------------------------------------------------
    | Arşivleme & Temizleme
    |--------------------------------------------------------------------------
    */

    /**
     * Eski logları arşivle
     *
     * 1. Saklama süresi geçen logları activity_logs_archive'a kopyala
     * 2. İsteğe bağlı: JSON dosyası olarak dışa aktar
     * 3. Orijinal kayıtları sil
     */
    public function archiveOldLogs(): array
    {
        $retentionDays = config('audit.retention_days', 365);
        $cutoffDate    = now()->subDays($retentionDays)->toDateTimeString();
        $connection    = $this->connection();

        $totalArchived = 0;
        $totalDeleted  = 0;

        try {
            // Chunk bazlı arşivleme (bellek tasarrufu)
            $chunkSize = 1000;

            DB::connection($connection)
                ->table('activity_logs')
                ->where('created_at', '<', $cutoffDate)
                ->orderBy('id')
                ->chunk($chunkSize, function ($logs) use ($connection, &$totalArchived, &$totalDeleted) {
                    $archiveData = $logs->map(function ($log) {
                        return [
                            'original_id'    => $log->id,
                            'user_id'        => $log->user_id,
                            'user_name'      => $log->user_name,
                            'user_email'     => $log->user_email,
                            'model_type'     => $log->model_type,
                            'model_label'    => $log->model_label,
                            'model_id'       => $log->model_id,
                            'action'         => $log->action,
                            'description'    => $log->description,
                            'old_values'     => $log->old_values,
                            'new_values'     => $log->new_values,
                            'changed_fields' => $log->changed_fields,
                            'tenant_id'      => $log->tenant_id,
                            'school_id'      => $log->school_id,
                            'ip_address'     => $log->ip_address,
                            'user_agent'     => $log->user_agent,
                            'url'            => $log->url,
                            'method'         => $log->method,
                            'created_at'     => $log->created_at,
                            'archived_at'    => now(),
                        ];
                    })->toArray();

                    // Arşiv tablosuna batch insert
                    DB::connection($connection)
                        ->table('activity_logs_archive')
                        ->insert($archiveData);

                    $totalArchived += count($archiveData);

                    // Orijinalleri sil
                    $ids = $logs->pluck('id')->toArray();
                    DB::connection($connection)
                        ->table('activity_logs')
                        ->whereIn('id', $ids)
                        ->delete();

                    $totalDeleted += count($ids);
                });

            // İsteğe bağlı: Dosyaya da yaz
            if (config('audit.archive.enabled', false)) {
                $this->exportArchiveToFile($cutoffDate);
            }

            Log::info("Activity log arşivleme tamamlandı", [
                'archived' => $totalArchived,
                'deleted'  => $totalDeleted,
                'cutoff'   => $cutoffDate,
            ]);

            return [
                'success'  => true,
                'archived' => $totalArchived,
                'deleted'  => $totalDeleted,
                'cutoff'   => $cutoffDate,
            ];
        } catch (\Throwable $e) {
            Log::error("Activity log arşivleme hatası: " . $e->getMessage());

            return [
                'success' => false,
                'error'   => $e->getMessage(),
            ];
        }
    }

    /**
     * Arşivi dosyaya dışa aktar
     */
    protected function exportArchiveToFile(string $cutoffDate): void
    {
        $disk      = config('audit.archive.disk', 'local');
        $basePath  = config('audit.archive.path', 'audit-archives');
        $fileName  = "audit_archive_" . now()->format('Y_m_d_His') . ".json";
        $filePath  = "{$basePath}/{$fileName}";

        $connection = $this->connection();

        $data = DB::connection($connection)
            ->table('activity_logs_archive')
            ->where('archived_at', '>=', now()->subMinutes(5))
            ->get()
            ->toArray();

        Storage::disk($disk)->put(
            $filePath,
            json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );

        Log::info("Arşiv dosyası oluşturuldu: {$filePath}");
    }

    /**
     * Arşiv tablosunu temizle (çok eski arşivleri sil)
     */
    public function cleanArchive(int $archiveRetentionDays = 730): int
    {
        $cutoff = now()->subDays($archiveRetentionDays)->toDateTimeString();

        return DB::connection($this->connection())
            ->table('activity_logs_archive')
            ->where('archived_at', '<', $cutoff)
            ->delete();
    }

    /**
     * Özet tablosunu güncelle (günlük çalışır)
     */
    public function updateDailySummaries(): void
    {
        $connection = $this->connection();
        $yesterday  = now()->subDay()->toDateString();

        $summaries = DB::connection($connection)
            ->table('activity_logs')
            ->select(
                DB::raw("DATE(created_at) as log_date"),
                'model_type',
                'action',
                'tenant_id',
                DB::raw('COUNT(*) as count')
            )
            ->whereDate('created_at', $yesterday)
            ->groupBy('log_date', 'model_type', 'action', 'tenant_id')
            ->get();

        foreach ($summaries as $summary) {
            DB::connection($connection)
                ->table('activity_log_summaries')
                ->updateOrInsert(
                    [
                        'log_date'   => $summary->log_date,
                        'model_type' => $summary->model_type,
                        'action'     => $summary->action,
                        'tenant_id'  => $summary->tenant_id,
                    ],
                    [
                        'count'      => $summary->count,
                        'updated_at' => now(),
                    ]
                );
        }
    }
}
