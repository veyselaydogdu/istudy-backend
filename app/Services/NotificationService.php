<?php

namespace App\Services;

use App\Models\Notification\NotificationPreference;
use App\Models\Notification\SystemNotification;
use App\Models\User;

/**
 * Bildirim Servisi
 *
 * Gelişmiş bildirim sistemi:
 * - Bildirim oluşturma (anlık veya zamanlanmış)
 * - Kullanıcılara dağıtım
 * - Okundu işaretleme
 * - Bildirim tercihleri yönetimi
 */
class NotificationService extends BaseService
{
    protected function model(): string
    {
        return SystemNotification::class;
    }

    /**
     * Bildirim oluştur ve hedef kullanıcılara gönder
     */
    public function createAndDispatch(array $data, array $userIds = []): SystemNotification
    {
        $notification = $this->create($data);

        // Hedef kullanıcıları belirle
        if (! empty($userIds)) {
            $this->attachRecipients($notification, $userIds);
        } elseif (! empty($data['target_user_ids'])) {
            $this->attachRecipients($notification, $data['target_user_ids']);
        } elseif (! empty($data['target_roles'])) {
            $this->dispatchToRoles($notification, $data['target_roles'], $data['school_id'] ?? null);
        }

        // Zamanlanmış değilse hemen gönder
        if (empty($data['scheduled_at'])) {
            $notification->markAsSent();
        }

        return $notification->load('recipients');
    }

    /**
     * Bildirim alıcılarını ata
     */
    protected function attachRecipients(SystemNotification $notification, array $userIds): void
    {
        foreach ($userIds as $userId) {
            $notification->recipients()->attach($userId, [
                'is_read' => false,
                'is_pushed' => false,
            ]);
        }
    }

    /**
     * Rol bazlı bildirim gönder
     */
    protected function dispatchToRoles(SystemNotification $notification, array $roles, ?int $schoolId = null): void
    {
        $query = User::whereHas('roles', function ($q) use ($roles) {
            $q->whereIn('name', $roles);
        });

        if ($schoolId) {
            // Okula bağlı kullanıcılar
            $query->where(function ($q) use ($schoolId) {
                $q->whereHas('teacherProfiles', fn ($q2) => $q2->where('school_id', $schoolId))
                  ->orWhereHas('familyProfiles.children', fn ($q2) => $q2->where('school_id', $schoolId));
            });
        }

        $userIds = $query->pluck('id')->toArray();
        $this->attachRecipients($notification, $userIds);
    }

    /**
     * Kullanıcının okunmamış bildirimlerini getir
     */
    public function unreadForUser(int $userId)
    {
        return SystemNotification::whereHas('recipients', function ($q) use ($userId) {
            $q->where('user_id', $userId)->where('is_read', false);
        })
        ->with('school')
        ->latest()
        ->paginate(20);
    }

    /**
     * Kullanıcının tüm bildirimlerini getir
     */
    public function allForUser(int $userId)
    {
        return SystemNotification::whereHas('recipients', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        })
        ->with('school')
        ->latest()
        ->paginate(20);
    }

    /**
     * Bildirimi okundu olarak işaretle
     */
    public function markAsRead(int $notificationId, int $userId): void
    {
        $notification = SystemNotification::findOrFail($notificationId);
        $notification->markAsReadFor($userId);
    }

    /**
     * Tüm bildirimleri okundu olarak işaretle
     */
    public function markAllAsRead(int $userId): void
    {
        SystemNotification::whereHas('recipients', function ($q) use ($userId) {
            $q->where('user_id', $userId)->where('is_read', false);
        })
        ->get()
        ->each(fn ($notification) => $notification->markAsReadFor($userId));
    }

    /**
     * Okunmamış bildirim sayısı
     */
    public function unreadCount(int $userId): int
    {
        return SystemNotification::whereHas('recipients', function ($q) use ($userId) {
            $q->where('user_id', $userId)->where('is_read', false);
        })->count();
    }

    /**
     * Bildirim tercihlerini güncelle
     */
    public function updatePreferences(int $userId, array $preferences): void
    {
        foreach ($preferences as $type => $channels) {
            NotificationPreference::updateOrCreate(
                ['user_id' => $userId, 'notification_type' => $type],
                [
                    'push_enabled' => $channels['push_enabled'] ?? true,
                    'email_enabled' => $channels['email_enabled'] ?? false,
                    'sms_enabled' => $channels['sms_enabled'] ?? false,
                ]
            );
        }
    }

    /**
     * Bildirim tercihlerini getir
     */
    public function getPreferences(int $userId)
    {
        return NotificationPreference::where('user_id', $userId)->get();
    }

    /**
     * Zamanlanmış bildirimleri gönder (Console command tarafından çağrılır)
     */
    public function processScheduledNotifications(): int
    {
        $notifications = SystemNotification::scheduled()->get();
        $count = 0;

        foreach ($notifications as $notification) {
            $notification->markAsSent();
            $count++;
            // TODO: Push notification, email, SMS gönderimi burada tetiklenecek
        }

        return $count;
    }

    /**
     * Filtreleme
     */
    protected function applyFilters($query, array $filters): void
    {
        if (! empty($filters['school_id'])) {
            $query->where('school_id', $filters['school_id']);
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }
    }
}
