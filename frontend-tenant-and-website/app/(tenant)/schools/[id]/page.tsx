'use client';
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import apiClient from '@/lib/apiClient';
import AuthImg from '@/components/AuthImg';
import { School, SchoolClass, Child, Teacher, AcademicYear, SchoolTeacher, TeacherRoleType, TeacherProfile, EnrollmentRequest, SchoolParent } from '@/types';
import { ArrowLeft, Plus, Trash2, Edit2, Users, BookOpen, X, UserPlus, ToggleLeft, ToggleRight, GraduationCap, Copy, RefreshCw, CheckCircle, XCircle, Clock, UserCheck, ChevronDown, ChevronRight, Baby, Eye } from 'lucide-react';

type ClassForm = { name: string; description: string; age_min: string; age_max: string; capacity: string; color: string; icon: string; academic_year_id: string };
const emptyClassForm: ClassForm = { name: '', description: '', age_min: '', age_max: '', capacity: '20', color: '', icon: '', academic_year_id: '' };

const CLASS_COLORS = [
    '#FF6B6B', '#FF8E53', '#FFC300', '#A8E063', '#56AB2F',
    '#43C6AC', '#00B4D8', '#4285F4', '#7B2FBE', '#E91E8C',
    '#FF5F6D', '#FFA500', '#FFD700', '#90EE90', '#20B2AA',
    '#87CEEB', '#6A5ACD', '#DA70D6', '#F08080', '#98D8C8',
];

const CLASS_ICONS = [
    '🌟', '⭐', '🌈', '☀️', '🌙', '🌸', '🌺', '🌻', '🌼', '🍀',
    '🦋', '🐱', '🐶', '🐰', '🦊', '🐻', '🐼', '🐨', '🐸', '🦁',
    '🐬', '🦒', '🦄', '🐠', '🦜', '🦅', '🐣', '🐥', '🦔', '🐞',
    '🍎', '🍓', '🍊', '🍋', '🍇', '🍒', '🍑', '🍌', '🥝', '🍉',
    '✏️', '📚', '🎨', '🎵', '🎸', '🎺', '🎻', '🥁', '🎤', '🎭',
    '🚀', '✈️', '🚂', '⛵', '🏠', '🏰', '⛄', '🌊', '🏖️', '🎠',
    '🎈', '🎉', '🎁', '🎊', '🎀', '🏆', '🥇', '💎', '🔮', '🎯',
];

const ICON_CATEGORIES_KEYS = [
    { labelKey: 'schools.detail.iconCatNature', icons: ['🌟', '⭐', '🌈', '☀️', '🌙', '🌸', '🌺', '🌻', '🌼', '🍀'] },
    { labelKey: 'schools.detail.iconCatAnimals', icons: ['🦋', '🐱', '🐶', '🐰', '🦊', '🐻', '🐼', '🐨', '🐸', '🦁', '🐬', '🦒', '🦄', '🐠', '🦜', '🦅', '🐣', '🐥', '🦔', '🐞'] },
    { labelKey: 'schools.detail.iconCatFruits', icons: ['🍎', '🍓', '🍊', '🍋', '🍇', '🍒', '🍑', '🍌', '🥝', '🍉'] },
    { labelKey: 'schools.detail.iconCatArtMusic', icons: ['✏️', '📚', '🎨', '🎵', '🎸', '🎺', '🎻', '🥁', '🎤', '🎭'] },
    { labelKey: 'schools.detail.iconCatAdventure', icons: ['🚀', '✈️', '🚂', '⛵', '🏠', '🏰', '⛄', '🌊', '🏖️', '🎠'] },
    { labelKey: 'schools.detail.iconCatCelebration', icons: ['🎈', '🎉', '🎁', '🎊', '🎀', '🏆', '🥇', '💎', '🔮', '🎯'] },
];

