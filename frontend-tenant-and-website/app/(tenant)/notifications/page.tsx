'use client';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import { TenantNotification, School, SchoolClass } from '@/types';
import { Bell, Send, CheckCheck, ChevronLeft, ChevronRight } from 'lucide-react';

type Tab = 'inbox' | 'send';

type SendForm = {
    school_id: string;
    class_id: string;
    type: string;
    title: string;
    body: string;
    priority: string;
};

const emptyForm: SendForm = {
    school_id: '', class_id: '', type: 'announcement', title: '', body: '', priority: 'normal',
};

const NOTIFICATION_TYPES = [
    { value: 'announcement', label: 'Duyuru' },
    { value: 'event', label: 'Etkinlik' },
    { value: 'activity', label: 'Aktivite' },
    { value: 'meal', label: 'Yemek' },
    { value: 'attendance', label: 'Devamsızlık' },
    { value: 'material', label: 'İhtiyaç Listesi' },
    { value: 'homework', label: 'Ödev' },
    { value: 'general', label: 'Genel' },
];

const PRIORITY_LABELS: Record<string, string> = {
    low: 'Düşük', normal: 'Normal', high: 'Yüksek', urgent: 'Acil',
};

const TYPE_BADGE_CLASS: Record<string, string> = {
    announcement: 'badge-outline-primary',
    event: 'badge-outline-info',
    activity: 'badge-outline-success',
    meal: 'badge-outline-warning',
    attendance: 'badge-outline-danger',
    material: 'badge-outline-secondary',
    homework: 'badge-outline-dark',
    general: 'badge-outline-primary',
};

