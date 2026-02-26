'use client';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import apiClient from '@/lib/apiClient';
import { AcademicYear, School } from '@/types';
import { Plus, Trash2, Edit2, X, GraduationCap, CheckCircle, XCircle } from 'lucide-react';

type YearForm = {
    name: string;
    start_date: string;
    end_date: string;
    description: string;
};

const emptyForm: YearForm = { name: '', start_date: '', end_date: '', description: '' };

export default function AcademicYearsPage() {
    const [schools, setSchools] = useState<School[]>([]);
    const [selectedSchoolId, setSelectedSchoolId] = useState('');

    const [years, setYears] = useState<AcademicYear[]>([]);
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

    const fetchYears = useCallback(async () => {
        if (!selectedSchoolId) return;
        setLoading(true);
        try {
            const res = await apiClient.get('/academic-years', { params: { school_id: selectedSchoolId } });
            setYears(res.data?.data ?? []);
        } catch {
            toast.error('Eğitim yılları yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    }, [selectedSchoolId]);

    useEffect(() => { fetchSchools(); }, [fetchSchools]);
    useEffect(() => { if (selectedSchoolId) fetchYears(); }, [selectedSchoolId, fetchYears]);

    const openCreate = () => {
        setEditingYear(null);
        setForm(emptyForm);
        setShowModal(true);
    };

    const openEdit = (year: AcademicYear) => {
        setEditingYear(year);
        setForm({
            name: year.name,
            start_date: year.start_date,
            end_date: year.end_date,
            description: '',
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const payload = {
            school_id: Number(selectedSchoolId),
            name: form.name,
            start_date: form.start_date,
            end_date: form.end_date,
            description: form.description || null,
        };
        try {
            if (editingYear) {
                await apiClient.put(`/academic-years/${editingYear.id}`, payload);
                toast.success('Eğitim yılı güncellendi.');
            } else {
                await apiClient.post('/academic-years', payload);
                toast.success('Eğitim yılı oluşturuldu.');
            }
            setShowModal(false);
            fetchYears();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? 'Hata oluştu.');
        } finally {
            setSaving(false);
        }
    };

    const handleSetCurrent = async (year: AcademicYear) => {
        const result = await Swal.fire({
            title: 'Aktif Yıl Yap',
            text: `"${year.name}" eğitim yılı aktif yapılacak. Devam?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Evet',
            cancelButtonText: 'İptal',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.patch(`/academic-years/${year.id}/set-current`);
            toast.success('Aktif eğitim yılı güncellendi.');
            fetchYears();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? 'İşlem başarısız.');
        }
    };

    const handleClose = async (year: AcademicYear) => {
        const result = await Swal.fire({
            title: 'Yılı Kapat',
            text: `"${year.name}" eğitim yılı kapatılacak. Bu işlem geri alınamaz.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Evet, Kapat',
            cancelButtonText: 'İptal',
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.patch(`/academic-years/${year.id}/close`);
            toast.success('Eğitim yılı kapatıldı.');
            fetchYears();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? 'İşlem başarısız.');
        }
    };

    const handleDelete = async (year: AcademicYear) => {
        const result = await Swal.fire({
            title: 'Eğitim Yılını Sil',
            text: `"${year.name}" silinecek. Bu işlem geri alınamaz.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Evet, Sil',
            cancelButtonText: 'İptal',
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.delete(`/academic-years/${year.id}`);
            toast.success('Eğitim yılı silindi.');
            fetchYears();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? 'Silme başarısız.');
        }
    };

    const f = (field: keyof YearForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm(prev => ({ ...prev, [field]: e.target.value }));

    return (
        <div className="p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-dark dark:text-white">Eğitim Yılları</h1>
                <button
                    type="button"
                    className="btn btn-primary gap-2"
                    onClick={openCreate}
                    disabled={!selectedSchoolId}
                >
                    <Plus className="h-4 w-4" />
                    Eğitim Yılı Ekle
                </button>
            </div>

            <div className="panel">
                {/* Okul seçici */}
                <div className="mb-6">
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
                ) : years.length === 0 ? (
                    <div className="py-12 text-center">
                        <GraduationCap className="mx-auto mb-3 h-12 w-12 text-[#888ea8]" />
                        <p className="text-[#515365] dark:text-[#888ea8]">Henüz eğitim yılı eklenmemiş.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table-hover">
                            <thead>
                                <tr>
                                    <th>Eğitim Yılı</th>
                                    <th>Başlangıç</th>
                                    <th>Bitiş</th>
                                    <th>Durum</th>
                                    <th>İşlemler</th>
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
                                                <span className="badge badge-outline-success">Aktif</span>
                                            ) : (
                                                <span className="badge badge-outline-secondary">Pasif</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex flex-wrap gap-2">
                                                {!year.is_active && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-success gap-1"
                                                        onClick={() => handleSetCurrent(year)}
                                                        title="Aktif Yıl Yap"
                                                    >
                                                        <CheckCircle className="h-3.5 w-3.5" />
                                                        Aktif Yap
                                                    </button>
                                                )}
                                                {year.is_active && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-warning gap-1"
                                                        onClick={() => handleClose(year)}
                                                        title="Yılı Kapat"
                                                    >
                                                        <XCircle className="h-3.5 w-3.5" />
                                                        Kapat
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-primary p-2"
                                                    onClick={() => openEdit(year)}
                                                    title="Düzenle"
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger p-2"
                                                    onClick={() => handleDelete(year)}
                                                    title="Sil"
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
                                {editingYear ? 'Eğitim Yılı Düzenle' : 'Yeni Eğitim Yılı'}
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
                                    Yıl Adı *
                                </label>
                                <input
                                    type="text"
                                    className="form-input mt-1"
                                    value={form.name}
                                    onChange={f('name')}
                                    required
                                    placeholder="Örn: 2025-2026"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">
                                        Başlangıç Tarihi *
                                    </label>
                                    <input
                                        type="date"
                                        className="form-input mt-1"
                                        value={form.start_date}
                                        onChange={f('start_date')}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">
                                        Bitiş Tarihi *
                                    </label>
                                    <input
                                        type="date"
                                        className="form-input mt-1"
                                        value={form.end_date}
                                        onChange={f('end_date')}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">
                                    Açıklama
                                </label>
                                <textarea
                                    className="form-input mt-1"
                                    rows={2}
                                    value={form.description}
                                    onChange={f('description')}
                                    placeholder="İsteğe bağlı açıklama..."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    className="btn btn-primary flex-1"
                                    disabled={saving}
                                >
                                    {saving ? 'Kaydediliyor...' : (editingYear ? 'Güncelle' : 'Kaydet')}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary flex-1"
                                    onClick={() => setShowModal(false)}
                                >
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
