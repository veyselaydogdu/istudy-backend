<?php

namespace App\Observers;

use App\Jobs\WriteActivityLog;
use App\Models\Base\ActivityLog;
use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

/**
 * Gelişmiş History Observer
 *
 * Tüm BaseModel'lerden extend eden modellerin CRUD işlemlerini
 * merkezi activity_logs tablosuna kaydeder.
 *
 * Özellikler:
 * - Güncelleme öncesi eski değerleri kaydeder (old_values)
 * - Sadece değişen alanları kaydeder (performans)
 * - Hassas alanları filtreler (password, token vb.)
 * - Asenkron loglama desteği (queue)
 * - Hariç tutulan modelleri atlar
 * - Auditable trait ile özelleştirilebilir
 *
 * Ayrıca eski _histories tablolarına da yazar (geriye dönük uyumluluk).
 */
class HistoryObserver
{
    /**
     * Handle the Model "created" event.
     */
    public function created(Model $model): void
    {
        $this->logActivity($model, 'created');
        $this->logLegacyHistory($model, 'create');
    }

    /**
     * Handle the Model "updated" event.
     */
    public function updated(Model $model): void
    {
        // Sadece gerçek bir değişiklik varsa logla
        if (empty($model->getChanges())) {
            return;
        }

        $this->logActivity($model, 'updated');
        $this->logLegacyHistory($model, 'update');
    }

    /**
     * Handle the Model "deleted" event.
     */
    public function deleted(Model $model): void
    {
        // Force delete mi soft delete mi?
        $action = $model->isForceDeleting() ? 'force_deleted' : 'deleted';
        $this->logActivity($model, $action);
        $this->logLegacyHistory($model, 'delete');
    }

    /**
     * Handle the Model "restored" event (soft delete geri alma).
     */
    public function restored(Model $model): void
    {
        $this->logActivity($model, 'restored');
        $this->logLegacyHistory($model, 'restore');
    }

    /*
    |--------------------------------------------------------------------------
    | Merkezi Activity Log
    |--------------------------------------------------------------------------
    */

    protected function logActivity(Model $model, string $action): void
    {
        // Hariç tutulan modelleri kontrol et
        if (in_array(get_class($model), config('audit.excluded_models', []))) {
            return;
        }

        // Auditable trait kullanıyorsa özelleştirilmiş kontrol
        if ($this->usesAuditable($model) && ! $model->shouldAudit()) {
            return;
        }

        try {
            $logData = $this->buildLogData($model, $action);

            // Asenkron mi senkron mu?
            if (config('audit.async', false)) {
                WriteActivityLog::dispatch($logData);
            } else {
                ActivityLog::create($logData);
            }
        } catch (\Throwable $e) {
            // Log hatası ana işlemi durdurmamalı
            Log::warning("Activity log yazılamadı [{$action}]: " . $e->getMessage(), [
                'model' => get_class($model),
                'id'    => $model->getKey(),
            ]);
        }
    }

