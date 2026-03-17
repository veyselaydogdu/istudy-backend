'use client';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import apiClient from '@/lib/apiClient';
import { TeacherProfile, TeacherRoleType, School } from '@/types';
import { Plus, Edit2, Trash2, X, Users, Building2, BookOpen, Tag } from 'lucide-react';

const EMPLOYMENT_LABELS: Record<string, string> = {
    full_time: 'Tam Zamanlı',
    part_time: 'Yarı Zamanlı',
    contract: 'Sözleşmeli',
    intern: 'Stajyer',
    volunteer: 'Gönüllü',
};

const EMPLOYMENT_BADGE: Record<string, string> = {
    full_time: 'badge-outline-success',
    part_time: 'badge-outline-warning',
    contract: 'badge-outline-info',
    intern: 'badge-outline-secondary',
    volunteer: 'badge-outline-primary',
};

type Country = { id: number; name: string; iso2: string; phone_code: string; flag_emoji: string | null };

type StoreForm = {
    name: string; surname: string; email: string; phone: string; phone_country_code: string; password: string;
    title: string; specialization: string; bio: string; experience_years: string;
    employment_type: string; hire_date: string;
    whatsapp_number: string; whatsapp_country_code: string;
    country_id: string; identity_number: string; passport_number: string;
};

type UpdateForm = {
    title: string; specialization: string; bio: string; experience_years: string;
    employment_type: string; hire_date: string;
    phone: string; phone_country_code: string;
    whatsapp_number: string; whatsapp_country_code: string;
    country_id: string; identity_number: string; passport_number: string;
};

const emptyStore: StoreForm = {
    name: '', surname: '', email: '', phone: '', phone_country_code: '+90', password: '',
    title: '', specialization: '', bio: '', experience_years: '',
    employment_type: 'full_time', hire_date: '',
    whatsapp_number: '', whatsapp_country_code: '+90',
    country_id: '', identity_number: '', passport_number: '',
};

const emptyUpdate: UpdateForm = {
    title: '', specialization: '', bio: '', experience_years: '',
    employment_type: 'full_time', hire_date: '',
    phone: '', phone_country_code: '+90',
    whatsapp_number: '', whatsapp_country_code: '+90',
    country_id: '', identity_number: '', passport_number: '',
};

type RoleTypeForm = { name: string; sort_order: string };
const emptyRoleType: RoleTypeForm = { name: '', sort_order: '0' };

