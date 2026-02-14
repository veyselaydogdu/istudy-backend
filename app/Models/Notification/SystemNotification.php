<?php

namespace App\Models\Notification;

use App\Models\Base\BaseModel;
use App\Models\School\School;
use App\Models\User;

/**
 * Sistem Bildirimi
 *
 * Gelişmiş bildirim sistemi.
 * Event, etkinlik, materyal, yoklama, yemek, ödev, duyuru vb. bildirimleri.
 * Zamanlanmış bildirim desteği ile (scheduled_at).
 * Roller veya belirli kullanıcılara hedefleme yapılabilir.
 */
class SystemNotification extends BaseModel
{
    protected $table = 'system_notifications';

    protected $fillable = [
        'school_id',
        'class_id',
        'type',
        'title',
        'body',
        'action_type',
        'action_id',
        'priority',
        'target_roles',
        'target_user_ids',
        'scheduled_at',
        'sent_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'target_roles' => 'array',
        'target_user_ids' => 'array',
        'scheduled_at' => 'datetime',
        'sent_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function schoolClass()
    {
        return $this->belongsTo(\App\Models\Academic\SchoolClass::class, 'class_id');
    }

    /**
     * Bildirimi alan kullanıcılar (pivot: okundu/okunmadı)
     */
    public function recipients()
    {
        return $this->belongsToMany(User::class, 'notification_user', 'notification_id', 'user_id')
            ->withPivot(['is_read', 'read_at', 'is_pushed'])
            ->withTimestamps();
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopePending($query)
    {
        return $query->whereNull('sent_at');
    }

    public function scopeSent($query)
    {
        return $query->whereNotNull('sent_at');
    }

    public function scopeScheduled($query)
    {
        return $query->whereNotNull('scheduled_at')
                     ->whereNull('sent_at')
                     ->where('scheduled_at', '<=', now());
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeHighPriority($query)
    {
        return $query->whereIn('priority', ['high', 'urgent']);
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Bildirim gönderildi olarak işaretle
     */
    public function markAsSent(): void
    {
        $this->update(['sent_at' => now()]);
    }

    /**
     * Kullanıcı için okundu olarak işaretle
     */
    public function markAsReadFor(int $userId): void
    {
        $this->recipients()->updateExistingPivot($userId, [
            'is_read' => true,
            'read_at' => now(),
        ]);
    }

    /**
     * İlgili modeli çözümle (Polymorphic)
     */
    public function getActionModelAttribute()
    {
        if ($this->action_type && $this->action_id) {
            return app($this->action_type)::find($this->action_id);
        }

        return null;
    }
}
