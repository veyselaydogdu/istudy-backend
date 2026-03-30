<?php

namespace App\Models\Base;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Activity Log Modeli
 *
 * Tüm model CRUD işlemlerini merkezi olarak kaydeder.
 * Ayrı veritabanında (audit connection) çalışır.
 *
 * Performans Notları:
 * - Denormalize user_name/user_email → JOIN gerektirmez
 * - changed_fields → hangi alanların değiştiğini hızlıca gösterir
 * - old_values/new_values → sadece değişen alanları içerir (kompakt)
 * - updated_at yok → sadece created_at ile INSERT-only tablo
 */
class ActivityLog extends Model
{
    /**
     * Audit bağlantısını kullan
     */
    public function getConnectionName()
    {
        return config('audit.connection', 'audit');
    }

    protected $table = 'activity_logs';

    /**
     * Sadece created_at kullanılır (updated_at yok — INSERT-only tablo)
     */
    const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'user_name',
        'user_email',
        'model_type',
        'model_label',
        'model_id',
        'action',
        'description',
        'old_values',
        'new_values',
        'changed_fields',
        'tenant_id',
        'school_id',
        'ip_address',
        'user_agent',
        'url',
        'method',
    ];

    protected $casts = [
        'old_values'     => 'array',
        'new_values'     => 'array',
        'changed_fields' => 'array',
        'created_at'     => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    /**
     * İşlemi yapan kullanıcı
     * Not: Cross-database relation — JOIN yapılamaz, lazy load ile çalışır
     */
    public function user(): BelongsTo
    {
        return $this->setConnection(config('database.default'))
            ->belongsTo(User::class, 'user_id')
            ->withDefault(['name' => 'Sistem']);
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    /**
     * Model bazlı filtreleme
     */
    public function scopeForModel($query, string $modelType, ?int $modelId = null)
    {
        $query->where('model_type', $modelType);

        if ($modelId) {
            $query->where('model_id', $modelId);
        }

        return $query;
    }

    /**
     * Okunabilir model adı ile filtreleme
     */
    public function scopeForModelLabel($query, string $label)
    {
        return $query->where('model_label', $label);
    }

    /**
     * Kullanıcı bazlı filtreleme
     */
    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * İşlem bazlı filtreleme
     */
    public function scopeByAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Tenant bazlı filtreleme
     */
    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Okul bazlı filtreleme
     */
    public function scopeForSchool($query, int $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }

    /**
     * Tarih aralığı ile filtreleme
     */
    public function scopeBetweenDates($query, string $from, string $to)
    {
        return $query->whereBetween('created_at', [$from, $to]);
    }

    /**
     * Bugünkü loglar
     */
    public function scopeToday($query)
    {
        return $query->whereDate('created_at', today());
    }

    /**
     * Son N gün
     */
    public function scopeLastDays($query, int $days)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Metin araması (description veya changed_fields)
     */
    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('description', 'LIKE', "%{$term}%")
              ->orWhere('user_name', 'LIKE', "%{$term}%")
              ->orWhere('user_email', 'LIKE', "%{$term}%")
              ->orWhere('model_label', 'LIKE', "%{$term}%");
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Hızlı log kaydı oluştur
     */
    public static function record(
        Model $model,
        string $action,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?array $changedFields = null,
        ?string $description = null
    ): self {
        $user = auth()->user();

        return static::create([
            'user_id'        => $user?->id,
            'user_name'      => $user ? ($user->name . ' ' . ($user->surname ?? '')) : 'Sistem',
            'user_email'     => $user?->email,
            'model_type'     => get_class($model),
            'model_label'    => class_basename($model),
            'model_id'       => $model->getKey(),
            'action'         => $action,
            'description'    => $description,
            'old_values'     => $oldValues,
            'new_values'     => $newValues,
            'changed_fields' => $changedFields,
            'tenant_id'      => $user?->tenant_id ?? $model->tenant_id ?? null,
            'school_id'      => $model->school_id ?? null,
            'ip_address'     => request()?->ip(),
            'user_agent'     => request()?->userAgent(),
            'url'            => request()?->fullUrl(),
            'method'         => request()?->method(),
        ]);
    }

    /**
     * İşlem türünün Türkçe karşılığı
     */
    public function getActionLabelAttribute(): string
    {
        return match ($this->action) {
            'created'       => 'Oluşturuldu',
            'updated'       => 'Güncellendi',
            'deleted'       => 'Silindi',
            'restored'      => 'Geri Yüklendi',
            'force_deleted' => 'Kalıcı Silindi',
            default         => $this->action,
        };
    }

    /**
     * Değişiklik özeti (tek satır)
     */
    public function getSummaryAttribute(): string
    {
        $fields = $this->changed_fields ?? [];
        $count  = count($fields);

        if ($count === 0) {
            return "{$this->model_label} #{$this->model_id} {$this->action_label}";
        }

        $fieldList = implode(', ', array_slice($fields, 0, 3));
        $remaining = $count - 3;
        $extra     = $count > 3 ? " (+{$remaining} alan)" : '';

        return "{$this->model_label} #{$this->model_id}: {$fieldList}{$extra} {$this->action_label}";
    }
}
