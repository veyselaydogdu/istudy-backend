'use client';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import apiClient from '@/lib/apiClient';
import { Activity, School, SchoolClass } from '@/types';
import { Plus, Trash2, Edit2, X, Calendar, DollarSign } from 'lucide-react';

type ActivityForm = {
    name: string;
    description: string;
    is_paid: boolean;
    price: string;
    start_date: string;
    end_date: string;
    class_ids: number[];
};

const emptyForm: ActivityForm = {
    name: '', description: '', is_paid: false, price: '',
    start_date: '', end_date: '', class_ids: [],
};

export default function ActivitiesPage() {
    const [schools, setSchools] = useState<School[]>([]);
    const [selectedSchoolId, setSelectedSchoolId] = useState('');
    const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]);

    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const [showModal, setShowModal] = useState(false);
    const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
    const [form, setForm] = useState<ActivityForm>(emptyForm);
    const [saving, setSaving] = useState(false);

    const fetchSchools = useCallback(async () => {
        try {
            const res = await apiClient.get('/schools');
            const data: School[] = res.data?.data ?? [];
            setSchools(data);
            if (data.length > 0) {
                setSelectedSchoolId(String(data[0].id));
            }
        } catch { /* sessizce geç */ }
    }, []);

    const fetchSchoolClasses = useCallback(async () => {
        if (!selectedSchoolId) return;
        try {
            const res = await apiClient.get(`/schools/${selectedSchoolId}/classes`);
            setSchoolClasses(res.data?.data ?? []);
        } catch { /* sessizce geç */ }
    }, [selectedSchoolId]);

    const fetchActivities = useCallback(async () => {
        if (!selectedSchoolId) return;
        setLoading(true);
        try {
            const res = await apiClient.get(`/schools/${selectedSchoolId}/activities`, { params: { page } });
            setActivities(res.data?.data ?? []);
            setLastPage(res.data?.meta?.last_page ?? 1);
        } catch {
            toast.error('Etkinlikler yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    }, [selectedSchoolId, page]);

    useEffect(() => { fetchSchools(); }, [fetchSchools]);
    useEffect(() => {
        if (selectedSchoolId) {
            setPage(1);
            fetchSchoolClasses();
            fetchActivities();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSchoolId]);
    useEffect(() => { if (selectedSchoolId) fetchActivities(); }, [fetchActivities]);

    const openCreate = () => {
        setEditingActivity(null);
        setForm(emptyForm);
        setShowModal(true);
    };

    const openEdit = (activity: Activity) => {
        setEditingActivity(activity);
        setForm({
            name: activity.name,
            description: activity.description ?? '',
            is_paid: activity.is_paid ?? false,
            price: activity.price != null ? String(activity.price) : '',
            start_date: activity.start_date ?? '',
            end_date: activity.end_date ?? '',
            class_ids: activity.classes?.map(c => c.id) ?? [],
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Frontend validation
        if (!form.name.trim()) {
            toast.error('Etkinlik adı zorunludur.');
            return;
        }
        if (!selectedSchoolId) {
            toast.error('Lütfen bir okul seçin.');
            return;
        }

        setSaving(true);
        const payload = {
            school_id: Number(selectedSchoolId),
            name: form.name.trim(),
            description: form.description || null,
            is_paid: form.is_paid,
            price: form.is_paid && form.price ? Number(form.price) : null,
            start_date: form.start_date || null,
            end_date: form.end_date || null,
            class_ids: form.class_ids,
        };
        try {
            if (editingActivity) {
                await apiClient.put(`/schools/${selectedSchoolId}/activities/${editingActivity.id}`, payload);
                toast.success('Etkinlik güncellendi.');
            } else {
                await apiClient.post(`/schools/${selectedSchoolId}/activities`, payload);
                toast.success('Etkinlik oluşturuldu.');
            }
            setShowModal(false);
            fetchActivities();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? 'Hata oluştu.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (activity: Activity) => {
        const result = await Swal.fire({
            title: 'Etkinliği Sil',
            text: `"${activity.name}" etkinliğini silmek istediğinize emin misiniz?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Evet, Sil',
            cancelButtonText: 'İptal',
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.delete(`/schools/${selectedSchoolId}/activities/${activity.id}`);
            toast.success('Etkinlik silindi.');
            fetchActivities();
        } catch {
            toast.error('Silme işlemi başarısız.');
        }
    };

    const toggleClassId = (classId: number) => {
        setForm(prev => ({
            ...prev,
            class_ids: prev.class_ids.includes(classId)
                ? prev.class_ids.filter(id => id !== classId)
                : [...prev.class_ids, classId],
        }));
    };

    const f = (field: keyof ActivityForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [field]: e.target.value }));

    return (
        <div className="p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-dark dark:text-white">Etkinlikler</h1>
                <button type="button" className="btn btn-primary gap-2" onClick={openCreate} disabled={!selectedSchoolId}>
                    <Plus className="h-4 w-4" />
                    Etkinlik Ekle
                </button>
            </div>

            <div className="panel">
                {/* Okul seçici */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-dark dark:text-white-light">Okul</label>
                    <select
                        className="form-select mt-1 max-w-xs"
                        value={selectedSchoolId}
                        onChange={e => setSelectedSchoolId(e.target.value)}
                    >
                        {schools.length === 0 && <option value="">Okul yok</option>}
                        {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>

                {loading ? (
                    <div className="flex h-32 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                ) : !selectedSchoolId ? (
                    <p className="py-8 text-center text-[#515365] dark:text-[#888ea8]">Lütfen bir okul seçin.</p>
                ) : activities.length === 0 ? (
                    <p className="py-8 text-center text-[#515365] dark:text-[#888ea8]">Henüz etkinlik eklenmemiş.</p>
                ) : (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {activities.map(activity => (
                                <div key={activity.id} className="rounded border border-[#ebedf2] p-4 dark:border-[#1b2e4b]">
                                    <div className="mb-2 flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-semibold text-dark dark:text-white">{activity.name}</h3>
                                                {activity.is_paid && (
                                                    <span className="badge badge-outline-success text-xs">Ücretli</span>
                                                )}
                                            </div>
                                            {activity.description && (
                                                <p className="mt-1 text-sm text-[#515365] dark:text-[#888ea8] line-clamp-2">
                                                    {activity.description}
                                                </p>
                                            )}
                                            {(activity.start_date || activity.end_date) && (
                                                <p className="mt-1 flex items-center gap-1 text-xs text-[#888ea8]">
                                                    <Calendar className="h-3 w-3" />
                                                    {activity.start_date && new Date(activity.start_date).toLocaleDateString('tr-TR')}
                                                    {activity.start_date && activity.end_date && ' — '}
                                                    {activity.end_date && new Date(activity.end_date).toLocaleDateString('tr-TR')}
                                                </p>
                                            )}
                                            {activity.classes && activity.classes.length > 0 && (
                                                <p className="mt-1 text-xs text-[#888ea8]">
                                                    {activity.classes.length} sınıf atanmış
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex shrink-0 gap-1">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-primary p-1.5"
                                                onClick={() => openEdit(activity)}
                                                title="Düzenle"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger p-1.5"
                                                onClick={() => handleDelete(activity)}
                                                title="Sil"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {activity.is_paid && activity.price != null && (
                                        <div className="mt-2 flex items-center gap-1 text-sm font-medium text-success">
                                            <DollarSign className="h-3.5 w-3.5" />
                                            {Number(activity.price).toFixed(2)} ₺
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {lastPage > 1 && (
                            <div className="mt-4 flex items-center justify-center gap-2">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    ‹
                                </button>
                                <span className="text-sm text-[#515365] dark:text-[#888ea8]">{page} / {lastPage}</span>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary"
                                    disabled={page === lastPage}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    ›
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-lg font-bold text-dark dark:text-white">
                                <Calendar className="h-5 w-5 text-primary" />
                                {editingActivity ? 'Etkinlik Düzenle' : 'Yeni Etkinlik'}
                            </h2>
                            <button type="button" onClick={() => setShowModal(false)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Etkinlik Adı *</label>
                                <input
                                    type="text"
                                    className="form-input mt-1"
                                    value={form.name}
                                    onChange={f('name')}
                                    placeholder="Örn: Bahar Şenliği"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Açıklama</label>
                                <textarea
                                    className="form-input mt-1"
                                    rows={3}
                                    value={form.description}
                                    onChange={f('description')}
                                    placeholder="Etkinlik hakkında kısa açıklama..."
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">Başlangıç Tarihi</label>
                                    <input
                                        type="date"
                                        className="form-input mt-1"
                                        value={form.start_date}
                                        onChange={f('start_date')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">Bitiş Tarihi</label>
                                    <input
                                        type="date"
                                        className="form-input mt-1"
                                        value={form.end_date}
                                        onChange={f('end_date')}
                                    />
                                </div>
                            </div>

                            {schoolClasses.length > 0 && (
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-dark dark:text-white-light">
                                        Sınıf Ataması
                                    </label>
                                    <div className="max-h-36 overflow-y-auto grid grid-cols-2 gap-2">
                                        {schoolClasses.map(cls => (
                                            <label
                                                key={cls.id}
                                                className="flex cursor-pointer items-center gap-2 rounded border border-[#ebedf2] p-2 hover:border-primary dark:border-[#1b2e4b]"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="form-checkbox"
                                                    checked={form.class_ids.includes(cls.id)}
                                                    onChange={() => toggleClassId(cls.id)}
                                                />
                                                <span className="text-sm text-dark dark:text-white">{cls.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3 rounded border border-[#ebedf2] p-3 dark:border-[#1b2e4b]">
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="checkbox"
                                        className="form-checkbox"
                                        checked={form.is_paid}
                                        onChange={e => setForm(prev => ({ ...prev, is_paid: e.target.checked, price: e.target.checked ? prev.price : '' }))}
                                    />
                                    <span className="text-sm font-medium text-dark dark:text-white-light">Ücretli Etkinlik</span>
                                </label>
                            </div>

                            {form.is_paid && (
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">Ücret (₺)</label>
                                    <input
                                        type="number"
                                        className="form-input mt-1"
                                        value={form.price}
                                        onChange={f('price')}
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                    />
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
                                    {saving ? 'Kaydediliyor...' : (editingActivity ? 'Güncelle' : 'Kaydet')}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowModal(false)}>
                                    İptal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