export default function NotificationsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('inbox');

    // Inbox
    const [notifications, setNotifications] = useState<TenantNotification[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [markingAll, setMarkingAll] = useState(false);

    // Send
    const [schools, setSchools] = useState<School[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [form, setForm] = useState<SendForm>(emptyForm);
    const [sending, setSending] = useState(false);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/notifications', { params: { page } });
            setNotifications(res.data?.data ?? []);
            setLastPage(res.data?.meta?.last_page ?? 1);
        } catch {
            toast.error('Bildirimler yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    }, [page]);

    const fetchSchools = useCallback(async () => {
        try {
            const res = await apiClient.get('/schools');
            const data: School[] = res.data?.data ?? [];
            setSchools(data);
            if (data.length > 0) {
                setForm(prev => ({ ...prev, school_id: String(data[0].id) }));
            }
        } catch { /* sessizce geç */ }
    }, []);

    const fetchClasses = useCallback(async (schoolId: string) => {
        if (!schoolId) { setClasses([]); return; }
        try {
            const res = await apiClient.get(`/schools/${schoolId}/classes`);
            setClasses(res.data?.data ?? []);
        } catch { setClasses([]); }
    }, []);

    useEffect(() => { if (activeTab === 'inbox') fetchNotifications(); }, [activeTab, fetchNotifications]);
    useEffect(() => { if (activeTab === 'send') fetchSchools(); }, [activeTab, fetchSchools]);
    useEffect(() => { if (form.school_id) fetchClasses(form.school_id); }, [form.school_id, fetchClasses]);

    const markAsRead = async (id: number) => {
        try {
            await apiClient.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch { /* sessizce geç */ }
    };

    const markAllAsRead = async () => {
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

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        const payload = {
            school_id: Number(form.school_id),
            class_id: form.class_id ? Number(form.class_id) : null,
            type: form.type,
            title: form.title,
            body: form.body,
            priority: form.priority,
        };
        try {
            await apiClient.post('/notifications', payload);
            toast.success('Bildirim başarıyla gönderildi.');
            setForm(prev => ({ ...emptyForm, school_id: prev.school_id }));
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? 'Bildirim gönderilemedi.');
        } finally {
            setSending(false);
        }
    };

    const f = (field: keyof SendForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [field]: e.target.value }));

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const tabBtn = (tab: Tab, label: string, icon: React.ReactNode) => (
        <button
            type="button"
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-[#515365] hover:text-primary dark:text-[#888ea8]'}`}
            onClick={() => setActiveTab(tab)}
        >
            {icon}{label}
        </button>
    );

    return (
        <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold text-dark dark:text-white">Bildirimler</h1>

            <div className="panel">
                <div className="mb-4 flex gap-2 border-b border-[#ebedf2] dark:border-[#1b2e4b]">
                    {tabBtn('inbox', `Gelen${unreadCount > 0 ? ` (${unreadCount})` : ''}`, <Bell className="h-4 w-4" />)}
                    {tabBtn('send', 'Bildirim Gönder', <Send className="h-4 w-4" />)}
                </div>

                {/* Gelen Bildirimler */}
                {activeTab === 'inbox' && (
                    <>
                        {unreadCount > 0 && (
                            <div className="mb-4 flex justify-end">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary gap-2"
                                    onClick={markAllAsRead}
                                    disabled={markingAll}
                                >
                                    <CheckCheck className="h-4 w-4" />
                                    {markingAll ? 'İşleniyor...' : 'Tümünü Okundu İşaretle'}
                                </button>
                            </div>
                        )}

                        {loading ? (
                            <div className="flex h-32 items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-12 text-center text-[#515365] dark:text-[#888ea8]">
                                <Bell className="mx-auto mb-3 h-10 w-10 opacity-30" />
                                <p>Henüz bildirim yok.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#ebedf2] dark:divide-[#1b2e4b]">
                                {notifications.map(n => (
                                    <div
                                        key={n.id}
                                        className={`flex items-start gap-4 py-4 transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}
                                    >
                                        <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${!n.is_read ? 'bg-primary' : 'bg-[#ebedf2] dark:bg-[#1b2e4b]'}`} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`badge ${TYPE_BADGE_CLASS[n.type] ?? 'badge-outline-primary'} text-xs`}>
                                                    {NOTIFICATION_TYPES.find(t => t.value === n.type)?.label ?? n.type}
                                                </span>
                                                <span className="text-xs text-[#888ea8]">
                                                    {new Date(n.created_at).toLocaleString('tr-TR')}
                                                </span>
                                            </div>
                                            <h4 className={`mt-1 font-semibold ${!n.is_read ? 'text-dark dark:text-white' : 'text-[#515365] dark:text-[#888ea8]'}`}>
                                                {n.title}
                                            </h4>
                                            <p className="mt-0.5 text-sm text-[#515365] dark:text-[#888ea8]">{n.body}</p>
                                        </div>
                                        {!n.is_read && (
                                            <button
                                                type="button"
                                                className="btn btn-xs btn-outline-secondary shrink-0"
                                                onClick={() => markAsRead(n.id)}
                                            >
                                                Okundu
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {lastPage > 1 && (
                            <div className="mt-4 flex items-center justify-center gap-2">
                                <button type="button" className="btn btn-sm btn-outline-primary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="text-sm text-[#515365] dark:text-[#888ea8]">{page} / {lastPage}</span>
                                <button type="button" className="btn btn-sm btn-outline-primary" disabled={page === lastPage} onClick={() => setPage(p => p + 1)}>
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Bildirim Gönder */}
                {activeTab === 'send' && (
                    <form onSubmit={handleSend} className="max-w-xl space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Okul *</label>
                                <select className="form-select mt-1" value={form.school_id} onChange={f('school_id')} required>
                                    <option value="">Okul seçin</option>
                                    {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Sınıf (İsteğe Bağlı)</label>
                                <select className="form-select mt-1" value={form.class_id} onChange={f('class_id')}>
                                    <option value="">Tüm sınıflar</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Bildirim Türü *</label>
                                <select className="form-select mt-1" value={form.type} onChange={f('type')}>
                                    {NOTIFICATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Öncelik</label>
                                <select className="form-select mt-1" value={form.priority} onChange={f('priority')}>
                                    {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark dark:text-white-light">Başlık *</label>
                            <input
                                type="text"
                                className="form-input mt-1"
                                value={form.title}
                                onChange={f('title')}
                                required
                                placeholder="Bildirim başlığı..."
                                maxLength={255}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark dark:text-white-light">Mesaj *</label>
                            <textarea
                                className="form-input mt-1"
                                rows={4}
                                value={form.body}
                                onChange={f('body')}
                                required
                                placeholder="Bildirim mesajını yazın..."
                            />
                        </div>

                        <div className="pt-2">
                            <button type="submit" className="btn btn-primary gap-2" disabled={sending || !form.school_id}>
                                <Send className="h-4 w-4" />
                                {sending ? 'Gönderiliyor...' : 'Bildirimi Gönder'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
