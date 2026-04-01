'use client';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import apiClient from '@/lib/apiClient';
import { TeacherProfile, TeacherRoleType, School } from '@/types';
import { Eye, X, Users, Building2, BookOpen, Tag, Mail, UserCheck, UserX, UserMinus, Check, GraduationCap, Award, BookOpen as CourseIcon, Zap, FileText, Phone, Globe, Pencil } from 'lucide-react';

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

type TeacherWithMembership = TeacherProfile & {
    membership_id: number;
    membership_status: 'active' | 'inactive';
};

type JoinRequest = {
    id: number;
    teacher_profile_id: number;
    name: string;
    email: string;
    specialization: string | null;
    experience_years: number | null;
    sent_at: string;
};

type TeacherDetail = TeacherWithMembership & {
    bio: string | null;
    linkedin_url: string | null;
    website_url: string | null;
    educations: { id: number; institution: string; degree: string; field_of_study: string; start_date: string | null; end_date: string | null; is_current: boolean; country: { id: number; name: string } | null; description: string | null }[];
    certificates: { id: number; name: string; issuing_organization: string | null; issue_date: string | null; expiry_date: string | null; credential_url: string | null; description: string | null }[];
    courses: { id: number; title: string; type: string; provider: string | null; start_date: string | null; end_date: string | null; duration_hours: number | null; location: string | null; is_online: boolean; description: string | null }[];
    skills: { id: number; name: string; level: string; category: string; proficiency: number }[];
    blog_posts: { id: number; title: string; description: string | null; likes_count: number; comments_count: number; published_at: string | null; created_at: string | null }[];
};

