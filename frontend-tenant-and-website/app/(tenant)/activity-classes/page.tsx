'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import apiClient from '@/lib/apiClient';
import { ActivityClass, School, SchoolClass } from '@/types';
import { Plus, Trash2, Edit2, Eye, Users, Star, DollarSign, Globe, Info } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

type ActivityClassForm = {
    name: string;
    description: string;
    language: string;
    age_min: string;
    age_max: string;
    capacity: string;
    is_school_wide: boolean;
    is_global: boolean;
    is_active: boolean;
    is_paid: boolean;
    price: string;
    currency: string;
    invoice_required: boolean;
    start_date: string;
    end_date: string;
    schedule: string;
    location: string;
    address: string;
    notes: string;
    school_class_ids: number[];
};

const emptyForm: ActivityClassForm = {
    name: '', description: '', language: 'tr',
    age_min: '', age_max: '', capacity: '',
    is_school_wide: true, is_global: false, is_active: true,
    is_paid: false, price: '', currency: 'TRY',
    invoice_required: false,
    start_date: '', end_date: '', schedule: '', location: '', address: '', notes: '',
    school_class_ids: [],
};

export default function ActivityClassesPage() {
    const { t } = useTranslation();
    const [schools, setSchools] = useState<School[]>([]);
    const [filterSchoolId, setFilterSchoolId] = useState('');
    const [formSchoolId, setFormSchoolId] = useState('');
    const [formSchoolClasses, setFormSchoolClasses] = useState<SchoolClass[]>([]);
    const [activityClasses, setActivityClasses] = useState<ActivityClass[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<ActivityClass | null>(null);
    const [form, setForm] = useState<ActivityClassForm>(emptyForm);
    const [saving, setSaving] = useState(false);

    const fetchSchools = useCallback(async () => {
        try {
            const res = await apiClient.get('/schools');
            setSchools(res.data?.data ?? []);
        } catch { /* silent */ }
    }, []);

    const fetchFormSchoolClasses = useCallback(async (schoolId: string) => {
        if (!schoolId) { setFormSchoolClasses([]); return; }
        try {
            const res = await apiClient.get(`/schools/${schoolId}/classes`);
            setFormSchoolClasses(res.data?.data ?? []);
        } catch { /* silent */ }
    }, []);

    const fetchActivityClasses = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, unknown> = { page };
            if (filterSchoolId) params.school_id = filterSchoolId;
            const res = await apiClient.get('/activity-classes', { params });
            setActivityClasses(res.data?.data ?? []);
            setLastPage(res.data?.meta?.last_page ?? 1);
        } catch {
            toast.error('Etkinlik sınıfları yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    }, [filterSchoolId, page]);

    useEffect(() => { fetchSchools(); }, [fetchSchools]);
    useEffect(() => { setPage(1); }, [filterSchoolId]);
    useEffect(() => { fetchActivityClasses(); }, [fetchActivityClasses]);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setFormSchoolId('');
        setFormSchoolClasses([]);
        setShowModal(true);
    };

    const openEdit = (ac: ActivityClass) => {
        setEditing(ac);
        const schoolId = ac.school_id ? String(ac.school_id) : '';
        setFormSchoolId(schoolId);
        if (schoolId) fetchFormSchoolClasses(schoolId);
        else setFormSchoolClasses([]);
        setForm({
            name: ac.name,
            description: ac.description ?? '',
            language: ac.language,
            age_min: ac.age_min != null ? String(ac.age_min) : '',
            age_max: ac.age_max != null ? String(ac.age_max) : '',
            capacity: ac.capacity != null ? String(ac.capacity) : '',
            is_school_wide: ac.is_school_wide,
            is_global: (ac as ActivityClass & { is_global?: boolean }).is_global ?? false,
            is_active: ac.is_active,
            is_paid: ac.is_paid,
            price: ac.price != null ? String(ac.price) : '',
            currency: ac.currency,
            invoice_required: ac.invoice_required,
            start_date: ac.start_date ?? '',
            end_date: ac.end_date ?? '',
            schedule: ac.schedule ?? '',
            location: ac.location ?? '',
            address: ac.address ?? '',
            notes: ac.notes ?? '',
            school_class_ids: ac.school_classes?.map(c => c.id) ?? [],
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) { toast.error('İsim zorunludur.'); return; }
        setSaving(true);
        try {
            const payload = {
                ...form,
                // Global ise okul ve sınıf ataması gönderilmez
                school_id: form.is_global ? null : (formSchoolId ? parseInt(formSchoolId) : null),
                age_min: form.age_min ? parseInt(form.age_min) : null,
                age_max: form.age_max ? parseInt(form.age_max) : null,
                capacity: form.capacity ? parseInt(form.capacity) : null,
                address: form.address || null,
                price: form.is_paid && form.price ? parseFloat(form.price) : null,
                school_class_ids: form.is_global ? [] : (formSchoolId ? form.school_class_ids : []),
            };

            if (editing) {
                await apiClient.put(`/activity-classes/${editing.id}`, payload);
                toast.success('Etkinlik sınıfı güncellendi.');
            } else {
                await apiClient.post('/activity-classes', payload);
                toast.success('Etkinlik sınıfı oluşturuldu.');
            }
            setShowModal(false);
            fetchActivityClasses();
        } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Bir hata oluştu.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (ac: ActivityClass) => {
        const result = await Swal.fire({
            title: t('swal.deleteTitle') || 'Etkinlik sınıfını sil?',
            text: `"${ac.name}" silinecek. Bu işlem geri alınamaz.`,
            icon: 'warning', showCancelButton: true,
            confirmButtonText: t('swal.confirmDelete'), cancelButtonText: t('common.cancel'),
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.delete(`/activity-classes/${ac.id}`);
            toast.success('Etkinlik sınıfı silindi.');
            fetchActivityClasses();
        } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Silinemedi.');
        }
    };

    const toggleClass = (id: number) => {
        setForm(prev => ({
            ...prev,
            school_class_ids: prev.school_class_ids.includes(id)
                ? prev.school_class_ids.filter(x => x !== id)
                : [...prev.school_class_ids, id],
        }));
    };

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#3b3f5c] dark:text-white">{t('activityClasses.title') || 'Etkinlik Sınıfları'}</h1>
                    <p className="text-sm text-[#888ea8] mt-1">{t('activityClasses.subtitle') || 'Okul etkinlik sınıflarını yönetin'}</p>
                </div>
                <button type="button" onClick={openCreate} className="btn btn-primary flex items-center gap-2">
                    <Plus className="h-4 w-4" /> {t('activityClasses.addBtn') || 'Yeni Etkinlik Sınıfı'}
                </button>
            </div>

            {/* Okul filtresi */}
            <div className="panel mb-4">
                <select
                    className="form-select w-full md:w-72"
                    value={filterSchoolId}
                    onChange={e => setFilterSchoolId(e.target.value)}
                >
                    <option value="">{t('activityClasses.allSchools') || 'Tüm Okullar'}</option>
                    {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>

            {/* Tablo */}
            <div className="panel">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : activityClasses.length === 0 ? (
                    <div className="text-center py-16 text-[#888ea8]">
                        <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>{t('activityClasses.noClass') || 'Henüz etkinlik sınıfı yok.'}</p>
                        <button type="button" onClick={openCreate} className="btn btn-primary mt-4">
                            <Plus className="h-4 w-4 mr-2" /> {t('activityClasses.addBtn') || 'İlk Etkinlik Sınıfını Oluştur'}
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="table-responsive">
                            <table className="table-hover">
                                <thead>
                                    <tr>
                                        <th>{t('activityClasses.nameLabel').replace(' *','') || 'İsim'}</th>
                                        <th>{t('activityClasses.schoolLabel').split(' (')[0] || 'Okul'}</th>
                                        <th>{t('activityClasses.languageLabel') || 'Dil'}</th>
                                        <th>{t('activityClasses.ageMinLabel').replace('Min ', '') || 'Yaş'}</th>
                                        <th>{t('activityClasses.capacityLabel') || 'Kapasite'}</th>
                                        <th>Kayıt</th>
                                        <th>{t('activityClasses.priceLabel') || 'Ücret'}</th>
                                        <th>{t('activityClasses.startDateLabel').replace('Başlangıç ','') || 'Tarih'}</th>
                                        <th>{t('common.status') || 'Durum'}</th>
                                        <th>{t('common.action') || 'İşlem'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activityClasses.map(ac => (
                                        <tr key={ac.id}>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-[#3b3f5c] dark:text-white">{ac.name}</span>
                                                    {(ac as ActivityClass & { is_global?: boolean }).is_global && (
                                                        <span className="badge badge-outline-warning text-xs flex items-center gap-1">
                                                            <Globe className="h-3 w-3" /> Global
                                                        </span>
                                                    )}
                                                </div>
                                                {!(ac as ActivityClass & { is_global?: boolean }).is_global && (
                                                    ac.is_school_wide ? (
                                                        <span className="text-xs text-[#888ea8]">Tüm okul</span>
                                                    ) : (
                                                        <span className="text-xs text-[#888ea8]">{ac.school_classes?.map(c => c.name).join(', ')}</span>
                                                    )
                                                )}
                                            </td>
                                            <td className="text-sm text-[#888ea8]">
                                                {(ac as ActivityClass & { is_global?: boolean }).is_global
                                                    ? <span className="badge badge-outline-warning flex items-center gap-1"><Globe className="h-3 w-3" /> Tüm Sistem</span>
                                                    : ac.school_id
                                                        ? (schools.find(s => s.id === ac.school_id)?.name ?? `Okul #${ac.school_id}`)
                                                        : <span className="badge badge-outline-info">Tüm Okullar</span>}
                                            </td>
                                            <td><span className="badge badge-outline-info uppercase">{ac.language}</span></td>
                                            <td className="text-sm">
                                                {ac.age_min != null || ac.age_max != null
                                                    ? `${ac.age_min ?? '?'} - ${ac.age_max ?? '?'}`
                                                    : <span className="text-[#888ea8]">—</span>}
                                            </td>
                                            <td className="text-sm">
                                                {ac.capacity ? (
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        {ac.active_enrollments_count ?? 0}/{ac.capacity}
                                                    </span>
                                                ) : <span className="text-[#888ea8]">—</span>}
                                            </td>
                                            <td>
                                                <span className="flex items-center gap-1 text-sm">
                                                    <Users className="h-3 w-3" />
                                                    {ac.active_enrollments_count ?? 0}
                                                </span>
                                            </td>
                                            <td>
                                                {ac.is_paid ? (
                                                    <span className="badge badge-outline-warning flex items-center gap-1 w-fit">
                                                        <DollarSign className="h-3 w-3" />
                                                        {ac.price} {ac.currency}
                                                    </span>
                                                ) : (
                                                    <span className="badge badge-outline-success">Ücretsiz</span>
                                                )}
                                            </td>
                                            <td className="text-xs text-[#888ea8]">
                                                {ac.start_date ? new Date(ac.start_date).toLocaleDateString('tr-TR') : '—'}
                                                {ac.end_date ? ` — ${new Date(ac.end_date).toLocaleDateString('tr-TR')}` : ''}
                                            </td>
                                            <td>
                                                <span className={`badge ${ac.is_active ? 'badge-outline-success' : 'badge-outline-danger'}`}>
                                                    {ac.is_active ? 'Aktif' : 'Pasif'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <Link href={`/activity-classes/${ac.id}`} className="btn btn-sm btn-outline-primary p-2" title={t('common.details')}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                    <button type="button" onClick={() => openEdit(ac)} className="btn btn-sm btn-outline-info p-2" title={t('common.edit')}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button type="button" onClick={() => handleDelete(ac)} className="btn btn-sm btn-outline-danger p-2" title={t('common.delete')}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {lastPage > 1 && (
                            <div className="flex justify-center gap-2 mt-4">
                                <button type="button" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-sm btn-outline-primary">Önceki</button>
                                <span className="px-3 py-1 text-sm">{page} / {lastPage}</span>
                                <button type="button" disabled={page === lastPage} onClick={() => setPage(p => p + 1)} className="btn btn-sm btn-outline-primary">Sonraki</button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#1b2e4b] rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b dark:border-[#1b2e4b]">
                            <h3 className="text-lg font-bold text-[#3b3f5c] dark:text-white">
                                {editing ? t('activityClasses.editModalTitle') || 'Etkinlik Sınıfını Düzenle' : t('activityClasses.addModalTitle') || 'Yeni Etkinlik Sınıfı'}
                            </h3>
                            <button type="button" onClick={() => setShowModal(false)} className="text-[#888ea8] hover:text-red-500">✕</button>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Global Etkinlik Sınıfı Toggle */}
                            <div className={`rounded-lg border-2 p-3 transition-colors ${form.is_global ? 'border-warning bg-warning/5' : 'border-[#ebedf2] dark:border-[#1b2e4b]'}`}>
                                <label className="flex cursor-pointer items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Globe className={`h-5 w-5 ${form.is_global ? 'text-warning' : 'text-[#888ea8]'}`} />
                                        <span className="font-semibold text-[#3b3f5c] dark:text-white">Global Etkinlik Sınıfı</span>
                                    </div>
                                    <div className={`relative h-6 w-11 rounded-full transition-colors ${form.is_global ? 'bg-warning' : 'bg-[#e0e6ed] dark:bg-[#1b2e4b]'}`}>
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={form.is_global}
                                            onChange={e => {
                                                const val = e.target.checked;
                                                setForm(prev => ({ ...prev, is_global: val, school_class_ids: [], is_school_wide: true }));
                                                if (val) { setFormSchoolId(''); setFormSchoolClasses([]); }
                                            }}
                                        />
                                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.is_global ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                    </div>
                                </label>
                                {form.is_global && (
                                    <div className="mt-2 flex items-start gap-2 rounded-md bg-warning/10 p-2 text-xs text-warning">
                                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                        <p>
                                            <strong>Bu etkinlik sınıfı herkese açıktır.</strong> Sistemdeki tüm kurumlar ve veliler görebilir, çocuklarını kaydedebilir.
                                            Okul veya sınıfa özel kısıtlama uygulanamaz.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Okul Seçimi (opsiyonel — global ise devre dışı) */}
                            <div>
                                <label className="text-sm font-medium">{t('activityClasses.schoolLabel') || 'Okul (opsiyonel)'}</label>
                                <select
                                    className={`form-select mt-1 w-full ${form.is_global ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    value={formSchoolId}
                                    disabled={form.is_global}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setFormSchoolId(val);
                                        setForm(prev => ({ ...prev, school_class_ids: [] }));
                                        fetchFormSchoolClasses(val);
                                    }}
                                >
                                    <option value="">{t('activityClasses.selectSchool') || 'Tüm Okullar (Tenant Geneli)'}</option>
                                    {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                {form.is_global && (
                                    <p className="mt-1 text-xs text-[#888ea8]">Global etkinlik sınıflarında okul seçimi yapılamaz.</p>
                                )}
                            </div>

                            {/* İsim & Dil */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">{t('activityClasses.nameLabel') || 'İsim *'}</label>
                                    <input
                                        className="form-input mt-1 w-full"
                                        placeholder=""
                                        value={form.name}
                                        onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">{t('activityClasses.languageLabel') || 'Dil'}</label>
                                    <select className="form-select mt-1 w-full" value={form.language} onChange={e => setForm(prev => ({ ...prev, language: e.target.value }))}>
                                        <option value="tr">Türkçe</option>
                                        <option value="en">İngilizce</option>
                                        <option value="de">Almanca</option>
                                        <option value="fr">Fransızca</option>
                                        <option value="ar">Arapça</option>
                                        <option value="ru">Rusça</option>
                                    </select>
                                </div>
                            </div>

                            {/* Açıklama */}
                            <div>
                                <label className="text-sm font-medium">{t('activityClasses.descriptionLabel') || 'Açıklama'}</label>
                                <textarea
                                    className="form-textarea mt-1 w-full"
                                    rows={3}
                                    placeholder="Etkinlik sınıfı hakkında bilgi..."
                                    value={form.description}
                                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>

                            {/* Yaş aralığı & Kapasite */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm font-medium">{t('activityClasses.ageMinLabel') || 'Min Yaş'}</label>
                                    <input
                                        type="number" min={0} max={18} className="form-input mt-1 w-full"
                                        placeholder="0"
                                        value={form.age_min}
                                        onChange={e => setForm(prev => ({ ...prev, age_min: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">{t('activityClasses.ageMaxLabel') || 'Max Yaş'}</label>
                                    <input
                                        type="number" min={0} max={18} className="form-input mt-1 w-full"
                                        placeholder="18"
                                        value={form.age_max}
                                        onChange={e => setForm(prev => ({ ...prev, age_max: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">{t('activityClasses.capacityLabel') || 'Kapasite'}</label>
                                    <input
                                        type="number" min={1} className="form-input mt-1 w-full"
                                        placeholder=""
                                        value={form.capacity}
                                        onChange={e => setForm(prev => ({ ...prev, capacity: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Tarihler & Program */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">{t('activityClasses.startDateLabel') || 'Başlangıç Tarihi'}</label>
                                    <input type="date" className="form-input mt-1 w-full" value={form.start_date} onChange={e => setForm(prev => ({ ...prev, start_date: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">{t('activityClasses.endDateLabel') || 'Bitiş Tarihi'}</label>
                                    <input type="date" className="form-input mt-1 w-full" value={form.end_date} onChange={e => setForm(prev => ({ ...prev, end_date: e.target.value }))} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">{t('activityClasses.scheduleLabel') || 'Program (Gün/Saat)'}</label>
                                    <input className="form-input mt-1 w-full" placeholder="" value={form.schedule} onChange={e => setForm(prev => ({ ...prev, schedule: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">{t('activityClasses.locationLabel') || 'Konum'}</label>
                                    <input className="form-input mt-1 w-full" placeholder="Derslik, salon..." value={form.location} onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))} />
                                </div>
                            </div>

                            {/* Adres */}
                            <div>
                                <label className="text-sm font-medium">
                                    Adres <span className="text-[#888ea8] font-normal">(opsiyonel)</span>
                                </label>
                                <input
                                    className="form-input mt-1 w-full"
                                    placeholder="Etkinlik sınıfının tam adresi..."
                                    value={form.address}
                                    onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                                />
                            </div>

                            {/* Kapsam — global ise sınıf seçimi devre dışı */}
                            {!form.is_global && (
                                <div>
                                    <label className="text-sm font-medium block mb-2">Kapsam</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="scope" checked={form.is_school_wide} onChange={() => setForm(prev => ({ ...prev, is_school_wide: true, school_class_ids: [] }))} />
                                            <span className="text-sm">{formSchoolId ? 'Tüm Okul' : 'Tüm Okullar'}</span>
                                        </label>
                                        {formSchoolId && (
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="scope" checked={!form.is_school_wide} onChange={() => setForm(prev => ({ ...prev, is_school_wide: false }))} />
                                                <span className="text-sm">Belirli Sınıflar</span>
                                            </label>
                                        )}
                                    </div>
                                    {formSchoolId && !form.is_school_wide && formSchoolClasses.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {formSchoolClasses.map(sc => (
                                                <label key={sc.id} className="flex items-center gap-1 cursor-pointer text-sm bg-[#f1f2f3] dark:bg-[#0e1726] px-3 py-1 rounded-full">
                                                    <input type="checkbox" checked={form.school_class_ids.includes(sc.id)} onChange={() => toggleClass(sc.id)} />
                                                    {sc.name}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                    {formSchoolId && !form.is_school_wide && formSchoolClasses.length === 0 && (
                                        <p className="text-xs text-[#888ea8] mt-2">Bu okulda sınıf bulunamadı.</p>
                                    )}
                                </div>
                            )}

                            {/* Ücret */}
                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="form-checkbox" checked={form.is_paid} onChange={e => setForm(prev => ({ ...prev, is_paid: e.target.checked }))} />
                                    <span className="text-sm font-medium">Ücretli Etkinlik Sınıfı</span>
                                </label>
                                {form.is_paid && (
                                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-sm font-medium">Ücret *</label>
                                            <input type="number" min={0} step="0.01" className="form-input mt-1 w-full" placeholder="0.00" value={form.price} onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Para Birimi</label>
                                            <select className="form-select mt-1 w-full" value={form.currency} onChange={e => setForm(prev => ({ ...prev, currency: e.target.value }))}>
                                                <option value="TRY">TRY</option>
                                                <option value="USD">USD</option>
                                                <option value="EUR">EUR</option>
                                            </select>
                                        </div>
                                        <div className="flex items-end pb-1">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" className="form-checkbox" checked={form.invoice_required} onChange={e => setForm(prev => ({ ...prev, invoice_required: e.target.checked }))} />
                                                <span className="text-sm">Ödeme Zorunlu</span>
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Notlar */}
                            <div>
                                <label className="text-sm font-medium">Notlar</label>
                                <textarea className="form-textarea mt-1 w-full" rows={2} placeholder="Ek notlar..." value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} />
                            </div>

                            {/* Durum */}
                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="form-checkbox" checked={form.is_active} onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))} />
                                    <span className="text-sm font-medium">Aktif</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 p-5 border-t dark:border-[#1b2e4b]">
                            <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline-danger" disabled={saving}>{t('common.cancel')}</button>
                            <button type="button" onClick={handleSave} disabled={saving} className="btn btn-primary">
                                {saving ? t('common.loading') : (editing ? t('common.update') : 'Oluştur')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