export default function TeachersPage() {
    const [activeTab, setActiveTab] = useState<'teachers' | 'role-types'>('teachers');

    // ── Öğretmenler ───────────────────────────────────────────
    const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);

    const [showCreate, setShowCreate] = useState(false);
    const [storeForm, setStoreForm] = useState<StoreForm>(emptyStore);
    const [saving, setSaving] = useState(false);

    const [editingTeacher, setEditingTeacher] = useState<TeacherProfile | null>(null);
    const [updateForm, setUpdateForm] = useState<UpdateForm>(emptyUpdate);

    const [assignTeacher, setAssignTeacher] = useState<TeacherProfile | null>(null);
    const [schools, setSchools] = useState<School[]>([]);
    const [assignedSchools, setAssignedSchools] = useState<{ id: number; name: string; is_active: boolean; role_type?: { id: number; name: string } | null }[]>([]);
    const [assignSchoolId, setAssignSchoolId] = useState('');
    const [assignRoleTypeId, setAssignRoleTypeId] = useState('');
    const [assigningSchool, setAssigningSchool] = useState(false);

    const [countries, setCountries] = useState<Country[]>([]);

    // ── Görev Türleri ─────────────────────────────────────────
    const [roleTypes, setRoleTypes] = useState<TeacherRoleType[]>([]);
    const [loadingRoleTypes, setLoadingRoleTypes] = useState(false);
    const [showCreateRole, setShowCreateRole] = useState(false);
    const [roleForm, setRoleForm] = useState<RoleTypeForm>(emptyRoleType);
    const [editingRole, setEditingRole] = useState<TeacherRoleType | null>(null);
    const [savingRole, setSavingRole] = useState(false);

    // ── Fetch ─────────────────────────────────────────────────
    const fetchTeachers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/teachers', { params: { page, search: search || undefined } });
            setTeachers(res.data?.data ?? []);
            setLastPage(res.data?.meta?.last_page ?? 1);
            setTotal(res.data?.meta?.total ?? 0);
        } catch { toast.error('Öğretmenler yüklenemedi.'); }
        finally { setLoading(false); }
    }, [page, search]);

    const fetchRoleTypes = useCallback(async () => {
        setLoadingRoleTypes(true);
        try {
            const res = await apiClient.get('/teacher-role-types');
            setRoleTypes(res.data?.data ?? []);
        } catch { toast.error('Görev türleri yüklenemedi.'); }
        finally { setLoadingRoleTypes(false); }
    }, []);

    const fetchSchools = useCallback(async () => {
        try {
            const res = await apiClient.get('/schools');
            setSchools(res.data?.data ?? []);
        } catch { /* sessiz */ }
    }, []);

    const fetchCountries = useCallback(async () => {
        try {
            const res = await apiClient.get('/parent/auth/countries');
            setCountries(res.data?.data ?? []);
        } catch { /* sessiz */ }
    }, []);

    useEffect(() => { fetchTeachers(); }, [fetchTeachers]);
    useEffect(() => { fetchRoleTypes(); }, [fetchRoleTypes]);
    useEffect(() => { fetchCountries(); }, [fetchCountries]);

    // ── Öğretmen CRUD ─────────────────────────────────────────
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!storeForm.name.trim() || !storeForm.surname.trim() || !storeForm.email.trim()) {
            toast.error('Ad, soyad ve e-posta zorunludur.');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...storeForm,
                experience_years: storeForm.experience_years ? Number(storeForm.experience_years) : undefined,
                password: storeForm.password || undefined,
                hire_date: storeForm.hire_date || undefined,
                whatsapp_number: storeForm.whatsapp_number || undefined,
                country_id: storeForm.country_id ? Number(storeForm.country_id) : undefined,
                identity_number: storeForm.identity_number || undefined,
                passport_number: storeForm.passport_number || undefined,
            };
            await apiClient.post('/teachers', payload);
            toast.success('Öğretmen oluşturuldu.');
            setShowCreate(false);
            setStoreForm(emptyStore);
            fetchTeachers();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? 'Hata oluştu.');
        } finally { setSaving(false); }
    };

    const openEdit = (t: TeacherProfile) => {
        setEditingTeacher(t);
        setUpdateForm({
            title: t.title ?? '', specialization: t.specialization ?? '', bio: t.bio ?? '',
            experience_years: t.experience_years ? String(t.experience_years) : '',
            employment_type: t.employment_type ?? 'full_time',
            hire_date: t.hire_date ?? '', phone: t.phone ?? '',
            phone_country_code: t.phone_country_code ?? '+90',
            whatsapp_number: t.whatsapp_number ?? '',
            whatsapp_country_code: t.whatsapp_country_code ?? '+90',
            country_id: t.nationality_country_id ? String(t.nationality_country_id) : '',
            identity_number: t.identity_number ?? '',
            passport_number: t.passport_number ?? '',
        });
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTeacher) { return; }
        setSaving(true);
        try {
            const payload = {
                ...updateForm,
                experience_years: updateForm.experience_years ? Number(updateForm.experience_years) : undefined,
                hire_date: updateForm.hire_date || undefined,
                whatsapp_number: updateForm.whatsapp_number || undefined,
                country_id: updateForm.country_id ? Number(updateForm.country_id) : null,
                identity_number: updateForm.identity_number || undefined,
                passport_number: updateForm.passport_number || undefined,
            };
            await apiClient.put(`/teachers/${editingTeacher.id}`, payload);
            toast.success('Öğretmen güncellendi.');
            setEditingTeacher(null);
            fetchTeachers();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? 'Hata oluştu.');
        } finally { setSaving(false); }
    };

    const handleDelete = async (t: TeacherProfile) => {
        const result = await Swal.fire({
            title: 'Öğretmeni Sil',
            text: `"${t.name}" silinecek. Bu işlem geri alınamaz.`,
            icon: 'warning', showCancelButton: true,
            confirmButtonText: 'Evet, Sil', cancelButtonText: 'İptal',
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) { return; }
        try {
            await apiClient.delete(`/teachers/${t.id}`);
            toast.success('Öğretmen silindi.');
            fetchTeachers();
        } catch { toast.error('Silme başarısız.'); }
    };

    // ── Okul Atama ────────────────────────────────────────────
    const openAssign = async (t: TeacherProfile) => {
        setAssignTeacher(t);
        setAssignSchoolId('');
        setAssignRoleTypeId('');
        fetchSchools();
        try {
            const res = await apiClient.get(`/teachers/${t.id}/schools`);
            setAssignedSchools(res.data?.data ?? []);
        } catch { setAssignedSchools([]); }
    };

    const handleAssignSchool = async () => {
        if (!assignTeacher || !assignSchoolId) { toast.error('Lütfen bir okul seçin.'); return; }
        setAssigningSchool(true);
        try {
            await apiClient.post(`/teachers/${assignTeacher.id}/schools`, {
                school_id: Number(assignSchoolId),
                teacher_role_type_id: assignRoleTypeId ? Number(assignRoleTypeId) : undefined,
            });
            toast.success('Öğretmen okula atandı.');
            const res = await apiClient.get(`/teachers/${assignTeacher.id}/schools`);
            setAssignedSchools(res.data?.data ?? []);
            setAssignSchoolId('');
            setAssignRoleTypeId('');
            fetchTeachers();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? 'Atama başarısız.');
        } finally { setAssigningSchool(false); }
    };

    const handleRemoveSchool = async (schoolId: number) => {
        if (!assignTeacher) { return; }
        try {
            await apiClient.delete(`/teachers/${assignTeacher.id}/schools/${schoolId}`);
            toast.success('Öğretmen okuldan çıkarıldı.');
            setAssignedSchools(prev => prev.filter(s => s.id !== schoolId));
            fetchTeachers();
        } catch { toast.error('İşlem başarısız.'); }
    };

    const availableSchools = schools.filter(s => !assignedSchools.some(a => a.id === s.id));

    // ── Görev Türü CRUD ───────────────────────────────────────
    const handleCreateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roleForm.name.trim()) { toast.error('Görev türü adı zorunludur.'); return; }
        setSavingRole(true);
        try {
            await apiClient.post('/teacher-role-types', {
                name: roleForm.name,
                sort_order: roleForm.sort_order ? Number(roleForm.sort_order) : 0,
            });
            toast.success('Görev türü oluşturuldu.');
            setShowCreateRole(false);
            setRoleForm(emptyRoleType);
            fetchRoleTypes();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? 'Hata oluştu.');
        } finally { setSavingRole(false); }
    };

    const openEditRole = (rt: TeacherRoleType) => {
        setEditingRole(rt);
        setRoleForm({ name: rt.name, sort_order: String(rt.sort_order ?? 0) });
    };

    const handleUpdateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRole) { return; }
        setSavingRole(true);
        try {
            await apiClient.put(`/teacher-role-types/${editingRole.id}`, {
                name: roleForm.name,
                sort_order: roleForm.sort_order ? Number(roleForm.sort_order) : 0,
            });
            toast.success('Görev türü güncellendi.');
            setEditingRole(null);
            fetchRoleTypes();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? 'Hata oluştu.');
        } finally { setSavingRole(false); }
    };

    const handleDeleteRole = async (rt: TeacherRoleType) => {
        const result = await Swal.fire({
            title: 'Görev Türünü Sil',
            text: `"${rt.name}" silinecek.`,
            icon: 'warning', showCancelButton: true,
            confirmButtonText: 'Evet, Sil', cancelButtonText: 'İptal',
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) { return; }
        try {
            await apiClient.delete(`/teacher-role-types/${rt.id}`);
            toast.success('Görev türü silindi.');
            fetchRoleTypes();
        } catch { toast.error('Silme başarısız.'); }
    };

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dark dark:text-white">Öğretmenler</h1>
                    <p className="mt-1 text-sm text-[#888ea8]">Tenant genelinde öğretmen ve görev türü yönetimi</p>
                </div>
                {activeTab === 'teachers' ? (
                    <button type="button" className="btn btn-primary gap-2" onClick={() => { setShowCreate(true); setStoreForm(emptyStore); }}>
                        <Plus className="h-4 w-4" />Yeni Öğretmen
                    </button>
                ) : (
                    <button type="button" className="btn btn-primary gap-2" onClick={() => { setShowCreateRole(true); setRoleForm(emptyRoleType); }}>
                        <Plus className="h-4 w-4" />Yeni Görev Türü
                    </button>
                )}
            </div>

            {/* Tab Başlıkları */}
            <div className="mb-4 flex border-b border-[#ebedf2] dark:border-[#1b2e4b]">
                <button
                    type="button"
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${activeTab === 'teachers' ? 'border-b-2 border-primary text-primary' : 'text-[#506690] hover:text-primary'}`}
                    onClick={() => setActiveTab('teachers')}
                >
                    <Users className="h-4 w-4" />Öğretmenler
                </button>
                <button
                    type="button"
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${activeTab === 'role-types' ? 'border-b-2 border-primary text-primary' : 'text-[#506690] hover:text-primary'}`}
                    onClick={() => setActiveTab('role-types')}
                >
                    <Tag className="h-4 w-4" />Görev Türleri
                </button>
            </div>

            {/* ── Öğretmenler Sekmesi ───────────────────────────── */}
            {activeTab === 'teachers' && (
                <div className="panel">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <input
                            type="text"
                            className="form-input w-full max-w-xs"
                            placeholder="İsim, e-posta ara..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                        />
                        {total > 0 && <span className="text-sm text-[#888ea8]">Toplam {total} öğretmen</span>}
                    </div>

                    {loading ? (
                        <div className="flex h-40 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                    ) : teachers.length === 0 ? (
                        <div className="flex h-40 flex-col items-center justify-center gap-2 text-[#888ea8]">
                            <Users className="h-10 w-10 opacity-40" />
                            <p>Henüz öğretmen eklenmemiş.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table-hover">
                                <thead>
                                    <tr>
                                        <th>Ad Soyad</th>
                                        <th>Unvan / Uzmanlık</th>
                                        <th>İstihdam</th>
                                        <th>Tecrübe</th>
                                        <th>Okullar</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teachers.map(t => (
                                        <tr key={t.id}>
                                            <td>
                                                <div>
                                                    <p className="font-semibold text-dark dark:text-white">{t.name}</p>
                                                    <p className="text-xs text-[#888ea8]">{t.email}</p>
                                                </div>
                                            </td>
                                            <td>
                                                <div>
                                                    {t.title && <p className="text-sm font-medium">{t.title}</p>}
                                                    {t.specialization && <p className="text-xs text-[#888ea8]">{t.specialization}</p>}
                                                </div>
                                            </td>
                                            <td>
                                                {t.employment_type && (
                                                    <span className={`badge ${EMPLOYMENT_BADGE[t.employment_type] ?? 'badge-outline-secondary'} text-xs`}>
                                                        {EMPLOYMENT_LABELS[t.employment_type] ?? t.employment_type}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {t.experience_years != null
                                                    ? <span className="text-sm">{t.experience_years} yıl</span>
                                                    : <span className="text-xs text-[#888ea8]">—</span>}
                                            </td>
                                            <td>
                                                <div className="flex flex-wrap gap-1">
                                                    {t.schools && t.schools.length > 0
                                                        ? t.schools.map(s => (
                                                            <div key={s.id} className="flex flex-col">
                                                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{s.name}</span>
                                                                {s.role_type_name && <span className="mt-0.5 text-center text-[10px] text-[#888ea8]">{s.role_type_name}</span>}
                                                            </div>
                                                        ))
                                                        : <span className="text-xs text-[#888ea8]">Atanmamış</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex gap-1">
                                                    <button type="button" title="Okul Ata" className="btn btn-sm btn-outline-info p-2" onClick={() => openAssign(t)}>
                                                        <Building2 className="h-4 w-4" />
                                                    </button>
                                                    <button type="button" title="Düzenle" className="btn btn-sm btn-outline-primary p-2" onClick={() => openEdit(t)}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button type="button" title="Sil" className="btn btn-sm btn-outline-danger p-2" onClick={() => handleDelete(t)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {lastPage > 1 && (
                        <div className="mt-4 flex justify-center gap-2">
                            <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹ Önceki</button>
                            <span className="flex items-center px-3 text-sm">{page} / {lastPage}</span>
                            <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page === lastPage} onClick={() => setPage(p => p + 1)}>Sonraki ›</button>
                        </div>
                    )}
                </div>
            )}

            {/* ── Görev Türleri Sekmesi ─────────────────────────── */}
            {activeTab === 'role-types' && (
                <div className="panel">
                    {loadingRoleTypes ? (
                        <div className="flex h-40 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                    ) : roleTypes.length === 0 ? (
                        <div className="flex h-40 flex-col items-center justify-center gap-2 text-[#888ea8]">
                            <Tag className="h-10 w-10 opacity-40" />
                            <p>Henüz görev türü tanımlanmamış.</p>
                            <p className="text-xs">Baş Öğretmen, Yardımcı Öğretmen vb. ekleyebilirsiniz.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table-hover">
                                <thead>
                                    <tr>
                                        <th>Görev Türü Adı</th>
                                        <th>Sıra</th>
                                        <th>Durum</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {roleTypes.map(rt => (
                                        <tr key={rt.id}>
                                            <td className="font-medium">{rt.name}</td>
                                            <td className="text-sm text-[#888ea8]">{rt.sort_order ?? 0}</td>
                                            <td>
                                                <span className={`badge ${rt.is_active ? 'badge-outline-success' : 'badge-outline-danger'} text-xs`}>
                                                    {rt.is_active ? 'Aktif' : 'Pasif'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex gap-1">
                                                    <button type="button" className="btn btn-sm btn-outline-primary p-2" onClick={() => openEditRole(rt)}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button type="button" className="btn btn-sm btn-outline-danger p-2" onClick={() => handleDeleteRole(rt)}>
                                                        <Trash2 className="h-4 w-4" />
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
            )}

            {/* ── Yeni Öğretmen Modal ───────────────────────────────── */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">Yeni Öğretmen</h2>
                            <button type="button" onClick={() => setShowCreate(false)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#888ea8]">Hesap Bilgileri</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Ad *</label>
                                    <input className="form-input" value={storeForm.name} onChange={e => setStoreForm(p => ({ ...p, name: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Soyad *</label>
                                    <input className="form-input" value={storeForm.surname} onChange={e => setStoreForm(p => ({ ...p, surname: e.target.value }))} />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">E-posta *</label>
                                <input type="email" className="form-input" value={storeForm.email} onChange={e => setStoreForm(p => ({ ...p, email: e.target.value }))} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Telefon</label>
                                <div className="flex gap-2">
                                    <select className="form-select w-36 shrink-0" value={storeForm.phone_country_code} onChange={e => setStoreForm(p => ({ ...p, phone_country_code: e.target.value }))}>
                                        {countries.map(c => <option key={c.id} value={c.phone_code}>{c.flag_emoji} {c.iso2} {c.phone_code}</option>)}
                                    </select>
                                    <input className="form-input flex-1" placeholder="5xx xxx xxxx" value={storeForm.phone} onChange={e => setStoreForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">WhatsApp <span className="text-xs text-[#888ea8]">(opsiyonel)</span></label>
                                <div className="flex gap-2">
                                    <select className="form-select w-36 shrink-0" value={storeForm.whatsapp_country_code} onChange={e => setStoreForm(p => ({ ...p, whatsapp_country_code: e.target.value }))}>
                                        {countries.map(c => <option key={c.id} value={c.phone_code}>{c.flag_emoji} {c.iso2} {c.phone_code}</option>)}
                                    </select>
                                    <input className="form-input flex-1" placeholder="5xx xxx xxxx" value={storeForm.whatsapp_number} onChange={e => setStoreForm(p => ({ ...p, whatsapp_number: e.target.value.replace(/\D/g, '').slice(0, 10) }))} />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Şifre <span className="text-xs text-[#888ea8]">(boş=otomatik)</span></label>
                                <input type="password" className="form-input" value={storeForm.password} onChange={e => setStoreForm(p => ({ ...p, password: e.target.value }))} />
                            </div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#888ea8]">Kimlik & Uyruk</p>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Uyruk <span className="text-xs text-[#888ea8]">(opsiyonel)</span></label>
                                <select className="form-select" value={storeForm.country_id} onChange={e => setStoreForm(p => ({ ...p, country_id: e.target.value }))}>
                                    <option value="">— Seçiniz —</option>
                                    {countries.map(c => <option key={c.id} value={c.id}>{c.flag_emoji} {c.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium">TC Kimlik No <span className="text-xs text-[#888ea8]">(opsiyonel)</span></label>
                                    <input className="form-input" maxLength={11} value={storeForm.identity_number} onChange={e => setStoreForm(p => ({ ...p, identity_number: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Pasaport No <span className="text-xs text-[#888ea8]">(opsiyonel)</span></label>
                                    <input className="form-input" maxLength={20} value={storeForm.passport_number} onChange={e => setStoreForm(p => ({ ...p, passport_number: e.target.value }))} />
                                </div>
                            </div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#888ea8]">Profil Bilgileri</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Unvan</label>
                                    <input className="form-input" placeholder="Dr., Uzm., vb." value={storeForm.title} onChange={e => setStoreForm(p => ({ ...p, title: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">İstihdam Türü</label>
                                    <select className="form-select" value={storeForm.employment_type} onChange={e => setStoreForm(p => ({ ...p, employment_type: e.target.value }))}>
                                        {Object.entries(EMPLOYMENT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Uzmanlık Alanı</label>
                                <input className="form-input" value={storeForm.specialization} onChange={e => setStoreForm(p => ({ ...p, specialization: e.target.value }))} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Tecrübe (yıl)</label>
                                    <input type="number" min={0} className="form-input" value={storeForm.experience_years} onChange={e => setStoreForm(p => ({ ...p, experience_years: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">İşe Başlama</label>
                                    <input type="date" className="form-input" value={storeForm.hire_date} onChange={e => setStoreForm(p => ({ ...p, hire_date: e.target.value }))} />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Biyografi</label>
                                <textarea className="form-input" rows={3} value={storeForm.bio} onChange={e => setStoreForm(p => ({ ...p, bio: e.target.value }))} />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
                                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowCreate(false)}>İptal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Düzenle Modal ─────────────────────────────────────── */}
            {editingTeacher && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">Öğretmen Düzenle — {editingTeacher.name}</h2>
                            <button type="button" onClick={() => setEditingTeacher(null)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium">Telefon</label>
                                <div className="flex gap-2">
                                    <select className="form-select w-36 shrink-0" value={updateForm.phone_country_code} onChange={e => setUpdateForm(p => ({ ...p, phone_country_code: e.target.value }))}>
                                        {countries.map(c => <option key={c.id} value={c.phone_code}>{c.flag_emoji} {c.iso2} {c.phone_code}</option>)}
                                    </select>
                                    <input className="form-input flex-1" placeholder="5xx xxx xxxx" value={updateForm.phone} onChange={e => setUpdateForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">WhatsApp <span className="text-xs text-[#888ea8]">(opsiyonel)</span></label>
                                <div className="flex gap-2">
                                    <select className="form-select w-36 shrink-0" value={updateForm.whatsapp_country_code} onChange={e => setUpdateForm(p => ({ ...p, whatsapp_country_code: e.target.value }))}>
                                        {countries.map(c => <option key={c.id} value={c.phone_code}>{c.flag_emoji} {c.iso2} {c.phone_code}</option>)}
                                    </select>
                                    <input className="form-input flex-1" placeholder="5xx xxx xxxx" value={updateForm.whatsapp_number} onChange={e => setUpdateForm(p => ({ ...p, whatsapp_number: e.target.value.replace(/\D/g, '').slice(0, 10) }))} />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Uyruk <span className="text-xs text-[#888ea8]">(opsiyonel)</span></label>
                                <select className="form-select" value={updateForm.country_id} onChange={e => setUpdateForm(p => ({ ...p, country_id: e.target.value }))}>
                                    <option value="">— Seçiniz —</option>
                                    {countries.map(c => <option key={c.id} value={c.id}>{c.flag_emoji} {c.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium">TC Kimlik No <span className="text-xs text-[#888ea8]">(opsiyonel)</span></label>
                                    <input className="form-input" maxLength={11} value={updateForm.identity_number} onChange={e => setUpdateForm(p => ({ ...p, identity_number: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Pasaport No <span className="text-xs text-[#888ea8]">(opsiyonel)</span></label>
                                    <input className="form-input" maxLength={20} value={updateForm.passport_number} onChange={e => setUpdateForm(p => ({ ...p, passport_number: e.target.value }))} />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Unvan</label>
                                <input className="form-input" placeholder="Dr., Uzm., vb." value={updateForm.title} onChange={e => setUpdateForm(p => ({ ...p, title: e.target.value }))} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium">İstihdam Türü</label>
                                    <select className="form-select" value={updateForm.employment_type} onChange={e => setUpdateForm(p => ({ ...p, employment_type: e.target.value }))}>
                                        {Object.entries(EMPLOYMENT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Tecrübe (yıl)</label>
                                    <input type="number" min={0} className="form-input" value={updateForm.experience_years} onChange={e => setUpdateForm(p => ({ ...p, experience_years: e.target.value }))} />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Uzmanlık Alanı</label>
                                <input className="form-input" value={updateForm.specialization} onChange={e => setUpdateForm(p => ({ ...p, specialization: e.target.value }))} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">İşe Başlama</label>
                                <input type="date" className="form-input" value={updateForm.hire_date} onChange={e => setUpdateForm(p => ({ ...p, hire_date: e.target.value }))} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Biyografi</label>
                                <textarea className="form-input" rows={3} value={updateForm.bio} onChange={e => setUpdateForm(p => ({ ...p, bio: e.target.value }))} />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
                                    {saving ? 'Kaydediliyor...' : 'Güncelle'}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setEditingTeacher(null)}>İptal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Okul Atama Modal ─────────────────────────────────── */}
            {assignTeacher && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">
                                Okul Atamaları — {assignTeacher.name}
                            </h2>
                            <button type="button" onClick={() => setAssignTeacher(null)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#888ea8]">Atanmış Okullar</p>
                            {assignedSchools.length === 0 ? (
                                <p className="text-sm text-[#888ea8]">Henüz okul atanmamış.</p>
                            ) : (
                                <div className="space-y-2">
                                    {assignedSchools.map(s => (
                                        <div key={s.id} className="flex items-center justify-between rounded border border-[#ebedf2] p-2 dark:border-[#1b2e4b]">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4 text-primary" />
                                                <div>
                                                    <span className="text-sm font-medium">{s.name}</span>
                                                    {s.role_type && <span className="ml-2 rounded-full bg-info/10 px-2 py-0.5 text-xs text-info">{s.role_type.name}</span>}
                                                </div>
                                            </div>
                                            <button type="button" className="btn btn-sm btn-outline-danger p-1" onClick={() => handleRemoveSchool(s.id)}>
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {availableSchools.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-[#888ea8]">Okul Ekle</p>
                                <select className="form-select w-full" value={assignSchoolId} onChange={e => setAssignSchoolId(e.target.value)}>
                                    <option value="">— Okul seçin —</option>
                                    {availableSchools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <select className="form-select w-full" value={assignRoleTypeId} onChange={e => setAssignRoleTypeId(e.target.value)}>
                                    <option value="">— Görev türü seçin (opsiyonel) —</option>
                                    {roleTypes.filter(rt => rt.is_active).map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                                </select>
                                <button type="button" className="btn btn-primary w-full" disabled={!assignSchoolId || assigningSchool} onClick={handleAssignSchool}>
                                    {assigningSchool ? 'Atanıyor...' : 'Okula Ata'}
                                </button>
                            </div>
                        )}

                        {availableSchools.length === 0 && assignedSchools.length > 0 && (
                            <p className="text-xs text-[#888ea8]">Tüm okullar atanmış durumda.</p>
                        )}

                        <div className="mt-4">
                            <button type="button" className="btn btn-outline-secondary w-full" onClick={() => setAssignTeacher(null)}>Kapat</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Görev Türü Oluştur Modal ──────────────────────────── */}
            {showCreateRole && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">Yeni Görev Türü</h2>
                            <button type="button" onClick={() => setShowCreateRole(false)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateRole} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium">Ad *</label>
                                <input className="form-input" placeholder="ör. Baş Öğretmen" value={roleForm.name} onChange={e => setRoleForm(p => ({ ...p, name: e.target.value }))} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Sıra</label>
                                <input type="number" min={0} className="form-input" value={roleForm.sort_order} onChange={e => setRoleForm(p => ({ ...p, sort_order: e.target.value }))} />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn btn-primary flex-1" disabled={savingRole}>
                                    {savingRole ? 'Kaydediliyor...' : 'Kaydet'}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowCreateRole(false)}>İptal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Görev Türü Düzenle Modal ──────────────────────────── */}
            {editingRole && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">Görev Türü Düzenle</h2>
                            <button type="button" onClick={() => setEditingRole(null)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateRole} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium">Ad *</label>
                                <input className="form-input" value={roleForm.name} onChange={e => setRoleForm(p => ({ ...p, name: e.target.value }))} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Sıra</label>
                                <input type="number" min={0} className="form-input" value={roleForm.sort_order} onChange={e => setRoleForm(p => ({ ...p, sort_order: e.target.value }))} />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn btn-primary flex-1" disabled={savingRole}>
                                    {savingRole ? 'Kaydediliyor...' : 'Güncelle'}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setEditingRole(null)}>İptal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
