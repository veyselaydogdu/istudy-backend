'use client';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import apiClient from '@/lib/apiClient';
import { TeacherProfile, TeacherRoleType, School } from '@/types';
import { Eye, X, Users, Building2, BookOpen, Tag, Mail, UserCheck, UserX, UserMinus, Check, GraduationCap, Award, BookOpen as CourseIcon, Zap, FileText, Phone, Globe, Pencil, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

import { useTranslation } from '@/hooks/useTranslation';

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
    phone: string | null;
    specialization: string | null;
    experience_years: number | null;
    sent_at: string;
};

type TeacherDetail = TeacherWithMembership & {
    bio: string | null;
    linkedin_url: string | null;
    website_url: string | null;
    educations: { id: number; institution: string; degree: string; field_of_study: string; start_date: string | null; end_date: string | null; is_current: boolean; country: { id: number; name: string } | null; description: string | null; approval_status: 'pending' | 'approved' | 'rejected'; rejection_reason: string | null; document_url: string | null }[];
    certificates: { id: number; name: string; issuing_organization: string | null; issue_date: string | null; expiry_date: string | null; credential_url: string | null; description: string | null; approval_status: 'pending' | 'approved' | 'rejected'; rejection_reason: string | null; document_url: string | null }[];
    courses: { id: number; title: string; type: string; provider: string | null; start_date: string | null; end_date: string | null; duration_hours: number | null; location: string | null; is_online: boolean; description: string | null; approval_status: 'pending' | 'approved' | 'rejected'; rejection_reason: string | null; document_url: string | null }[];
    skills: { id: number; name: string; level: string; category: string; proficiency: number }[];
    blog_posts: { id: number; title: string; description: string | null; image_url: string | null; likes_count: number; comments_count: number; published_at: string | null; created_at: string | null }[];
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
    const { t } = useTranslation();
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


    const [countries, setCountries] = useState<Country[]>([]);

    // ── Öğretmen Detay ────────────────────────────────────────
    const [viewingTeacher, setViewingTeacher] = useState<TeacherDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [detailTab, setDetailTab] = useState<'info' | 'education' | 'certificates' | 'courses' | 'skills' | 'blogs'>('info');
    const [approvingId, setApprovingId] = useState<string | null>(null); // "cert-{id}" | "course-{id}"
    const [docBlobUrls, setDocBlobUrls] = useState<Record<string, { blobUrl: string; mimeType: string }>>({});
    const [docModal, setDocModal] = useState<{ blobUrl: string; mimeType: string; name: string } | null>(null);

    // ── Katılma Talepleri ─────────────────────────────────────
    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(false);

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
        } catch { toast.error(t('teachers.loadError')); }
        finally { setLoading(false); }
    }, [page, search]);

    const fetchJoinRequests = useCallback(async () => {
        setLoadingRequests(true);
        try {
            const res = await apiClient.get('/teachers/join-requests');
            setJoinRequests(res.data?.data ?? []);
        } catch { toast.error(t('common.error')); }
        finally { setLoadingRequests(false); }
    }, []);

    const fetchRoleTypes = useCallback(async () => {
        setLoadingRoleTypes(true);
        try {
            const res = await apiClient.get('/teacher-role-types');
            setRoleTypes(res.data?.data ?? []);
        } catch { toast.error(t('common.error')); }
        finally { setLoadingRoleTypes(false); }
    }, []);


    const fetchCountries = useCallback(async () => {
        try {
            const res = await apiClient.get('/parent/auth/countries');
            setCountries(res.data?.data ?? []);
        } catch { /* sessiz */ }
    }, []);

    useEffect(() => { fetchTeachers(); }, [fetchTeachers]);
    useEffect(() => { fetchJoinRequests(); }, [fetchJoinRequests]);
    useEffect(() => { fetchRoleTypes(); }, [fetchRoleTypes]);
    useEffect(() => { fetchCountries(); }, [fetchCountries]);

    // ── Davet ─────────────────────────────────────────────────
    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim()) { toast.error(t('teachers.inviteEmailRequired')); return; }
        setInviting(true);
        try {
            await apiClient.post('/teachers/invite', { email: inviteEmail.trim(), notes: inviteNotes || undefined });
            toast.success(t('teachers.inviteSuccess'));
            setShowInvite(false);
            setInviteEmail('');
            setInviteNotes('');
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? t('teachers.inviteError'));
        } finally { setInviting(false); }
    };

    // ── Öğretmen Detay Görüntüle ──────────────────────────────
    const preloadDocuments = useCallback((detail: TeacherDetail) => {
        const urls = [
            ...detail.educations.map(e => e.document_url),
            ...detail.certificates.map(c => c.document_url),
            ...detail.courses.map(c => c.document_url),
        ].filter((u): u is string => !!u);

        urls.forEach(url => {
            apiClient.get(url, { responseType: 'blob', baseURL: '' })
                .then(res => {
                    const mimeType = (res.headers['content-type'] as string | undefined)?.split(';')[0] ?? 'application/octet-stream';
                    const blobUrl = URL.createObjectURL(res.data as Blob);
                    setDocBlobUrls(prev => ({ ...prev, [url]: { blobUrl, mimeType } }));
                })
                .catch(() => {});
        });
    }, []);

    const closeDetail = useCallback(() => {
        setViewingTeacher(null);
        setDocModal(null);
        setDocBlobUrls(prev => {
            Object.values(prev).forEach(({ blobUrl }) => URL.revokeObjectURL(blobUrl));
            return {};
        });
    }, []);

    const openDetail = async (teacher: TeacherWithMembership) => {
        setDetailTab('info');
        setLoadingDetail(true);
        setDocBlobUrls({});
        setViewingTeacher(null);
        // optimistic: show modal immediately, load data
        setViewingTeacher({ ...teacher, bio: null, linkedin_url: null, website_url: null, educations: [], certificates: [], courses: [], skills: [], blog_posts: [] } as unknown as TeacherDetail);
        try {
            const res = await apiClient.get(`/teachers/${teacher.id}`);
            const detail = res.data?.data as TeacherDetail;
            setViewingTeacher(detail);
            preloadDocuments(detail);
        } catch { toast.error(t('teachers.detailError')); }
        finally { setLoadingDetail(false); }
    };

    // ── Credential Onay / Red ─────────────────────────────────
    const handleApproveCredential = async (type: 'certificate' | 'course' | 'education', id: number) => {
        const key = `${type}-${id}`;
        setApprovingId(key);
        try {
            const pathMap = { certificate: 'certificates', course: 'courses', education: 'educations' };
            await apiClient.patch(`/teacher-approvals/${pathMap[type]}/${id}/approve`);
            toast.success('Onaylandı.');
            if (viewingTeacher) {
                setViewingTeacher(prev => {
                    if (!prev) { return prev; }
                    if (type === 'certificate') {
                        return { ...prev, certificates: prev.certificates.map(c => c.id === id ? { ...c, approval_status: 'approved' as const, rejection_reason: null } : c) };
                    }
                    if (type === 'education') {
                        return { ...prev, educations: prev.educations.map(e => e.id === id ? { ...e, approval_status: 'approved' as const, rejection_reason: null } : e) };
                    }
                    return { ...prev, courses: prev.courses.map(c => c.id === id ? { ...c, approval_status: 'approved' as const, rejection_reason: null } : c) };
                });
            }
        } catch { toast.error('Onay işlemi başarısız.'); }
        finally { setApprovingId(null); }
    };

    const handleRejectCredential = async (type: 'certificate' | 'course' | 'education', id: number) => {
        const { value: reason } = await Swal.fire({
            title: 'Red Sebebi',
            input: 'textarea',
            inputLabel: 'Lütfen red sebebini yazın',
            inputPlaceholder: 'Red sebebi...',
            inputAttributes: { maxlength: '1000' },
            showCancelButton: true,
            confirmButtonText: 'Reddet',
            cancelButtonText: 'İptal',
            confirmButtonColor: '#e7515a',
            inputValidator: (v) => { if (!v?.trim()) { return 'Red sebebi zorunludur.'; } },
        });
        if (!reason) { return; }

        const key = `${type}-${id}`;
        setApprovingId(key);
        try {
            const pathMap = { certificate: 'certificates', course: 'courses', education: 'educations' };
            await apiClient.patch(`/teacher-approvals/${pathMap[type]}/${id}/reject`, { rejection_reason: reason });
            toast.success('Reddedildi.');
            if (viewingTeacher) {
                setViewingTeacher(prev => {
                    if (!prev) { return prev; }
                    if (type === 'certificate') {
                        return { ...prev, certificates: prev.certificates.map(c => c.id === id ? { ...c, approval_status: 'rejected' as const, rejection_reason: reason } : c) };
                    }
                    if (type === 'education') {
                        return { ...prev, educations: prev.educations.map(e => e.id === id ? { ...e, approval_status: 'rejected' as const, rejection_reason: reason } : e) };
                    }
                    return { ...prev, courses: prev.courses.map(c => c.id === id ? { ...c, approval_status: 'rejected' as const, rejection_reason: reason } : c) };
                });
            }
        } catch { toast.error('Red işlemi başarısız.'); }
        finally { setApprovingId(null); }
    };

    // ── Öğretmen Düzenle (DEVRE DIŞI — tenant düzenleyemez) ──
    const openEdit = (teacher: TeacherWithMembership) => {
        setEditingTeacher(teacher);
        setUpdateForm({
            title: teacher.title ?? '', specialization: teacher.specialization ?? '', bio: teacher.bio ?? '',
            experience_years: teacher.experience_years ? String(teacher.experience_years) : '',
            employment_type: teacher.employment_type ?? 'full_time',
            hire_date: teacher.hire_date ?? '', phone: teacher.phone ?? '',
            phone_country_code: teacher.phone_country_code ?? '+90',
            whatsapp_number: teacher.whatsapp_number ?? '',
            whatsapp_country_code: teacher.whatsapp_country_code ?? '+90',
            country_id: teacher.nationality_country_id ? String(teacher.nationality_country_id) : '',
            identity_number: teacher.identity_number ?? '',
            passport_number: teacher.passport_number ?? '',
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
            toast.success(t('teachers.updateSuccess'));
            setEditingTeacher(null);
            fetchTeachers();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? t('teachers.updateError'));
        } finally { setSaving(false); }
    };

    // ── Üyelik Yönetimi ───────────────────────────────────────
    const handleActivate = async (teacher: TeacherWithMembership) => {
        try {
            await apiClient.patch(`/teachers/${teacher.membership_id}/activate`);
            toast.success(t('teachers.activateSuccess'));
            fetchTeachers();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? t('teachers.activateError'));
        }
    };

    const handleDeactivate = async (teacher: TeacherWithMembership) => {
        const result = await Swal.fire({
            title: t('teachers.deactivateTitle'),
            text: t('teachers.deactivateText', { name: teacher.name }),
            icon: 'warning', showCancelButton: true,
            confirmButtonText: t('teachers.deactivateConfirm'), cancelButtonText: t('common.cancel'),
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) { return; }
        try {
            await apiClient.patch(`/teachers/${teacher.membership_id}/deactivate`);
            toast.success(t('teachers.deactivateSuccess'));
            fetchTeachers();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? t('teachers.deactivateError'));
        }
    };

    const handleRemoveMembership = async (teacher: TeacherWithMembership) => {
        const result = await Swal.fire({
            title: t('teachers.removeTitle'),
            text: t('teachers.removeText', { name: teacher.name }),
            icon: 'warning', showCancelButton: true,
            confirmButtonText: t('teachers.removeConfirm'), cancelButtonText: t('common.cancel'),
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) { return; }
        try {
            await apiClient.delete(`/teachers/${teacher.membership_id}/membership`);
            toast.success(t('teachers.removeSuccess'));
            fetchTeachers();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? t('teachers.removeError'));
        }
    };


    // ── Katılma Talepleri ─────────────────────────────────────
    const handleApproveRequest = async (req: JoinRequest) => {
        try {
            await apiClient.patch(`/teachers/join-requests/${req.id}/approve`);
            toast.success(t('teachers.approveRequestSuccess'));
            setJoinRequests(prev => prev.filter(r => r.id !== req.id));
            fetchTeachers();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? t('teachers.approveRequestError'));
        }
    };

    const handleRejectRequest = async (req: JoinRequest) => {
        const result = await Swal.fire({
            title: t('teachers.rejectRequestTitle'),
            text: t('teachers.rejectRequestText', { name: req.name }),
            icon: 'warning', showCancelButton: true,
            confirmButtonText: t('teachers.rejectRequestConfirm'), cancelButtonText: t('common.cancel'),
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) { return; }
        try {
            await apiClient.patch(`/teachers/join-requests/${req.id}/reject`);
            toast.success(t('teachers.rejectRequestSuccess'));
            setJoinRequests(prev => prev.filter(r => r.id !== req.id));
        } catch { toast.error(t('teachers.rejectRequestError')); }
    };

    // ── Görev Türü CRUD ───────────────────────────────────────
    const handleCreateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roleForm.name.trim()) { toast.error(t('teachers.createRoleError')); return; }
        setSavingRole(true);
        try {
            await apiClient.post('/teacher-role-types', {
                name: roleForm.name,
                sort_order: roleForm.sort_order ? Number(roleForm.sort_order) : 0,
            });
            toast.success(t('teachers.createRoleSuccess'));
            setShowCreateRole(false);
            setRoleForm(emptyRoleType);
            fetchRoleTypes();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? t('teachers.createRoleError2'));
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
            toast.success(t('teachers.updateRoleSuccess'));
            setEditingRole(null);
            fetchRoleTypes();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? t('teachers.updateRoleError'));
        } finally { setSavingRole(false); }
    };

    const getEmploymentLabel = (type: string) => {
        const map: Record<string, string> = {
            full_time: t('teachers.fullTime'),
            part_time: t('teachers.partTime'),
            contract: t('teachers.contract'),
            intern: t('teachers.intern'),
            volunteer: t('teachers.volunteer'),
        };
        return map[type] ?? type;
    };

    const getCourseTypeLabel = (type: string) => {
        const map: Record<string, string> = {
            course: t('teachers.courseTypeCourse'),
            seminar: t('teachers.courseTypeSeminar'),
            workshop: t('teachers.courseTypeWorkshop'),
            conference: t('teachers.courseTypeConference'),
            training: t('teachers.courseTypeTraining'),
            webinar: t('teachers.courseTypeWebinar'),
            other: t('teachers.courseTypeOther'),
        };
        return map[type] ?? type;
    };

    const getSkillLevelLabel = (level: string) => {
        const map: Record<string, string> = {
            beginner: t('teachers.skillBeginner'),
            intermediate: t('teachers.skillIntermediate'),
            advanced: t('teachers.skillAdvanced'),
            expert: t('teachers.skillExpert'),
        };
        return map[level] ?? level;
    };

    const handleDeleteRole = async (rt: TeacherRoleType) => {
        const result = await Swal.fire({
            title: t('teachers.deleteRoleTitle'),
            text: t('teachers.deleteRoleText', { name: rt.name }),
            icon: 'warning', showCancelButton: true,
            confirmButtonText: t('swal.confirmDelete'), cancelButtonText: t('swal.cancel'),
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) { return; }
        try {
            await apiClient.delete(`/teacher-role-types/${rt.id}`);
            toast.success(t('teachers.deleteRoleSuccess'));
            fetchRoleTypes();
        } catch { toast.error(t('teachers.deleteRoleError')); }
    };

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dark dark:text-white">{t('teachers.title')}</h1>
                    <p className="mt-1 text-sm text-[#888ea8]">{t('teachers.subtitle')}</p>
                </div>
                {activeTab === 'teachers' && (
                    <button type="button" className="btn btn-primary gap-2" onClick={() => { setShowInvite(true); setInviteEmail(''); setInviteNotes(''); }}>
                        <Mail className="h-4 w-4" />{t('teachers.inviteBtn')}
                    </button>
                )}
                {activeTab === 'role-types' && (
                    <button type="button" className="btn btn-primary gap-2" onClick={() => { setShowCreateRole(true); setRoleForm(emptyRoleType); }}>
                        <Tag className="h-4 w-4" />{t('teachers.newRoleTypeTitle')}
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
                    <Users className="h-4 w-4" />{t('teachers.teachersTab')}
                    {total > 0 && <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{total}</span>}
                </button>
                <button
                    type="button"
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${activeTab === 'join-requests' ? 'border-b-2 border-primary text-primary' : 'text-[#506690] hover:text-primary'}`}
                    onClick={() => setActiveTab('join-requests')}
                >
                    <UserCheck className="h-4 w-4" />{t('teachers.joinRequestsTab')}
                    {joinRequests.length > 0 && (
                        <span className="ml-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs text-warning">{joinRequests.length}</span>
                    )}
                </button>
                <button
                    type="button"
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${activeTab === 'role-types' ? 'border-b-2 border-primary text-primary' : 'text-[#506690] hover:text-primary'}`}
                    onClick={() => setActiveTab('role-types')}
                >
                    <Tag className="h-4 w-4" />{t('teachers.roleTypesTab')}
                </button>
            </div>

            {/* ── Öğretmenler Sekmesi ───────────────────────────── */}
            {activeTab === 'teachers' && (
                <div className="panel">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <input
                            type="text"
                            className="form-input w-full max-w-xs"
                            placeholder={t('teachers.searchPlaceholder2')}
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                        />
                        {total > 0 && <span className="text-sm text-[#888ea8]">{t('teachers.total', { count: total })}</span>}
                    </div>

                    {loading ? (
                        <div className="flex h-40 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                    ) : teachers.length === 0 ? (
                        <div className="flex h-40 flex-col items-center justify-center gap-2 text-[#888ea8]">
                            <Users className="h-10 w-10 opacity-40" />
                            <p>{t('teachers.noTeacher')}</p>
                            <p className="text-xs">{t('teachers.noTeacherHint')}</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table-hover">
                                <thead>
                                    <tr>
                                        <th>{t('teachers.nameCol')}</th>
                                        <th>{t('teachers.titleSpecializationCol')}</th>
                                        <th>{t('teachers.employmentCol')}</th>
                                        <th>{t('teachers.experienceCol')}</th>
                                        <th>{t('teachers.statusCol')}</th>
                                        <th>{t('teachers.schoolsCol')}</th>
                                        <th>{t('teachers.actionsCol')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teachers.map(teacher => (
                                        <tr key={teacher.id}>
                                            <td>
                                                <div className="flex flex-col gap-0.5">
                                                    <p className="font-semibold text-dark dark:text-white">{teacher.name}</p>
                                                    {teacher.email && (
                                                        <span className="flex items-center gap-1 text-xs text-[#888ea8]">
                                                            <Mail className="h-3 w-3 shrink-0" />{teacher.email}
                                                        </span>
                                                    )}
                                                    {teacher.phone && (
                                                        <span className="flex items-center gap-1 text-xs text-[#888ea8]">
                                                            <Phone className="h-3 w-3 shrink-0" />{teacher.phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div>
                                                    {teacher.title && <p className="text-sm font-medium">{teacher.title}</p>}
                                                    {teacher.specialization && <p className="text-xs text-[#888ea8]">{teacher.specialization}</p>}
                                                </div>
                                            </td>
                                            <td>
                                                {teacher.employment_type && (
                                                    <span className={`badge ${EMPLOYMENT_BADGE[teacher.employment_type] ?? 'badge-outline-secondary'} text-xs`}>
                                                        {getEmploymentLabel(teacher.employment_type)}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {teacher.experience_years != null
                                                    ? <span className="text-sm">{t('teachers.yearsExp', { count: teacher.experience_years })}</span>
                                                    : <span className="text-xs text-[#888ea8]">—</span>}
                                            </td>
                                            <td>
                                                <span className={`badge text-xs ${teacher.membership_status === 'active' ? 'badge-outline-success' : 'badge-outline-danger'}`}>
                                                    {teacher.membership_status === 'active' ? t('teachers.statusActive') : t('teachers.statusInactive')}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex flex-wrap gap-1">
                                                    {teacher.schools && teacher.schools.length > 0
                                                        ? teacher.schools.map(s => (
                                                            <span key={s.id} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{s.name}</span>
                                                        ))
                                                        : <span className="text-xs text-[#888ea8]">{t('teachers.noSchoolAssigned')}</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex gap-1">
                                                    <button type="button" title={t('teachers.viewBtn')} className="btn btn-sm btn-outline-primary p-2" onClick={() => openDetail(teacher)}>
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    {teacher.membership_status === 'inactive' ? (
                                                        <button type="button" title={t('teachers.activateTitle')} className="btn btn-sm btn-outline-success p-2" onClick={() => handleActivate(teacher)}>
                                                            <UserCheck className="h-4 w-4" />
                                                        </button>
                                                    ) : (
                                                        <button type="button" title={t('teachers.deactivateTitle2')} className="btn btn-sm btn-outline-warning p-2" onClick={() => handleDeactivate(teacher)}>
                                                            <UserX className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    <button type="button" title={t('teachers.removeFromOrg')} className="btn btn-sm btn-outline-danger p-2" onClick={() => handleRemoveMembership(teacher)}>
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
                            <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>{t('teachers.prevPage')}</button>
                            <span className="flex items-center px-3 text-sm">{page} / {lastPage}</span>
                            <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page === lastPage} onClick={() => setPage(p => p + 1)}>{t('teachers.nextPage')}</button>
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
                            <p>{t('teachers.noJoinRequest')}</p>
                            <p className="text-xs">{t('teachers.noJoinRequestHint')}</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table-hover">
                                <thead>
                                    <tr>
                                        <th>{t('teachers.nameCol')}</th>
                                        <th>{t('teachers.contactCol')}</th>
                                        <th>{t('teachers.specialization')}</th>
                                        <th>{t('teachers.experienceCol')}</th>
                                        <th>{t('teachers.requestDateCol')}</th>
                                        <th>{t('teachers.actionsCol')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {joinRequests.map(req => (
                                        <tr key={req.id}>
                                            <td>
                                                <p className="font-semibold text-dark dark:text-white">{req.name}</p>
                                            </td>
                                            <td>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="flex items-center gap-1 text-sm text-[#506690]">
                                                        <Mail className="h-3.5 w-3.5 shrink-0" />{req.email}
                                                    </span>
                                                    {req.phone && (
                                                        <span className="flex items-center gap-1 text-sm text-[#506690]">
                                                            <Phone className="h-3.5 w-3.5 shrink-0" />{req.phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-sm">{req.specialization ?? '—'}</td>
                                            <td className="text-sm">{req.experience_years != null ? t('teachers.yearsExp', { count: req.experience_years }) : '—'}</td>
                                            <td className="text-sm text-[#888ea8]">{new Date(req.sent_at).toLocaleDateString('tr-TR')}</td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-success gap-1"
                                                        onClick={() => handleApproveRequest(req)}
                                                    >
                                                        <Check className="h-4 w-4" />{t('teachers.approveBtn')}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger gap-1"
                                                        onClick={() => handleRejectRequest(req)}
                                                    >
                                                        <X className="h-4 w-4" />{t('teachers.rejectBtn')}
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
                            <p>{t('teachers.noRoleType')}</p>
                            <p className="text-xs">{t('teachers.noRoleTypeHint')}</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table-hover">
                                <thead>
                                    <tr>
                                        <th>{t('teachers.roleTypeNameCol')}</th>
                                        <th>{t('teachers.sortOrderCol')}</th>
                                        <th>{t('teachers.statusCol')}</th>
                                        <th>{t('teachers.actionsCol')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {roleTypes.map(rt => (
                                        <tr key={rt.id}>
                                            <td className="font-medium">{rt.name}</td>
                                            <td className="text-sm text-[#888ea8]">{rt.sort_order ?? 0}</td>
                                            <td>
                                                <span className={`badge ${rt.is_active ? 'badge-outline-success' : 'badge-outline-danger'} text-xs`}>
                                                    {rt.is_active ? t('teachers.statusActive') : t('teachers.statusInactive')}
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
                            <h2 className="text-lg font-bold text-dark dark:text-white">{t('teachers.inviteTitle')}</h2>
                            <button type="button" onClick={() => setShowInvite(false)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <p className="mb-4 text-sm text-[#888ea8]">
                            {t('teachers.inviteDesc')}
                        </p>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium">{t('teachers.inviteEmailLabel')}</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder={t('teachers.inviteEmailPlaceholder')}
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">{t('teachers.inviteNotesOptional')}</label>
                                <textarea
                                    className="form-input"
                                    rows={3}
                                    placeholder={t('teachers.inviteNotesPlaceholder')}
                                    value={inviteNotes}
                                    onChange={e => setInviteNotes(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn btn-primary flex-1" disabled={inviting}>
                                    {inviting ? t('teachers.inviting') : t('teachers.inviteBtn2')}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowInvite(false)}>{t('common.cancel')}</button>
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
                            <h2 className="text-lg font-bold text-dark dark:text-white">{t('teachers.editModalTitle')} — {editingTeacher.name}</h2>
                            <button type="button" onClick={() => setEditingTeacher(null)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium">{t('teachers.phoneLabel')}</label>
                                <div className="flex gap-2">
                                    <select className="form-select w-36 shrink-0" value={updateForm.phone_country_code} onChange={e => setUpdateForm(p => ({ ...p, phone_country_code: e.target.value }))}>
                                        {countries.map(c => <option key={c.id} value={c.phone_code}>{c.flag_emoji} {c.iso2} {c.phone_code}</option>)}
                                    </select>
                                    <input className="form-input flex-1" placeholder="5xx xxx xxxx" value={updateForm.phone} onChange={e => setUpdateForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">{t('teachers.whatsappLabel')} <span className="text-xs text-[#888ea8]">{t('teachers.whatsappOptional')}</span></label>
                                <div className="flex gap-2">
                                    <select className="form-select w-36 shrink-0" value={updateForm.whatsapp_country_code} onChange={e => setUpdateForm(p => ({ ...p, whatsapp_country_code: e.target.value }))}>
                                        {countries.map(c => <option key={c.id} value={c.phone_code}>{c.flag_emoji} {c.iso2} {c.phone_code}</option>)}
                                    </select>
                                    <input className="form-input flex-1" placeholder="5xx xxx xxxx" value={updateForm.whatsapp_number} onChange={e => setUpdateForm(p => ({ ...p, whatsapp_number: e.target.value.replace(/\D/g, '').slice(0, 10) }))} />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">{t('teachers.nationalityLabel')} <span className="text-xs text-[#888ea8]">{t('teachers.nationalityOptional')}</span></label>
                                <select className="form-select" value={updateForm.country_id} onChange={e => setUpdateForm(p => ({ ...p, country_id: e.target.value }))}>
                                    <option value="">{t('teachers.selectNationality')}</option>
                                    {countries.map(c => <option key={c.id} value={c.id}>{c.flag_emoji} {c.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium">{t('teachers.idNumberLabel')} <span className="text-xs text-[#888ea8]">{t('teachers.idNumberOptional')}</span></label>
                                    <input className="form-input" maxLength={11} value={updateForm.identity_number} onChange={e => setUpdateForm(p => ({ ...p, identity_number: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">{t('teachers.passportLabel')} <span className="text-xs text-[#888ea8]">{t('teachers.passportOptional')}</span></label>
                                    <input className="form-input" maxLength={20} value={updateForm.passport_number} onChange={e => setUpdateForm(p => ({ ...p, passport_number: e.target.value }))} />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">{t('teachers.titleLabel')}</label>
                                <input className="form-input" placeholder={t('teachers.titlePlaceholder')} value={updateForm.title} onChange={e => setUpdateForm(p => ({ ...p, title: e.target.value }))} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium">{t('teachers.employmentTypeLabel')}</label>
                                    <select className="form-select" value={updateForm.employment_type} onChange={e => setUpdateForm(p => ({ ...p, employment_type: e.target.value }))}>
                                        <option value="full_time">{t('teachers.fullTime')}</option>
                                        <option value="part_time">{t('teachers.partTime')}</option>
                                        <option value="contract">{t('teachers.contract')}</option>
                                        <option value="intern">{t('teachers.intern')}</option>
                                        <option value="volunteer">{t('teachers.volunteer')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">{t('teachers.experienceYearsLabel')}</label>
                                    <input type="number" min={0} className="form-input" value={updateForm.experience_years} onChange={e => setUpdateForm(p => ({ ...p, experience_years: e.target.value }))} />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">{t('teachers.specializationLabel')}</label>
                                <input className="form-input" value={updateForm.specialization} onChange={e => setUpdateForm(p => ({ ...p, specialization: e.target.value }))} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">{t('teachers.hireDateLabel')}</label>
                                <input type="date" className="form-input" value={updateForm.hire_date} onChange={e => setUpdateForm(p => ({ ...p, hire_date: e.target.value }))} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">{t('teachers.bioLabel')}</label>
                                <textarea className="form-input" rows={3} value={updateForm.bio} onChange={e => setUpdateForm(p => ({ ...p, bio: e.target.value }))} />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
                                    {saving ? t('common.loading') : t('common.update')}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setEditingTeacher(null)}>{t('common.cancel')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* ── Görev Türü Oluştur Modal ──────────────────────────── */}
            {showCreateRole && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">{t('teachers.newRoleTypeTitle')}</h2>
                            <button type="button" onClick={() => setShowCreateRole(false)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateRole} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium">{t('teachers.roleNameLabelRequired')}</label>
                                <input className="form-input" value={roleForm.name} onChange={e => setRoleForm(p => ({ ...p, name: e.target.value }))} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">{t('teachers.sortLabel')}</label>
                                <input type="number" min={0} className="form-input" value={roleForm.sort_order} onChange={e => setRoleForm(p => ({ ...p, sort_order: e.target.value }))} />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn btn-primary flex-1" disabled={savingRole}>
                                    {savingRole ? t('common.loading') : t('common.save')}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowCreateRole(false)}>{t('common.cancel')}</button>
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
                            <h2 className="text-lg font-bold text-dark dark:text-white">{t('teachers.editRoleTypeTitle')}</h2>
                            <button type="button" onClick={() => setEditingRole(null)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateRole} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium">{t('teachers.roleNameLabelRequired')}</label>
                                <input className="form-input" value={roleForm.name} onChange={e => setRoleForm(p => ({ ...p, name: e.target.value }))} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">{t('teachers.sortLabel')}</label>
                                <input type="number" min={0} className="form-input" value={roleForm.sort_order} onChange={e => setRoleForm(p => ({ ...p, sort_order: e.target.value }))} />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn btn-primary flex-1" disabled={savingRole}>
                                    {savingRole ? t('common.loading') : t('common.update')}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setEditingRole(null)}>{t('common.cancel')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Belge Görüntüleyici Modal ─────────────────────────── */}
            {docModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={() => setDocModal(null)}>
                    <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-2xl dark:bg-[#0e1726]" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-[#ebedf2] px-5 py-3 dark:border-[#1b2e4b]">
                            <p className="text-sm font-semibold text-dark dark:text-white">{docModal.name}</p>
                            <button type="button" onClick={() => setDocModal(null)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-2">
                            {docModal.mimeType.startsWith('image/') ? (
                                <img src={docModal.blobUrl} alt={docModal.name} className="mx-auto max-h-[80vh] max-w-full object-contain rounded" />
                            ) : (
                                <iframe src={docModal.blobUrl} className="h-[80vh] w-full rounded border-0" title={docModal.name} />
                            )}
                        </div>
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
                                            {viewingTeacher.membership_status === 'active' ? t('teachers.statusActive') : t('teachers.statusInactive')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button type="button" onClick={closeDetail} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Sekmeler */}
                        <div className="flex overflow-x-auto border-b border-[#ebedf2] dark:border-[#1b2e4b]">
                            {([
                                { key: 'info', icon: <Phone className="h-4 w-4" />, label: t('teachers.contactAndGeneral') },
                                { key: 'education', icon: <GraduationCap className="h-4 w-4" />, label: t('teachers.educationTab') },
                                { key: 'certificates', icon: <Award className="h-4 w-4" />, label: t('teachers.certificatesTab') },
                                { key: 'courses', icon: <CourseIcon className="h-4 w-4" />, label: t('teachers.coursesTab') },
                                { key: 'skills', icon: <Zap className="h-4 w-4" />, label: t('teachers.skillsTab') },
                                { key: 'blogs', icon: <FileText className="h-4 w-4" />, label: t('teachers.blogsTab') },
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
                                        <InfoRow icon={<Phone className="h-4 w-4" />} label={t('teachers.inviteEmailLabel').replace(' *', '')} value={viewingTeacher.email} />
                                        <InfoRow icon={<Phone className="h-4 w-4" />} label={t('teachers.phoneLabel')} value={viewingTeacher.phone ? `${viewingTeacher.phone_country_code ?? ''} ${viewingTeacher.phone}`.trim() : null} />
                                        <InfoRow icon={<Phone className="h-4 w-4" />} label={t('teachers.whatsappLabel')} value={viewingTeacher.whatsapp_number ? `${viewingTeacher.whatsapp_country_code ?? ''} ${viewingTeacher.whatsapp_number}`.trim() : null} />
                                        <InfoRow icon={<GraduationCap className="h-4 w-4" />} label={t('teachers.experienceCol')} value={viewingTeacher.experience_years != null ? t('teachers.yearsExp', { count: viewingTeacher.experience_years }) : null} />
                                        <InfoRow icon={<Building2 className="h-4 w-4" />} label={t('teachers.employmentCol')} value={getEmploymentLabel(viewingTeacher.employment_type ?? '')} />
                                        <InfoRow icon={<Building2 className="h-4 w-4" />} label={t('teachers.hireDateLabel')} value={viewingTeacher.hire_date ? new Date(viewingTeacher.hire_date).toLocaleDateString('tr-TR') : null} />
                                        {viewingTeacher.linkedin_url && <InfoRow icon={<Globe className="h-4 w-4" />} label="LinkedIn" value={viewingTeacher.linkedin_url} />}
                                        {viewingTeacher.website_url && <InfoRow icon={<Globe className="h-4 w-4" />} label="Website" value={viewingTeacher.website_url} />}
                                    </div>
                                    {viewingTeacher.bio && (
                                        <div className="rounded border border-[#ebedf2] p-3 dark:border-[#1b2e4b]">
                                            <p className="mb-1 text-xs font-semibold text-[#888ea8]">{t('teachers.bioSection')}</p>
                                            <p className="text-sm text-dark dark:text-white-light">{viewingTeacher.bio}</p>
                                        </div>
                                    )}
                                    {viewingTeacher.schools && viewingTeacher.schools.length > 0 && (
                                        <div>
                                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#888ea8]">{t('teachers.assignedSchools')}</p>
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
                                        <EmptyState icon={<GraduationCap />} text={t('teachers.noEducation')} />
                                    ) : viewingTeacher.educations.map(e => (
                                        <div key={e.id} className="rounded border border-[#ebedf2] p-3 dark:border-[#1b2e4b]">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-dark dark:text-white">{e.institution}</p>
                                                    <p className="text-sm">{e.degree} {e.field_of_study && `— ${e.field_of_study}`}</p>
                                                    {e.approval_status === 'pending' && (
                                                        <span className="inline-flex items-center gap-1 mt-1 badge badge-outline-warning text-xs"><Clock className="h-3 w-3" />Onay Bekliyor</span>
                                                    )}
                                                    {e.approval_status === 'approved' && (
                                                        <span className="inline-flex items-center gap-1 mt-1 badge badge-outline-success text-xs"><CheckCircle className="h-3 w-3" />Onaylandı</span>
                                                    )}
                                                    {e.approval_status === 'rejected' && (
                                                        <div>
                                                            <span className="inline-flex items-center gap-1 mt-1 badge badge-outline-danger text-xs"><XCircle className="h-3 w-3" />Reddedildi</span>
                                                            {e.rejection_reason && <p className="mt-1 text-xs text-danger italic">"{e.rejection_reason}"</p>}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-2 shrink-0">
                                                    <span className="text-xs text-[#888ea8] whitespace-nowrap">
                                                        {e.start_date ? new Date(e.start_date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' }) : '?'}
                                                        {' — '}
                                                        {e.is_current ? t('teachers.ongoing') : e.end_date ? new Date(e.end_date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' }) : '?'}
                                                    </span>
                                                    <div className="flex gap-1">
                                                        {e.approval_status !== 'approved' && (
                                                            <button
                                                                onClick={() => handleApproveCredential('education', e.id)}
                                                                disabled={approvingId === `education-${e.id}`}
                                                                className="btn btn-success btn-sm h-7 min-h-0 px-2 text-xs gap-1"
                                                            >
                                                                <CheckCircle className="h-3.5 w-3.5" />Onayla
                                                            </button>
                                                        )}
                                                        {e.approval_status !== 'rejected' && (
                                                            <button
                                                                onClick={() => handleRejectCredential('education', e.id)}
                                                                disabled={approvingId === `education-${e.id}`}
                                                                className="btn btn-danger btn-sm h-7 min-h-0 px-2 text-xs gap-1"
                                                            >
                                                                <XCircle className="h-3.5 w-3.5" />Reddet
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {e.country && <p className="mt-1 text-xs text-[#888ea8]">{e.country.name}</p>}
                                            {e.description && <p className="mt-2 text-xs text-[#888ea8]">{e.description}</p>}
                                            {e.document_url && (
                                                <button
                                                    type="button"
                                                    onClick={() => { const d = docBlobUrls[e.document_url!]; if (d) { setDocModal({ ...d, name: `${e.institution} Belgesi` }); } }}
                                                    disabled={!docBlobUrls[e.document_url]}
                                                    className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:cursor-wait disabled:opacity-50"
                                                >
                                                    <FileText className="h-3 w-3" />{docBlobUrls[e.document_url] ? 'Belgeyi Görüntüle' : 'Yükleniyor...'}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!loadingDetail && detailTab === 'certificates' && (
                                <div className="space-y-3">
                                    {viewingTeacher.certificates.length === 0 ? (
                                        <EmptyState icon={<Award />} text={t('teachers.noCertificate')} />
                                    ) : viewingTeacher.certificates.map(c => (
                                        <div key={c.id} className="rounded border border-[#ebedf2] p-3 dark:border-[#1b2e4b]">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-dark dark:text-white">{c.name}</p>
                                                    {c.issuing_organization && <p className="text-sm text-[#888ea8]">{c.issuing_organization}</p>}
                                                    {c.approval_status === 'pending' && (
                                                        <span className="inline-flex items-center gap-1 mt-1 badge badge-outline-warning text-xs"><Clock className="h-3 w-3" />Onay Bekliyor</span>
                                                    )}
                                                    {c.approval_status === 'approved' && (
                                                        <span className="inline-flex items-center gap-1 mt-1 badge badge-outline-success text-xs"><CheckCircle className="h-3 w-3" />Onaylandı</span>
                                                    )}
                                                    {c.approval_status === 'rejected' && (
                                                        <div>
                                                            <span className="inline-flex items-center gap-1 mt-1 badge badge-outline-danger text-xs"><XCircle className="h-3 w-3" />Reddedildi</span>
                                                            {c.rejection_reason && <p className="mt-1 text-xs text-danger italic">"{c.rejection_reason}"</p>}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-2 shrink-0">
                                                    <span className="text-xs text-[#888ea8] whitespace-nowrap">
                                                        {c.issue_date ? new Date(c.issue_date).toLocaleDateString('tr-TR') : '—'}
                                                        {c.expiry_date && ` — ${new Date(c.expiry_date).toLocaleDateString('tr-TR')}`}
                                                    </span>
                                                    <div className="flex gap-1">
                                                        {c.approval_status !== 'approved' && (
                                                            <button
                                                                onClick={() => handleApproveCredential('certificate', c.id)}
                                                                disabled={approvingId === `certificate-${c.id}`}
                                                                className="btn btn-success btn-sm h-7 min-h-0 px-2 text-xs gap-1"
                                                            >
                                                                <CheckCircle className="h-3.5 w-3.5" />Onayla
                                                            </button>
                                                        )}
                                                        {c.approval_status !== 'rejected' && (
                                                            <button
                                                                onClick={() => handleRejectCredential('certificate', c.id)}
                                                                disabled={approvingId === `certificate-${c.id}`}
                                                                className="btn btn-danger btn-sm h-7 min-h-0 px-2 text-xs gap-1"
                                                            >
                                                                <XCircle className="h-3.5 w-3.5" />Reddet
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-1 flex flex-wrap gap-3">
                                                {c.credential_url && (
                                                    <a href={c.credential_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">{t('teachers.viewCredential')}</a>
                                                )}
                                                {c.document_url && (
                                                    <button
                                                        type="button"
                                                        onClick={() => { const d = docBlobUrls[c.document_url!]; if (d) { setDocModal({ ...d, name: `${c.name} Belgesi` }); } }}
                                                        disabled={!docBlobUrls[c.document_url]}
                                                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:cursor-wait disabled:opacity-50"
                                                    >
                                                        <FileText className="h-3 w-3" />{docBlobUrls[c.document_url] ? 'Belgeyi Görüntüle' : 'Yükleniyor...'}
                                                    </button>
                                                )}
                                            </div>
                                            {c.description && <p className="mt-2 text-xs text-[#888ea8]">{c.description}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!loadingDetail && detailTab === 'courses' && (
                                <div className="space-y-3">
                                    {viewingTeacher.courses.length === 0 ? (
                                        <EmptyState icon={<CourseIcon />} text={t('teachers.noCourse')} />
                                    ) : viewingTeacher.courses.map(c => (
                                        <div key={c.id} className="rounded border border-[#ebedf2] p-3 dark:border-[#1b2e4b]">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-dark dark:text-white">{c.title}</p>
                                                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                                        <span className="badge badge-outline-primary text-xs">{getCourseTypeLabel(c.type)}</span>
                                                        {c.provider && <span className="text-xs text-[#888ea8]">{c.provider}</span>}
                                                        {c.is_online && <span className="badge badge-outline-info text-xs">Online</span>}
                                                        {c.duration_hours && <span className="text-xs text-[#888ea8]">{c.duration_hours} {t('teachers.hoursUnit')}</span>}
                                                    </div>
                                                    {c.approval_status === 'pending' && (
                                                        <span className="inline-flex items-center gap-1 mt-1 badge badge-outline-warning text-xs"><Clock className="h-3 w-3" />Onay Bekliyor</span>
                                                    )}
                                                    {c.approval_status === 'approved' && (
                                                        <span className="inline-flex items-center gap-1 mt-1 badge badge-outline-success text-xs"><CheckCircle className="h-3 w-3" />Onaylandı</span>
                                                    )}
                                                    {c.approval_status === 'rejected' && (
                                                        <div>
                                                            <span className="inline-flex items-center gap-1 mt-1 badge badge-outline-danger text-xs"><XCircle className="h-3 w-3" />Reddedildi</span>
                                                            {c.rejection_reason && <p className="mt-1 text-xs text-danger italic">"{c.rejection_reason}"</p>}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-2 shrink-0">
                                                    <span className="text-xs text-[#888ea8] whitespace-nowrap">
                                                        {c.start_date ? new Date(c.start_date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' }) : '?'}
                                                        {c.end_date && ` — ${new Date(c.end_date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' })}`}
                                                    </span>
                                                    <div className="flex gap-1">
                                                        {c.approval_status !== 'approved' && (
                                                            <button
                                                                onClick={() => handleApproveCredential('course', c.id)}
                                                                disabled={approvingId === `course-${c.id}`}
                                                                className="btn btn-success btn-sm h-7 min-h-0 px-2 text-xs gap-1"
                                                            >
                                                                <CheckCircle className="h-3.5 w-3.5" />Onayla
                                                            </button>
                                                        )}
                                                        {c.approval_status !== 'rejected' && (
                                                            <button
                                                                onClick={() => handleRejectCredential('course', c.id)}
                                                                disabled={approvingId === `course-${c.id}`}
                                                                className="btn btn-danger btn-sm h-7 min-h-0 px-2 text-xs gap-1"
                                                            >
                                                                <XCircle className="h-3.5 w-3.5" />Reddet
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {c.location && <p className="mt-1 text-xs text-[#888ea8]">📍 {c.location}</p>}
                                            {c.document_url && (
                                                <button
                                                    type="button"
                                                    onClick={() => { const d = docBlobUrls[c.document_url!]; if (d) { setDocModal({ ...d, name: `${c.title} Belgesi` }); } }}
                                                    disabled={!docBlobUrls[c.document_url]}
                                                    className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:cursor-wait disabled:opacity-50"
                                                >
                                                    <FileText className="h-3 w-3" />{docBlobUrls[c.document_url] ? 'Belgeyi Görüntüle' : 'Yükleniyor...'}
                                                </button>
                                            )}
                                            {c.description && <p className="mt-2 text-xs text-[#888ea8]">{c.description}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!loadingDetail && detailTab === 'skills' && (
                                <div>
                                    {viewingTeacher.skills.length === 0 ? (
                                        <EmptyState icon={<Zap />} text={t('teachers.noSkill')} />
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {viewingTeacher.skills.map(s => (
                                                <div key={s.id} className="flex items-center gap-1.5 rounded-full border border-[#ebedf2] px-3 py-1.5 dark:border-[#1b2e4b]">
                                                    <span className="text-sm font-medium text-dark dark:text-white">{s.name}</span>
                                                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${SKILL_LEVEL_BADGE[s.level] ?? 'bg-gray-100 text-gray-600'}`}>
                                                        {getSkillLevelLabel(s.level)}
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
                                        <EmptyState icon={<FileText />} text={t('teachers.noBlog')} />
                                    ) : viewingTeacher.blog_posts.map(p => (
                                        <div key={p.id} className="rounded border border-[#ebedf2] dark:border-[#1b2e4b] overflow-hidden">
                                            {p.image_url && (
                                                <img
                                                    src={p.image_url}
                                                    alt={p.title}
                                                    className="h-40 w-full object-cover"
                                                />
                                            )}
                                            <div className="p-3">
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
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="border-t border-[#ebedf2] p-4 dark:border-[#1b2e4b]">
                            <button type="button" className="btn btn-outline-secondary w-full" onClick={closeDetail}>{t('teachers.closeBtn')}</button>
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


const SKILL_LEVEL_BADGE: Record<string, string> = {
    beginner: 'bg-gray-100 text-gray-600',
    intermediate: 'bg-blue-50 text-blue-600',
    advanced: 'bg-green-50 text-green-600',
    expert: 'bg-purple-50 text-purple-600',
};
