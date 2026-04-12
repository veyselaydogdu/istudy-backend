'use client';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import apiClient from '@/lib/apiClient';
import { Activity, School, SchoolClass } from '@/types';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Edit2, X, Calendar, DollarSign, PackagePlus, ExternalLink, RotateCcw, Users, MapPin } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

type ActivityForm = {
    name: string;
    description: string;
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
    name: '', description: '', is_paid: false, is_enrollment_required: false,
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

    const [statusFilter, setStatusFilter] = useState<'active' | 'ended' | 'deleted'>('active');
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const [showModal, setShowModal] = useState(false);
    const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
    const [form, setForm] = useState<ActivityForm>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [materialInput, setMaterialInput] = useState('');

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
            const params: Record<string, string | number> = { page };
            if (statusFilter === 'deleted') {
                params.with_trashed = 'true';
                params.status = 'deleted';
            } else {
                params.status = statusFilter;
            }
            const res = await apiClient.get(`/schools/${selectedSchoolId}/activities`, { params });
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
        if (selectedSchoolId) {
            setPage(1);
            fetchSchoolClasses();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSchoolId]);
    useEffect(() => {
        setPage(1);
    }, [statusFilter]);
    useEffect(() => { if (selectedSchoolId) fetchActivities(); }, [fetchActivities]);

    const openCreate = () => {
        setEditingActivity(null);
        setForm(emptyForm);
        setMaterialInput('');
        setShowModal(true);
    };

    const openEdit = (activity: Activity) => {
        setEditingActivity(activity);
        setForm({
            name: activity.name,
            description: activity.description ?? '',
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

        // Frontend validation
        if (!form.name.trim()) {
            toast.error(t('activities.nameRequired'));
            return;
        }
        if (!selectedSchoolId) {
            toast.error(t('activities.schoolRequired'));
            return;
        }
        if (form.start_date && form.start_date < today) {
            toast.error(t('activities.startDatePast'));
            return;
        }
        if (form.end_date && form.end_date < today) {
            toast.error(t('activities.endDatePast'));
            return;
        }
        if (form.cancellation_allowed && form.cancellation_deadline && form.start_date
            && form.cancellation_deadline > form.start_date) {
            toast.error(t('activities.cancellationDeadlineError'));
            return;
        }

        setSaving(true);
        const payload = {
            school_id: Number(selectedSchoolId),
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
            class_ids: form.class_ids,
            materials: form.materials.length > 0 ? form.materials : null,
        };
        try {
            if (editingActivity) {
                await apiClient.put(`/schools/${selectedSchoolId}/activities/${editingActivity.id}`, payload);
                toast.success(t('activities.updateSuccess'));
            } else {
                await apiClient.post(`/schools/${selectedSchoolId}/activities`, payload);
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

    const handleRestore = async (activity: Activity) => {
        try {
            await apiClient.post(`/schools/${selectedSchoolId}/activities/${activity.id}/restore`);
            toast.success(t('activities.restoreSuccess'));
            fetchActivities();
        } catch {
            toast.error(t('activities.restoreError'));
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
            await apiClient.delete(`/schools/${selectedSchoolId}/activities/${activity.id}`);
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

    return (
        <div className="p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-dark dark:text-white">{t('activities.title')}</h1>
                <button type="button" className="btn btn-primary gap-2" onClick={openCreate} disabled={!selectedSchoolId}>
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
                            {schools.length === 0 && <option value="">{t('activities.noSchool')}</option>}
                            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-1">
                        {(['active', 'ended', 'deleted'] as const).map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setStatusFilter(s)}
                                className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-outline-secondary'}`}
                            >
                                {s === 'active' ? t('activities.statusActive') : s === 'ended' ? t('activities.statusEnded') : t('activities.statusDeleted')}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex h-32 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                ) : !selectedSchoolId ? (
                    <p className="py-8 text-center text-[#515365] dark:text-[#888ea8]">{t('activities.selectSchoolFirst')}</p>
                ) : activities.length === 0 ? (
                    <p className="py-8 text-center text-[#515365] dark:text-[#888ea8]">{t('activities.noActivity')}</p>
                ) : (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {activities.map(activity => {
                                const isDeleted = !!activity.deleted_at;
                                const isEnded = !isDeleted && activity.end_date
                                    ? new Date(activity.end_date) < new Date(new Date().toDateString())
                                    : false;
                                return (
                                    <div key={activity.id} className={`rounded border p-4 ${isDeleted ? 'border-danger/30 bg-danger/5 dark:border-danger/20' : 'border-[#ebedf2] dark:border-[#1b2e4b]'}`}>
                                        <div className="mb-2 flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className={`font-semibold text-dark dark:text-white ${isDeleted ? 'line-through opacity-60' : ''}`}>{activity.name}</h3>
                                                    {isDeleted && (
                                                        <span className="badge badge-outline-danger text-xs">{t('activities.deletedBadge')}</span>
                                                    )}
                                                    {isEnded && (
                                                        <span className="badge badge-outline-warning text-xs">{t('activities.endedBadge')}</span>
                                                    )}
                                                    {activity.is_paid && (
                                                        <span className="badge badge-outline-success text-xs">{t('activities.paidBadge')}</span>
                                                    )}
                                                    {activity.is_enrollment_required && (
                                                        <span className="badge badge-outline-info text-xs">{t('activities.enrollmentBadge')}</span>
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
                                                        {t('activities.assignedClasses', { count: activity.classes.length })}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex shrink-0 gap-1">
                                                {!isDeleted && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-info p-1.5"
                                                        onClick={() => router.push(`/activities/${activity.id}`)}
                                                        title={t('common.details')}
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                                {isDeleted ? (
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-success p-1.5"
                                                        onClick={() => handleRestore(activity)}
                                                        title={t('common.restore')}
                                                    >
                                                        <RotateCcw className="h-3.5 w-3.5" />
                                                    </button>
                                                ) : (
                                                    <>
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
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {activity.is_paid && activity.price != null && (
                                            <div className="mt-2 flex items-center gap-1 text-sm font-medium text-success">
                                                <DollarSign className="h-3.5 w-3.5" />
                                                {Number(activity.price).toFixed(2)} ₺
                                            </div>
                                        )}
                                        {(activity.capacity != null || activity.address) && (
                                            <div className="mt-2 flex flex-wrap gap-3">
                                                {activity.capacity != null && (
                                                    <span className="flex items-center gap-1 text-xs text-[#515365] dark:text-[#888ea8]">
                                                        <Users className="h-3 w-3" />
                                                        {t('activities.capacityLabel')}: {activity.enrollments_count ?? 0}/{activity.capacity}
                                                        {activity.enrollments_count != null && activity.enrollments_count >= activity.capacity && (
                                                            <span className="ml-1 badge badge-outline-danger text-xs">{t('common.noData')}</span>
                                                        )}
                                                    </span>
                                                )}
                                                {activity.address && (
                                                    <span className="flex items-center gap-1 text-xs text-[#515365] dark:text-[#888ea8]">
                                                        <MapPin className="h-3 w-3" />
                                                        {activity.address}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {activity.materials && activity.materials.length > 0 && (
                                            <div className="mt-2">
                                                <p className="mb-1 text-xs font-medium text-[#515365] dark:text-[#888ea8]">
                                                    {t('activities.materialsLabel')} ({activity.materials.length}):
                                                </p>
                                                <div className="flex flex-wrap gap-1">
                                                    {activity.materials.map((m, i) => (
                                                        <span key={i} className="rounded bg-[#f1f3f5] px-1.5 py-0.5 text-xs text-dark dark:bg-[#1b2e4b] dark:text-white">
                                                            {m}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
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
                                                min={today + 'T00:00'}
                                                max={form.start_date ? form.start_date + 'T23:59' : undefined}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {schoolClasses.length > 0 && (
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