    /**
     * Log verisini hazırla
     */
    protected function buildLogData(Model $model, string $action): array
    {
        $user = auth()->user();
        $usesAuditable = $this->usesAuditable($model);

        // Değişen alanlar, eski ve yeni değerler
        $oldValues     = null;
        $newValues     = null;
        $changedFields = null;
        $description   = null;

        if ($action === 'updated') {
            $oldValues     = $usesAuditable ? $model->getOldAuditValues() : $this->getOldValues($model);
            $newValues     = $usesAuditable ? $model->getNewAuditValues() : $this->getNewValues($model);
            $changedFields = $usesAuditable ? $model->getChangedFields() : array_keys($model->getChanges());
        } elseif ($action === 'created') {
            $newValues = $usesAuditable
                ? $model->filterAuditAttributes($model->getAttributes())
                : $this->filterSensitive($model->getAttributes());
        } elseif (in_array($action, ['deleted', 'force_deleted'])) {
            $oldValues = $usesAuditable
                ? $model->filterAuditAttributes($model->getAttributes())
                : $this->filterSensitive($model->getAttributes());
        }

        // Açıklama
        $description = $usesAuditable
            ? $model->generateAuditDescription($action)
            : $this->generateDescription($model, $action, $user);

        // Model label
        $modelLabel = $usesAuditable ? $model->getAuditLabel() : class_basename($model);

        // JSON boyut kontrolü
        $maxSize = config('audit.max_json_size', 65535);
        $oldValues = $this->truncateJson($oldValues, $maxSize);
        $newValues = $this->truncateJson($newValues, $maxSize);

        return [
            'user_id'        => $user?->id,
            'user_name'      => $user ? trim(($user->name ?? '') . ' ' . ($user->surname ?? '')) : 'Sistem',
            'user_email'     => $user?->email,
            'model_type'     => get_class($model),
            'model_label'    => $modelLabel,
            'model_id'       => $model->getKey(),
            'action'         => $action,
            'description'    => $description,
            'old_values'     => $oldValues,
            'new_values'     => $newValues,
            'changed_fields' => $changedFields,
            'tenant_id'      => $user?->tenant_id ?? ($model->tenant_id ?? null),
            'school_id'      => $model->school_id ?? null,
            'ip_address'     => request()?->ip(),
            'user_agent'     => $this->truncateText(request()?->userAgent(), 500),
            'url'            => $this->truncateText(request()?->fullUrl(), 500),
            'method'         => request()?->method(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Eski _histories Tablosu (Geriye Dönük Uyumluluk)
    |--------------------------------------------------------------------------
    */

    protected function logLegacyHistory(Model $model, string $operation): void
    {
        if ($model instanceof \Illuminate\Database\Eloquent\Relations\Pivot) {
            return;
        }

        $tableName    = $model->getTable();
        $historyTable = $tableName . '_histories';

        try {
            \Illuminate\Support\Facades\DB::table($historyTable)->insert([
                'original_id'    => $model->getKey(),
                'operation_type' => $operation,
                'snapshot'       => $model->toJson(),
                'operated_by'    => auth()->id(),
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);
        } catch (\Exception $e) {
            // History tablosu yoksa sessizce geç
            // Bu eski sistemden kaynaklı — yeni activity_logs zaten kaydedildi
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Model Auditable trait kullanıyor mu?
     */
    protected function usesAuditable(Model $model): bool
    {
        return in_array(Auditable::class, class_uses_recursive($model));
    }

    /**
     * Güncelleme öncesi eski değerleri al (trait olmayan modeller)
     */
    protected function getOldValues(Model $model): array
    {
        $changes = $model->getChanges();
        $old     = [];

        foreach (array_keys($changes) as $key) {
            $old[$key] = $model->getOriginal($key);
        }

        return $this->filterSensitive($old);
    }

    /**
     * Güncelleme sonrası yeni değerleri al (trait olmayan modeller)
     */
    protected function getNewValues(Model $model): array
    {
        if (config('audit.only_dirty', true)) {
            return $this->filterSensitive($model->getChanges());
        }

        return $this->filterSensitive($model->getAttributes());
    }

    /**
     * Hassas alanları filtrele
     */
    protected function filterSensitive(array $attributes): array
    {
        $excludes = config('audit.excluded_fields', [
            'password',
            'remember_token',
            'two_factor_secret',
            'two_factor_recovery_codes',
        ]);

        return array_diff_key($attributes, array_flip($excludes));
    }

    /**
     * Otomatik açıklama üret (Auditable trait olmayan modeller)
     */
    protected function generateDescription(Model $model, string $action, $user): string
    {
        $label    = class_basename($model);
        $userName = $user?->name ?? 'Sistem';

        return match ($action) {
            'created'       => "{$userName}, {$label} #{$model->getKey()} oluşturdu.",
            'updated'       => "{$userName}, {$label} #{$model->getKey()} güncelledi.",
            'deleted'       => "{$userName}, {$label} #{$model->getKey()} sildi.",
            'restored'      => "{$userName}, {$label} #{$model->getKey()} geri yükledi.",
            'force_deleted' => "{$userName}, {$label} #{$model->getKey()} kalıcı olarak sildi.",
            default         => "{$userName}, {$label} üzerinde {$action} işlemi yaptı.",
        };
    }

    /**
     * JSON boyut kontrolü
     */
    protected function truncateJson(?array $data, int $maxSize): ?array
    {
        if (is_null($data)) {
            return null;
        }

        $json = json_encode($data);

        if (strlen($json) <= $maxSize) {
            return $data;
        }

        // Çok büyük veri — sadece alan isimlerini ve kısa değerleri tut
        $truncated = [];
        foreach ($data as $key => $value) {
            if (is_string($value) && strlen($value) > 255) {
                $truncated[$key] = substr($value, 0, 252) . '...';
            } else {
                $truncated[$key] = $value;
            }
        }

        return $truncated;
    }

    /**
     * Metin kısaltma
     */
    protected function truncateText(?string $text, int $maxLength): ?string
    {
        if (is_null($text)) {
            return null;
        }

        return strlen($text) > $maxLength ? substr($text, 0, $maxLength) : $text;
    }
}