export default function SchoolDetailPage() {
    const { t } = useTranslation();
    const params = useParams();
    const id = params.id as string;

    const [school, setSchool] = useState<School | null>(null);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [children, setChildren] = useState<Child[]>([]);
    const [selectedChild, setSelectedChild] = useState<Child | null>(null);
    const [loadingChildDetail, setLoadingChildDetail] = useState(false);
    const [showClassAssignModal, setShowClassAssignModal] = useState(false);
    const [assigningChildToClass, setAssigningChildToClass] = useState(false);
    const [selectedClassIdForAssign, setSelectedClassIdForAssign] = useState('');

    // Sınıf satırından öğrenci atama
    const [showClassStudentModal, setShowClassStudentModal] = useState(false);
    const [classForStudentAssign, setClassForStudentAssign] = useState<SchoolClass | null>(null);
    const [studentAssignChildId, setStudentAssignChildId] = useState('');
    const [assigningStudentToClass, setAssigningStudentToClass] = useState(false);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'classes' | 'children' | 'teachers' | 'requests' | 'parents' | 'child-requests' | 'removal-requests'>('classes');

    // School-level teacher management
    const [schoolLevelTeachers, setSchoolLevelTeachers] = useState<SchoolTeacher[]>([]);
    const [loadingSchoolTeachers, setLoadingSchoolTeachers] = useState(false);
    const [teachersFetched, setTeachersFetched] = useState(false);
    const [roleTypes, setRoleTypes] = useState<TeacherRoleType[]>([]);
    const [selectedTeacherDetail, setSelectedTeacherDetail] = useState<SchoolTeacher | null>(null);
    const [selectedFamilyDetail, setSelectedFamilyDetail] = useState<SchoolParent | null>(null);

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

    // Child enrollment requests
    type ChildEnrollmentRequest = {
        id: number;
        status: 'pending' | 'approved' | 'rejected';
        rejection_reason: string | null;
        created_at: string;
        parent: { id: number; name: string; surname: string; email: string; phone: string | null } | null;
        child: {
            id: number; first_name: string; last_name: string; full_name: string;
            birth_date: string | null; gender: string | null; blood_type: string | null;
            identity_number: string | null; passport_number: string | null;
            parent_notes: string | null; special_notes: string | null;
            languages: string[] | null;
            nationality: { name: string; flag_emoji: string | null } | null;
            allergens: { id: number; name: string; status: string }[];
            conditions: { id: number; name: string; status: string }[];
            medications: { id: number; name: string }[];
        } | null;
    };
    const [childEnrollmentRequests, setChildEnrollmentRequests] = useState<ChildEnrollmentRequest[]>([]);
    const [loadingChildRequests, setLoadingChildRequests] = useState(false);
    const [childRequestsFetched, setChildRequestsFetched] = useState(false);
    const [childRequestsFilter, setChildRequestsFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
    const [childRequestsMeta, setChildRequestsMeta] = useState({ current_page: 1, last_page: 1 });
    const [selectedParentDetail, setSelectedParentDetail] = useState<ChildEnrollmentRequest['parent'] | null>(null);
    const [selectedChildDetail, setSelectedChildDetail] = useState<ChildEnrollmentRequest['child'] | null>(null);
    const [showRejectChildModal, setShowRejectChildModal] = useState(false);
    const [rejectChildTargetId, setRejectChildTargetId] = useState<number | null>(null);
    const [rejectionChildReason, setRejectionChildReason] = useState('');
    const [savingChildReject, setSavingChildReject] = useState(false);

    // ── Çocuk Silme Talepleri ──
    type RemovalRequest = {
        id: number;
        status: 'pending' | 'approved' | 'rejected';
        reason: string | null;
        rejection_reason: string | null;
        reviewed_at: string | null;
        created_at: string;
        child: { id: number; full_name: string; birth_date: string | null; gender: string | null } | null;
        owner_name: string | null;
        owner_phone: string | null;
        owner_email: string | null;
    };
    const [removalRequests, setRemovalRequests] = useState<RemovalRequest[]>([]);
    const [removalRequestsFetched, setRemovalRequestsFetched] = useState(false);
    const [removalRequestsFilter, setRemovalRequestsFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
    const [showRejectRemovalModal, setShowRejectRemovalModal] = useState(false);
    const [rejectRemovalTargetId, setRejectRemovalTargetId] = useState<number | null>(null);
    const [rejectionRemovalReason, setRejectionRemovalReason] = useState('');
    const [savingRemovalReject, setSavingRemovalReject] = useState(false);

    // Invite info
    const [inviteInfo, setInviteInfo] = useState<{ registration_code: string; invite_token: string } | null>(null);
    const [regeneratingInvite, setRegeneratingInvite] = useState(false);

    // Class CRUD
    const [showClassModal, setShowClassModal] = useState(false);
    const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
    const [classForm, setClassForm] = useState<ClassForm>(emptyClassForm);
    const [savingClass, setSavingClass] = useState(false);
    // Logo upload & crop
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null); // canvas/blob URL (yerel)
    const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null); // API signed URL (auth gerekli)
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [cropX, setCropX] = useState(0);
    const [cropY, setCropY] = useState(0);
    const [cropSize, setCropSize] = useState(200);
    const [showIconPicker, setShowIconPicker] = useState(false);

    // Teacher assignment
    const [showTeacherModal, setShowTeacherModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
    const [classTeachers, setClassTeachers] = useState<Teacher[]>([]);
    const [schoolTeachers, setSchoolTeachers] = useState<Teacher[]>([]);
    const [assigningTeacher, setAssigningTeacher] = useState(false);
    const [selectedTeacherId, setSelectedTeacherId] = useState('');
    const [classTeacherRoleTypeId, setClassTeacherRoleTypeId] = useState('');

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [schoolRes, classesRes, childrenRes, yearsRes, childRequestsRes, teachersRes, parentsRes] = await Promise.all([
                apiClient.get(`/schools/${id}`),
                apiClient.get(`/schools/${id}/classes`).catch(() => ({ data: { data: [] } })),
                apiClient.get(`/schools/${id}/children`).catch(() => ({ data: { data: [] } })),
                apiClient.get('/academic-years', { params: { school_id: id } }).catch(() => ({ data: { data: [] } })),
                apiClient.get(`/schools/${id}/child-enrollment-requests`, { params: { status: 'pending' } }).catch(() => ({ data: { data: [] } })),
                apiClient.get(`/schools/${id}/teachers`, { params: { detailed: 1 } }).catch(() => ({ data: { data: [] } })),
                apiClient.get(`/schools/${id}/parents`).catch(() => ({ data: { data: [] } })),
            ]);
            if (schoolRes.data?.data) setSchool(schoolRes.data.data);
            if (classesRes.data?.data) setClasses(classesRes.data.data);
            if (childrenRes.data?.data) setChildren(childrenRes.data.data);
            if (yearsRes.data?.data) setAcademicYears(yearsRes.data.data);
            if (childRequestsRes.data?.data) {
                setChildEnrollmentRequests(childRequestsRes.data.data);
                setChildRequestsFetched(true);
            }
            if (teachersRes.data?.data) {
                setSchoolLevelTeachers(teachersRes.data.data);
                setTeachersFetched(true);
            }
            if (parentsRes.data?.data) {
                setParents(parentsRes.data.data);
                setParentsFetched(true);
            }
        } catch {
            toast.error(t('schools.detail.loadError'));
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleAssignChildToClass = async () => {
        if (!selectedChild || !selectedClassIdForAssign) return;
        setAssigningChildToClass(true);
        try {
            await apiClient.post(`/schools/${id}/classes/${selectedClassIdForAssign}/children`, {
                child_id: selectedChild.id,
            });
            toast.success(t('schools.detail.studentAssignedToClass'));
            setShowClassAssignModal(false);
            setSelectedClassIdForAssign('');
            // Çocuk detayını yenile
            const res = await apiClient.get(`/schools/${id}/children/${selectedChild.id}`);
            setSelectedChild(res.data?.data ?? null);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? t('schools.detail.studentAssignError'));
        } finally {
            setAssigningChildToClass(false);
        }
    };

    const openClassStudentModal = (cls: SchoolClass) => {
        setClassForStudentAssign(cls);
        setStudentAssignChildId('');
        setShowClassStudentModal(true);
    };

    const handleAssignStudentToClass = async () => {
        if (!classForStudentAssign || !studentAssignChildId) return;
        setAssigningStudentToClass(true);
        try {
            await apiClient.post(`/schools/${id}/classes/${classForStudentAssign.id}/children`, {
                child_id: studentAssignChildId,
            });
            toast.success(t('schools.detail.studentAssignedToClass'));
            setShowClassStudentModal(false);
            loadData();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? t('schools.detail.studentAssignError'));
        } finally {
            setAssigningStudentToClass(false);
        }
    };

    const handleRemoveChildFromClass = async (classId: number, className: string) => {
        if (!selectedChild) return;
        const result = await Swal.fire({
            title: t('schools.detail.removeFromClassTitle'),
            text: t('schools.detail.removeFromClassText').replace('{name}', selectedChild.full_name).replace('{class}', className),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('schools.detail.removeFromClassConfirm'),
            cancelButtonText: t('common.cancel'),
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.delete(`/schools/${id}/classes/${classId}/children/${selectedChild.id}`);
            toast.success(t('schools.detail.removeFromClassSuccess'));
            const res = await apiClient.get(`/schools/${id}/children/${selectedChild.id}`);
            setSelectedChild(res.data?.data ?? null);
        } catch {
            toast.error(t('schools.detail.operationFailed'));
        }
    };

    const openChildDetail = async (childId: number) => {
        setLoadingChildDetail(true);
        setSelectedChild(null);
        try {
            const res = await apiClient.get(`/schools/${id}/children/${childId}`);
            setSelectedChild(res.data?.data ?? null);
        } catch {
            toast.error(t('schools.detail.childDetailLoadError'));
        } finally {
            setLoadingChildDetail(false);
        }
    };

    const fetchSchoolLevelTeachers = useCallback(async () => {
        setLoadingSchoolTeachers(true);
        try {
            const res = await apiClient.get(`/schools/${id}/teachers`, { params: { detailed: 1 } });
            setSchoolLevelTeachers(res.data?.data ?? []);
            setTeachersFetched(true);
        } catch {
            toast.error(t('schools.detail.teachersLoadError'));
        } finally {
            setLoadingSchoolTeachers(false);
        }
    }, [id]);


    const handleUnenrollChild = async (child: Child, e: React.MouseEvent) => {
        e.stopPropagation();
        const result = await Swal.fire({
            title: t('schools.detail.unenrollTitle'),
            text: t('schools.detail.unenrollText').replace('{name}', `${child.first_name} ${child.last_name}`),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('schools.detail.unenrollConfirm'),
            cancelButtonText: t('common.cancel'),
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.patch(`/schools/${id}/children/${child.id}/unenroll`);
            toast.success(t('schools.detail.unenrollSuccess'));
            setChildren((prev) => prev.filter((c) => c.id !== child.id));
        } catch {
            toast.error(t('schools.detail.operationFailed'));
        }
    };

    const handleRemoveTeacherFromSchool = async (teacher: SchoolTeacher) => {
        const result = await Swal.fire({
            title: t('schools.detail.removeTeacherFromSchoolTitle'),
            text: t('schools.detail.removeTeacherFromSchoolText').replace('{name}', teacher.name),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('schools.detail.removeTeacherConfirm'),
            cancelButtonText: t('common.cancel'),
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.delete(`/schools/${id}/teachers/${teacher.id}`);
            toast.success(t('schools.detail.removeTeacherFromSchoolSuccess'));
            fetchSchoolLevelTeachers();
        } catch {
            toast.error(t('schools.detail.operationFailed'));
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
            toast.error(t('schools.detail.requestsLoadError'));
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
            toast.error(t('schools.detail.parentsLoadError'));
        } finally {
            setLoadingParents(false);
        }
    }, [id]);

    const fetchChildEnrollmentRequests = useCallback(async (status = 'pending', page = 1) => {
        setLoadingChildRequests(true);
        try {
            const res = await apiClient.get(`/schools/${id}/child-enrollment-requests`, {
                params: { status, page },
            });
            setChildEnrollmentRequests(res.data?.data ?? []);
            setChildRequestsMeta(res.data?.meta ?? { current_page: 1, last_page: 1 });
            setChildRequestsFetched(true);
        } catch {
            toast.error(t('schools.detail.childRequestsLoadError'));
        } finally {
            setLoadingChildRequests(false);
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
        if (tab === 'child-requests' && !childRequestsFetched && !loadingChildRequests) {
            fetchChildEnrollmentRequests('pending');
        }
        if (tab === 'removal-requests' && !removalRequestsFetched) {
            void fetchRemovalRequests('pending');
        }
    };

    const fetchRemovalRequests = async (status: 'pending' | 'approved' | 'rejected' | 'all') => {
        try {
            const res = await apiClient.get(`/schools/${id}/child-removal-requests`, { params: { status } });
            setRemovalRequests(res.data?.data ?? []);
            setRemovalRequestsFetched(true);
        } catch {
            toast.error(t('schools.detail.removalRequestsLoadError'));
        }
    };

    const handleApproveRemoval = async (requestId: number) => {
        const result = await Swal.fire({
            title: t('schools.detail.approveRemovalTitle'),
            text: t('schools.detail.approveRemovalText'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('swal.confirmDelete'),
            cancelButtonText: t('common.cancel'),
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.patch(`/schools/${id}/child-removal-requests/${requestId}/approve`);
            toast.success(t('schools.detail.approveRemovalSuccess'));
            void fetchRemovalRequests(removalRequestsFilter);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? t('schools.detail.errorOccurred'));
        }
    };

    const handleRejectRemoval = async () => {
        if (!rejectRemovalTargetId || !rejectionRemovalReason.trim()) return;
        setSavingRemovalReject(true);
        try {
            await apiClient.patch(`/schools/${id}/child-removal-requests/${rejectRemovalTargetId}/reject`, {
                rejection_reason: rejectionRemovalReason.trim(),
            });
            toast.success(t('schools.detail.rejectEnrollmentSuccess'));
            setShowRejectRemovalModal(false);
            setRejectionRemovalReason('');
            setRejectRemovalTargetId(null);
            void fetchRemovalRequests(removalRequestsFilter);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? t('schools.detail.errorOccurred'));
        } finally {
            setSavingRemovalReject(false);
        }
    };

    const handleRequestsFilterChange = (f: '' | 'pending' | 'approved' | 'rejected') => {
        setRequestsFilter(f);
        fetchEnrollmentRequests(f);
    };

    const handleApprove = async (requestId: number) => {
        const result = await Swal.fire({
            title: t('schools.detail.approveEnrollmentTitle'),
            text: t('schools.detail.approveEnrollmentText'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: t('swal.confirmApprove'),
            cancelButtonText: t('common.cancel'),
            confirmButtonColor: '#00ab55',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.patch(`/schools/${id}/enrollment-requests/${requestId}/approve`);
            toast.success(t('schools.detail.approveEnrollmentSuccess'));
            fetchEnrollmentRequests(requestsFilter);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? t('schools.detail.approveEnrollmentError'));
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
            toast.success(t('schools.detail.rejectEnrollmentSuccess'));
            setShowRejectModal(false);
            fetchEnrollmentRequests(requestsFilter);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? t('schools.detail.rejectEnrollmentError'));
        } finally {
            setSavingReject(false);
        }
    };

    const handleApproveChildRequest = async (requestId: number, childName: string) => {
        const result = await Swal.fire({
            title: t('schools.detail.approveChildEnrollmentTitle'),
            text: t('schools.detail.approveChildEnrollmentText').replace('{name}', childName),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: t('schools.detail.approveChildEnrollmentConfirm'),
            cancelButtonText: t('common.cancel'),
            confirmButtonColor: '#00ab55',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.patch(`/schools/${id}/child-enrollment-requests/${requestId}/approve`);
            toast.success(t('schools.detail.approveChildEnrollmentSuccess'));
            // Öğrenci listesini ve talep listesini yenile
            const childrenRes = await apiClient.get(`/schools/${id}/children`).catch(() => ({ data: { data: [] } }));
            if (childrenRes.data?.data) setChildren(childrenRes.data.data);
            fetchChildEnrollmentRequests(childRequestsFilter);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? t('schools.detail.approveEnrollmentError'));
        }
    };

    const openRejectChildModal = (requestId: number) => {
        setRejectChildTargetId(requestId);
        setRejectionChildReason('');
        setShowRejectChildModal(true);
    };

    const handleRejectChildSubmit = async () => {
        if (!rejectChildTargetId || !rejectionChildReason.trim()) return;
        setSavingChildReject(true);
        try {
            await apiClient.patch(`/schools/${id}/child-enrollment-requests/${rejectChildTargetId}/reject`, {
                rejection_reason: rejectionChildReason,
            });
            toast.success(t('schools.detail.rejectEnrollmentSuccess'));
            setShowRejectChildModal(false);
            fetchChildEnrollmentRequests(childRequestsFilter);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? t('schools.detail.rejectEnrollmentError'));
        } finally {
            setSavingChildReject(false);
        }
    };

    const handleRegenerateInvite = async () => {
        const result = await Swal.fire({
            title: t('schools.detail.regenerateInviteTitle'),
            text: t('schools.detail.regenerateInviteText'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('schools.detail.regenerateInviteConfirm'),
            cancelButtonText: t('common.cancel'),
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) return;
        setRegeneratingInvite(true);
        try {
            const res = await apiClient.post(`/schools/${id}/invite/regenerate`);
            setInviteInfo(res.data?.data ?? null);
            toast.success(t('schools.detail.regenerateInviteSuccess'));
        } catch {
            toast.error(t('schools.detail.regenerateInviteError'));
        } finally {
            setRegeneratingInvite(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text).then(() => toast.success(t('schools.detail.copiedLabel').replace('{label}', label)));
    };

    // ── Sınıf CRUD ──────────────────────────────────────────────
    const openCreateClass = () => {
        setEditingClass(null);
        const active = academicYears.find(y => y.is_active);
        setClassForm({
            ...emptyClassForm,
            academic_year_id: active ? String(active.id) : (academicYears[0] ? String(academicYears[0].id) : ''),
        });
        setLogoFile(null);
        setLogoPreview(null);
        setExistingLogoUrl(null);
        setCropSrc(null);
        setShowIconPicker(false);
        setShowClassModal(true);
    };

    const openEditClass = (cls: SchoolClass) => {
        setEditingClass(cls);
        setClassForm({
            name: cls.name, description: cls.description ?? '',
            age_min: cls.age_min != null ? String(cls.age_min) : '',
            age_max: cls.age_max != null ? String(cls.age_max) : '',
            capacity: String(cls.capacity ?? 20), color: cls.color ?? '',
            icon: cls.icon ?? '',
            academic_year_id: cls.academic_year_id ? String(cls.academic_year_id) : '',
        });
        setLogoFile(null);
        setLogoPreview(null);
        setExistingLogoUrl(cls.logo_url ?? null);
        setCropSrc(null);
        setShowIconPicker(false);
        setShowClassModal(true);
    };

    const handleToggleClassStatus = async (cls: SchoolClass) => {
        const actionKey = cls.is_active !== false ? 'schools.detail.toggleInactive' : 'schools.detail.toggleActive';
        const actionTitleKey = cls.is_active !== false ? 'schools.detail.toggleInactiveTitle' : 'schools.detail.toggleActiveTitle';
        const action = t(actionKey);
        const actionTitle = t(actionTitleKey);
        const result = await Swal.fire({
            title: t('schools.detail.toggleClassTitle').replace('{action}', actionTitle),
            text: t('schools.detail.toggleClassText').replace('{name}', cls.name).replace('{action}', action),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: t('common.yes'),
            cancelButtonText: t('common.cancel'),
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.patch(`/schools/${id}/classes/${cls.id}/toggle-status`);
            toast.success(t('schools.detail.toggleClassSuccess').replace('{action}', action));
            loadData();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? t('schools.detail.toggleClassError'));
        }
    };

    const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setCropSrc(ev.target?.result as string);
            setCropX(0);
            setCropY(0);
            setCropSize(200);
            setShowCropModal(true);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleCropConfirm = () => {
        const imgEl = document.getElementById('crop-img') as HTMLImageElement | null;
        if (!imgEl) return;
        const canvas = document.createElement('canvas');
        const outputSize = 400;
        canvas.width = outputSize;
        canvas.height = outputSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const scaleX = imgEl.naturalWidth / imgEl.width;
        const scaleY = imgEl.naturalHeight / imgEl.height;
        ctx.drawImage(imgEl, cropX * scaleX, cropY * scaleY, cropSize * scaleX, cropSize * scaleY, 0, 0, outputSize, outputSize);
        canvas.toBlob((blob) => {
            if (!blob) return;
            const f = new File([blob], 'logo.jpg', { type: 'image/jpeg' });
            setLogoFile(f);
            setLogoPreview(canvas.toDataURL('image/jpeg', 0.9));
            setExistingLogoUrl(null); // yeni logo seçildi, eski URL artık geçersiz
            setClassForm(prev => ({ ...prev, icon: '' }));
            setShowCropModal(false);
            setCropSrc(null);
        }, 'image/jpeg', 0.9);
    };

    const handleClassSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!classForm.name.trim()) { toast.error(t('schools.detail.classNameRequired')); return; }
        if (!classForm.color) { toast.error(t('schools.detail.classColorRequired')); return; }
        if (!editingClass && !classForm.icon && !logoFile) { toast.error(t('schools.detail.classIconRequired')); return; }
        if (editingClass && !classForm.icon && !logoFile && !existingLogoUrl) { toast.error(t('schools.detail.classIconRequired')); return; }

        setSavingClass(true);
        const fd = new FormData();
        fd.append('name', classForm.name);
        fd.append('color', classForm.color);
        if (classForm.description) fd.append('description', classForm.description);
        if (classForm.age_min !== '') fd.append('age_min', classForm.age_min);
        if (classForm.age_max !== '') fd.append('age_max', classForm.age_max);
        fd.append('capacity', classForm.capacity || '20');
        if (classForm.academic_year_id) fd.append('academic_year_id', classForm.academic_year_id);
        if (logoFile) {
            fd.append('logo', logoFile);
        } else if (classForm.icon) {
            fd.append('icon', classForm.icon);
        }

        try {
            if (editingClass) {
                await apiClient.post(`/schools/${id}/classes/${editingClass.id}/update-media`, fd);
                toast.success(t('schools.detail.classUpdated'));
            } else {
                await apiClient.post(`/schools/${id}/classes`, fd);
                toast.success(t('schools.detail.classCreated'));
            }
            setShowClassModal(false);
            loadData();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
            const errs = error.response?.data?.errors;
            if (errs) {
                const first = Object.values(errs)[0]?.[0];
                toast.error(first ?? t('schools.detail.errorOccurred'));
            } else {
                toast.error(error.response?.data?.message ?? t('schools.detail.errorOccurred'));
            }
        } finally {
            setSavingClass(false);
        }
    };

    const handleDeleteClass = async (cls: SchoolClass) => {
        const result = await Swal.fire({
            title: t('schools.detail.deleteClassTitle'),
            text: t('schools.detail.deleteClassText').replace('{name}', cls.name),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('swal.confirmDelete'),
            cancelButtonText: t('common.cancel'),
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.delete(`/schools/${id}/classes/${cls.id}`);
            toast.success(t('schools.detail.classDeleted'));
            loadData();
        } catch {
            toast.error(t('schools.detail.classDeleteFailed'));
        }
    };

    // ── Öğretmen Atama ──────────────────────────────────────────
    const openTeacherModal = async (cls: SchoolClass) => {
        setSelectedClass(cls);
        setSelectedTeacherId('');
        setClassTeacherRoleTypeId('');
        setClassTeachers([]);
        setSchoolTeachers([]);
        setShowTeacherModal(true);
        try {
            const [teachersRes, schoolTeachersRes, roleTypesRes] = await Promise.all([
                apiClient.get(`/schools/${id}/classes/${cls.id}/teachers`),
                apiClient.get(`/schools/${id}/teachers`),
                roleTypes.length === 0 ? apiClient.get('/teacher-role-types') : Promise.resolve({ data: { data: roleTypes } }),
            ]);
            setClassTeachers(teachersRes.data?.data ?? []);
            setSchoolTeachers(schoolTeachersRes.data?.data ?? []);
            if (roleTypes.length === 0) { setRoleTypes(roleTypesRes.data?.data ?? []); }
        } catch {
            toast.error(t('schools.detail.teachersLoadError'));
        }
    };

    const handleAssignTeacher = async () => {
        if (!selectedTeacherId || !selectedClass || !classTeacherRoleTypeId) return;
        setAssigningTeacher(true);
        try {
            await apiClient.post(`/schools/${id}/classes/${selectedClass.id}/teachers`, {
                teacher_profile_id: Number(selectedTeacherId),
                teacher_role_type_id: classTeacherRoleTypeId ? Number(classTeacherRoleTypeId) : undefined,
            });
            toast.success(t('schools.detail.teacherAssignedToClass'));
            setShowTeacherModal(false);
            fetchSchoolLevelTeachers();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? t('schools.detail.teacherAssignError'));
        } finally {
            setAssigningTeacher(false);
        }
    };

    const handleRemoveTeacher = async (teacherProfileId: number) => {
        if (!selectedClass) return;
        try {
            await apiClient.delete(`/schools/${id}/classes/${selectedClass.id}/teachers/${teacherProfileId}`);
            toast.success(t('schools.detail.teacherRemovedFromClass'));
            const res = await apiClient.get(`/schools/${id}/classes/${selectedClass.id}/teachers`);
            setClassTeachers(res.data?.data ?? []);
        } catch {
            toast.error(t('schools.detail.operationFailed'));
        }
    };

    const cf = (field: keyof ClassForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setClassForm(prev => ({ ...prev, [field]: e.target.value }));

    const roleLabel = (role: string) => ({
        head_teacher: t('schools.detail.roleHeadTeacher'),
        assistant_teacher: t('schools.detail.roleAssistantTeacher'),
        substitute_teacher: t('schools.detail.roleSubstituteTeacher'),
    }[role] ?? role);
    const employmentLabel = (type?: string) => ({
        full_time: t('schools.detail.empFullTime'),
        part_time: t('schools.detail.empPartTime'),
        contract: t('schools.detail.empContract'),
        intern: t('schools.detail.empIntern'),
        volunteer: t('schools.detail.empVolunteer'),
    }[type ?? ''] ?? type ?? '—');

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!school) {
        return <div className="p-6 text-center text-[#515365] dark:text-[#888ea8]">{t('schools.detail.schoolNotFound')}</div>;
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
                <Link href="/schools" className="btn btn-sm btn-outline-secondary gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    {t('schools.detail.backBtn')}
                </Link>
                <h1 className="text-2xl font-bold text-dark dark:text-white">{school.name}</h1>
            </div>

            {/* Okul Bilgi Kartı */}
            <div className="panel mb-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {school.city && (
                        <div>
                            <p className="text-xs text-[#888ea8]">{t('schools.detail.cityLabel')}</p>
                            <p className="mt-1 font-medium text-dark dark:text-white">{school.city}</p>
                        </div>
                    )}
                    {school.address && (
                        <div>
                            <p className="text-xs text-[#888ea8]">{t('schools.detail.addressLabel')}</p>
                            <p className="mt-1 font-medium text-dark dark:text-white">{school.address}</p>
                        </div>
                    )}
                    {school.phone && (
                        <div>
                            <p className="text-xs text-[#888ea8]">{t('schools.detail.phoneLabel')}</p>
                            <p className="mt-1 font-medium text-dark dark:text-white">{school.phone}</p>
                        </div>
                    )}
                    {school.gsm && (
                        <div>
                            <p className="text-xs text-[#888ea8]">{t('schools.detail.gsmLabel')}</p>
                            <p className="mt-1 font-medium text-dark dark:text-white">{school.gsm}</p>
                        </div>
                    )}
                    {school.whatsapp && (
                        <div>
                            <p className="text-xs text-[#888ea8]">{t('schools.detail.whatsappLabel')}</p>
                            <p className="mt-1 font-medium text-dark dark:text-white">{school.whatsapp}</p>
                        </div>
                    )}
                    {school.email && (
                        <div>
                            <p className="text-xs text-[#888ea8]">{t('schools.detail.emailLabel')}</p>
                            <p className="mt-1 font-medium text-dark dark:text-white">{school.email}</p>
                        </div>
                    )}
                    <div>
                        <p className="text-xs text-[#888ea8]">{t('schools.detail.statusLabel')}</p>
                        <span className={`badge mt-1 ${school.is_active !== false ? 'badge-outline-success' : 'badge-outline-danger'}`}>
                            {school.is_active !== false ? t('schools.detail.statusActive') : t('schools.detail.statusInactive')}
                        </span>
                    </div>
                </div>

                {/* Davet Kodu Bölümü */}
                {inviteInfo && (
                    <div className="mt-4 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
                        <p className="mb-3 text-sm font-semibold text-primary">{t('schools.detail.inviteInfoTitle')}</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <p className="text-xs text-[#888ea8]">{t('schools.detail.registrationCodeLabel')}</p>
                                <div className="mt-1 flex items-center gap-2">
                                    <code className="rounded bg-white px-3 py-1 text-base font-bold tracking-widest text-dark dark:bg-[#1b2e4b] dark:text-white">
                                        {inviteInfo.registration_code}
                                    </code>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary p-1.5"
                                        onClick={() => copyToClipboard(inviteInfo.registration_code, t('schools.detail.registrationCodeLabel'))}
                                        title={t('common.actions')}
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-[#888ea8]">{t('schools.detail.inviteLinkLabel')}</p>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className="max-w-[200px] truncate text-sm text-[#515365] dark:text-[#888ea8]">
                                        {`${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${inviteInfo.invite_token}`}
                                    </span>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary p-1.5"
                                        onClick={() => copyToClipboard(
                                            `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${inviteInfo.invite_token}`,
                                            t('schools.detail.inviteLinkLabel')
                                        )}
                                        title={t('schools.detail.inviteLinkLabel')}
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger p-1.5"
                                        onClick={handleRegenerateInvite}
                                        disabled={regeneratingInvite}
                                        title={t('schools.detail.regenerateInviteTitle')}
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
                        {t('schools.detail.schoolsTab')} ({classes.length})
                    </button>
                    <button
                        type="button"
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'children' ? 'border-b-2 border-primary text-primary' : 'text-[#515365] hover:text-primary dark:text-[#888ea8]'}`}
                        onClick={() => handleTabChange('children')}
                    >
                        <Users className="h-4 w-4" />
                        {t('schools.detail.childrenTab')} ({children.length})
                    </button>
                    <button
                        type="button"
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'teachers' ? 'border-b-2 border-primary text-primary' : 'text-[#515365] hover:text-primary dark:text-[#888ea8]'}`}
                        onClick={() => handleTabChange('teachers')}
                    >
                        <GraduationCap className="h-4 w-4" />
                        {t('schools.detail.teachersTab')} ({schoolLevelTeachers.length})
                    </button>
                    <button
                        type="button"
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'requests' ? 'border-b-2 border-primary text-primary' : 'text-[#515365] hover:text-primary dark:text-[#888ea8]'}`}
                        onClick={() => handleTabChange('requests')}
                    >
                        <Clock className="h-4 w-4" />
                        {t('schools.detail.requestsTab')}
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
                        {t('schools.detail.parentsTab')} ({parents.length})
                    </button>
                    <button
                        type="button"
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'child-requests' ? 'border-b-2 border-primary text-primary' : 'text-[#515365] hover:text-primary dark:text-[#888ea8]'}`}
                        onClick={() => handleTabChange('child-requests')}
                    >
                        <Baby className="h-4 w-4" />
                        {t('schools.detail.childRequestsTab')}
                        {childEnrollmentRequests.filter(r => r.status === 'pending').length > 0 && (
                            <span className="badge badge-outline-warning text-xs">{childEnrollmentRequests.filter(r => r.status === 'pending').length}</span>
                        )}
                    </button>
                    <button
                        type="button"
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'removal-requests' ? 'border-b-2 border-danger text-danger' : 'text-[#515365] hover:text-danger dark:text-[#888ea8]'}`}
                        onClick={() => handleTabChange('removal-requests')}
                    >
                        <Trash2 className="h-4 w-4" />
                        {t('schools.detail.removalRequestsTab')}
                        {removalRequests.filter(r => r.status === 'pending').length > 0 && (
                            <span className="badge badge-outline-danger text-xs">{removalRequests.filter(r => r.status === 'pending').length}</span>
                        )}
                    </button>
                </div>

                {/* Sınıflar Tab */}
                {activeTab === 'classes' && (
                    <>
                        <div className="mb-4 flex justify-end">
                            <button type="button" className="btn btn-primary btn-sm gap-2" onClick={openCreateClass}>
                                <Plus className="h-4 w-4" />
                                {t('schools.detail.addClassBtn')}
                            </button>
                        </div>
                        {classes.length === 0 ? (
                            <p className="py-8 text-center text-[#515365] dark:text-[#888ea8]">{t('schools.detail.noClass')}</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th>{t('schools.detail.classColHeader')}</th>
                                            <th>{t('schools.detail.ageGroupColHeader')}</th>
                                            <th>{t('schools.detail.capacityColHeader')}</th>
                                            <th>{t('schools.detail.studentColHeader')}</th>
                                            <th>{t('schools.detail.statusColHeader')}</th>
                                            <th>{t('schools.detail.actionsColHeader')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {classes.map((cls) => (
                                            <tr key={cls.id}>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        {/* Renk + ikon/logo */}
                                                        <div
                                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl shadow-sm"
                                                            style={{ backgroundColor: cls.color || '#e5e7eb' }}
                                                        >
                                                            {cls.logo_url ? (
                                                                <AuthImg src={cls.logo_url} alt={cls.name} className="h-10 w-10 rounded-xl object-cover" fallback={<span className="text-xl font-bold text-white">{cls.name.charAt(0)}</span>} />
                                                            ) : cls.icon ? (
                                                                <span>{cls.icon}</span>
                                                            ) : (
                                                                <span className="text-sm font-bold text-white">{cls.name.charAt(0).toUpperCase()}</span>
                                                            )}
                                                        </div>
                                                        <Link href={`/schools/${id}/classes/${cls.id}`} className="font-medium text-primary hover:underline">
                                                            {cls.name}
                                                        </Link>
                                                    </div>
                                                </td>
                                                <td>
                                                    {cls.age_min != null && cls.age_max != null
                                                        ? `${cls.age_min}–${cls.age_max} ${t('schools.detail.classAgeUnit')}`
                                                        : cls.age_min != null
                                                            ? `${cls.age_min}+ ${t('schools.detail.classAgeUnit')}`
                                                            : '—'}
                                                </td>
                                                <td>{cls.capacity ?? '—'}</td>
                                                <td>{cls.children_count ?? 0}</td>
                                                <td>
                                                    {cls.is_active !== false ? (
                                                        <span className="badge badge-outline-success">{t('schools.detail.statusActive')}</span>
                                                    ) : (
                                                        <span className="badge badge-outline-secondary">{t('schools.detail.statusInactive')}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            className={`btn btn-sm p-2 ${cls.is_active !== false ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                                            onClick={() => handleToggleClassStatus(cls)}
                                                            title={cls.is_active !== false ? t('schools.detail.toggleInactiveTitle') : t('schools.detail.toggleActiveTitle')}
                                                        >
                                                            {cls.is_active !== false
                                                                ? <ToggleRight className="h-4 w-4" />
                                                                : <ToggleLeft className="h-4 w-4" />
                                                            }
                                                        </button>
                                                        <button type="button" className="btn btn-sm btn-outline-success p-2" onClick={() => openClassStudentModal(cls)} title={t('schools.detail.assignStudentModalTitle')}>
                                                            <Baby className="h-4 w-4" />
                                                        </button>
                                                        <button type="button" className="btn btn-sm btn-outline-info p-2" onClick={() => openTeacherModal(cls)} title={t('schools.detail.assignTeacherBtn')}>
                                                            <UserPlus className="h-4 w-4" />
                                                        </button>
                                                        <button type="button" className="btn btn-sm btn-outline-primary p-2" onClick={() => openEditClass(cls)} title={t('schools.detail.editClassBtn')}>
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                        <button type="button" className="btn btn-sm btn-outline-danger p-2" onClick={() => handleDeleteClass(cls)} title={t('common.delete')}>
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
                        <p className="py-8 text-center text-[#515365] dark:text-[#888ea8]">{t('schools.detail.noStudents')}</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table-hover">
                                <thead>
                                    <tr>
                                        <th>{t('schools.detail.fullNameColHeader')}</th>
                                        <th>{t('schools.detail.parentColHeader')}</th>
                                        <th>{t('schools.detail.classAssignColHeader')}</th>
                                        <th>{t('schools.detail.birthDateColHeader')}</th>
                                        <th>{t('schools.detail.genderColHeader')}</th>
                                        <th>{t('schools.detail.statusColHeader')}</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {children.map((child) => (
                                        <tr key={child.id} className="hover:bg-primary/5">
                                            <td>
                                                <span className="font-medium text-dark dark:text-white">
                                                    {child.first_name} {child.last_name}
                                                </span>
                                            </td>
                                            <td>
                                                {child.family_profile?.owner ? (
                                                    <div>
                                                        <p className="text-sm font-medium text-dark dark:text-white">
                                                            {child.family_profile.owner.name} {child.family_profile.owner.surname}
                                                        </p>
                                                        {child.family_profile.owner.phone && (
                                                            <p className="text-xs text-[#888ea8]">{child.family_profile.owner.phone}</p>
                                                        )}
                                                    </div>
                                                ) : <span className="text-[#888ea8]">—</span>}
                                            </td>
                                            <td>
                                                {(child.classes?.length ?? 0) > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {child.classes!.map(cls => (
                                                            <span key={cls.id} className="badge badge-outline-info text-xs">{cls.name}</span>
                                                        ))}
                                                    </div>
                                                ) : <span className="text-[#888ea8]">—</span>}
                                            </td>
                                            <td className="text-sm text-[#515365] dark:text-[#888ea8]">{child.birth_date ? new Date(child.birth_date).toLocaleDateString('tr-TR') : '—'}</td>
                                            <td className="text-sm text-[#515365] dark:text-[#888ea8]">
                                                {child.gender === 'male' ? t('schools.detail.genderMale') : child.gender === 'female' ? t('schools.detail.genderFemale') : '—'}
                                            </td>
                                            <td>
                                                <span className={`badge ${child.status === 'active' ? 'badge-outline-success' : 'badge-outline-secondary'}`}>
                                                    {child.status === 'active' ? t('schools.detail.statusActive') : (child.status ?? '—')}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-primary p-2"
                                                        onClick={() => openChildDetail(child.id)}
                                                        title={t('common.detail')}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger p-2"
                                                        onClick={(e) => handleUnenrollChild(child, e)}
                                                        title={t('schools.detail.unenrollTitle')}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
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
                        {loadingSchoolTeachers ? (
                            <div className="flex h-32 items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        ) : schoolLevelTeachers.length === 0 ? (
                            <p className="py-8 text-center text-[#515365] dark:text-[#888ea8]">{t('schools.detail.noTeachers')}</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th>{t('schools.detail.fullNameColHeader')}</th>
                                            <th>{t('schools.detail.titleColHeader')}</th>
                                            <th>{t('schools.detail.employmentColHeader')}</th>
                                            <th>{t('schools.detail.classesColHeader')}</th>
                                            <th>{t('schools.detail.statusColHeader')}</th>
                                            <th>{t('schools.detail.actionsColHeader')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {schoolLevelTeachers.map((teacher) => (
                                            <tr key={teacher.id}>
                                                <td className="font-medium text-dark dark:text-white">{teacher.name}</td>
                                                <td>{teacher.title ?? '—'}</td>
                                                <td>{employmentLabel(teacher.employment_type)}</td>
                                                <td>
                                                    {teacher.classes && teacher.classes.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {teacher.classes.map(c => (
                                                                <span key={c.id} className="badge badge-outline-info text-xs">{c.name}</span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-[#888ea8]">{t('schools.detail.notAssigned')}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {teacher.is_active ? (
                                                        <span className="badge badge-outline-success">{t('schools.detail.statusActive')}</span>
                                                    ) : (
                                                        <span className="badge badge-outline-secondary">{t('schools.detail.statusInactive')}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-primary p-2"
                                                            onClick={() => setSelectedTeacherDetail(teacher)}
                                                            title={t('common.detail')}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger p-2"
                                                            onClick={() => handleRemoveTeacherFromSchool(teacher)}
                                                            title={t('schools.detail.removeTeacherFromSchoolTitle')}
                                                        >
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

                {/* Kayıt Talepleri Tab */}
                {activeTab === 'requests' && (
                    <>
                        {/* Filtre Butonları */}
                        <div className="mb-4 flex flex-wrap gap-2">
                            {(['pending', 'approved', 'rejected', ''] as const).map((f) => {
                                const labels: Record<string, string> = {
                                    pending: t('schools.detail.filterPending'),
                                    approved: t('schools.detail.filterApproved'),
                                    rejected: t('schools.detail.filterRejected'),
                                    '': t('schools.detail.filterAll'),
                                };
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
                                {requestsFilter === 'pending' ? t('schools.detail.noPendingRequests') : t('schools.detail.noRequests')}
                            </p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th>{t('schools.detail.fullNameColHeader')}</th>
                                            <th>{t('schools.detail.emailColHeader')}</th>
                                            <th>{t('schools.detail.phoneColHeader')}</th>
                                            <th>{t('schools.detail.messageColHeader')}</th>
                                            <th>{t('schools.detail.statusColHeader')}</th>
                                            <th>{t('schools.detail.dateColHeader')}</th>
                                            <th>{t('schools.detail.actionsColHeader')}</th>
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
                                                    {req.status === 'pending' && <span className="badge badge-outline-warning">{t('schools.detail.statusPending')}</span>}
                                                    {req.status === 'approved' && <span className="badge badge-outline-success">{t('schools.detail.statusApproved')}</span>}
                                                    {req.status === 'rejected' && (
                                                        <span
                                                            className="badge badge-outline-danger cursor-help"
                                                            title={req.rejection_reason ?? ''}
                                                        >
                                                            {t('schools.detail.statusRejected')}
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
                                                                title={t('common.approve')}
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-danger p-2"
                                                                onClick={() => openRejectModal(req.id)}
                                                                title={t('schools.detail.rejectBtn')}
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
                                <button type="button" className="btn btn-sm btn-outline-secondary" disabled={requestsMeta.current_page === 1} onClick={() => fetchEnrollmentRequests(requestsFilter, requestsMeta.current_page - 1)}>{t('schools.detail.prevPage')}</button>
                                <span className="text-sm text-[#888ea8]">{requestsMeta.current_page} / {requestsMeta.last_page}</span>
                                <button type="button" className="btn btn-sm btn-outline-secondary" disabled={requestsMeta.current_page === requestsMeta.last_page} onClick={() => fetchEnrollmentRequests(requestsFilter, requestsMeta.current_page + 1)}>{t('schools.detail.nextPage')}</button>
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
                            <p className="py-8 text-center text-[#515365] dark:text-[#888ea8]">{t('schools.detail.noParents')}</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 32 }}></th>
                                            <th>{t('schools.detail.parentNameColHeader')}</th>
                                            <th>{t('schools.detail.familyNameColHeader')}</th>
                                            <th>{t('schools.detail.emailColHeader')}</th>
                                            <th>{t('schools.detail.phoneColHeader')}</th>
                                            <th>{t('schools.detail.childrenCountColHeader')}</th>
                                            <th></th>
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
                                                        <span className="badge badge-outline-info">{t('schools.detail.childrenCount').replace('{count}', String(parent.children.length))}</span>
                                                    </td>
                                                    <td onClick={e => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-primary p-2"
                                                            onClick={() => setSelectedFamilyDetail(parent)}
                                                            title={t('common.detail')}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                                {expandedParent === parent.id && parent.children.length > 0 && (
                                                    <tr key={`${parent.id}-children`}>
                                                        <td></td>
                                                        <td colSpan={5} className="bg-primary/5 pb-3 pt-1">
                                                            <p className="mb-2 text-xs font-semibold text-[#888ea8]">{t('schools.detail.childrenSubHeader')}</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {parent.children.map((child) => (
                                                                    <div key={child.id} className="flex items-center gap-2 rounded-lg border border-[#ebedf2] bg-white px-3 py-1.5 dark:border-[#1b2e4b] dark:bg-[#0e1726]">
                                                                        <span className="font-medium text-dark dark:text-white">{child.name}</span>
                                                                        {child.birth_date && <span className="text-xs text-[#888ea8]">{new Date(child.birth_date).toLocaleDateString('tr-TR')}</span>}
                                                                        {child.gender && <span className="badge badge-outline-secondary text-xs">{child.gender === 'male' ? t('schools.detail.genderMale') : child.gender === 'female' ? t('schools.detail.genderFemale') : child.gender}</span>}
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

                {/* Onay Bekleyen Öğrenciler Tab */}
                {activeTab === 'child-requests' && (
                    <>
                        {/* Filtre */}
                        <div className="mb-4 flex flex-wrap gap-2">
                            {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => {
                                const labels = {
                                    pending: t('schools.detail.filterPending'),
                                    approved: t('schools.detail.filterApproved'),
                                    rejected: t('schools.detail.filterRejected'),
                                    all: t('schools.detail.filterAll'),
                                };
                                const colors = { pending: 'btn-outline-warning', approved: 'btn-outline-success', rejected: 'btn-outline-danger', all: 'btn-outline-secondary' };
                                return (
                                    <button
                                        key={f}
                                        type="button"
                                        className={`btn btn-sm ${childRequestsFilter === f ? colors[f].replace('outline-', '') : colors[f]}`}
                                        onClick={() => { setChildRequestsFilter(f); fetchChildEnrollmentRequests(f); }}
                                    >
                                        {labels[f]}
                                    </button>
                                );
                            })}
                        </div>

                        {loadingChildRequests ? (
                            <div className="flex h-32 items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        ) : childEnrollmentRequests.length === 0 ? (
                            <p className="py-8 text-center text-[#515365] dark:text-[#888ea8]">
                                {childRequestsFilter === 'pending' ? t('schools.detail.noPendingChildRequests') : t('schools.detail.noChildRequests')}
                            </p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th>{t('schools.detail.parentColHeader')}</th>
                                            <th>{t('schools.detail.childColHeader')}</th>
                                            <th>{t('schools.detail.birthDateColHeader')}</th>
                                            <th>{t('schools.detail.genderColHeader')}</th>
                                            <th>{t('schools.detail.statusColHeader')}</th>
                                            <th>{t('schools.detail.dateColHeader')}</th>
                                            <th>{t('schools.detail.actionsColHeader')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {childEnrollmentRequests.map((req) => (
                                            <tr key={req.id}>
                                                <td>
                                                    {req.parent ? (
                                                        <button
                                                            type="button"
                                                            className="font-medium text-primary hover:underline"
                                                            onClick={() => setSelectedParentDetail(req.parent)}
                                                        >
                                                            {req.parent.name} {req.parent.surname}
                                                        </button>
                                                    ) : '—'}
                                                </td>
                                                <td>
                                                    {req.child ? (
                                                        <button
                                                            type="button"
                                                            className="font-medium text-primary hover:underline"
                                                            onClick={() => setSelectedChildDetail(req.child)}
                                                        >
                                                            {req.child.full_name}
                                                        </button>
                                                    ) : '—'}
                                                </td>
                                                <td className="text-sm text-[#515365] dark:text-[#888ea8]">{req.child?.birth_date ? new Date(req.child.birth_date).toLocaleDateString('tr-TR') : '—'}</td>
                                                <td className="text-sm text-[#515365] dark:text-[#888ea8]">
                                                    {req.child?.gender === 'male' ? t('schools.detail.genderMale') : req.child?.gender === 'female' ? t('schools.detail.genderFemale') : '—'}
                                                </td>
                                                <td>
                                                    {req.status === 'pending' && <span className="badge badge-outline-warning">{t('schools.detail.statusPending')}</span>}
                                                    {req.status === 'approved' && <span className="badge badge-outline-success">{t('schools.detail.statusApproved')}</span>}
                                                    {req.status === 'rejected' && (
                                                        <span className="badge badge-outline-danger cursor-help" title={req.rejection_reason ?? ''}>{t('schools.detail.statusRejected')}</span>
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
                                                                onClick={() => handleApproveChildRequest(req.id, req.child?.full_name ?? '')}
                                                                title={t('common.approve')}
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-danger p-2"
                                                                onClick={() => openRejectChildModal(req.id)}
                                                                title={t('schools.detail.rejectBtn')}
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

                        {childRequestsMeta.last_page > 1 && (
                            <div className="mt-4 flex items-center justify-center gap-3">
                                <button type="button" className="btn btn-sm btn-outline-secondary" disabled={childRequestsMeta.current_page === 1} onClick={() => fetchChildEnrollmentRequests(childRequestsFilter, childRequestsMeta.current_page - 1)}>{t('schools.detail.prevPage')}</button>
                                <span className="text-sm text-[#888ea8]">{childRequestsMeta.current_page} / {childRequestsMeta.last_page}</span>
                                <button type="button" className="btn btn-sm btn-outline-secondary" disabled={childRequestsMeta.current_page === childRequestsMeta.last_page} onClick={() => fetchChildEnrollmentRequests(childRequestsFilter, childRequestsMeta.current_page + 1)}>{t('schools.detail.nextPage')}</button>
                            </div>
                        )}
                    </>
                )}

                {/* ── Silme Talepleri Tab ── */}
                {activeTab === 'removal-requests' && (
                    <>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-[#888ea8]">{t('schools.detail.removalRequestsDesc')}</p>
                            <div className="flex gap-2">
                                {(['pending', 'approved', 'rejected', 'all'] as const).map(f => {
                                    const labels = {
                                        pending: t('schools.detail.filterPendingOnly'),
                                        approved: t('schools.detail.filterApprovedOnly'),
                                        rejected: t('schools.detail.filterRejectedOnly'),
                                        all: t('schools.detail.filterAll'),
                                    };
                                    const colors = { pending: 'btn-outline-warning', approved: 'btn-outline-success', rejected: 'btn-outline-danger', all: 'btn-outline-secondary' };
                                    return (
                                        <button
                                            key={f}
                                            type="button"
                                            className={`btn btn-sm ${removalRequestsFilter === f ? colors[f].replace('outline-', '') : colors[f]}`}
                                            onClick={() => {
                                                setRemovalRequestsFilter(f);
                                                void fetchRemovalRequests(f);
                                            }}
                                        >
                                            {labels[f]}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {removalRequests.length === 0 ? (
                            <p className="py-12 text-center text-sm text-[#888ea8]">
                                {removalRequestsFilter === 'pending' ? t('schools.detail.noPendingRemovalRequests') : t('schools.detail.noRemovalRequests')}
                            </p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th>{t('schools.detail.childColHeader')}</th>
                                            <th>{t('schools.detail.parentColHeader')}</th>
                                            <th>{t('schools.detail.reasonColHeader')}</th>
                                            <th>{t('schools.detail.statusColHeader')}</th>
                                            <th>{t('schools.detail.dateColHeader')}</th>
                                            <th>{t('schools.detail.actionsColHeader')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {removalRequests.map(req => (
                                            <tr key={req.id}>
                                                <td className="font-medium text-dark dark:text-white">
                                                    {req.child?.full_name ?? '—'}
                                                </td>
                                                <td>
                                                    <div>
                                                        <p className="text-sm font-medium text-dark dark:text-white">{req.owner_name ?? '—'}</p>
                                                        {req.owner_phone && <p className="text-xs text-[#888ea8]">{req.owner_phone}</p>}
                                                        {req.owner_email && <p className="text-xs text-[#888ea8]">{req.owner_email}</p>}
                                                    </div>
                                                </td>
                                                <td className="max-w-xs text-sm text-[#515365] dark:text-[#888ea8]">
                                                    {req.reason ?? '—'}
                                                </td>
                                                <td>
                                                    {req.status === 'pending' && <span className="badge badge-outline-warning">{t('schools.detail.statusPending')}</span>}
                                                    {req.status === 'approved' && <span className="badge badge-outline-success">{t('schools.detail.statusApproved')}</span>}
                                                    {req.status === 'rejected' && (
                                                        <span className="badge badge-outline-danger cursor-help" title={req.rejection_reason ?? ''}>{t('schools.detail.statusRejected')}</span>
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
                                                                className="btn btn-sm btn-outline-danger p-2"
                                                                onClick={() => handleApproveRemoval(req.id)}
                                                                title={t('schools.detail.approveRemovalTitle')}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-secondary p-2"
                                                                onClick={() => {
                                                                    setRejectRemovalTargetId(req.id);
                                                                    setRejectionRemovalReason('');
                                                                    setShowRejectRemovalModal(true);
                                                                }}
                                                                title={t('schools.detail.rejectBtn')}
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
                    </>
                )}
            </div>

            {/* Öğretmen Detay Modalı */}
            {selectedTeacherDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl dark:bg-[#0e1726] max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-[#ebedf2] px-6 py-4 dark:border-[#1b2e4b]">
                            <h2 className="text-lg font-bold text-dark dark:text-white">{t('schools.detail.teacherDetailTitle')}</h2>
                            <button type="button" onClick={() => setSelectedTeacherDetail(null)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-5 p-6">
                            {/* Başlık kartı */}
                            <div className="flex items-center gap-4 rounded-lg bg-primary/5 p-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                                    {selectedTeacherDetail.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-dark dark:text-white">{selectedTeacherDetail.name}</p>
                                    {selectedTeacherDetail.title && (
                                        <p className="text-sm text-[#888ea8]">{selectedTeacherDetail.title}</p>
                                    )}
                                    <span className={`badge mt-1 ${selectedTeacherDetail.is_active ? 'badge-outline-success' : 'badge-outline-secondary'}`}>
                                        {selectedTeacherDetail.is_active ? t('schools.detail.statusActive') : t('schools.detail.statusInactive')}
                                    </span>
                                </div>
                            </div>

                            {/* Bilgi satırları */}
                            <div className="divide-y divide-[#ebedf2] dark:divide-[#1b2e4b]">
                                {selectedTeacherDetail.employment_type && (
                                    <div className="flex justify-between py-2.5">
                                        <span className="text-sm text-[#888ea8]">{t('schools.detail.employmentTypelabel')}</span>
                                        <span className="text-sm font-medium text-dark dark:text-white">{employmentLabel(selectedTeacherDetail.employment_type)}</span>
                                    </div>
                                )}
                                {selectedTeacherDetail.role_type && (
                                    <div className="flex justify-between py-2.5">
                                        <span className="text-sm text-[#888ea8]">{t('schools.detail.rolTypeLabel')}</span>
                                        <span className="text-sm font-medium text-dark dark:text-white">{selectedTeacherDetail.role_type.name}</span>
                                    </div>
                                )}
                            </div>

                            {/* Atandığı sınıflar */}
                            <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#888ea8]">{t('schools.detail.assignedClassesLabel')}</p>
                                {(selectedTeacherDetail.classes?.length ?? 0) === 0 ? (
                                    <p className="text-sm text-[#888ea8]">{t('schools.detail.noClassAssigned')}</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedTeacherDetail.classes!.map(cls => (
                                            <span key={cls.id} className="badge badge-outline-info">{cls.name}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="border-t border-[#ebedf2] px-6 py-4 dark:border-[#1b2e4b]">
                            <button type="button" className="btn btn-outline-secondary w-full" onClick={() => setSelectedTeacherDetail(null)}>{t('common.close')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Aile Detay Modalı */}
            {selectedFamilyDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl dark:bg-[#0e1726] max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-[#ebedf2] px-6 py-4 dark:border-[#1b2e4b]">
                            <h2 className="text-lg font-bold text-dark dark:text-white">{t('schools.detail.familyDetailTitle')}</h2>
                            <button type="button" onClick={() => setSelectedFamilyDetail(null)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-5 p-6">
                            {/* Başlık kartı */}
                            <div className="flex items-center gap-4 rounded-lg bg-primary/5 p-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                                    {selectedFamilyDetail.owner_name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-dark dark:text-white">{selectedFamilyDetail.owner_name}</p>
                                    {selectedFamilyDetail.family_name && (
                                        <p className="text-sm text-[#888ea8]">{selectedFamilyDetail.family_name} {t('schools.detail.familySection')}</p>
                                    )}
                                </div>
                            </div>

                            {/* İletişim bilgileri */}
                            <div className="divide-y divide-[#ebedf2] dark:divide-[#1b2e4b]">
                                {selectedFamilyDetail.email && (
                                    <div className="flex justify-between py-2.5">
                                        <span className="text-sm text-[#888ea8]">{t('schools.detail.emailLabel')}</span>
                                        <span className="text-sm font-medium text-dark dark:text-white">{selectedFamilyDetail.email}</span>
                                    </div>
                                )}
                                {selectedFamilyDetail.phone && (
                                    <div className="flex justify-between py-2.5">
                                        <span className="text-sm text-[#888ea8]">{t('schools.detail.phoneLabel')}</span>
                                        <span className="text-sm font-medium text-dark dark:text-white">{selectedFamilyDetail.phone}</span>
                                    </div>
                                )}
                            </div>

                            {/* Çocuklar */}
                            <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#888ea8]">
                                    {t('schools.detail.childrenLabel')} ({selectedFamilyDetail.children.length})
                                </p>
                                {selectedFamilyDetail.children.length === 0 ? (
                                    <p className="text-sm text-[#888ea8]">{t('schools.detail.noRegisteredChildren')}</p>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedFamilyDetail.children.map(child => (
                                            <div key={child.id} className="flex items-center gap-3 rounded-lg border border-[#ebedf2] p-3 dark:border-[#1b2e4b]">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-info/20 text-sm font-bold text-info">
                                                    {child.name.charAt(0)}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-dark dark:text-white">{child.name}</p>
                                                    <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-[#888ea8]">
                                                        {child.birth_date && <span>{new Date(child.birth_date).toLocaleDateString('tr-TR')}</span>}
                                                        {child.gender && <span>{child.gender === 'male' ? t('schools.detail.genderMale') : child.gender === 'female' ? t('schools.detail.genderFemale') : child.gender}</span>}
                                                    </div>
                                                </div>
                                                {child.status && (
                                                    <span className={`badge ${child.status === 'active' ? 'badge-outline-success' : 'badge-outline-secondary'} text-xs`}>
                                                        {child.status === 'active' ? t('schools.detail.statusActive') : child.status}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="border-t border-[#ebedf2] px-6 py-4 dark:border-[#1b2e4b]">
                            <button type="button" className="btn btn-outline-secondary w-full" onClick={() => setSelectedFamilyDetail(null)}>{t('common.close')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Silme Talebi Reddetme Modalı */}
            {showRejectRemovalModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">{t('schools.detail.rejectRemovalTitle')}</h2>
                            <button type="button" onClick={() => setShowRejectRemovalModal(false)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">{t('schools.detail.rejectRemovalReasonLabel')}</label>
                                <textarea
                                    className="form-textarea mt-1 w-full"
                                    rows={3}
                                    placeholder={t('schools.detail.rejectRemovalPlaceholder')}
                                    value={rejectionRemovalReason}
                                    onChange={e => setRejectionRemovalReason(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowRejectRemovalModal(false)}>
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger flex-1"
                                    disabled={!rejectionRemovalReason.trim() || savingRemovalReject}
                                    onClick={() => void handleRejectRemoval()}
                                >
                                    {savingRemovalReject ? t('schools.detail.savingBtn') : t('schools.detail.rejectBtn')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Veli Detay Modalı */}
            {selectedParentDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">{t('schools.detail.parentDetailTitle')}</h2>
                            <button type="button" onClick={() => setSelectedParentDetail(null)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 rounded-lg bg-primary/5 p-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white text-lg font-bold">
                                    {selectedParentDetail.name.charAt(0)}{selectedParentDetail.surname.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-dark dark:text-white">{selectedParentDetail.name} {selectedParentDetail.surname}</p>
                                    <p className="text-sm text-[#888ea8]">{selectedParentDetail.email}</p>
                                </div>
                            </div>
                            {selectedParentDetail.phone && (
                                <div className="flex justify-between border-b border-[#ebedf2] py-2 dark:border-[#1b2e4b]">
                                    <span className="text-sm text-[#888ea8]">{t('schools.detail.phoneLabel')}</span>
                                    <span className="text-sm font-medium text-dark dark:text-white">{selectedParentDetail.phone}</span>
                                </div>
                            )}
                        </div>
                        <button type="button" className="btn btn-outline-secondary mt-4 w-full" onClick={() => setSelectedParentDetail(null)}>{t('common.close')}</button>
                    </div>
                </div>
            )}

            {/* Çocuk Detay Modalı */}
            {selectedChildDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-lg bg-white p-6 dark:bg-[#0e1726] max-h-[90vh] overflow-y-auto">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">{t('schools.detail.childDetailTitle')}</h2>
                            <button type="button" onClick={() => setSelectedChildDetail(null)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-1">
                            <div className="mb-4 flex items-center gap-3 rounded-lg bg-primary/5 p-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white text-lg font-bold">
                                    {selectedChildDetail.first_name.charAt(0)}{selectedChildDetail.last_name.charAt(0)}
                                </div>
                                <p className="text-xl font-bold text-dark dark:text-white">{selectedChildDetail.full_name}</p>
                            </div>
                            {[
                                { label: t('schools.detail.birthDateLabel'), value: selectedChildDetail.birth_date ? new Date(selectedChildDetail.birth_date).toLocaleDateString('tr-TR') : null },
                                { label: t('schools.detail.genderColHeader'), value: selectedChildDetail.gender === 'male' ? t('schools.detail.genderMale') : selectedChildDetail.gender === 'female' ? t('schools.detail.genderFemale') : selectedChildDetail.gender },
                                { label: t('schools.detail.bloodTypeLabel'), value: selectedChildDetail.blood_type },
                                { label: t('schools.detail.idNumberLabel'), value: selectedChildDetail.identity_number },
                                { label: t('schools.detail.passportLabel'), value: selectedChildDetail.passport_number },
                                { label: t('schools.detail.nationalityLabel'), value: selectedChildDetail.nationality ? `${selectedChildDetail.nationality.flag_emoji ?? ''} ${selectedChildDetail.nationality.name}` : null },
                                { label: t('schools.detail.languagesLabel'), value: selectedChildDetail.languages?.join(', ') ?? null },
                            ].filter(r => r.value).map(r => (
                                <div key={r.label} className="flex justify-between border-b border-[#ebedf2] py-2 dark:border-[#1b2e4b]">
                                    <span className="text-sm text-[#888ea8]">{r.label}</span>
                                    <span className="text-sm font-medium text-dark dark:text-white">{r.value}</span>
                                </div>
                            ))}
                            {selectedChildDetail.allergens.length > 0 && (
                                <div className="pt-3">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#888ea8]">{t('schools.detail.allergensSection')}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedChildDetail.allergens.map(a => (
                                            <span key={a.id} className={`badge ${a.status === 'pending' ? 'badge-outline-warning' : 'badge-outline-danger'}`}>
                                                {a.name}{a.status === 'pending' ? ` ${t('schools.detail.allergenPending')}` : ''}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {selectedChildDetail.conditions.length > 0 && (
                                <div className="pt-3">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#888ea8]">{t('schools.detail.conditionsSection')}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedChildDetail.conditions.map(c => (
                                            <span key={c.id} className={`badge ${c.status === 'pending' ? 'badge-outline-warning' : 'badge-outline-info'}`}>
                                                {c.name}{c.status === 'pending' ? ` ${t('schools.detail.conditionPending')}` : ''}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {selectedChildDetail.medications.length > 0 && (
                                <div className="pt-3">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#888ea8]">{t('schools.detail.medicationsSection')}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedChildDetail.medications.map(m => (
                                            <span key={m.id} className="badge badge-outline-secondary">{m.name}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {selectedChildDetail.parent_notes && (
                                <div className="pt-3">
                                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#888ea8]">{t('schools.detail.parentNoteSection')}</p>
                                    <p className="text-sm text-[#515365] dark:text-[#888ea8]">{selectedChildDetail.parent_notes}</p>
                                </div>
                            )}
                            {selectedChildDetail.special_notes && (
                                <div className="pt-3">
                                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#888ea8]">{t('schools.detail.classDetail.specialNoteLabel')}</p>
                                    <p className="text-sm text-[#515365] dark:text-[#888ea8]">{selectedChildDetail.special_notes}</p>
                                </div>
                            )}
                        </div>
                        <button type="button" className="btn btn-outline-secondary mt-4 w-full" onClick={() => setSelectedChildDetail(null)}>{t('common.close')}</button>
                    </div>
                </div>
            )}

            {/* Çocuk Talebi Red Modalı */}
            {showRejectChildModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">{t('schools.detail.rejectChildRequestTitle')}</h2>
                            <button type="button" onClick={() => setShowRejectChildModal(false)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">
                                    {t('schools.detail.rejectReasonLabel')} <span className="text-danger">*</span>
                                </label>
                                <textarea
                                    className="form-textarea mt-1 w-full"
                                    rows={4}
                                    placeholder={t('schools.detail.rejectReasonPlaceholder')}
                                    value={rejectionChildReason}
                                    onChange={e => setRejectionChildReason(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    className="btn btn-danger flex-1"
                                    onClick={handleRejectChildSubmit}
                                    disabled={!rejectionChildReason.trim() || savingChildReject}
                                >
                                    {savingChildReject ? t('schools.detail.rejectingBtn') : t('schools.detail.rejectBtn')}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowRejectChildModal(false)}>{t('common.cancel')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Öğrenci Detay Modalı */}
            {(selectedChild || loadingChildDetail) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-lg bg-white p-6 dark:bg-[#0e1726] max-h-[90vh] overflow-y-auto">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">{t('schools.detail.studentDetailTitle')}</h2>
                            <button type="button" onClick={() => setSelectedChild(null)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {loadingChildDetail ? (
                            <div className="flex h-32 items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        ) : selectedChild && (
                            <div className="space-y-6">
                                {/* Başlık */}
                                <div className="flex items-center gap-4 rounded-lg bg-primary/5 p-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                                        {selectedChild.first_name.charAt(0)}{selectedChild.last_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-dark dark:text-white">{selectedChild.full_name}</p>
                                        <span className={`badge ${selectedChild.status === 'active' ? 'badge-outline-success' : 'badge-outline-secondary'}`}>
                                            {selectedChild.status === 'active' ? t('schools.detail.statusActive') : (selectedChild.status ?? '—')}
                                        </span>
                                    </div>
                                </div>

                                {/* Kişisel Bilgiler */}
                                <div>
                                    <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#888ea8]">{t('schools.detail.personalInfoSection')}</p>
                                    <div className="divide-y divide-[#ebedf2] dark:divide-[#1b2e4b]">
                                        {[
                                            { label: t('schools.detail.birthDateLabel'), value: selectedChild.birth_date ? new Date(selectedChild.birth_date).toLocaleDateString('tr-TR') : null },
                                            { label: t('schools.detail.genderColHeader'), value: selectedChild.gender === 'male' ? t('schools.detail.genderMale') : selectedChild.gender === 'female' ? t('schools.detail.genderFemale') : selectedChild.gender },
                                            { label: t('schools.detail.bloodTypeLabel'), value: selectedChild.blood_type },
                                            { label: t('schools.detail.idNumberLabel'), value: selectedChild.identity_number },
                                            { label: t('schools.detail.passportLabel'), value: selectedChild.passport_number },
                                            { label: t('schools.detail.nationalityLabel'), value: selectedChild.nationality ? `${selectedChild.nationality.flag_emoji ?? ''} ${selectedChild.nationality.name}` : null },
                                            { label: t('schools.detail.languagesLabel'), value: selectedChild.languages?.join(', ') },
                                        ].filter(r => r.value).map(r => (
                                            <div key={r.label} className="flex justify-between py-2">
                                                <span className="text-sm text-[#888ea8]">{r.label}</span>
                                                <span className="text-sm font-medium text-dark dark:text-white">{r.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Sağlık Bilgileri */}
                                {((selectedChild.allergens?.length ?? 0) > 0 || (selectedChild.conditions?.length ?? 0) > 0 || (selectedChild.medications?.length ?? 0) > 0) && (
                                    <div>
                                        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#888ea8]">{t('schools.detail.healthInfoSection')}</p>
                                        {(selectedChild.allergens?.length ?? 0) > 0 && (
                                            <div className="mb-2">
                                                <p className="mb-1 text-xs text-[#888ea8]">{t('schools.detail.allergensSection')}</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {selectedChild.allergens!.map(a => (
                                                        <span key={a.id} className={`badge ${a.status === 'pending' ? 'badge-outline-warning' : 'badge-outline-danger'}`}>
                                                            {a.name}{a.status === 'pending' ? ` ${t('schools.detail.allergenPending')}` : ''}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {(selectedChild.conditions?.length ?? 0) > 0 && (
                                            <div className="mb-2">
                                                <p className="mb-1 text-xs text-[#888ea8]">{t('schools.detail.conditionsSection')}</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {selectedChild.conditions!.map(c => (
                                                        <span key={c.id} className={`badge ${c.status === 'pending' ? 'badge-outline-warning' : 'badge-outline-info'}`}>
                                                            {c.name}{c.status === 'pending' ? ` ${t('schools.detail.conditionPending')}` : ''}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {(selectedChild.medications?.length ?? 0) > 0 && (
                                            <div>
                                                <p className="mb-1 text-xs text-[#888ea8]">{t('schools.detail.medicationsSection')}</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {selectedChild.medications!.map(m => (
                                                        <span key={m.id} className="badge badge-outline-secondary">{m.name}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Veli Notları */}
                                {selectedChild.parent_notes && (
                                    <div>
                                        <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-[#888ea8]">{t('schools.detail.parentNoteSection')}</p>
                                        <p className="text-sm text-[#515365] dark:text-[#888ea8]">{selectedChild.parent_notes}</p>
                                    </div>
                                )}

                                {/* Aile Bilgileri */}
                                {selectedChild.family_profile && (
                                    <div>
                                        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#888ea8]">{t('schools.detail.familyInfoSection')}</p>
                                        {selectedChild.family_profile.family_name && (
                                            <p className="mb-2 text-sm font-medium text-dark dark:text-white">
                                                {t('schools.detail.familyLabel')} {selectedChild.family_profile.family_name}
                                            </p>
                                        )}
                                        <div className="space-y-2">
                                            {/* Ana veli */}
                                            {selectedChild.family_profile.owner && (
                                                <div className="flex items-center gap-3 rounded-lg border border-[#ebedf2] p-3 dark:border-[#1b2e4b]">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                                                        {selectedChild.family_profile.owner.name.charAt(0)}{selectedChild.family_profile.owner.surname.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium text-dark dark:text-white">
                                                            {selectedChild.family_profile.owner.name} {selectedChild.family_profile.owner.surname}
                                                            <span className="ml-2 text-xs text-[#888ea8]">{t('schools.detail.mainParentLabel')}</span>
                                                        </p>
                                                        <p className="text-xs text-[#888ea8]">{selectedChild.family_profile.owner.email}</p>
                                                        {selectedChild.family_profile.owner.phone && (
                                                            <p className="text-xs text-[#888ea8]">{selectedChild.family_profile.owner.phone}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {/* Diğer üyeler */}
                                            {(selectedChild.family_profile.members ?? []).filter(m => m.user).map(m => (
                                                <div key={m.id} className="flex items-center gap-3 rounded-lg border border-[#ebedf2] p-3 dark:border-[#1b2e4b]">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#888ea8] text-sm font-bold text-white">
                                                        {m.user!.name.charAt(0)}{m.user!.surname.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium text-dark dark:text-white">
                                                            {m.user!.name} {m.user!.surname}
                                                            <span className="ml-2 text-xs text-[#888ea8]">
                                                                {m.role === 'super_parent' ? t('schools.detail.mainParentLabel') : t('schools.detail.coParentLabel')}
                                                            </span>
                                                        </p>
                                                        <p className="text-xs text-[#888ea8]">{m.user!.email}</p>
                                                        {m.user!.phone && (
                                                            <p className="text-xs text-[#888ea8]">{m.user!.phone}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Sınıf Atamaları */}
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <p className="text-sm font-semibold uppercase tracking-wide text-[#888ea8]">{t('schools.detail.classAssignSection')}</p>
                                        <button
                                            type="button"
                                            className="btn btn-xs btn-outline-primary gap-1"
                                            onClick={() => { setSelectedClassIdForAssign(''); setShowClassAssignModal(true); }}
                                        >
                                            <Plus className="h-3 w-3" />
                                            {t('schools.detail.assignToClassBtn')}
                                        </button>
                                    </div>
                                    {(selectedChild.classes?.length ?? 0) === 0 ? (
                                        <p className="text-sm text-[#888ea8]">{t('schools.detail.noClassAssignedYet')}</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedChild.classes!.map((cls: { id: number; name: string }) => (
                                                <div key={cls.id} className="flex items-center gap-1.5 rounded-lg border border-[#ebedf2] bg-white px-3 py-1.5 dark:border-[#1b2e4b] dark:bg-[#0e1726]">
                                                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                                                    <span className="text-sm font-medium text-dark dark:text-white">{cls.name}</span>
                                                    <button
                                                        type="button"
                                                        className="ml-1 text-[#888ea8] hover:text-danger"
                                                        onClick={() => handleRemoveChildFromClass(cls.id, cls.name)}
                                                        title={t('schools.detail.removeFromClassTitle')}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button type="button" className="btn btn-outline-secondary w-full" onClick={() => setSelectedChild(null)}>{t('common.close')}</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Sınıf Satırından Öğrenci Atama Modal */}
            {showClassStudentModal && classForStudentAssign && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">{t('schools.detail.assignStudentModalTitle')}</h2>
                            <button type="button" onClick={() => setShowClassStudentModal(false)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <p className="mb-4 text-sm text-[#515365] dark:text-[#888ea8]">
                            <strong className="text-dark dark:text-white">{classForStudentAssign.name}</strong> {t('schools.detail.classStudentSelectDesc')}
                            {(classForStudentAssign.age_min != null || classForStudentAssign.age_max != null) && (
                                <span className="ml-1 text-xs text-[#888ea8]">
                                    ({t('schools.detail.classAgeRangeLabel')}: {classForStudentAssign.age_min ?? '?'}–{classForStudentAssign.age_max ?? '?'})
                                </span>
                            )}
                        </p>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">{t('schools.detail.assignStudentSelectLabel')}</label>
                                <select
                                    className="form-select mt-1"
                                    value={studentAssignChildId}
                                    onChange={e => setStudentAssignChildId(e.target.value)}
                                >
                                    <option value="">{t('schools.detail.assignStudentSelectPlaceholder')}</option>
                                    {children.map(c => {
                                        const hasClass = (c.classes?.length ?? 0) > 0;
                                        const birthYear = c.birth_date ? new Date(c.birth_date + 'T00:00:00') : null;
                                        let age: number | null = null;
                                        if (birthYear) {
                                            const today = new Date();
                                            age = today.getFullYear() - birthYear.getFullYear();
                                            const m = today.getMonth() - birthYear.getMonth();
                                            if (m < 0 || (m === 0 && today.getDate() < birthYear.getDate())) age--;
                                        }
                                        const min = classForStudentAssign?.age_min ?? null;
                                        const max = classForStudentAssign?.age_max ?? null;
                                        const outOfRange = age !== null && ((min !== null && age < min) || (max !== null && age > max));
                                        if (outOfRange) { return null; }
                                        const label = `${c.first_name} ${c.last_name}${age !== null ? t('schools.detail.assignStudentAgeLabel').replace('{age}', String(age)) : ''}${hasClass ? t('schools.detail.assignStudentInClass').replace('{class}', c.classes![0].name) : ''}`;
                                        return (
                                            <option key={c.id} value={String(c.id)} disabled={hasClass}>
                                                {label}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    className="btn btn-primary flex-1"
                                    disabled={!studentAssignChildId || assigningStudentToClass}
                                    onClick={handleAssignStudentToClass}
                                >
                                    {assigningStudentToClass ? t('schools.detail.assignStudentAssigning') : t('schools.detail.assignStudentBtn')}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowClassStudentModal(false)}>{t('common.cancel') || 'İptal'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sınıfa Öğrenci Atama Modal */}
            {showClassAssignModal && selectedChild && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">{t('schools.detail.assignClassModalTitle')}</h2>
                            <button type="button" onClick={() => setShowClassAssignModal(false)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <p className="mb-4 text-sm text-[#515365] dark:text-[#888ea8]">
                            <strong className="text-dark dark:text-white">{selectedChild.full_name}</strong> {t('schools.detail.assignClassSelectDesc')}
                        </p>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">{t('schools.detail.assignClassSelectLabel')}</label>
                                <select
                                    className="form-select mt-1"
                                    value={selectedClassIdForAssign}
                                    onChange={e => setSelectedClassIdForAssign(e.target.value)}
                                >
                                    <option value="">{t('schools.detail.assignClassSelectPlaceholder')}</option>
                                    {classes.filter(c => c.is_active !== false).map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                            {(c.age_min != null || c.age_max != null) && t('schools.detail.assignClassAgeRange').replace('{min}', String(c.age_min ?? '?')).replace('{max}', String(c.age_max ?? '?'))}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    className="btn btn-primary flex-1"
                                    disabled={!selectedClassIdForAssign || assigningChildToClass}
                                    onClick={handleAssignChildToClass}
                                >
                                    {assigningChildToClass ? t('schools.detail.assignStudentAssigning') : t('schools.detail.assignStudentBtn')}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowClassAssignModal(false)}>{t('common.cancel') || 'İptal'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sınıf Oluştur/Düzenle Modal */}
            {showClassModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-[#0e1726]">
                        <div className="flex shrink-0 items-center justify-between border-b border-[#e0e6ed] px-6 py-4 dark:border-[#1b2e4b]">
                            <h2 className="text-lg font-bold text-dark dark:text-white">
                                {editingClass ? t('schools.detail.classEditModal') : t('schools.detail.classNewModal')}
                            </h2>
                            <button type="button" onClick={() => setShowClassModal(false)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleClassSubmit} className="flex flex-1 flex-col overflow-y-auto">
                            <div className="space-y-5 px-6 py-5">

                                {/* Sınıf Adı */}
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">{t('schools.detail.classNameFieldLabel')}</label>
                                    <input type="text" className="form-input mt-1" value={classForm.name} onChange={cf('name')} required />
                                </div>

                                {/* Renk Seçici — zorunlu */}
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">
                                        {t('schools.detail.classColorFieldLabel')} <span className="text-danger">*</span>
                                    </label>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {CLASS_COLORS.map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setClassForm(prev => ({ ...prev, color: c }))}
                                                className="relative h-8 w-8 rounded-full transition-transform hover:scale-110 focus:outline-none"
                                                style={{ backgroundColor: c }}
                                                title={c}
                                            >
                                                {classForm.color === c && (
                                                    <span className="absolute inset-0 flex items-center justify-center rounded-full ring-2 ring-white ring-offset-1 ring-offset-dark">
                                                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                        {/* Özel renk */}
                                        <label
                                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-[#888ea8] text-xs text-[#888ea8] hover:border-primary hover:text-primary"
                                            title={t('schools.detail.customColorLabel')}
                                        >
                                            <span>+</span>
                                            <input
                                                type="color"
                                                className="sr-only"
                                                value={classForm.color || '#4285F4'}
                                                onChange={e => setClassForm(prev => ({ ...prev, color: e.target.value }))}
                                            />
                                        </label>
                                    </div>
                                    {classForm.color && (
                                        <div className="mt-2 flex items-center gap-2 text-sm text-[#515365]">
                                            <span className="inline-block h-4 w-4 rounded-full" style={{ backgroundColor: classForm.color }} />
                                            <span>{t('schools.detail.classSelectedColor').replace('{color}', classForm.color)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* İkon veya Logo — birinden biri zorunlu */}
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">
                                        {t('schools.detail.classIconOrLogoLabel')} <span className="text-danger">*</span>
                                        <span className="ml-1 text-xs font-normal text-[#888ea8]">{t('schools.detail.classIconOrLogoHint')}</span>
                                    </label>

                                    <div className="mt-2 flex gap-3">
                                        {/* İkon seçme butonu */}
                                        <button
                                            type="button"
                                            onClick={() => { setShowIconPicker(v => !v); setLogoFile(null); setLogoPreview(null); }}
                                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${classForm.icon && !logoFile ? 'border-primary bg-primary/10 text-primary' : 'border-[#e0e6ed] text-[#515365] hover:border-primary dark:border-[#1b2e4b]'}`}
                                        >
                                            <span className="text-lg">{classForm.icon || '😊'}</span>
                                            <span>{t('schools.detail.classIconSelectBtn')}</span>
                                        </button>

                                        {/* Logo yükleme butonu */}
                                        <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${logoFile ? 'border-primary bg-primary/10 text-primary' : 'border-[#e0e6ed] text-[#515365] hover:border-primary dark:border-[#1b2e4b]'}`}>
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span>{t('schools.detail.classLogoUploadBtn')}</span>
                                            <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" className="sr-only" onChange={handleLogoFileChange} />
                                        </label>
                                    </div>

                                    {/* İkon picker */}
                                    {showIconPicker && !logoFile && (
                                        <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-[#e0e6ed] bg-[#f8f9fa] p-3 dark:border-[#1b2e4b] dark:bg-[#1b2e4b]">
                                            {ICON_CATEGORIES_KEYS.map(cat => (
                                                <div key={cat.labelKey} className="mb-3">
                                                    <p className="mb-1 text-xs font-semibold uppercase text-[#888ea8]">{t(cat.labelKey)}</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {cat.icons.map(icon => (
                                                            <button
                                                                key={icon}
                                                                type="button"
                                                                onClick={() => { setClassForm(prev => ({ ...prev, icon })); setShowIconPicker(false); }}
                                                                className={`rounded-lg p-1.5 text-2xl transition-colors hover:bg-white dark:hover:bg-[#0e1726] ${classForm.icon === icon ? 'bg-primary/20 ring-2 ring-primary' : ''}`}
                                                                title={icon}
                                                            >
                                                                {icon}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Seçilen ikon önizlemesi */}
                                    {classForm.icon && !logoFile && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <div
                                                className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl shadow-sm"
                                                style={{ backgroundColor: classForm.color || '#e5e7eb' }}
                                            >
                                                {classForm.icon}
                                            </div>
                                            <span className="text-sm text-[#515365]">{t('schools.detail.classSelectedIcon')}</span>
                                            <button type="button" className="text-xs text-danger hover:underline" onClick={() => setClassForm(prev => ({ ...prev, icon: '' }))}>
                                                {t('schools.detail.classIconRemove')}
                                            </button>
                                        </div>
                                    )}

                                    {/* Logo önizlemesi — yeni kırpılan (blob) */}
                                    {logoPreview && (
                                        <div className="mt-2 flex items-center gap-3">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={logoPreview} alt={t('schools.detail.classLogoPreviewAlt')} className="h-12 w-12 rounded-xl object-cover shadow-sm" />
                                            <button
                                                type="button"
                                                className="text-xs text-danger hover:underline"
                                                onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                                            >
                                                {t('schools.detail.classLogoRemove')}
                                            </button>
                                        </div>
                                    )}
                                    {/* Logo önizlemesi — mevcut kayıtlı logo (auth gerekli) */}
                                    {!logoPreview && existingLogoUrl && (
                                        <div className="mt-2 flex items-center gap-3">
                                            <AuthImg
                                                src={existingLogoUrl}
                                                alt={t('schools.detail.classCurrentLogoAlt')}
                                                className="h-12 w-12 rounded-xl object-cover shadow-sm"
                                                fallback={<div className="h-12 w-12 animate-pulse rounded-xl bg-gray-200 dark:bg-[#1b2e4b]" />}
                                            />
                                            <button
                                                type="button"
                                                className="text-xs text-danger hover:underline"
                                                onClick={() => { setExistingLogoUrl(null); setClassForm(prev => ({ ...prev, icon: '' })); }}
                                            >
                                                {t('schools.detail.classLogoRemove')}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Eğitim Yılı */}
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">{t('schools.detail.classAcademicYearLabel')}</label>
                                    <select
                                        className="form-select mt-1"
                                        value={classForm.academic_year_id}
                                        onChange={e => setClassForm(prev => ({ ...prev, academic_year_id: e.target.value }))}
                                    >
                                        <option value="">{t('schools.detail.classAcademicYearOptional')}</option>
                                        {academicYears.map(y => (
                                            <option key={y.id} value={y.id}>
                                                {y.name}{y.is_active ? t('schools.detail.classAcademicYearActive') : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Yaş Aralığı */}
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">{t('schools.detail.classAgeRangeLabel')}</label>
                                    <div className="mt-1 flex items-center gap-2">
                                        <input type="number" className="form-input w-full" placeholder="Min" min={0} max={18} value={classForm.age_min} onChange={cf('age_min')} />
                                        <span className="shrink-0 text-[#888ea8]">—</span>
                                        <input type="number" className="form-input w-full" placeholder="Max" min={0} max={18} value={classForm.age_max} onChange={cf('age_max')} />
                                        <span className="shrink-0 text-sm text-[#888ea8]">{t('schools.detail.classAgeUnit')}</span>
                                    </div>
                                </div>

                                {/* Kapasite */}
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">{t('schools.detail.classCapacityLabel')}</label>
                                    <input type="number" className="form-input mt-1" min={1} value={classForm.capacity} onChange={cf('capacity')} />
                                </div>

                                {/* Açıklama */}
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">{t('schools.detail.classDescriptionLabel')}</label>
                                    <textarea className="form-input mt-1" rows={2} value={classForm.description} onChange={cf('description')} />
                                </div>
                            </div>

                            <div className="flex shrink-0 gap-3 border-t border-[#e0e6ed] px-6 py-4 dark:border-[#1b2e4b]">
                                <button type="submit" className="btn btn-primary flex-1" disabled={savingClass}>
                                    {savingClass ? t('schools.detail.savingBtn') : (editingClass ? t('schools.detail.classUpdateBtn') : t('schools.detail.classSaveBtn'))}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowClassModal(false)}>{t('common.cancel') || 'İptal'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Logo Kırpma Modal */}
            {showCropModal && cropSrc && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
                    <div className="flex w-full max-w-lg flex-col rounded-xl bg-white shadow-2xl dark:bg-[#0e1726]">
                        <div className="flex items-center justify-between border-b border-[#e0e6ed] px-6 py-4 dark:border-[#1b2e4b]">
                            <h3 className="text-base font-bold text-dark dark:text-white">{t('schools.detail.cropModalTitle')}</h3>
                            <button type="button" onClick={() => { setShowCropModal(false); setCropSrc(null); }} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="relative overflow-hidden p-4" style={{ height: 360 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                id="crop-img"
                                src={cropSrc}
                                alt={t('schools.detail.cropImgAlt')}
                                className="h-full w-full object-contain"
                                style={{ display: 'block' }}
                            />
                            {/* Kırpma çerçevesi */}
                            <div
                                className="absolute border-2 border-white shadow-lg"
                                style={{
                                    left: cropX,
                                    top: cropY,
                                    width: cropSize,
                                    height: cropSize,
                                    cursor: 'move',
                                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                                    borderRadius: '8px',
                                }}
                                onMouseDown={(e) => {
                                    const startX = e.clientX - cropX;
                                    const startY = e.clientY - cropY;
                                    const img = document.getElementById('crop-img') as HTMLImageElement;
                                    const rect = img?.getBoundingClientRect();
                                    const maxX = (rect?.width ?? 400) - cropSize;
                                    const maxY = (rect?.height ?? 360) - cropSize;
                                    const onMove = (me: MouseEvent) => {
                                        setCropX(Math.max(0, Math.min(maxX, me.clientX - startX)));
                                        setCropY(Math.max(0, Math.min(maxY, me.clientY - startY)));
                                    };
                                    const onUp = () => {
                                        window.removeEventListener('mousemove', onMove);
                                        window.removeEventListener('mouseup', onUp);
                                    };
                                    window.addEventListener('mousemove', onMove);
                                    window.addEventListener('mouseup', onUp);
                                }}
                            />
                        </div>
                        <div className="border-t border-[#e0e6ed] px-6 py-3 dark:border-[#1b2e4b]">
                            <label className="block text-xs font-medium text-[#515365] dark:text-[#888ea8]">
                                {t('schools.detail.cropSizeLabel').replace('{size}', String(cropSize))}
                            </label>
                            <input
                                type="range"
                                min={80}
                                max={320}
                                value={cropSize}
                                onChange={e => {
                                    const s = Number(e.target.value);
                                    setCropSize(s);
                                    const img = document.getElementById('crop-img') as HTMLImageElement;
                                    const rect = img?.getBoundingClientRect();
                                    if (rect) {
                                        setCropX(prev => Math.min(prev, rect.width - s));
                                        setCropY(prev => Math.min(prev, rect.height - s));
                                    }
                                }}
                                className="mt-1 w-full"
                            />
                        </div>
                        <div className="flex gap-3 border-t border-[#e0e6ed] px-6 py-4 dark:border-[#1b2e4b]">
                            <button type="button" className="btn btn-primary flex-1" onClick={handleCropConfirm}>
                                {t('schools.detail.cropConfirmBtn')}
                            </button>
                            <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => { setShowCropModal(false); setCropSrc(null); }}>
                                {t('common.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Red Sebebi Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">{t('schools.detail.rejectRequestTitle')}</h2>
                            <button type="button" onClick={() => setShowRejectModal(false)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">
                                    {t('schools.detail.rejectReasonLabel')} <span className="text-danger">*</span>
                                </label>
                                <textarea
                                    className="form-textarea mt-1 w-full"
                                    rows={4}
                                    placeholder={t('schools.detail.rejectReasonPlaceholder')}
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
                                    {savingReject ? t('schools.detail.rejectingBtn') : t('schools.detail.rejectBtn')}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowRejectModal(false)}>{t('common.cancel') || 'İptal'}</button>
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
                                {selectedClass.name} — {t('schools.detail.teacherModalTitle')}
                            </h2>
                            <button type="button" onClick={() => setShowTeacherModal(false)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Mevcut öğretmenler */}
                        {classTeachers.length > 0 && (
                            <div className="mb-4">
                                <p className="mb-2 text-sm font-medium text-dark dark:text-white-light">{t('schools.detail.assignedTeachersLabel')}</p>
                                <div className="space-y-2">
                                    {classTeachers.map(t => (
                                        <div key={t.id} className="flex items-center justify-between rounded border border-[#ebedf2] p-2 dark:border-[#1b2e4b]">
                                            <div>
                                                <span className="font-medium text-dark dark:text-white">{t.name}</span>
                                                {t.role_type && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{t.role_type.name}</span>}
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
                            <p className="text-sm font-medium text-dark dark:text-white-light">{t('schools.detail.addTeacherLabel')}</p>
                            <select className="form-select" value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)}>
                                <option value="">{t('schools.detail.teacherSelectPlaceholder')}</option>
                                {schoolTeachers.map(teacher => {
                                    const assigned = classTeachers.some(ct => Number(ct.id) === Number(teacher.id));
                                    return (
                                        <option key={teacher.id} value={teacher.id} disabled={assigned}>
                                            {teacher.name}{assigned ? t('schools.detail.teacherAlreadyAssigned') : ''}
                                        </option>
                                    );
                                })}
                            </select>
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">{t('schools.detail.roleTypeLabel')} <span className="text-danger">*</span></label>
                                <select className="form-select mt-1" value={classTeacherRoleTypeId} onChange={e => setClassTeacherRoleTypeId(e.target.value)}>
                                    <option value="">{t('schools.detail.roleTypeSelectPlaceholder')}</option>
                                    {roleTypes.filter(r => r.is_active !== false).map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="button" className="btn btn-primary w-full" onClick={handleAssignTeacher} disabled={!selectedTeacherId || !classTeacherRoleTypeId || assigningTeacher}>
                                {assigningTeacher ? t('schools.detail.teacherAssigningBtn') : t('schools.detail.teacherAssignBtn')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
