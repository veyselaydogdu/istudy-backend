'use client';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import apiClient from '@/lib/apiClient';
import { Activity, School, SchoolClass } from '@/types';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Edit2, X, Calendar, DollarSign, PackagePlus, ExternalLink, RotateCcw, Users, Globe, Info } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

type ActivityForm = {
    name: string;
    description: string;
    is_global: boolean;
    is_paid: boolean;
    is_enrollment_required: boolean;
    cancellation_allowed: boolean;
    cancellation_deadline: string;
    price: string;
    capacity: string;
    address: string;
    start_date: string;
    start_time: string;
    end_date: string;
    end_time: string;
    class_ids: number[];
    materials: string[];
};

const emptyForm: ActivityForm = {
    name: '', description: '', is_global: false, is_paid: false, is_enrollment_required: false,
    cancellation_allowed: false, cancellation_deadline: '',
    price: '', capacity: '', address: '',
    start_date: '', start_time: '', end_date: '', end_time: '',
    class_ids: [], materials: [],
};

export default function ActivitiesPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const [schools, setSchools] = useState<School[]>([]);
    const [selectedSchoolId, setSelectedSchoolId] = useState('');
    const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]);

    const [statusFilter, setStatusFilter] = useState<'active' | 'ended'>('active');
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const [showModal, setShowModal] = useState(false);
    const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
    const [form, setForm] = useState<ActivityForm>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [materialInput, setMaterialInput] = useState('');

    // Modal için seçilen okul (form.is_global=false iken)
    const [formSchoolId, setFormSchoolId] = useState('');

    const fetchSchools = useCallback(async () => {
        try {
            const res = await apiClient.get('/schools');
            const data: School[] = res.data?.data ?? [];
            setSchools(data);
            if (data.length > 0) {
                setFormSchoolId(String(data[0].id));
            }
        } catch { /* sessizce geç */ }
    }, []);

    const fetchSchoolClasses = useCallback(async () => {
        if (!formSchoolId) return;
        try {
            const res = await apiClient.get(`/schools/${formSchoolId}/classes`);
            setSchoolClasses(res.data?.data ?? []);
        } catch { /* sessizce geç */ }
    }, [formSchoolId]);

    const fetchActivities = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page, status: statusFilter };
            if (selectedSchoolId) {
                params.school_id = selectedSchoolId;
            }
            const res = await apiClient.get('/all-activities', { params });
            setActivities(res.data?.data ?? []);
            setLastPage(res.data?.meta?.last_page ?? 1);
        } catch {
            toast.error(t('activities.loadError'));
        } finally {
            setLoading(false);
        }
    }, [selectedSchoolId, page, statusFilter]);

    useEffect(() => { fetchSchools(); }, [fetchSchools]);
    useEffect(() => {
        if (formSchoolId) {
            fetchSchoolClasses();
        }
    }, [formSchoolId, fetchSchoolClasses]);
    useEffect(() => { setPage(1); }, [statusFilter, selectedSchoolId]);
    useEffect(() => { fetchActivities(); }, [fetchActivities]);

    const openCreate = () => {
        setEditingActivity(null);
        setForm(emptyForm);
        setMaterialInput('');
        if (schools.length > 0) setFormSchoolId(String(schools[0].id));
        setShowModal(true);
    };

    const openEdit = (activity: Activity) => {
        setEditingActivity(activity);
        const isGlobal = activity.is_global ?? false;
        const schoolId = activity.school?.id ? String(activity.school.id) : (schools[0] ? String(schools[0].id) : '');
        setFormSchoolId(schoolId);
        setForm({
            name: activity.name,
            description: activity.description ?? '',
            is_global: isGlobal,
            is_paid: activity.is_paid ?? false,
            is_enrollment_required: activity.is_enrollment_required ?? false,
            cancellation_allowed: activity.cancellation_allowed ?? false,
            cancellation_deadline: activity.cancellation_deadline
                ? activity.cancellation_deadline.slice(0, 16)
                : '',
            price: activity.price != null ? String(activity.price) : '',
            capacity: activity.capacity != null ? String(activity.capacity) : '',
            address: activity.address ?? '',
            start_date: activity.start_date ? activity.start_date.slice(0, 10) : '',
            start_time: activity.start_time ?? '',
            end_date: activity.end_date ? activity.end_date.slice(0, 10) : '',
            end_time: activity.end_time ?? '',
            class_ids: activity.classes?.map(c => c.id) ?? [],
            materials: activity.materials ?? [],
        });
        setMaterialInput('');
        setShowModal(true);
    };

    const addMaterial = () => {
        const trimmed = materialInput.trim();
        if (!trimmed) return;
        setForm(prev => ({ ...prev, materials: [...prev.materials, trimmed] }));
        setMaterialInput('');
    };

    const removeMaterial = (index: number) => {
        setForm(prev => ({ ...prev, materials: prev.materials.filter((_, i) => i !== index) }));
    };

    const today = new Date().toISOString().slice(0, 10);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name.trim()) {
            toast.error(t('activities.nameRequired'));
            return;
        }
        if (!form.is_global && !formSchoolId) {
            toast.error(t('activities.schoolRequired'));
            return;
        }
        if (form.cancellation_allowed && form.cancellation_deadline) {
            const startDt = form.start_date ? `${form.start_date}T${form.start_time || '00:00'}` : null;
            const endDt = form.end_date ? `${form.end_date}T${form.end_time || '23:59'}` : null;
            if (startDt && form.cancellation_deadline < startDt) {
                toast.error('İptal son tarihi, etkinlik başlangıcından önce olamaz.');
                return;
            }
            if (endDt && form.cancellation_deadline > endDt) {
                toast.error('İptal son tarihi, etkinlik bitişinden sonra olamaz.');
                return;
            }
        }

        setSaving(true);

        const isGlobal = form.is_global;
        const basePayload = {
            name: form.name.trim(),
            description: form.description || null,
            is_paid: form.is_paid,
            is_enrollment_required: form.is_enrollment_required,
            cancellation_allowed: form.cancellation_allowed,
            cancellation_deadline: form.cancellation_allowed && form.cancellation_deadline
                ? form.cancellation_deadline
                : null,
            price: form.is_paid && form.price ? Number(form.price) : null,
            capacity: form.capacity ? Number(form.capacity) : null,
            address: form.address || null,
            start_date: form.start_date || null,
            start_time: form.start_time || null,
            end_date: form.end_date || null,
            end_time: form.end_time || null,
            materials: form.materials.length > 0 ? form.materials : null,
        };
        const payload = isGlobal
            ? basePayload
            : { ...basePayload, school_id: Number(formSchoolId), class_ids: form.class_ids };

        try {
            if (editingActivity) {
                if (isGlobal) {
                    await apiClient.put(`/global-events/${editingActivity.id}`, payload);
                } else {
                    await apiClient.put(`/schools/${formSchoolId}/activities/${editingActivity.id}`, payload);
                }
                toast.success(t('activities.updateSuccess'));
            } else {
                if (isGlobal) {
                    await apiClient.post('/global-events', payload);
                } else {
                    await apiClient.post(`/schools/${formSchoolId}/activities`, payload);
                }
                toast.success(t('activities.createSuccess'));
            }
            setShowModal(false);
            fetchActivities();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? t('activities.createError'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (activity: Activity) => {
        const result = await Swal.fire({
            title: t('activities.deleteActivityTitle'),
            text: t('activities.deleteActivityText', { name: activity.name }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('swal.confirmDelete'),
            cancelButtonText: t('swal.cancel'),
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) return;
        try {
            if (activity.is_global) {
                await apiClient.delete(`/global-events/${activity.id}`);
            } else {
                await apiClient.delete(`/schools/${activity.school_id}/activities/${activity.id}`);
            }
            toast.success(t('activities.deleteSuccess'));
            fetchActivities();
        } catch {
            toast.error(t('activities.deleteFailed'));
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

    const isEnded = (activity: Activity) =>
        !activity.deleted_at && !!activity.end_date && new Date(activity.end_date) < new Date(new Date().toDateString());

    return (
        <div className="p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-dark dark:text-white">{t('activities.title')}</h1>
                <button type="button" className="btn btn-primary gap-2" onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                    {t('activities.addBtn')}
                </button>
            </div>

            <div className="panel">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div>
                        <label className="block text-sm font-medium text-dark dark:text-white-light">{t('activities.schoolLabel')}</label>
                        <select
                            className="form-select mt-1 max-w-xs"
                            value={selectedSchoolId}
                            onChange={e => setSelectedSchoolId(e.target.value)}
                        >
                            <option value="">Tüm Okullar</option>
                            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-1">
                        {(['active', 'ended'] as const).map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setStatusFilter(s)}
                                className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-outline-secondary'}`}
                            >
                                {s === 'active' ? t('activities.statusActive') : t('activities.statusEnded')}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex h-32 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                ) : activities.length === 0 ? (
                    <p className="py-8 text-center text-[#515365] dark:text-[#888ea8]">{t('activities.noActivity')}</p>
                ) : (
                    <>
                        <div className="table-responsive">
                            <table className="table-hover table">
                                <thead>
                                    <tr>
                                        <th>{t('activities.nameLabel')}</th>
                                        <th>Okul</th>
                                        <th>Sınıflar</th>
                                        <th>{t('activities.startDateLabel')}</th>
                                        <th>Kayıt</th>
                                        <th>Ücret</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activities.map(activity => (
                                        <tr key={activity.id}>
                                            <td>
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className="font-medium text-dark dark:text-white">{activity.name}</span>
                                                    {activity.is_global && (
                                                        <span className="badge badge-outline-warning text-xs flex items-center gap-1">
                                                            <Globe className="h-3 w-3" /> Global
                                                        </span>
                                                    )}
                                                    {isEnded(activity) && (
                                                        <span className="badge badge-outline-secondary text-xs">{t('activities.endedBadge')}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-sm text-[#888ea8]">
                                                {activity.is_global ? (
                                                    <span className="text-[#c8c8c8]">—</span>
                                                ) : (
                                                    <span>{activity.school?.name ?? '—'}</span>
                                                )}
                                            </td>
                                            <td className="text-sm text-[#888ea8]">
                                                {activity.is_global ? (
                                                    <span className="text-[#c8c8c8]">—</span>
                                                ) : activity.classes && activity.classes.length > 0 ? (
                                                    <span>{activity.classes.map(c => c.name).join(', ')}</span>
                                                ) : (
                                                    <span className="badge badge-outline-info">Tüm Sınıflar</span>
                                                )}
                                            </td>
                                            <td className="text-sm text-[#888ea8]">
                                                {activity.start_date
                                                    ? new Date(activity.start_date).toLocaleDateString('tr-TR')
                                                    : '—'}
                                                {activity.end_date && (
                                                    <span className="text-xs"> – {new Date(activity.end_date).toLocaleDateString('tr-TR')}</span>
                                                )}
                                            </td>
                                            <td>
                                                {activity.is_enrollment_required ? (
                                                    <span className="badge badge-outline-info text-xs">{t('activities.enrollmentBadge')}</span>
                                                ) : (
                                                    <span className="text-xs text-[#c8c8c8]">—</span>
                                                )}
                                            </td>
                                            <td className="text-sm">
                                                {activity.is_paid && activity.price != null ? (
                                                    <span className="flex items-center gap-1 text-success font-medium">
                                                        <DollarSign className="h-3.5 w-3.5" />
                                                        {Number(activity.price).toFixed(2)} ₺
                                                    </span>
                                                ) : (
                                                    <span className="badge badge-outline-success text-xs">Ücretsiz</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-info p-1.5"
                                                        onClick={() => router.push(`/activities/${activity.id}`)}
                                                        title={t('common.details')}
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-primary p-1.5"
                                                        onClick={() => openEdit(activity)}
                                                        title={t('common.edit')}
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger p-1.5"
                                                        onClick={() => handleDelete(activity)}
                                                        title={t('common.delete')}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                                {editingActivity ? t('activities.editModalTitle') : t('activities.addModalTitle')}
                            </h2>
                            <button type="button" onClick={() => setShowModal(false)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Global Etkinlik Toggle */}
                            <div className={`rounded-lg border-2 p-3 transition-colors ${form.is_global ? 'border-warning bg-warning/5' : 'border-[#ebedf2] dark:border-[#1b2e4b]'}`}>
                                <label className="flex cursor-pointer items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Globe className={`h-5 w-5 ${form.is_global ? 'text-warning' : 'text-[#888ea8]'}`} />
                                        <span className="font-semibold text-dark dark:text-white">Global Etkinlik</span>
                                    </div>
                                    <div className={`relative h-6 w-11 rounded-full transition-colors ${form.is_global ? 'bg-warning' : 'bg-[#e0e6ed] dark:bg-[#1b2e4b]'}`}>
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={form.is_global}
                                            onChange={e => setForm(prev => ({ ...prev, is_global: e.target.checked, class_ids: [] }))}
                                        />
                                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.is_global ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                    </div>
                                </label>
                                {form.is_global && (
                                    <div className="mt-2 flex items-start gap-2 rounded-md bg-warning/10 p-2 text-xs text-warning">
                                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                        <p>
                                            <strong>Bu etkinlik herkese açıktır.</strong> Sistemdeki tüm kurumlar ve veliler görebilir.
                                            Okul veya sınıfa özel kısıtlama uygulanamaz.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {!form.is_global && schools.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">{t('activities.schoolLabel')}</label>
                                    <select
                                        className="form-select mt-1"
                                        value={formSchoolId}
                                        onChange={e => setFormSchoolId(e.target.value)}
                                    >
                                        {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">{t('activities.nameLabel')}</label>
                                <input
                                    type="text"
                                    className="form-input mt-1"
                                    value={form.name}
                                    onChange={f('name')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">{t('activities.descriptionLabel')}</label>
                                <textarea
                                    className="form-input mt-1"
                                    rows={3}
                                    value={form.description}
                                    onChange={f('description')}
                                />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">{t('activities.startDateLabel')}</label>
                                    <input type="date" className="form-input mt-1" value={form.start_date} onChange={f('start_date')} min={today} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">{t('activities.startTimeLabel')}</label>
                                    <input type="time" className="form-input mt-1" value={form.start_time} onChange={f('start_time')} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">{t('activities.endDateLabel')}</label>
                                    <input type="date" className="form-input mt-1" value={form.end_date} onChange={f('end_date')} min={form.start_date || today} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">{t('activities.endTimeLabel')}</label>
                                    <input type="time" className="form-input mt-1" value={form.end_time} onChange={f('end_time')} />
                                </div>
                            </div>

                            {form.is_enrollment_required && (
                                <div className="space-y-3 rounded-lg border border-[#ebedf2] p-3 dark:border-[#1b2e4b]">
                                    <label className="flex cursor-pointer items-center gap-2">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox"
                                            checked={form.cancellation_allowed}
                                            onChange={e => setForm(prev => ({ ...prev, cancellation_allowed: e.target.checked, cancellation_deadline: '' }))}
                                        />
                                        <span className="text-sm font-medium text-dark dark:text-white">{t('activities.cancellationAllowed')}</span>
                                    </label>
                                    {form.cancellation_allowed && (
                                        <div>
                                            <label className="mb-1 block text-xs text-[#515365] dark:text-[#888ea8]">
                                                {t('activities.cancellationDeadlineLabel')}
                                            </label>
                                            <input
                                                type="datetime-local"
                                                className="form-input"
                                                value={form.cancellation_deadline}
                                                onChange={e => setForm(prev => ({ ...prev, cancellation_deadline: e.target.value }))}
                                                min={form.start_date ? `${form.start_date}T${form.start_time || '00:00'}` : today + 'T00:00'}
                                                max={form.end_date ? `${form.end_date}T${form.end_time || '23:59'}` : undefined}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {schoolClasses.length > 0 && !form.is_global && (
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-dark dark:text-white-light">
                                        {t('activities.classesLabel')}
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
                                        onChange={e => setForm(prev => ({
                                            ...prev,
                                            is_paid: e.target.checked,
                                            price: e.target.checked ? prev.price : '',
                                            is_enrollment_required: e.target.checked ? true : prev.is_enrollment_required,
                                        }))}
                                    />
                                    <span className="text-sm font-medium text-dark dark:text-white-light">{t('activities.paidLabel')}</span>
                                </label>
                            </div>

                            <div className="flex items-center gap-3 rounded border border-[#ebedf2] p-3 dark:border-[#1b2e4b]">
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="checkbox"
                                        className="form-checkbox"
                                        checked={form.is_enrollment_required}
                                        disabled={form.is_paid}
                                        onChange={e => setForm(prev => ({ ...prev, is_enrollment_required: e.target.checked }))}
                                    />
                                    <span className="text-sm font-medium text-dark dark:text-white-light">
                                        {t('activities.enrollmentRequired')}
                                    </span>
                                </label>
                            </div>

                            {form.is_paid && (
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">{t('activities.priceLabel')}</label>
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

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">
                                        {t('activities.capacityLabel')}
                                    </label>
                                    <input
                                        type="number"
                                        className="form-input mt-1"
                                        value={form.capacity}
                                        onChange={f('capacity')}
                                        min="1"
                                        placeholder={t('common.unlimited')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">
                                        {t('activities.addressLabel')}
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input mt-1"
                                        value={form.address}
                                        onChange={f('address')}
                                    />
                                </div>
                            </div>

                            {/* Materyaller */}
                            <div>
                                <label className="mb-2 flex items-center gap-1 text-sm font-medium text-dark dark:text-white-light">
                                    <PackagePlus className="h-4 w-4 text-primary" />
                                    {t('activities.materialsLabel')}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="form-input flex-1"
                                        value={materialInput}
                                        onChange={e => setMaterialInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMaterial(); } }}
                                        placeholder={t('activities.materialPlaceholder')}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-outline-primary px-3"
                                        onClick={addMaterial}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                                {form.materials.length > 0 && (
                                    <ul className="mt-2 space-y-1">
                                        {form.materials.map((m, i) => (
                                            <li key={i} className="flex items-center justify-between rounded border border-[#ebedf2] px-3 py-1.5 text-sm dark:border-[#1b2e4b]">
                                                <span className="text-dark dark:text-white">{m}</span>
                                                <button
                                                    type="button"
                                                    className="text-danger hover:opacity-70"
                                                    onClick={() => removeMaterial(i)}
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
                                    {saving ? t('common.loading') : (editingActivity ? t('common.update') : t('common.save'))}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowModal(false)}>
                                    {t('common.cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