type UpdateForm = {
    title: string; specialization: string; bio: string; experience_years: string;
    employment_type: string; hire_date: string;
    phone: string; phone_country_code: string;
    whatsapp_number: string; whatsapp_country_code: string;
    country_id: string; identity_number: string; passport_number: string;
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
    const [activeTab, setActiveTab] = useState<'teachers' | 'join-requests' | 'role-types'>('teachers');

    // ── Öğretmenler ───────────────────────────────────────────
    const [teachers, setTeachers] = useState<TeacherWithMembership[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);

    // Davet
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteNotes, setInviteNotes] = useState('');
    const [inviting, setInviting] = useState(false);

    const [editingTeacher, setEditingTeacher] = useState<TeacherWithMembership | null>(null);
    const [updateForm, setUpdateForm] = useState<UpdateForm>(emptyUpdate);
    const [saving, setSaving] = useState(false);

    const [assignTeacher, setAssignTeacher] = useState<TeacherWithMembership | null>(null);
    const [schools, setSchools] = useState<School[]>([]);
    const [assignedSchools, setAssignedSchools] = useState<{ id: number; name: string; is_active: boolean; role_type?: { id: number; name: string } | null }[]>([]);
    const [assignSchoolId, setAssignSchoolId] = useState('');
    const [assignRoleTypeId, setAssignRoleTypeId] = useState('');
    const [assigningSchool, setAssigningSchool] = useState(false);

    const [countries, setCountries] = useState<Country[]>([]);

    // ── Öğretmen Detay ────────────────────────────────────────
    const [viewingTeacher, setViewingTeacher] = useState<TeacherDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [detailTab, setDetailTab] = useState<'info' | 'education' | 'certificates' | 'courses' | 'skills' | 'blogs'>('info');

    // ── Katılma Talepleri ─────────────────────────────────────
    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [requestsFetched, setRequestsFetched] = useState(false);

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

    const fetchJoinRequests = useCallback(async () => {
        setLoadingRequests(true);
        try {
            const res = await apiClient.get('/teachers/join-requests');
            setJoinRequests(res.data?.data ?? []);
            setRequestsFetched(true);
        } catch { toast.error('Katılma talepleri yüklenemedi.'); }
        finally { setLoadingRequests(false); }
    }, []);

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

    useEffect(() => {
        if (activeTab === 'join-requests' && !requestsFetched) {
            fetchJoinRequests();
        }
    }, [activeTab, requestsFetched, fetchJoinRequests]);

    // ── Davet ─────────────────────────────────────────────────
    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim()) { toast.error('E-posta zorunludur.'); return; }
        setInviting(true);
        try {
            await apiClient.post('/teachers/invite', { email: inviteEmail.trim(), notes: inviteNotes || undefined });
            toast.success('Öğretmen davet edildi. Daveti kabul etmesi bekleniyor.');
            setShowInvite(false);
            setInviteEmail('');
            setInviteNotes('');
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? 'Davet gönderilemedi.');
        } finally { setInviting(false); }
    };

    // ── Öğretmen Detay Görüntüle ──────────────────────────────
    const openDetail = async (t: TeacherWithMembership) => {
        setDetailTab('info');
        setLoadingDetail(true);
        setViewingTeacher(null);
        // optimistic: show modal immediately, load data
        setViewingTeacher({ ...t, bio: null, linkedin_url: null, website_url: null, educations: [], certificates: [], courses: [], skills: [], blog_posts: [] } as TeacherDetail);
        try {
            const res = await apiClient.get(`/teachers/${t.id}`);
            setViewingTeacher(res.data?.data as TeacherDetail);
        } catch { toast.error('Öğretmen detayı yüklenemedi.'); }
        finally { setLoadingDetail(false); }
    };

    // ── Öğretmen Düzenle (DEVRE DIŞI — tenant düzenleyemez) ──
    const openEdit = (t: TeacherWithMembership) => {
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

    // ── Üyelik Yönetimi ───────────────────────────────────────
    const handleActivate = async (t: TeacherWithMembership) => {
        try {
            await apiClient.patch(`/teachers/${t.membership_id}/activate`);
            toast.success('Öğretmen aktif edildi.');
            fetchTeachers();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? 'İşlem başarısız.');
        }
    };

    const handleDeactivate = async (t: TeacherWithMembership) => {
        const result = await Swal.fire({
            title: 'Öğretmeni Pasifleştir',
            text: `"${t.name}" pasif yapılacak. Sisteme giriş yapamayacak.`,
            icon: 'warning', showCancelButton: true,
            confirmButtonText: 'Evet, Pasifleştir', cancelButtonText: 'İptal',
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) { return; }
        try {
            await apiClient.patch(`/teachers/${t.membership_id}/deactivate`);
            toast.success('Öğretmen pasif yapıldı.');
            fetchTeachers();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? 'İşlem başarısız.');
        }
    };

    const handleRemoveMembership = async (t: TeacherWithMembership) => {
        const result = await Swal.fire({
            title: 'Kurumdan Çıkar',
            text: `"${t.name}" kurumdan çıkarılacak. Profili sistemde korunacak.`,
            icon: 'warning', showCancelButton: true,
            confirmButtonText: 'Evet, Çıkar', cancelButtonText: 'İptal',
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) { return; }
        try {
            await apiClient.delete(`/teachers/${t.membership_id}/membership`);
            toast.success('Öğretmen kurumdan çıkarıldı.');
            fetchTeachers();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? 'İşlem başarısız.');
        }
    };

    // ── Okul Atama ────────────────────────────────────────────
    const openAssign = async (t: TeacherWithMembership) => {
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
            });
            toast.success('Öğretmen okula atandı.');
            const res = await apiClient.get(`/teachers/${assignTeacher.id}/schools`);
            setAssignedSchools(res.data?.data ?? []);
            setAssignSchoolId('');
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

    // ── Katılma Talepleri ─────────────────────────────────────
    const handleApproveRequest = async (req: JoinRequest) => {
        try {
            await apiClient.patch(`/teachers/join-requests/${req.id}/approve`);
            toast.success('Talep onaylandı. Öğretmen kurumunuza eklendi.');
            setJoinRequests(prev => prev.filter(r => r.id !== req.id));
            fetchTeachers();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? 'Onaylama başarısız.');
        }
    };

    const handleRejectRequest = async (req: JoinRequest) => {
        const result = await Swal.fire({
            title: 'Talebi Reddet',
            text: `"${req.name}" adlı öğretmenin katılma talebi reddedilecek.`,
            icon: 'warning', showCancelButton: true,
            confirmButtonText: 'Evet, Reddet', cancelButtonText: 'İptal',
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) { return; }
        try {
            await apiClient.patch(`/teachers/join-requests/${req.id}/reject`);
            toast.success('Talep reddedildi.');
            setJoinRequests(prev => prev.filter(r => r.id !== req.id));
        } catch { toast.error('Reddetme başarısız.'); }
    };

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
                {activeTab === 'teachers' && (
                    <button type="button" className="btn btn-primary gap-2" onClick={() => { setShowInvite(true); setInviteEmail(''); setInviteNotes(''); }}>
                        <Mail className="h-4 w-4" />Öğretmeni Davet Et
                    </button>
                )}
                {activeTab === 'role-types' && (
                    <button type="button" className="btn btn-primary gap-2" onClick={() => { setShowCreateRole(true); setRoleForm(emptyRoleType); }}>
                        <Tag className="h-4 w-4" />Yeni Görev Türü
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
                    {total > 0 && <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{total}</span>}
                </button>
                <button
                    type="button"
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${activeTab === 'join-requests' ? 'border-b-2 border-primary text-primary' : 'text-[#506690] hover:text-primary'}`}
                    onClick={() => setActiveTab('join-requests')}
                >
                    <UserCheck className="h-4 w-4" />Katılma Talepleri
                    {requestsFetched && joinRequests.length > 0 && (
                        <span className="ml-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs text-warning">{joinRequests.length}</span>
                    )}
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
                            <p className="text-xs">Öğretmenleri e-posta ile davet edin veya katılma taleplerini onaylayın.</p>
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
                                        <th>Durum</th>
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
                                                <span className={`badge text-xs ${t.membership_status === 'active' ? 'badge-outline-success' : 'badge-outline-danger'}`}>
                                                    {t.membership_status === 'active' ? 'Aktif' : 'Pasif'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex flex-wrap gap-1">
                                                    {t.schools && t.schools.length > 0
                                                        ? t.schools.map(s => (
                                                            <span key={s.id} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{s.name}</span>
                                                        ))
                                                        : <span className="text-xs text-[#888ea8]">Atanmamış</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex gap-1">
                                                    <button type="button" title="Görüntüle" className="btn btn-sm btn-outline-primary p-2" onClick={() => openDetail(t)}>
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button type="button" title="Okul Ata" className="btn btn-sm btn-outline-info p-2" onClick={() => openAssign(t)}>
                                                        <Building2 className="h-4 w-4" />
                                                    </button>
                                                    {t.membership_status === 'inactive' ? (
                                                        <button type="button" title="Aktif Et" className="btn btn-sm btn-outline-success p-2" onClick={() => handleActivate(t)}>
                                                            <UserCheck className="h-4 w-4" />
                                                        </button>
                                                    ) : (
                                                        <button type="button" title="Pasifleştir" className="btn btn-sm btn-outline-warning p-2" onClick={() => handleDeactivate(t)}>
                                                            <UserX className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    <button type="button" title="Kurumdan Çıkar" className="btn btn-sm btn-outline-danger p-2" onClick={() => handleRemoveMembership(t)}>
                                                        <UserMinus className="h-4 w-4" />
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

            {/* ── Katılma Talepleri Sekmesi ─────────────────────── */}
            {activeTab === 'join-requests' && (
                <div className="panel">
                    {loadingRequests ? (
                        <div className="flex h-40 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                    ) : joinRequests.length === 0 ? (
                        <div className="flex h-40 flex-col items-center justify-center gap-2 text-[#888ea8]">
                            <UserCheck className="h-10 w-10 opacity-40" />
                            <p>Bekleyen katılma talebi yok.</p>
                            <p className="text-xs">Öğretmenler kurumunuzun davet kodunu kullanarak katılma talebinde bulunabilir.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table-hover">
                                <thead>
                                    <tr>
                                        <th>Ad Soyad</th>
                                        <th>Uzmanlık</th>
                                        <th>Tecrübe</th>
                                        <th>Talep Tarihi</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {joinRequests.map(req => (
                                        <tr key={req.id}>
                                            <td>
                                                <div>
                                                    <p className="font-semibold text-dark dark:text-white">{req.name}</p>
                                                    <p className="text-xs text-[#888ea8]">{req.email}</p>
                                                </div>
                                            </td>
                                            <td className="text-sm">{req.specialization ?? '—'}</td>
                                            <td className="text-sm">{req.experience_years != null ? `${req.experience_years} yıl` : '—'}</td>
                                            <td className="text-sm text-[#888ea8]">{new Date(req.sent_at).toLocaleDateString('tr-TR')}</td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-success gap-1"
                                                        onClick={() => handleApproveRequest(req)}
                                                    >
                                                        <Check className="h-4 w-4" />Onayla
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger gap-1"
                                                        onClick={() => handleRejectRequest(req)}
                                                    >
                                                        <X className="h-4 w-4" />Reddet
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
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button type="button" className="btn btn-sm btn-outline-danger p-2" onClick={() => handleDeleteRole(rt)}>
                                                        <X className="h-4 w-4" />
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

            {/* ── Davet Modal ───────────────────────────────────────── */}
            {showInvite && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">Öğretmeni Davet Et</h2>
                            <button type="button" onClick={() => setShowInvite(false)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <p className="mb-4 text-sm text-[#888ea8]">
                            Sisteme kayıtlı öğretmenin e-posta adresini girin. Öğretmen daveti kabul ettikten sonra kurumunuza eklenecektir.
                        </p>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium">E-posta *</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="ogretmen@mail.com"
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Not <span className="text-xs text-[#888ea8]">(opsiyonel)</span></label>
                                <textarea
                                    className="form-input"
                                    rows={3}
                                    placeholder="Öğretmene iletilecek not..."
                                    value={inviteNotes}
                                    onChange={e => setInviteNotes(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn btn-primary flex-1" disabled={inviting}>
                                    {inviting ? 'Gönderiliyor...' : 'Davet Gönder'}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowInvite(false)}>İptal</button>
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

            {/* ── Öğretmen Detay Modal ──────────────────────────────── */}
            {viewingTeacher && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10">
                    <div className="w-full max-w-3xl rounded-lg bg-white dark:bg-[#0e1726]">
                        {/* Header */}
                        <div className="flex items-start justify-between border-b border-[#ebedf2] p-5 dark:border-[#1b2e4b]">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                                    {viewingTeacher.name?.charAt(0)?.toUpperCase() ?? '?'}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-dark dark:text-white">{viewingTeacher.name}</h2>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                        {viewingTeacher.title && <span className="text-sm text-[#888ea8]">{viewingTeacher.title}</span>}
                                        {viewingTeacher.specialization && <span className="text-xs text-[#888ea8]">· {viewingTeacher.specialization}</span>}
                                        <span className={`badge text-xs ${viewingTeacher.membership_status === 'active' ? 'badge-outline-success' : 'badge-outline-danger'}`}>
                                            {viewingTeacher.membership_status === 'active' ? 'Aktif' : 'Pasif'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button type="button" onClick={() => setViewingTeacher(null)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Sekmeler */}
                        <div className="flex overflow-x-auto border-b border-[#ebedf2] dark:border-[#1b2e4b]">
                            {([
                                { key: 'info', icon: <Phone className="h-4 w-4" />, label: 'İletişim & Genel' },
                                { key: 'education', icon: <GraduationCap className="h-4 w-4" />, label: 'Eğitim' },
                                { key: 'certificates', icon: <Award className="h-4 w-4" />, label: 'Sertifikalar' },
                                { key: 'courses', icon: <CourseIcon className="h-4 w-4" />, label: 'Kurslar & Seminerler' },
                                { key: 'skills', icon: <Zap className="h-4 w-4" />, label: 'Beceriler' },
                                { key: 'blogs', icon: <FileText className="h-4 w-4" />, label: 'Blog Yazıları' },
                            ] as { key: typeof detailTab; icon: React.ReactNode; label: string }[]).map(tab => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setDetailTab(tab.key)}
                                    className={`flex shrink-0 items-center gap-1.5 px-4 py-3 text-xs font-medium transition-colors ${detailTab === tab.key ? 'border-b-2 border-primary text-primary' : 'text-[#506690] hover:text-primary'}`}
                                >
                                    {tab.icon}{tab.label}
                                </button>
                            ))}
                        </div>

                        {/* İçerik */}
                        <div className="p-5">
                            {loadingDetail && (
                                <div className="flex h-40 items-center justify-center">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                </div>
                            )}

                            {!loadingDetail && detailTab === 'info' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <InfoRow icon={<Phone className="h-4 w-4" />} label="E-posta" value={viewingTeacher.email} />
                                        <InfoRow icon={<Phone className="h-4 w-4" />} label="Telefon" value={viewingTeacher.phone ? `${viewingTeacher.phone_country_code ?? ''} ${viewingTeacher.phone}`.trim() : null} />
                                        <InfoRow icon={<Phone className="h-4 w-4" />} label="WhatsApp" value={viewingTeacher.whatsapp_number ? `${viewingTeacher.whatsapp_country_code ?? ''} ${viewingTeacher.whatsapp_number}`.trim() : null} />
                                        <InfoRow icon={<GraduationCap className="h-4 w-4" />} label="Tecrübe" value={viewingTeacher.experience_years != null ? `${viewingTeacher.experience_years} yıl` : null} />
                                        <InfoRow icon={<Building2 className="h-4 w-4" />} label="İstihdam" value={EMPLOYMENT_LABELS[viewingTeacher.employment_type ?? ''] ?? viewingTeacher.employment_type} />
                                        <InfoRow icon={<Building2 className="h-4 w-4" />} label="İşe Başlama" value={viewingTeacher.hire_date ? new Date(viewingTeacher.hire_date).toLocaleDateString('tr-TR') : null} />
                                        {viewingTeacher.linkedin_url && <InfoRow icon={<Globe className="h-4 w-4" />} label="LinkedIn" value={viewingTeacher.linkedin_url} />}
                                        {viewingTeacher.website_url && <InfoRow icon={<Globe className="h-4 w-4" />} label="Website" value={viewingTeacher.website_url} />}
                                    </div>
                                    {viewingTeacher.bio && (
                                        <div className="rounded border border-[#ebedf2] p-3 dark:border-[#1b2e4b]">
                                            <p className="mb-1 text-xs font-semibold text-[#888ea8]">Biyografi</p>
                                            <p className="text-sm text-dark dark:text-white-light">{viewingTeacher.bio}</p>
                                        </div>
                                    )}
                                    {viewingTeacher.schools && viewingTeacher.schools.length > 0 && (
                                        <div>
                                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#888ea8]">Atanmış Okullar</p>
                                            <div className="flex flex-wrap gap-2">
                                                {viewingTeacher.schools.map(s => (
                                                    <span key={s.id} className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">{s.name}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!loadingDetail && detailTab === 'education' && (
                                <div className="space-y-3">
                                    {viewingTeacher.educations.length === 0 ? (
                                        <EmptyState icon={<GraduationCap />} text="Eğitim bilgisi girilmemiş." />
                                    ) : viewingTeacher.educations.map(e => (
                                        <div key={e.id} className="rounded border border-[#ebedf2] p-3 dark:border-[#1b2e4b]">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-semibold text-dark dark:text-white">{e.institution}</p>
                                                    <p className="text-sm">{e.degree} {e.field_of_study && `— ${e.field_of_study}`}</p>
                                                </div>
                                                <span className="text-xs text-[#888ea8] whitespace-nowrap">
                                                    {e.start_date ? new Date(e.start_date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' }) : '?'}
                                                    {' — '}
                                                    {e.is_current ? 'Devam Ediyor' : e.end_date ? new Date(e.end_date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' }) : '?'}
                                                </span>
                                            </div>
                                            {e.country && <p className="mt-1 text-xs text-[#888ea8]">{e.country.name}</p>}
                                            {e.description && <p className="mt-2 text-xs text-[#888ea8]">{e.description}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!loadingDetail && detailTab === 'certificates' && (
                                <div className="space-y-3">
                                    {viewingTeacher.certificates.length === 0 ? (
                                        <EmptyState icon={<Award />} text="Onaylı sertifika bulunmuyor." />
                                    ) : viewingTeacher.certificates.map(c => (
                                        <div key={c.id} className="rounded border border-[#ebedf2] p-3 dark:border-[#1b2e4b]">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-semibold text-dark dark:text-white">{c.name}</p>
                                                    {c.issuing_organization && <p className="text-sm text-[#888ea8]">{c.issuing_organization}</p>}
                                                </div>
                                                <span className="text-xs text-[#888ea8] whitespace-nowrap">
                                                    {c.issue_date ? new Date(c.issue_date).toLocaleDateString('tr-TR') : '—'}
                                                    {c.expiry_date && ` — ${new Date(c.expiry_date).toLocaleDateString('tr-TR')}`}
                                                </span>
                                            </div>
                                            {c.credential_url && (
                                                <a href={c.credential_url} target="_blank" rel="noreferrer" className="mt-1 text-xs text-primary hover:underline">Belgeyi Görüntüle →</a>
                                            )}
                                            {c.description && <p className="mt-2 text-xs text-[#888ea8]">{c.description}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!loadingDetail && detailTab === 'courses' && (
                                <div className="space-y-3">
                                    {viewingTeacher.courses.length === 0 ? (
                                        <EmptyState icon={<CourseIcon />} text="Onaylı kurs veya seminer bulunmuyor." />
                                    ) : viewingTeacher.courses.map(c => (
                                        <div key={c.id} className="rounded border border-[#ebedf2] p-3 dark:border-[#1b2e4b]">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-semibold text-dark dark:text-white">{c.title}</p>
                                                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                                        <span className="badge badge-outline-primary text-xs">{COURSE_TYPE_LABELS[c.type] ?? c.type}</span>
                                                        {c.provider && <span className="text-xs text-[#888ea8]">{c.provider}</span>}
                                                        {c.is_online && <span className="badge badge-outline-info text-xs">Online</span>}
                                                        {c.duration_hours && <span className="text-xs text-[#888ea8]">{c.duration_hours} saat</span>}
                                                    </div>
                                                </div>
                                                <span className="text-xs text-[#888ea8] whitespace-nowrap">
                                                    {c.start_date ? new Date(c.start_date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' }) : '?'}
                                                    {c.end_date && ` — ${new Date(c.end_date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' })}`}
                                                </span>
                                            </div>
                                            {c.location && <p className="mt-1 text-xs text-[#888ea8]">📍 {c.location}</p>}
                                            {c.description && <p className="mt-2 text-xs text-[#888ea8]">{c.description}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!loadingDetail && detailTab === 'skills' && (
                                <div>
                                    {viewingTeacher.skills.length === 0 ? (
                                        <EmptyState icon={<Zap />} text="Beceri bilgisi girilmemiş." />
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {viewingTeacher.skills.map(s => (
                                                <div key={s.id} className="flex items-center gap-1.5 rounded-full border border-[#ebedf2] px-3 py-1.5 dark:border-[#1b2e4b]">
                                                    <span className="text-sm font-medium text-dark dark:text-white">{s.name}</span>
                                                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${SKILL_LEVEL_BADGE[s.level] ?? 'bg-gray-100 text-gray-600'}`}>
                                                        {SKILL_LEVEL_LABELS[s.level] ?? s.level}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {!loadingDetail && detailTab === 'blogs' && (
                                <div className="space-y-3">
                                    {viewingTeacher.blog_posts.length === 0 ? (
                                        <EmptyState icon={<FileText />} text="Henüz blog yazısı yok." />
                                    ) : viewingTeacher.blog_posts.map(p => (
                                        <div key={p.id} className="rounded border border-[#ebedf2] p-3 dark:border-[#1b2e4b]">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-semibold text-dark dark:text-white">{p.title}</p>
                                                <span className="text-xs text-[#888ea8] whitespace-nowrap">{p.published_at ? new Date(p.published_at).toLocaleDateString('tr-TR') : p.created_at ? new Date(p.created_at).toLocaleDateString('tr-TR') : '—'}</span>
                                            </div>
                                            {p.description && <p className="mt-1 line-clamp-2 text-xs text-[#888ea8]">{p.description}</p>}
                                            <div className="mt-2 flex gap-4 text-xs text-[#888ea8]">
                                                <span>❤ {p.likes_count}</span>
                                                <span>💬 {p.comments_count}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="border-t border-[#ebedf2] p-4 dark:border-[#1b2e4b]">
                            <button type="button" className="btn btn-outline-secondary w-full" onClick={() => setViewingTeacher(null)}>Kapat</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Yardımcı Bileşenler ───────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
    if (!value) { return null; }
    return (
        <div className="flex items-start gap-2">
            <span className="mt-0.5 text-primary">{icon}</span>
            <div>
                <p className="text-xs text-[#888ea8]">{label}</p>
                <p className="text-sm font-medium text-dark dark:text-white">{value}</p>
            </div>
        </div>
    );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-[#888ea8]">
            <span className="opacity-40 [&>svg]:h-10 [&>svg]:w-10">{icon}</span>
            <p className="text-sm">{text}</p>
        </div>
    );
}

const COURSE_TYPE_LABELS: Record<string, string> = {
    course: 'Kurs', seminar: 'Seminer', workshop: 'Atölye', conference: 'Konferans',
    training: 'Eğitim', webinar: 'Webinar', other: 'Diğer',
};

const SKILL_LEVEL_LABELS: Record<string, string> = {
    beginner: 'Başlangıç', intermediate: 'Orta', advanced: 'İleri', expert: 'Uzman',
};

const SKILL_LEVEL_BADGE: Record<string, string> = {
    beginner: 'bg-gray-100 text-gray-600',
    intermediate: 'bg-blue-50 text-blue-600',
    advanced: 'bg-green-50 text-green-600',
    expert: 'bg-purple-50 text-purple-600',
};
