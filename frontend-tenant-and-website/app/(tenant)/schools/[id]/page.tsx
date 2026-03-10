'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import apiClient from '@/lib/apiClient';
import { School, SchoolClass, Child, Teacher, AcademicYear, SchoolTeacher, TeacherRoleType, TeacherProfile, EnrollmentRequest, SchoolParent } from '@/types';
import { ArrowLeft, Plus, Trash2, Edit2, Users, BookOpen, X, UserPlus, ToggleLeft, ToggleRight, GraduationCap, Copy, RefreshCw, CheckCircle, XCircle, Clock, UserCheck, ChevronDown, ChevronRight } from 'lucide-react';

type ClassForm = { name: string; description: string; age_min: string; age_max: string; capacity: string; color: string; academic_year_id: string };
const emptyClassForm: ClassForm = { name: '', description: '', age_min: '', age_max: '', capacity: '20', color: '', academic_year_id: '' };

export default function SchoolDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [school, setSchool] = useState<School | null>(null);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [children, setChildren] = useState<Child[]>([]);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'classes' | 'children' | 'teachers' | 'requests' | 'parents'>('classes');

    // School-level teacher management
    const [schoolLevelTeachers, setSchoolLevelTeachers] = useState<SchoolTeacher[]>([]);
    const [loadingSchoolTeachers, setLoadingSchoolTeachers] = useState(false);
    const [teachersFetched, setTeachersFetched] = useState(false);
    const [showSchoolTeacherModal, setShowSchoolTeacherModal] = useState(false);
    const [allTenantTeachers, setAllTenantTeachers] = useState<Pick<TeacherProfile, 'id' | 'name'>[]>([]);
    const [roleTypes, setRoleTypes] = useState<TeacherRoleType[]>([]);
    const [assignTeacherProfileId, setAssignTeacherProfileId] = useState('');
    const [assignRoleTypeId, setAssignRoleTypeId] = useState('');
    const [assignEmploymentType, setAssignEmploymentType] = useState('full_time');
    const [savingSchoolTeacher, setSavingSchoolTeacher] = useState(false);

    // Enrollment requests
    const [enrollmentRequests, setEnrollmentRequests] = useState<EnrollmentRequest[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [requestsFetched, setRequestsFetched] = useState(false);
    const [requestsFilter, setRequestsFilter] = useState<'' | 'pending' | 'approved' | 'rejected'>('pending');
    const [requestsMeta, setRequestsMeta] = useState({ current_page: 1, last_page: 1 });

    // Reject modal
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [savingReject, setSavingReject] = useState(false);

    // Parents
    const [parents, setParents] = useState<SchoolParent[]>([]);
    const [loadingParents, setLoadingParents] = useState(false);
    const [parentsFetched, setParentsFetched] = useState(false);
    const [expandedParent, setExpandedParent] = useState<number | null>(null);

    // Invite info
    const [inviteInfo, setInviteInfo] = useState<{ registration_code: string; invite_token: string } | null>(null);
    const [regeneratingInvite, setRegeneratingInvite] = useState(false);

    // Class CRUD
    const [showClassModal, setShowClassModal] = useState(false);
    const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
    const [classForm, setClassForm] = useState<ClassForm>(emptyClassForm);
    const [savingClass, setSavingClass] = useState(false);

    // Teacher assignment
    const [showTeacherModal, setShowTeacherModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
    const [classTeachers, setClassTeachers] = useState<Teacher[]>([]);
    const [schoolTeachers, setSchoolTeachers] = useState<Teacher[]>([]);
    const [assigningTeacher, setAssigningTeacher] = useState(false);
    const [selectedTeacherId, setSelectedTeacherId] = useState('');
    const [teacherRole, setTeacherRole] = useState('assistant_teacher');

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [schoolRes, classesRes, childrenRes, yearsRes] = await Promise.all([
                apiClient.get(`/schools/${id}`),
                apiClient.get(`/schools/${id}/classes`).catch(() => ({ data: { data: [] } })),
                apiClient.get(`/schools/${id}/children`).catch(() => ({ data: { data: [] } })),
                apiClient.get('/academic-years', { params: { school_id: id } }).catch(() => ({ data: { data: [] } })),
            ]);
            if (schoolRes.data?.data) setSchool(schoolRes.data.data);
            if (classesRes.data?.data) setClasses(classesRes.data.data);
            if (childrenRes.data?.data) setChildren(childrenRes.data.data);
            if (yearsRes.data?.data) setAcademicYears(yearsRes.data.data);
        } catch {
            toast.error('Okul bilgileri yüklenemedi.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { loadData(); }, [loadData]);

    const fetchSchoolLevelTeachers = useCallback(async () => {
        setLoadingSchoolTeachers(true);
        try {
            const res = await apiClient.get(`/schools/${id}/teachers`, { params: { detailed: 1 } });
            setSchoolLevelTeachers(res.data?.data ?? []);
            setTeachersFetched(true);
        } catch {
            toast.error('Öğretmenler yüklenemedi.');
        } finally {
            setLoadingSchoolTeachers(false);
        }
    }, [id]);

    const openSchoolTeacherModal = async () => {
        setAssignTeacherProfileId('');
        setAssignRoleTypeId('');
        setAssignEmploymentType('full_time');
        try {
            const [teachersRes, roleTypesRes] = await Promise.all([
                apiClient.get('/teachers', { params: { per_page: 100 } }),
                apiClient.get('/teacher-role-types'),
            ]);
            const all: Pick<TeacherProfile, 'id' | 'name'>[] = teachersRes.data?.data ?? [];
            const assignedIds = new Set(schoolLevelTeachers.map(t => t.id));
            setAllTenantTeachers(all.filter(t => !assignedIds.has(t.id)));
            setRoleTypes(roleTypesRes.data?.data ?? []);
        } catch {
            toast.error('Veriler yüklenemedi.');
        }
        setShowSchoolTeacherModal(true);
    };

    const handleAssignTeacherToSchool = async () => {
        if (!assignTeacherProfileId) return;
        setSavingSchoolTeacher(true);
        try {
            await apiClient.post(`/schools/${id}/teachers`, {
                teacher_profile_id: Number(assignTeacherProfileId),
                teacher_role_type_id: assignRoleTypeId ? Number(assignRoleTypeId) : undefined,
                employment_type: assignEmploymentType,
            });
            toast.success('Öğretmen okula atandı.');
            setShowSchoolTeacherModal(false);
            fetchSchoolLevelTeachers();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? 'Atama başarısız.');
        } finally {
            setSavingSchoolTeacher(false);
        }
    };

    const handleRemoveTeacherFromSchool = async (teacher: SchoolTeacher) => {
        const result = await Swal.fire({
            title: 'Öğretmeni Çıkar',
            text: `"${teacher.name}" adlı öğretmeni okuldan çıkarmak istediğinize emin misiniz?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Evet, Çıkar',
            cancelButtonText: 'İptal',
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.delete(`/schools/${id}/teachers/${teacher.id}`);
            toast.success('Öğretmen okuldan çıkarıldı.');
            fetchSchoolLevelTeachers();
        } catch {
            toast.error('İşlem başarısız.');
        }
    };

    const fetchEnrollmentRequests = useCallback(async (status?: string, page = 1) => {
        setLoadingRequests(true);
        try {
            const res = await apiClient.get(`/schools/${id}/enrollment-requests`, {
                params: { status: status || undefined, page },
            });
            setEnrollmentRequests(res.data?.data ?? []);
            setRequestsMeta(res.data?.meta ?? { current_page: 1, last_page: 1 });
            setRequestsFetched(true);
        } catch {
            toast.error('Kayıt talepleri yüklenemedi.');
        } finally {
            setLoadingRequests(false);
        }
    }, [id]);

    const fetchParents = useCallback(async () => {
        setLoadingParents(true);
        try {
            const res = await apiClient.get(`/schools/${id}/parents`);
            setParents(res.data?.data ?? []);
            setParentsFetched(true);
        } catch {
            toast.error('Veliler yüklenemedi.');
        } finally {
            setLoadingParents(false);
        }
    }, [id]);

    const fetchInviteInfo = useCallback(async () => {
        try {
            const res = await apiClient.get(`/schools/${id}/invite-info`);
            setInviteInfo(res.data?.data ?? null);
        } catch { /* sessiz */ }
    }, [id]);

    useEffect(() => { fetchInviteInfo(); }, [fetchInviteInfo]);

    const handleTabChange = (tab: typeof activeTab) => {
        setActiveTab(tab);
        if (tab === 'teachers' && !teachersFetched && !loadingSchoolTeachers) {
            fetchSchoolLevelTeachers();
        }
        if (tab === 'requests' && !requestsFetched && !loadingRequests) {
            fetchEnrollmentRequests(requestsFilter);
        }
        if (tab === 'parents' && !parentsFetched && !loadingParents) {
            fetchParents();
        }
    };

    const handleRequestsFilterChange = (f: '' | 'pending' | 'approved' | 'rejected') => {
        setRequestsFilter(f);
        fetchEnrollmentRequests(f);
    };

    const handleApprove = async (requestId: number) => {
        const result = await Swal.fire({
            title: 'Talebi Onayla',
            text: 'Bu kayıt talebini onaylamak istediğinize emin misiniz? Veli için hesap oluşturulacak.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Evet, Onayla',
            cancelButtonText: 'İptal',
            confirmButtonColor: '#00ab55',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.patch(`/schools/${id}/enrollment-requests/${requestId}/approve`);
            toast.success('Talep onaylandı. Veli hesabı oluşturuldu.');
            fetchEnrollmentRequests(requestsFilter);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? 'Onaylama başarısız.');
        }
    };

    const openRejectModal = (requestId: number) => {
        setRejectTargetId(requestId);
        setRejectionReason('');
        setShowRejectModal(true);
    };

    const handleRejectSubmit = async () => {
        if (!rejectTargetId || !rejectionReason.trim()) return;
        setSavingReject(true);
        try {
            await apiClient.patch(`/schools/${id}/enrollment-requests/${rejectTargetId}/reject`, {
                rejection_reason: rejectionReason,
            });
            toast.success('Talep reddedildi.');
            setShowRejectModal(false);
            fetchEnrollmentRequests(requestsFilter);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? 'Red işlemi başarısız.');
        } finally {
            setSavingReject(false);
        }
    };

    const handleRegenerateInvite = async () => {
        const result = await Swal.fire({
            title: 'Davet Linkini Yenile',
            text: 'Eski davet linki geçersiz olacak. Devam etmek istiyor musunuz?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Evet, Yenile',
            cancelButtonText: 'İptal',
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) return;
        setRegeneratingInvite(true);
        try {
            const res = await apiClient.post(`/schools/${id}/invite/regenerate`);
            setInviteInfo(res.data?.data ?? null);
            toast.success('Davet linki yenilendi.');
        } catch {
            toast.error('Yenileme başarısız.');
        } finally {
            setRegeneratingInvite(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text).then(() => toast.success(`${label} kopyalandı.`));
    };

    // ── Sınıf CRUD ──────────────────────────────────────────────
    const openCreateClass = () => {
        setEditingClass(null);
        const active = academicYears.find(y => y.is_active);
        setClassForm({
            ...emptyClassForm,
            academic_year_id: active ? String(active.id) : (academicYears[0] ? String(academicYears[0].id) : ''),
        });
        setShowClassModal(true);
    };

    const openEditClass = (cls: SchoolClass) => {
        setEditingClass(cls);
        setClassForm({
            name: cls.name, description: cls.description ?? '',
            age_min: cls.age_min != null ? String(cls.age_min) : '',
            age_max: cls.age_max != null ? String(cls.age_max) : '',
            capacity: String(cls.capacity ?? 20), color: cls.color ?? '',
            academic_year_id: cls.academic_year_id ? String(cls.academic_year_id) : '',
        });
        setShowClassModal(true);
    };

    const handleToggleClassStatus = async (cls: SchoolClass) => {
        const action = cls.is_active !== false ? 'pasif' : 'aktif';
        const result = await Swal.fire({
            title: `Sınıfı ${action === 'aktif' ? 'Aktif' : 'Pasif'} Yap`,
            text: `"${cls.name}" sınıfı ${action} yapılacak. Devam?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Evet',
            cancelButtonText: 'İptal',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.patch(`/schools/${id}/classes/${cls.id}/toggle-status`);
            toast.success(`Sınıf ${action} yapıldı.`);
            loadData();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? 'Durum değiştirilemedi.');
        }
    };

    const handleClassSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!classForm.name.trim()) { toast.error('Sınıf adı zorunludur.'); return; }
        setSavingClass(true);
        const payload = {
            name: classForm.name,
            description: classForm.description || undefined,
            age_min: classForm.age_min !== '' ? Number(classForm.age_min) : undefined,
            age_max: classForm.age_max !== '' ? Number(classForm.age_max) : undefined,
            capacity: Number(classForm.capacity),
            color: classForm.color || undefined,
            academic_year_id: classForm.academic_year_id ? Number(classForm.academic_year_id) : undefined,
        };
        try {
            if (editingClass) {
                await apiClient.put(`/schools/${id}/classes/${editingClass.id}`, payload);
                toast.success('Sınıf güncellendi.');
            } else {
                await apiClient.post(`/schools/${id}/classes`, payload);
                toast.success('Sınıf oluşturuldu.');
            }
            setShowClassModal(false);
            loadData();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? 'Hata oluştu.');
        } finally {
            setSavingClass(false);
        }
    };

    const handleDeleteClass = async (cls: SchoolClass) => {
        const result = await Swal.fire({
            title: 'Sınıfı Sil',
            text: `"${cls.name}" sınıfını silmek istediğinize emin misiniz?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Evet, Sil',
            cancelButtonText: 'İptal',
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.delete(`/schools/${id}/classes/${cls.id}`);
            toast.success('Sınıf silindi.');
            loadData();
        } catch {
            toast.error('Silme başarısız.');
        }
    };

    // ── Öğretmen Atama ──────────────────────────────────────────
    const openTeacherModal = async (cls: SchoolClass) => {
        setSelectedClass(cls);
        setSelectedTeacherId('');
        setTeacherRole('assistant_teacher');
        try {
            const [teachersRes, schoolTeachersRes] = await Promise.all([
                apiClient.get(`/schools/${id}/classes/${cls.id}/teachers`).catch(() => ({ data: { data: [] } })),
                apiClient.get(`/schools/${id}/teachers`).catch(() => ({ data: { data: [] } })),
            ]);
            setClassTeachers(teachersRes.data?.data ?? []);
            setSchoolTeachers(schoolTeachersRes.data?.data ?? []);
        } catch {
            toast.error('Öğretmenler yüklenemedi.');
        }
        setShowTeacherModal(true);
    };

    const handleAssignTeacher = async () => {
        if (!selectedTeacherId || !selectedClass) return;
        setAssigningTeacher(true);
        try {
            await apiClient.post(`/schools/${id}/classes/${selectedClass.id}/teachers`, {
                teacher_profile_id: Number(selectedTeacherId),
                role: teacherRole,
            });
            toast.success('Öğretmen atandı.');
            const res = await apiClient.get(`/schools/${id}/classes/${selectedClass.id}/teachers`);
            setClassTeachers(res.data?.data ?? []);
            setSelectedTeacherId('');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? 'Atama başarısız.');
        } finally {
            setAssigningTeacher(false);
        }
    };

    const handleRemoveTeacher = async (teacherProfileId: number) => {
        if (!selectedClass) return;
        try {
            await apiClient.delete(`/schools/${id}/classes/${selectedClass.id}/teachers/${teacherProfileId}`);
            toast.success('Öğretmen çıkarıldı.');
            const res = await apiClient.get(`/schools/${id}/classes/${selectedClass.id}/teachers`);
            setClassTeachers(res.data?.data ?? []);
        } catch {
            toast.error('İşlem başarısız.');
        }
    };

    const cf = (field: keyof ClassForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setClassForm(prev => ({ ...prev, [field]: e.target.value }));

    const roleLabel = (role: string) => ({ head_teacher: 'Baş Öğretmen', assistant_teacher: 'Yardımcı Öğretmen', substitute_teacher: 'Vekil Öğretmen' }[role] ?? role);
    const employmentLabel = (type?: string) => ({ full_time: 'Tam Zamanlı', part_time: 'Yarı Zamanlı', contract: 'Sözleşmeli', intern: 'Stajyer', volunteer: 'Gönüllü' }[type ?? ''] ?? type ?? '—');

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!school) {
        return <div className="p-6 text-center text-[#515365] dark:text-[#888ea8]">Okul bulunamadı.</div>;
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
                <Link href="/schools" className="btn btn-sm btn-outline-secondary gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Geri
                </Link>
                <h1 className="text-2xl font-bold text-dark dark:text-white">{school.name}</h1>
            </div>

            {/* Okul Bilgi Kartı */}
            <div className="panel mb-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {school.city && (
                        <div>
                            <p className="text-xs text-[#888ea8]">Şehir</p>
                            <p className="mt-1 font-medium text-dark dark:text-white">{school.city}</p>
                        </div>
                    )}
                    {school.address && (
                        <div>
                            <p className="text-xs text-[#888ea8]">Adres</p>
                            <p className="mt-1 font-medium text-dark dark:text-white">{school.address}</p>
                        </div>
                    )}
                    {school.phone && (
                        <div>
                            <p className="text-xs text-[#888ea8]">Telefon</p>
                            <p className="mt-1 font-medium text-dark dark:text-white">{school.phone}</p>
                        </div>
                    )}
                    {school.gsm && (
                        <div>
                            <p className="text-xs text-[#888ea8]">GSM</p>
                            <p className="mt-1 font-medium text-dark dark:text-white">{school.gsm}</p>
                        </div>
                    )}
                    {school.whatsapp && (
                        <div>
                            <p className="text-xs text-[#888ea8]">WhatsApp</p>
                            <p className="mt-1 font-medium text-dark dark:text-white">{school.whatsapp}</p>
                        </div>
                    )}
                    {school.email && (
                        <div>
                            <p className="text-xs text-[#888ea8]">E-posta</p>
                            <p className="mt-1 font-medium text-dark dark:text-white">{school.email}</p>
                        </div>
                    )}
                    <div>
                        <p className="text-xs text-[#888ea8]">Durum</p>
                        <span className={`badge mt-1 ${school.is_active !== false ? 'badge-outline-success' : 'badge-outline-danger'}`}>
                            {school.is_active !== false ? 'Aktif' : 'Pasif'}
                        </span>
                    </div>
                </div>

                {/* Davet Kodu Bölümü */}
                {inviteInfo && (
                    <div className="mt-4 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
                        <p className="mb-3 text-sm font-semibold text-primary">Veli Davet Bilgileri</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <p className="text-xs text-[#888ea8]">Kayıt Kodu</p>
                                <div className="mt-1 flex items-center gap-2">
                                    <code className="rounded bg-white px-3 py-1 text-base font-bold tracking-widest text-dark dark:bg-[#1b2e4b] dark:text-white">
                                        {inviteInfo.registration_code}
                                    </code>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary p-1.5"
                                        onClick={() => copyToClipboard(inviteInfo.registration_code, 'Kayıt kodu')}
                                        title="Kopyala"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-[#888ea8]">Davet Linki</p>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className="max-w-[200px] truncate text-sm text-[#515365] dark:text-[#888ea8]">
                                        {`${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${inviteInfo.invite_token}`}
                                    </span>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary p-1.5"
                                        onClick={() => copyToClipboard(
                                            `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${inviteInfo.invite_token}`,
                                            'Davet linki'
                                        )}
                                        title="Linki Kopyala"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger p-1.5"
                                        onClick={handleRegenerateInvite}
                                        disabled={regeneratingInvite}
                                        title="Linki Yenile (Eski link geçersiz olur)"
                                    >
                                        <RefreshCw className={`h-3.5 w-3.5 ${regeneratingInvite ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="panel">
                <div className="mb-4 flex gap-2 border-b border-[#ebedf2] dark:border-[#1b2e4b]">
                    <button
                        type="button"
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'classes' ? 'border-b-2 border-primary text-primary' : 'text-[#515365] hover:text-primary dark:text-[#888ea8]'}`}
                        onClick={() => handleTabChange('classes')}
                    >
                        <BookOpen className="h-4 w-4" />
                        Sınıflar ({classes.length})
                    </button>
                    <button
                        type="button"
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'children' ? 'border-b-2 border-primary text-primary' : 'text-[#515365] hover:text-primary dark:text-[#888ea8]'}`}
                        onClick={() => handleTabChange('children')}
                    >
                        <Users className="h-4 w-4" />
                        Öğrenciler ({children.length})
                    </button>
                    <button
                        type="button"
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'teachers' ? 'border-b-2 border-primary text-primary' : 'text-[#515365] hover:text-primary dark:text-[#888ea8]'}`}
                        onClick={() => handleTabChange('teachers')}
                    >
                        <GraduationCap className="h-4 w-4" />
                        Öğretmenler ({schoolLevelTeachers.length})
                    </button>
                    <button
                        type="button"
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'requests' ? 'border-b-2 border-primary text-primary' : 'text-[#515365] hover:text-primary dark:text-[#888ea8]'}`}
                        onClick={() => handleTabChange('requests')}
                    >
                        <Clock className="h-4 w-4" />
                        Kayıt Talepleri
                        {enrollmentRequests.filter(r => r.status === 'pending').length > 0 && (
                            <span className="badge badge-outline-warning text-xs">{enrollmentRequests.filter(r => r.status === 'pending').length}</span>
                        )}
                    </button>
                    <button
                        type="button"
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'parents' ? 'border-b-2 border-primary text-primary' : 'text-[#515365] hover:text-primary dark:text-[#888ea8]'}`}
                        onClick={() => handleTabChange('parents')}
                    >
                        <UserCheck className="h-4 w-4" />
                        Veliler ({parents.length})
                    </button>
                </div>

                {/* Sınıflar Tab */}
                {activeTab === 'classes' && (
                    <>
                        <div className="mb-4 flex justify-end">
                            <button type="button" className="btn btn-primary btn-sm gap-2" onClick={openCreateClass}>
                                <Plus className="h-4 w-4" />
                                Sınıf Ekle
                            </button>
                        </div>
                        {classes.length === 0 ? (
                            <p className="py-8 text-center text-[#515365] dark:text-[#888ea8]">Henüz sınıf eklenmemiş.</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th>Sınıf Adı</th>
                                            <th>Yaş Grubu</th>
                                            <th>Kapasite</th>
                                            <th>Öğrenci</th>
                                            <th>Durum</th>
                                            <th>İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {classes.map((cls) => (
                                            <tr key={cls.id}>
                                                <td>
                                                    <Link href={`/schools/${id}/classes/${cls.id}`} className="font-medium text-primary hover:underline">
                                                        {cls.name}
                                                    </Link>
                                                </td>
                                                <td>
                                                    {cls.age_min != null && cls.age_max != null
                                                        ? `${cls.age_min}–${cls.age_max} yaş`
                                                        : cls.age_min != null
                                                            ? `${cls.age_min}+ yaş`
                                                            : '—'}
                                                </td>
                                                <td>{cls.capacity ?? '—'}</td>
                                                <td>{cls.children_count ?? 0}</td>
                                                <td>
                                                    {cls.is_active !== false ? (
                                                        <span className="badge badge-outline-success">Aktif</span>
                                                    ) : (
                                                        <span className="badge badge-outline-secondary">Pasif</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            className={`btn btn-sm p-2 ${cls.is_active !== false ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                                            onClick={() => handleToggleClassStatus(cls)}
                                                            title={cls.is_active !== false ? 'Pasif Yap' : 'Aktif Yap'}
                                                        >
                                                            {cls.is_active !== false
                                                                ? <ToggleRight className="h-4 w-4" />
                                                                : <ToggleLeft className="h-4 w-4" />
                                                            }
                                                        </button>
                                                        <button type="button" className="btn btn-sm btn-outline-info p-2" onClick={() => openTeacherModal(cls)} title="Öğretmen Ata">
                                                            <UserPlus className="h-4 w-4" />
                                                        </button>
                                                        <button type="button" className="btn btn-sm btn-outline-primary p-2" onClick={() => openEditClass(cls)} title="Düzenle">
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                        <button type="button" className="btn btn-sm btn-outline-danger p-2" onClick={() => handleDeleteClass(cls)} title="Sil">
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
                    </>
                )}

                {/* Öğrenciler Tab */}
                {activeTab === 'children' && (
                    children.length === 0 ? (
                        <p className="py-8 text-center text-[#515365] dark:text-[#888ea8]">Öğrenci bulunamadı.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table-hover">
                                <thead>
                                    <tr>
                                        <th>Ad</th>
                                        <th>Soyad</th>
                                        <th>Doğum Tarihi</th>
                                        <th>Durum</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {children.map((child) => (
                                        <tr key={child.id}>
                                            <td className="font-medium text-dark dark:text-white">{child.name}</td>
                                            <td>{child.surname ?? '—'}</td>
                                            <td>{child.birth_date ?? '—'}</td>
                                            <td>
                                                <span className={`badge ${child.status === 'active' ? 'badge-outline-success' : 'badge-outline-secondary'}`}>
                                                    {child.status === 'active' ? 'Aktif' : (child.status ?? '—')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}

                {/* Öğretmenler Tab */}
                {activeTab === 'teachers' && (
                    <>
                        <div className="mb-4 flex justify-end">
                            <button type="button" className="btn btn-primary btn-sm gap-2" onClick={openSchoolTeacherModal}>
                                <UserPlus className="h-4 w-4" />
                                Öğretmen Ata
                            </button>
                        </div>
                        {loadingSchoolTeachers ? (
                            <div className="flex h-32 items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        ) : schoolLevelTeachers.length === 0 ? (
                            <p className="py-8 text-center text-[#515365] dark:text-[#888ea8]">Bu okula henüz öğretmen atanmamış.</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th>Ad</th>
                                            <th>Unvan</th>
                                            <th>Görev Türü</th>
                                            <th>İstihdam</th>
                                            <th>Durum</th>
                                            <th>İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {schoolLevelTeachers.map((teacher) => (
                                            <tr key={teacher.id}>
                                                <td className="font-medium text-dark dark:text-white">{teacher.name}</td>
                                                <td>{teacher.title ?? '—'}</td>
                                                <td>
                                                    {teacher.role_type ? (
                                                        <span className="badge badge-outline-info">{teacher.role_type.name}</span>
                                                    ) : '—'}
                                                </td>
                                                <td>{employmentLabel(teacher.employment_type)}</td>
                                                <td>
                                                    {teacher.is_active ? (
                                                        <span className="badge badge-outline-success">Aktif</span>
                                                    ) : (
                                                        <span className="badge badge-outline-secondary">Pasif</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger p-2"
                                                        onClick={() => handleRemoveTeacherFromSchool(teacher)}
                                                        title="Okuldan Çıkar"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {/* Kayıt Talepleri Tab */}
                {activeTab === 'requests' && (
                    <>
                        {/* Filtre Butonları */}
                        <div className="mb-4 flex flex-wrap gap-2">
                            {(['pending', 'approved', 'rejected', ''] as const).map((f) => {
                                const labels: Record<string, string> = { pending: 'Bekleyenler', approved: 'Onaylananlar', rejected: 'Reddedilenler', '': 'Tümü' };
                                const colors: Record<string, string> = { pending: 'btn-outline-warning', approved: 'btn-outline-success', rejected: 'btn-outline-danger', '': 'btn-outline-secondary' };
                                return (
                                    <button
                                        key={f}
                                        type="button"
                                        className={`btn btn-sm ${requestsFilter === f ? colors[f].replace('outline-', '') : colors[f]}`}
                                        onClick={() => handleRequestsFilterChange(f)}
                                    >
                                        {labels[f]}
                                    </button>
                                );
                            })}
                        </div>

                        {loadingRequests ? (
                            <div className="flex h-32 items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        ) : enrollmentRequests.length === 0 ? (
                            <p className="py-8 text-center text-[#515365] dark:text-[#888ea8]">
                                {requestsFilter === 'pending' ? 'Bekleyen kayıt talebi yok.' : 'Kayıt talebi bulunamadı.'}
                            </p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th>Ad Soyad</th>
                                            <th>E-posta</th>
                                            <th>Telefon</th>
                                            <th>Mesaj</th>
                                            <th>Durum</th>
                                            <th>Tarih</th>
                                            <th>İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {enrollmentRequests.map((req) => (
                                            <tr key={req.id}>
                                                <td className="font-medium text-dark dark:text-white">
                                                    {[req.parent_name, req.parent_surname].filter(Boolean).join(' ') || '—'}
                                                </td>
                                                <td>{req.parent_email ?? '—'}</td>
                                                <td>{req.parent_phone ?? '—'}</td>
                                                <td className="max-w-[180px]">
                                                    <span className="line-clamp-2 text-sm text-[#515365] dark:text-[#888ea8]">
                                                        {req.message ?? '—'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {req.status === 'pending' && <span className="badge badge-outline-warning">Bekliyor</span>}
                                                    {req.status === 'approved' && <span className="badge badge-outline-success">Onaylandı</span>}
                                                    {req.status === 'rejected' && (
                                                        <span
                                                            className="badge badge-outline-danger cursor-help"
                                                            title={req.rejection_reason ?? ''}
                                                        >
                                                            Reddedildi
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-sm text-[#888ea8]">
                                                    {new Date(req.created_at).toLocaleDateString('tr-TR')}
                                                </td>
                                                <td>
                                                    {req.status === 'pending' && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-success p-2"
                                                                onClick={() => handleApprove(req.id)}
                                                                title="Onayla"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-danger p-2"
                                                                onClick={() => openRejectModal(req.id)}
                                                                title="Reddet"
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {requestsMeta.last_page > 1 && (
                            <div className="mt-4 flex items-center justify-center gap-3">
                                <button type="button" className="btn btn-sm btn-outline-secondary" disabled={requestsMeta.current_page === 1} onClick={() => fetchEnrollmentRequests(requestsFilter, requestsMeta.current_page - 1)}>Önceki</button>
                                <span className="text-sm text-[#888ea8]">{requestsMeta.current_page} / {requestsMeta.last_page}</span>
                                <button type="button" className="btn btn-sm btn-outline-secondary" disabled={requestsMeta.current_page === requestsMeta.last_page} onClick={() => fetchEnrollmentRequests(requestsFilter, requestsMeta.current_page + 1)}>Sonraki</button>
                            </div>
                        )}
                    </>
                )}

                {/* Veliler Tab */}
                {activeTab === 'parents' && (
                    <>
                        {loadingParents ? (
                            <div className="flex h-32 items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        ) : parents.length === 0 ? (
                            <p className="py-8 text-center text-[#515365] dark:text-[#888ea8]">Bu okula kayıtlı veli bulunmuyor.</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 32 }}></th>
                                            <th>Veli Adı</th>
                                            <th>Aile Adı</th>
                                            <th>E-posta</th>
                                            <th>Telefon</th>
                                            <th>Çocuklar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parents.map((parent) => (
                                            <>
                                                <tr
                                                    key={parent.id}
                                                    className="cursor-pointer"
                                                    onClick={() => setExpandedParent(expandedParent === parent.id ? null : parent.id)}
                                                >
                                                    <td>
                                                        {parent.children.length > 0 && (
                                                            expandedParent === parent.id
                                                                ? <ChevronDown className="h-4 w-4 text-[#888ea8]" />
                                                                : <ChevronRight className="h-4 w-4 text-[#888ea8]" />
                                                        )}
                                                    </td>
                                                    <td className="font-medium text-dark dark:text-white">{parent.owner_name}</td>
                                                    <td>{parent.family_name ?? '—'}</td>
                                                    <td>{parent.email ?? '—'}</td>
                                                    <td>{parent.phone ?? '—'}</td>
                                                    <td>
                                                        <span className="badge badge-outline-info">{parent.children.length} çocuk</span>
                                                    </td>
                                                </tr>
                                                {expandedParent === parent.id && parent.children.length > 0 && (
                                                    <tr key={`${parent.id}-children`}>
                                                        <td></td>
                                                        <td colSpan={5} className="bg-primary/5 pb-3 pt-1">
                                                            <p className="mb-2 text-xs font-semibold text-[#888ea8]">ÇOCUKLAR</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {parent.children.map((child) => (
                                                                    <div key={child.id} className="flex items-center gap-2 rounded-lg border border-[#ebedf2] bg-white px-3 py-1.5 dark:border-[#1b2e4b] dark:bg-[#0e1726]">
                                                                        <span className="font-medium text-dark dark:text-white">{child.name}</span>
                                                                        {child.birth_date && <span className="text-xs text-[#888ea8]">{child.birth_date}</span>}
                                                                        {child.gender && <span className="badge badge-outline-secondary text-xs">{child.gender === 'male' ? 'Erkek' : child.gender === 'female' ? 'Kız' : child.gender}</span>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Sınıf Oluştur/Düzenle Modal */}
            {showClassModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">
                                {editingClass ? 'Sınıf Düzenle' : 'Yeni Sınıf'}
                            </h2>
                            <button type="button" onClick={() => setShowClassModal(false)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleClassSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Sınıf Adı *</label>
                                <input type="text" className="form-input mt-1" value={classForm.name} onChange={cf('name')} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Eğitim Yılı</label>
                                <select
                                    className="form-select mt-1"
                                    value={classForm.academic_year_id}
                                    onChange={e => setClassForm(prev => ({ ...prev, academic_year_id: e.target.value }))}
                                >
                                    <option value="">— Seçin (İsteğe Bağlı) —</option>
                                    {academicYears.map(y => (
                                        <option key={y.id} value={y.id}>
                                            {y.name}{y.is_active ? ' (Aktif)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Yaş Aralığı</label>
                                <div className="mt-1 flex items-center gap-2">
                                    <input
                                        type="number"
                                        className="form-input w-full"
                                        placeholder="Min"
                                        min={0}
                                        max={18}
                                        value={classForm.age_min}
                                        onChange={cf('age_min')}
                                    />
                                    <span className="shrink-0 text-[#888ea8]">—</span>
                                    <input
                                        type="number"
                                        className="form-input w-full"
                                        placeholder="Max"
                                        min={0}
                                        max={18}
                                        value={classForm.age_max}
                                        onChange={cf('age_max')}
                                    />
                                    <span className="shrink-0 text-sm text-[#888ea8]">yaş</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Kapasite</label>
                                <input type="number" className="form-input mt-1" min={1} value={classForm.capacity} onChange={cf('capacity')} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Açıklama</label>
                                <textarea className="form-input mt-1" rows={2} value={classForm.description} onChange={cf('description')} />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn btn-primary flex-1" disabled={savingClass}>
                                    {savingClass ? 'Kaydediliyor...' : (editingClass ? 'Güncelle' : 'Kaydet')}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowClassModal(false)}>İptal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Okul Öğretmen Atama Modal */}
            {showSchoolTeacherModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">Okula Öğretmen Ata</h2>
                            <button type="button" onClick={() => setShowSchoolTeacherModal(false)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Öğretmen *</label>
                                <select
                                    className="form-select mt-1"
                                    value={assignTeacherProfileId}
                                    onChange={e => setAssignTeacherProfileId(e.target.value)}
                                >
                                    <option value="">Öğretmen seçin</option>
                                    {allTenantTeachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Görev Türü</label>
                                <select
                                    className="form-select mt-1"
                                    value={assignRoleTypeId}
                                    onChange={e => setAssignRoleTypeId(e.target.value)}
                                >
                                    <option value="">— Seçin (İsteğe Bağlı) —</option>
                                    {roleTypes.filter(r => r.is_active !== false).map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">İstihdam Türü</label>
                                <select
                                    className="form-select mt-1"
                                    value={assignEmploymentType}
                                    onChange={e => setAssignEmploymentType(e.target.value)}
                                >
                                    <option value="full_time">Tam Zamanlı</option>
                                    <option value="part_time">Yarı Zamanlı</option>
                                    <option value="contract">Sözleşmeli</option>
                                    <option value="intern">Stajyer</option>
                                    <option value="volunteer">Gönüllü</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    className="btn btn-primary flex-1"
                                    onClick={handleAssignTeacherToSchool}
                                    disabled={!assignTeacherProfileId || savingSchoolTeacher}
                                >
                                    {savingSchoolTeacher ? 'Atanıyor...' : 'Ata'}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowSchoolTeacherModal(false)}>İptal</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Red Sebebi Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">Talebi Reddet</h2>
                            <button type="button" onClick={() => setShowRejectModal(false)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">
                                    Red Sebebi <span className="text-danger">*</span>
                                </label>
                                <textarea
                                    className="form-textarea mt-1 w-full"
                                    rows={4}
                                    placeholder="Red sebebini açıklayınız (zorunlu)..."
                                    value={rejectionReason}
                                    onChange={e => setRejectionReason(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    className="btn btn-danger flex-1"
                                    onClick={handleRejectSubmit}
                                    disabled={!rejectionReason.trim() || savingReject}
                                >
                                    {savingReject ? 'Reddediliyor...' : 'Reddet'}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowRejectModal(false)}>İptal</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Öğretmen Atama Modal */}
            {showTeacherModal && selectedClass && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">
                                {selectedClass.name} — Öğretmenler
                            </h2>
                            <button type="button" onClick={() => setShowTeacherModal(false)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Mevcut öğretmenler */}
                        {classTeachers.length > 0 && (
                            <div className="mb-4">
                                <p className="mb-2 text-sm font-medium text-dark dark:text-white-light">Atanmış Öğretmenler</p>
                                <div className="space-y-2">
                                    {classTeachers.map(t => (
                                        <div key={t.id} className="flex items-center justify-between rounded border border-[#ebedf2] p-2 dark:border-[#1b2e4b]">
                                            <div>
                                                <span className="font-medium text-dark dark:text-white">{t.name}</span>
                                                <span className="ml-2 text-xs text-[#888ea8]">{roleLabel(t.role ?? '')}</span>
                                            </div>
                                            <button type="button" className="text-danger hover:opacity-70" onClick={() => handleRemoveTeacher(t.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Öğretmen ekle */}
                        <div className="space-y-3 border-t border-[#ebedf2] pt-4 dark:border-[#1b2e4b]">
                            <p className="text-sm font-medium text-dark dark:text-white-light">Öğretmen Ekle</p>
                            <select className="form-select" value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)}>
                                <option value="">Öğretmen seçin</option>
                                {schoolTeachers
                                    .filter(t => !classTeachers.find(ct => ct.id === t.id))
                                    .map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                            </select>
                            <select className="form-select" value={teacherRole} onChange={e => setTeacherRole(e.target.value)}>
                                <option value="head_teacher">Baş Öğretmen</option>
                                <option value="assistant_teacher">Yardımcı Öğretmen</option>
                                <option value="substitute_teacher">Vekil Öğretmen</option>
                            </select>
                            <button type="button" className="btn btn-primary w-full" onClick={handleAssignTeacher} disabled={!selectedTeacherId || assigningTeacher}>
                                {assigningTeacher ? 'Atanıyor...' : 'Öğretmeni Ata'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
