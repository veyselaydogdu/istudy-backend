'use client';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import { TenantNotification } from '@/types';
import { CheckCheck } from 'lucide-react';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<TenantNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [markingAll, setMarkingAll] = useState(false);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/notifications');
            if (res.data?.data) {
                setNotifications(res.data.data);
            }
        } catch {
            toast.error('Bildirimler yüklenemedi.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

    const handleMarkRead = async (id: number) => {
        try {
            await apiClient.patch(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        } catch {
            toast.error('İşlem başarısız.');
        }
    };

    const handleMarkAllRead = async () => {
        setMarkingAll(true);
        try {
            await apiClient.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            toast.success('Tüm bildirimler okundu olarak işaretlendi.');
        } catch {
            toast.error('İşlem başarısız.');
        } finally {
            setMarkingAll(false);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-dark dark:text-white">
                    Bildirimler
                    {unreadCount > 0 && (
                        <span className="ml-3 rounded-full bg-primary px-2 py-0.5 text-sm font-normal text-white">
                            {unreadCount} yeni
                        </span>
                    )}
                </h1>
                {unreadCount > 0 && (
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-primary gap-2"
                        onClick={handleMarkAllRead}
                        disabled={markingAll}
                    >
                        <CheckCheck className="h-4 w-4" />
                        {markingAll ? 'İşleniyor...' : 'Tümünü Okundu İşaretle'}
                    </button>
                )}
            </div>

            <div className="panel">
                {loading ? (
                    <div className="flex h-32 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="py-12 text-center text-[#515365] dark:text-[#888ea8]">
                        Bildirim bulunmuyor.
                    </div>
                ) : (
                    <div className="divide-y divide-[#ebedf2] dark:divide-[#1b2e4b]">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className={`flex items-start gap-4 px-2 py-4 transition-colors ${
                                    !n.is_read ? 'bg-primary/5' : ''
                                }`}
                            >
                                <div className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${n.is_read ? 'bg-[#ebedf2] dark:bg-[#1b2e4b]' : 'bg-primary'}`} />
                                <div className="flex-1">
                                    <p className={`font-semibold ${!n.is_read ? 'text-dark dark:text-white' : 'text-[#515365] dark:text-[#888ea8]'}`}>
                                        {n.title}
                                    </p>
                                    <p className="mt-1 text-sm text-[#515365] dark:text-[#888ea8]">{n.body}</p>
                                    <p className="mt-2 text-xs text-[#888ea8]">
                                        {new Date(n.created_at).toLocaleString('tr-TR')}
                                    </p>
                                </div>
                                {!n.is_read && (
                                    <button
                                        type="button"
                                        className="btn btn-xs btn-outline-secondary flex-shrink-0"
                                        onClick={() => handleMarkRead(n.id)}
                                    >
                                        Okundu
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
