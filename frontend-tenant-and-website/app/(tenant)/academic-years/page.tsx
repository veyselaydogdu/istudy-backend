'use client';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import apiClient from '@/lib/apiClient';
import { AcademicYear, School } from '@/types';
import { Plus, Trash2, X, GraduationCap, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

type GlobalYear = {
    name: string;
    start_year: number;
    end_year: number;
    start_date: string;
    end_date: string;
};

type YearForm = {
    global_year_name: string;
    start_date: string;
    end_date: string;
    description: string;
};

const emptyForm: YearForm = { global_year_name: '', start_date: '', end_date: '', description: '' };

export default function AcademicYearsPage() {
    const { t } = useTranslation();
    const [schools, setSchools] = useState<School[]>([]);
    const [selectedSchoolId, setSelectedSchoolId] = useState('');

    const [years, setYears] = useState<AcademicYear[]>([]);
    const [globalYears, setGlobalYears] = useState<GlobalYear[]>([]);
    const [loading, setLoading] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
    const [form, setForm] = useState<YearForm>(emptyForm);
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

    const fetchGlobalYears = useCallback(async () => {
        try {
            const res = await apiClient.get('/academic-years/global-list');
            setGlobalYears(res.data?.data ?? []);
        } catch { /* sessizce geç */ }
    }, []);

    const fetchYears = useCallback(async () => {
        if (!selectedSchoolId) return;
        setLoading(true);
        try {
            const res = await apiClient.get('/academic-years', { params: { school_id: selectedSchoolId } });
            setYears(res.data?.data ?? []);
        } catch {
            toast.error(t('academicYears.loadError'));
        } finally {
            setLoading(false);
        }
    }, [selectedSchoolId]);

    useEffect(() => { fetchSchools(); fetchGlobalYears(); }, [fetchSchools, fetchGlobalYears]);
    useEffect(() => { if (selectedSchoolId) fetchYears(); }, [selectedSchoolId, fetchYears]);

    const handleGlobalYearChange = (name: string) => {
        const gy = globalYears.find(y => y.name === name);
        setForm(prev => ({
            ...prev,
            global_year_name: name,
            start_date: gy ? gy.start_date : '',
            end_date: gy ? gy.end_date : '',
        }));
    };

    const openCreate = () => {
        setEditingYear(null);
        setForm(emptyForm);
        setShowModal(true);
    };

    const openEdit = (year: AcademicYear) => {
        setEditingYear(year);
        setForm({
            global_year_name: year.name,
            start_date: year.start_date,
            end_date: year.end_date,
            description: '',
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Frontend validation
        if (!form.global_year_name && !editingYear) {
            toast.error(t('academicYears.yearRequired'));
            return;
        }
        if (!form.start_date || !form.end_date) {
            toast.error(t('academicYears.datesRequired'));
            return;
        }
        if (!selectedSchoolId) {
            toast.error(t('academicYears.schoolRequired'));
            return;
        }

        setSaving(true);
        const payload = {
            school_id: selectedSchoolId,
            name: form.global_year_name,
            start_date: form.start_date,
            end_date: form.end_date,
            description: form.description || null,
        };
        try {
            if (editingYear) {
                await apiClient.put(`/academic-years/${editingYear.id}`, payload);
                toast.success(t('academicYears.editYear'));
            } else {
                await apiClient.post('/academic-years', payload);
                toast.success(t('academicYears.addYear'));
            }
            setShowModal(false);
            fetchYears();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? t('academicYears.createError'));
        } finally {
            setSaving(false);
        }
    };

    const handleSetCurrent = async (year: AcademicYear) => {
        const result = await Swal.fire({
            title: t('academicYears.setActiveTitle'),
            text: t('academicYears.setActiveText', { name: year.name }),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: t('common.yes'),
            cancelButtonText: t('common.cancel'),
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.patch(`/academic-years/${year.id}/set-current`);
            toast.success(t('academicYears.setActiveSuccess'));
            fetchYears();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? t('academicYears.setActiveError'));
        }
    };

    const handleClose = async (year: AcademicYear) => {
        const result = await Swal.fire({
            title: t('academicYears.closeTitle'),
            text: t('academicYears.closeText', { name: year.name }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('academicYears.closeConfirm'),
            cancelButtonText: t('common.cancel'),
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.patch(`/academic-years/${year.id}/close`);
            toast.success(t('academicYears.closeSuccess'));
            fetchYears();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? t('academicYears.closeError'));
        }
    };

    const handleDelete = async (year: AcademicYear) => {
        const result = await Swal.fire({
            title: t('academicYears.deleteTitle'),
            text: t('academicYears.deleteText', { name: year.name }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('swal.confirmDelete'),
            cancelButtonText: t('swal.cancel'),
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.delete(`/academic-years/${year.id}`);
            toast.success(t('academicYears.deleteSuccess'));
            fetchYears();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? t('academicYears.deleteError'));
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-dark dark:text-white">{t('academicYears.title')}</h1>
                <button
                    type="button"
                    className="btn btn-primary gap-2"
                    onClick={openCreate}
                    disabled={!selectedSchoolId}
                >
                    <Plus className="h-4 w-4" />
                    {t('academicYears.addBtn')}
                </button>
            </div>

            <div className="panel">
                <div className="mb-6">
                    <label className="block text-sm font-medium text-dark dark:text-white-light">{t('academicYears.schoolLabel')}</label>
                    <select
                        className="form-select mt-1 max-w-xs"
                        value={selectedSchoolId}
                        onChange={e => setSelectedSchoolId(e.target.value)}
                    >
                        {schools.length === 0 && <option value="">{t('academicYears.noSchool')}</option>}
                        {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>

                {loading ? (
                    <div className="flex h-32 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                ) : !selectedSchoolId ? (
                    <p className="py-8 text-center text-[#515365] dark:text-[#888ea8]">{t('academicYears.selectSchoolFirst')}</p>
                ) : years.length === 0 ? (
                    <div className="py-12 text-center">
                        <GraduationCap className="mx-auto mb-3 h-12 w-12 text-[#888ea8]" />
                        <p className="text-[#515365] dark:text-[#888ea8]">{t('academicYears.noYear')}</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table-hover">
                            <thead>
                                <tr>
                                    <th>{t('academicYears.yearCol')}</th>
                                    <th>{t('academicYears.startCol')}</th>
                                    <th>{t('academicYears.endCol')}</th>
                                    <th>{t('academicYears.statusCol')}</th>
                                    <th>{t('academicYears.actionsCol')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {years.map(year => (
                                    <tr key={year.id}>
                                        <td className="font-medium text-dark dark:text-white">{year.name}</td>
                                        <td className="text-sm text-[#515365] dark:text-[#888ea8]">
                                            {new Date(year.start_date).toLocaleDateString('tr-TR')}
                                        </td>
                                        <td className="text-sm text-[#515365] dark:text-[#888ea8]">
                                            {new Date(year.end_date).toLocaleDateString('tr-TR')}
                                        </td>
                                        <td>
                                            {year.is_active ? (
                                                <span className="badge badge-outline-success">{t('academicYears.statusActive')}</span>
                                            ) : (
                                                <span className="badge badge-outline-secondary">{t('academicYears.statusInactive')}</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex flex-wrap gap-2">
                                                {!year.is_active && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-success gap-1"
                                                        onClick={() => handleSetCurrent(year)}
                                                    >
                                                        <CheckCircle className="h-3.5 w-3.5" />
                                                        {t('academicYears.setActiveBtn')}
                                                    </button>
                                                )}
                                                {year.is_active && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-warning gap-1"
                                                        onClick={() => handleClose(year)}
                                                    >
                                                        <XCircle className="h-3.5 w-3.5" />
                                                        {t('academicYears.closeBtn')}
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger p-2"
                                                    onClick={() => handleDelete(year)}
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
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-lg font-bold text-dark dark:text-white">
                                <GraduationCap className="h-5 w-5 text-primary" />
                                {editingYear ? t('academicYears.editModalTitle') : t('academicYears.addModalTitle')}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="text-[#888ea8] hover:text-danger"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">
                                    {t('academicYears.globalYearLabel')}
                                </label>
                                <select
                                    className="form-select mt-1"
                                    value={form.global_year_name}
                                    onChange={e => handleGlobalYearChange(e.target.value)}
                                >
                                    <option value="">{t('academicYears.selectYear')}</option>
                                    {globalYears.map(gy => (
                                        <option key={gy.name} value={gy.name}>{gy.name}</option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-[#888ea8]">
                                    {t('academicYears.globalYearHint')}
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">
                                        {t('academicYears.startDateLabel')}
                                    </label>
                                    <input
                                        type="date"
                                        className="form-input mt-1"
                                        value={form.start_date}
                                        onChange={e => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">
                                        {t('academicYears.endDateLabel')}
                                    </label>
                                    <input
                                        type="date"
                                        className="form-input mt-1"
                                        value={form.end_date}
                                        onChange={e => setForm(prev => ({ ...prev, end_date: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">
                                    {t('academicYears.descriptionLabel')}
                                </label>
                                <textarea
                                    className="form-input mt-1"
                                    rows={2}
                                    value={form.description}
                                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder={t('academicYears.descriptionPlaceholder')}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    className="btn btn-primary flex-1"
                                    disabled={saving}
                                >
                                    {saving ? t('common.loading') : (editingYear ? t('common.update') : t('common.save'))}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary flex-1"
                                    onClick={() => setShowModal(false)}
                                >
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
