'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import apiClient from '@/lib/apiClient';
import { Child, Attendance, SupplyItem, Activity } from '@/types';
import {
    ArrowLeft, Plus, Trash2, Pencil, X, Calendar, ClipboardList,
    BookOpen, Users, GraduationCap, AlertCircle, Baby,
} from 'lucide-react';

// ── Yerel tipler ─────────────────────────────────────────────────────────────

type ClassInfo = {
    id: number; name: string; school_id: number; description?: string;
    age_min?: number; age_max?: number; capacity?: number; color?: string;
    is_active?: boolean; children_count?: number; teachers_count?: number;
    academic_year?: { id: number; name: string };
};

type ClassTeacher = {
    id: number; user_id: number; name: string; title?: string;
    teacher_role_type_id?: number | null;
    role_type?: { id: number; name: string } | null;
};

type MealSchedule = {
    id: number; menu_date: string; schedule_type: string;
    meal?: {
        id: number; name: string; meal_type?: string;
        ingredients?: { id: number; name: string; allergens?: { id: number; name: string }[] }[];
    } | null;
};

type AvailableMeal = {
    id: number; name: string; meal_type?: string;
    ingredients?: { id: number; name: string; allergens?: { id: number; name: string }[] }[];
};

type AllergenConflict = { childName: string; allergenName: string };

type Tab = 'students' | 'teachers' | 'attendance' | 'activities' | 'meals' | 'supply';

// ── Sabit etiketler ──────────────────────────────────────────────────────────

const STATUS_ACTIVE: Record<string, string> = {
    present: 'btn-success', absent: 'btn-danger', late: 'btn-warning', excused: 'btn-info',
};

function calcAge(birthDate: string): number | null {
    const bd = new Date(birthDate + 'T00:00:00');
    if (isNaN(bd.getTime())) { return null; }
    const today = new Date();
    let age = today.getFullYear() - bd.getFullYear();
    const m = today.getMonth() - bd.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) { age--; }
    return age;
}

// ── Ana bileşen ───────────────────────────────────────────────────────────────

export default function ClassDetailPage() {
    const { t } = useTranslation();
    const params = useParams();

    const STATUS_LABELS: Record<string, string> = {
        present: t('schools.detail.classDetail.presentStatus'),
        absent: t('schools.detail.classDetail.absentStatus'),
        late: t('schools.detail.classDetail.lateStatus'),
        excused: t('schools.detail.classDetail.excusedStatus'),
    };
    const GENDER_LABELS: Record<string, string> = {
        male: t('schools.detail.genderMale'),
        female: t('schools.detail.genderFemale'),
    };
    const schoolId = params.id as string;
    const classId = params.classId as string;

    const [cls, setCls] = useState<ClassInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('students');

    // Öğrenciler
    const [children, setChildren] = useState<Child[]>([]);
    const [selectedChild, setSelectedChild] = useState<Child | null>(null);
    const [loadingChildDetail, setLoadingChildDetail] = useState(false);

    // Öğretmenler
    const [classTeachers, setClassTeachers] = useState<ClassTeacher[]>([]);
    const [teachersFetched, setTeachersFetched] = useState(false);

    // Devamsızlık
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceStatuses, setAttendanceStatuses] = useState<Record<number, string>>({});
    const [savingAttendance, setSavingAttendance] = useState(false);
    const attendanceLoadedDateRef = useRef<string>('');

    // Etkinlikler
    const [activities, setActivities] = useState<Activity[]>([]);
    const [activitiesFetched, setActivitiesFetched] = useState(false);
    const [loadingActivities, setLoadingActivities] = useState(false);

    // Yemek takvimi
    const [mealSchedules, setMealSchedules] = useState<MealSchedule[]>([]);
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
    const mealLoadedKeyRef = useRef<string>('');

    // Menü ekleme
    const [availableMeals, setAvailableMeals] = useState<AvailableMeal[]>([]);
    const [availableMealsFetched, setAvailableMealsFetched] = useState(false);
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [menuForm, setMenuForm] = useState({ meal_id: '', menu_date: new Date().toISOString().split('T')[0], schedule_type: 'daily' });
    const [savingMenu, setSavingMenu] = useState(false);
    const [pendingAllergenConflicts, setPendingAllergenConflicts] = useState<AllergenConflict[]>([]);
    const [showAllergenWarning, setShowAllergenWarning] = useState(false);

    // İhtiyaç listesi
    const [supplyItems, setSupplyItems] = useState<SupplyItem[]>([]);
    const [supplyFetched, setSupplyFetched] = useState(false);
    const [showSupplyModal, setShowSupplyModal] = useState(false);
    const [editingSupply, setEditingSupply] = useState<SupplyItem | null>(null);
    const [supplyForm, setSupplyForm] = useState({ name: '', description: '', quantity: '1', due_date: '' });
    const [savingSupply, setSavingSupply] = useState(false);

    // ── Veri yükleme ─────────────────────────────────────────────────────────

    const loadInitial = useCallback(async () => {
        setLoading(true);
        try {
            const [clsRes, childrenRes] = await Promise.all([
                apiClient.get(`/schools/${schoolId}/classes/${classId}`),
                apiClient.get(`/schools/${schoolId}/children`, { params: { class_id: classId } }),
            ]);
            if (clsRes.data?.data) { setCls(clsRes.data.data); }
            setChildren(childrenRes.data?.data ?? []);
        } catch {
            toast.error(t('schools.detail.classDetail.classInfoLoadError'));
        } finally {
            setLoading(false);
        }
    }, [schoolId, classId]);

    const loadTeachers = useCallback(async () => {
        if (teachersFetched) { return; }
        try {
            const res = await apiClient.get(`/schools/${schoolId}/classes/${classId}/teachers`);
            setClassTeachers(res.data?.data ?? []);
            setTeachersFetched(true);
        } catch { toast.error(t('schools.detail.classDetail.teachersLoadError')); }
    }, [schoolId, classId, teachersFetched]);

    const loadAttendances = useCallback(async (date: string) => {
        if (attendanceLoadedDateRef.current === date) { return; }
        try {
            const res = await apiClient.get(`/schools/${schoolId}/attendances`, {
                params: { class_id: classId, date },
            });
            const data: Attendance[] = res.data?.data ?? [];
            const statuses: Record<number, string> = {};
            data.forEach(a => { statuses[a.child_id] = a.status; });
            setAttendanceStatuses(statuses);
            attendanceLoadedDateRef.current = date;
        } catch { toast.error(t('schools.detail.classDetail.attendanceLoadError')); }
    }, [schoolId, classId]);

    const loadActivities = useCallback(async () => {
        if (activitiesFetched) { return; }
        setLoadingActivities(true);
        try {
            const res = await apiClient.get(`/schools/${schoolId}/activities`, {
                params: { class_id: classId, per_page: 100 },
            });
            const all: Activity[] = res.data?.data ?? [];
            // Backend class_id filtresi yoksa client'da filtrele
            const filtered = all.filter(a =>
                !a.classes || a.classes.length === 0 || a.classes.some(c => c.id === Number(classId))
            );
            setActivities(filtered);
            setActivitiesFetched(true);
        } catch { toast.error(t('schools.detail.classDetail.activitiesLoadError')); }
        finally { setLoadingActivities(false); }
    }, [schoolId, classId, activitiesFetched]);

    const loadMeals = useCallback(async (year: number, month: number) => {
        const key = `${year}-${month}`;
        if (mealLoadedKeyRef.current === key) { return; }
        try {
            const res = await apiClient.get('/meal-menus/monthly', {
                params: { school_id: schoolId, class_id: classId, year, month },
            });
            setMealSchedules(res.data?.data ?? []);
            mealLoadedKeyRef.current = key;
        } catch { toast.error(t('schools.detail.classDetail.mealsLoadError')); }
    }, [schoolId, classId]);

    const loadSupply = useCallback(async () => {
        if (supplyFetched) { return; }
        try {
            const res = await apiClient.get(`/schools/${schoolId}/classes/${classId}/supply-list`);
            setSupplyItems(res.data?.data ?? []);
            setSupplyFetched(true);
        } catch { toast.error(t('schools.detail.classDetail.supplyLoadError')); }
    }, [schoolId, classId, supplyFetched]);

    const loadAvailableMeals = useCallback(async () => {
        if (availableMealsFetched) { return; }
        try {
            const res = await apiClient.get('/meals', { params: { school_id: schoolId } });
            setAvailableMeals(res.data?.data ?? []);
            setAvailableMealsFetched(true);
        } catch { toast.error(t('schools.detail.classDetail.mealsAvailableLoadError')); }
    }, [schoolId, availableMealsFetched]);

    useEffect(() => { loadInitial(); }, [loadInitial]);

    useEffect(() => {
        if (activeTab === 'teachers') { loadTeachers(); }
        if (activeTab === 'attendance') { loadAttendances(attendanceDate); }
        if (activeTab === 'activities') { loadActivities(); }
        if (activeTab === 'meals') { loadMeals(calendarYear, calendarMonth); }
        if (activeTab === 'supply') { loadSupply(); }
    }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (activeTab === 'attendance') {
            attendanceLoadedDateRef.current = '';
            loadAttendances(attendanceDate);
        }
    }, [attendanceDate]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (activeTab === 'meals') {
            mealLoadedKeyRef.current = '';
            loadMeals(calendarYear, calendarMonth);
        }
    }, [calendarYear, calendarMonth]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Öğrenci detay ────────────────────────────────────────────────────────

    const openChildDetail = async (childId: number) => {
        setLoadingChildDetail(true);
        setSelectedChild(null);
        try {
            const res = await apiClient.get(`/schools/${schoolId}/children/${childId}`);
            setSelectedChild(res.data?.data ?? null);
        } catch { toast.error(t('schools.detail.classDetail.childDetailLoadError')); }
        finally { setLoadingChildDetail(false); }
    };

    // ── Devamsızlık kaydet ───────────────────────────────────────────────────

    const handleSaveAttendance = async () => {
        if (children.length === 0) { return; }
        setSavingAttendance(true);
        const records = children.map(child => ({
            child_id: child.id,
            status: attendanceStatuses[child.id] ?? 'present',
        }));
        try {
            await apiClient.post(`/schools/${schoolId}/attendances`, { class_id: classId, date: attendanceDate, attendances: records });
            toast.success(t('schools.detail.classDetail.attendanceSaved'));
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? t('schools.detail.classDetail.attendanceSaveError'));
        } finally {
            setSavingAttendance(false);
        }
    };

    // ── İhtiyaç listesi CRUD ─────────────────────────────────────────────────

    const openSupplyCreate = () => {
        setEditingSupply(null);
        setSupplyForm({ name: '', description: '', quantity: '1', due_date: '' });
        setShowSupplyModal(true);
    };

    const openSupplyEdit = (item: SupplyItem) => {
        setEditingSupply(item);
        setSupplyForm({ name: item.name, description: item.description ?? '', quantity: String(item.quantity ?? 1), due_date: item.due_date ?? '' });
        setShowSupplyModal(true);
    };

    const handleSupplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingSupply(true);
        const payload = { ...supplyForm, quantity: Number(supplyForm.quantity) };
        try {
            if (editingSupply) {
                await apiClient.put(`/schools/${schoolId}/classes/${classId}/supply-list/${editingSupply.id}`, payload);
                toast.success(t('schools.detail.classDetail.supplyUpdated'));
            } else {
                await apiClient.post(`/schools/${schoolId}/classes/${classId}/supply-list`, payload);
                toast.success(t('schools.detail.classDetail.supplyAdded'));
            }
            setShowSupplyModal(false);
            setSupplyFetched(false);
            setSupplyItems([]);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? t('schools.detail.classDetail.supplyError'));
        } finally {
            setSavingSupply(false); }
    };

    const handleDeleteSupply = async (item: SupplyItem) => {
        const result = await Swal.fire({
            title: t('schools.detail.classDetail.deleteSupplyTitle'),
            text: t('schools.detail.classDetail.deleteSupplyText').replace('{name}', item.name),
            icon: 'warning', showCancelButton: true,
            confirmButtonText: t('swal.confirmDelete'), cancelButtonText: t('common.cancel'),
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) { return; }
        try {
            await apiClient.delete(`/schools/${schoolId}/classes/${classId}/supply-list/${item.id}`);
            toast.success(t('schools.detail.classDetail.supplyDeleted'));
            setSupplyItems(prev => prev.filter(s => s.id !== item.id));
        } catch { toast.error(t('schools.detail.classDetail.supplyDeleteFailed')); }
    };

    const detectAllergenConflicts = (mealId: string): AllergenConflict[] => {
        const meal = availableMeals.find(m => String(m.id) === mealId);
        if (!meal) { return []; }
        const mealAllergenIds = new Set<number>();
        const allergenNameMap = new Map<number, string>();
        (meal.ingredients ?? []).forEach(ing => {
            (ing.allergens ?? []).forEach(a => {
                mealAllergenIds.add(a.id);
                allergenNameMap.set(a.id, a.name);
            });
        });
        if (mealAllergenIds.size === 0) { return []; }
        const conflicts: AllergenConflict[] = [];
        children.forEach(child => {
            (child.allergens ?? []).filter(a => a.status !== 'pending').forEach(ca => {
                if (mealAllergenIds.has(ca.id)) {
                    conflicts.push({ childName: child.full_name, allergenName: allergenNameMap.get(ca.id) ?? ca.name });
                }
            });
        });
        return conflicts;
    };

    const getMealAllergenConflicts = (schedule: MealSchedule): AllergenConflict[] => {
        if (!schedule.meal?.ingredients) { return []; }
        const mealAllergenIds = new Set<number>();
        const allergenNameMap = new Map<number, string>();
        schedule.meal.ingredients.forEach(ing => {
            (ing.allergens ?? []).forEach(a => {
                mealAllergenIds.add(a.id);
                allergenNameMap.set(a.id, a.name);
            });
        });
        if (mealAllergenIds.size === 0) { return []; }
        const conflicts: AllergenConflict[] = [];
        children.forEach(child => {
            (child.allergens ?? []).filter(a => a.status !== 'pending').forEach(ca => {
                if (mealAllergenIds.has(ca.id)) {
                    conflicts.push({ childName: child.full_name, allergenName: allergenNameMap.get(ca.id) ?? ca.name });
                }
            });
        });
        return conflicts;
    };

    const openMenuModal = () => {
        setMenuForm({ meal_id: '', menu_date: new Date().toISOString().split('T')[0], schedule_type: 'daily' });
        setPendingAllergenConflicts([]);
        setShowAllergenWarning(false);
        setShowMenuModal(true);
        loadAvailableMeals();
    };

    const saveMenuEntry = async () => {
        setSavingMenu(true);
        try {
            const res = await apiClient.post('/meal-menus', {
                school_id: schoolId,
                class_id: classId,
                meal_id: Number(menuForm.meal_id),
                menu_date: menuForm.menu_date,
                schedule_type: menuForm.schedule_type,
            });
            const newSchedule: MealSchedule = res.data?.data;
            if (newSchedule) {
                setMealSchedules(prev => [...prev, newSchedule]);
            }
            setShowMenuModal(false);
            setShowAllergenWarning(false);
            toast.success(t('schools.detail.classDetail.menuAddedSuccess'));
            // Reload to get updated data
            mealLoadedKeyRef.current = '';
            loadMeals(calendarYear, calendarMonth);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? t('schools.detail.classDetail.menuAddError'));
        } finally {
            setSavingMenu(false);
        }
    };

    const handleMenuSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!menuForm.meal_id) { toast.error(t('schools.detail.classDetail.menuSelectError')); return; }
        const conflicts = detectAllergenConflicts(menuForm.meal_id);
        if (conflicts.length > 0) {
            setPendingAllergenConflicts(conflicts);
            setShowAllergenWarning(true);
            return;
        }
        await saveMenuEntry();
    };

    const handleDeleteMenuEntry = async (scheduleId: number) => {
        const result = await Swal.fire({
            title: t('schools.detail.classDetail.removeFromMenuTitle'),
            text: t('schools.detail.classDetail.removeFromMenuText'),
            icon: 'warning', showCancelButton: true,
            confirmButtonText: t('swal.confirmDelete'), cancelButtonText: t('common.cancel'),
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) { return; }
        try {
            await apiClient.delete(`/meal-menus/${scheduleId}`);
            setMealSchedules(prev => prev.filter(s => s.id !== scheduleId));
            toast.success(t('schools.detail.classDetail.menuRemovedSuccess'));
        } catch { toast.error(t('schools.detail.classDetail.menuRemoveFailed')); }
    };

    // ── Render ───────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    const teacherCount = teachersFetched ? classTeachers.length : cls?.teachers_count ?? 0;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
                <Link href={`/schools/${schoolId}`} className="btn btn-sm btn-outline-secondary gap-2">
                    <ArrowLeft className="h-4 w-4" />{t('schools.detail.classDetail.backBtn')}
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        {cls?.color && (
                            <span className="h-5 w-5 rounded-full border-2 border-white shadow" style={{ background: cls.color }} />
                        )}
                        <h1 className="text-2xl font-bold text-dark dark:text-white">{cls?.name ?? t('schools.detail.classDetail.classDefaultName')}</h1>
                        {cls?.is_active === false && <span className="badge badge-outline-danger">{t('schools.detail.statusInactive')}</span>}
                        {cls?.academic_year && (
                            <span className="badge badge-outline-info text-xs">{cls.academic_year.name}</span>
                        )}
                    </div>
                    {cls?.description && <p className="mt-0.5 text-sm text-[#888ea8]">{cls.description}</p>}
                </div>
            </div>

            {/* İstatistik Kartları */}
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard
                    icon={<Users className="h-5 w-5" />}
                    label={t('schools.detail.classDetail.studentStatLabel')}
                    value={`${children.length}${cls?.capacity ? ` / ${cls.capacity}` : ''}`}
                    color="primary"
                />
                <StatCard
                    icon={<GraduationCap className="h-5 w-5" />}
                    label={t('schools.detail.classDetail.teacherStatLabel')}
                    value={teacherCount > 0 ? String(teacherCount) : '—'}
                    color="info"
                />
                <StatCard
                    icon={<Baby className="h-5 w-5" />}
                    label={t('schools.detail.classDetail.ageRangeStatLabel')}
                    value={cls?.age_min != null || cls?.age_max != null ? `${cls?.age_min ?? '?'} – ${cls?.age_max ?? '?'}` : '—'}
                    color="success"
                />
                <StatCard
                    icon={<AlertCircle className="h-5 w-5" />}
                    label={t('schools.detail.classDetail.allergyStatLabel')}
                    value={String(children.filter(c => (c.allergens?.length ?? 0) > 0).length)}
                    color="warning"
                />
            </div>

            {/* Tab Paneli */}
            <div className="panel">
                {/* Tab başlıkları */}
                <div className="flex flex-wrap gap-0 overflow-x-auto border-b border-[#ebedf2] dark:border-[#1b2e4b]">
                    {([
                        { key: 'students', label: `${t('schools.detail.classDetail.studentsTab')} (${children.length})`, icon: <Users className="h-4 w-4" /> },
                        { key: 'teachers', label: `${t('schools.detail.classDetail.teachersTab')}${teacherCount > 0 ? ` (${teacherCount})` : ''}`, icon: <GraduationCap className="h-4 w-4" /> },
                        { key: 'attendance', label: t('schools.detail.classDetail.attendanceTab'), icon: <ClipboardList className="h-4 w-4" /> },
                        { key: 'activities', label: t('schools.detail.classDetail.activitiesTab'), icon: <BookOpen className="h-4 w-4" /> },
                        { key: 'meals', label: t('schools.detail.classDetail.mealsTab'), icon: <Calendar className="h-4 w-4" /> },
                        { key: 'supply', label: t('schools.detail.classDetail.supplyTab'), icon: <Plus className="h-4 w-4" /> },
                    ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(tab => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                                activeTab === tab.key
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-[#506690] hover:text-primary'
                            }`}
                        >
                            {tab.icon}{tab.label}
                        </button>
                    ))}
                </div>

                <div className="pt-4">

                    {/* ── Öğrenciler ──────────────────────────────────────────── */}
                    {activeTab === 'students' && (
                        children.length === 0 ? (
                            <EmptyTab icon={<Users />} text={t('schools.detail.classDetail.noStudents')} />
                        ) : (
                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th>{t('schools.detail.classDetail.fullNameColHeader')}</th>
                                            <th>{t('schools.detail.classDetail.birthAgeColHeader')}</th>
                                            <th>{t('schools.detail.classDetail.genderColHeader')}</th>
                                            <th>{t('schools.detail.classDetail.bloodTypeColHeader')}</th>
                                            <th>{t('schools.detail.classDetail.healthWarningColHeader')}</th>
                                            <th>{t('schools.detail.classDetail.statusColHeader')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {children.map(c => {
                                            const age = c.birth_date ? calcAge(c.birth_date) : null;
                                            const allergenCount = c.allergens?.filter(a => a.status !== 'pending').length ?? 0;
                                            const medicationCount = c.medications?.length ?? 0;
                                            return (
                                                <tr
                                                    key={c.id}
                                                    className="cursor-pointer"
                                                    onClick={() => openChildDetail(c.id)}
                                                >
                                                    <td>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                                {c.first_name?.charAt(0)}{c.last_name?.charAt(0)}
                                                            </div>
                                                            <span className="font-medium text-dark dark:text-white">{c.full_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="text-sm">
                                                        {c.birth_date ? new Date(c.birth_date).toLocaleDateString('tr-TR') : '—'}
                                                        {age !== null && <span className="ml-1 text-xs text-[#888ea8]">({age}{t('schools.detail.classDetail.ageUnit')})</span>}
                                                    </td>
                                                    <td className="text-sm">{c.gender ? (GENDER_LABELS[c.gender] ?? c.gender) : '—'}</td>
                                                    <td className="text-sm">{c.blood_type ?? '—'}</td>
                                                    <td>
                                                        <div className="flex flex-wrap gap-1">
                                                            {allergenCount > 0 && (
                                                                <span className="badge badge-outline-danger text-xs">
                                                                    {t('schools.detail.classDetail.allergenBadge').replace('{count}', String(allergenCount))}
                                                                </span>
                                                            )}
                                                            {medicationCount > 0 && (
                                                                <span className="badge badge-outline-warning text-xs">
                                                                    {t('schools.detail.classDetail.medicationBadge').replace('{count}', String(medicationCount))}
                                                                </span>
                                                            )}
                                                            {allergenCount === 0 && medicationCount === 0 && (
                                                                <span className="text-xs text-[#888ea8]">—</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`badge text-xs ${c.status === 'active' ? 'badge-outline-success' : 'badge-outline-secondary'}`}>
                                                            {c.status === 'active' ? t('schools.detail.classDetail.statusActive') : (c.status ?? t('schools.detail.classDetail.statusActive'))}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                <p className="mt-2 text-xs text-[#888ea8]">
                                    {t('schools.detail.classDetail.clickRowHint')}
                                </p>
                            </div>
                        )
                    )}

                    {/* ── Öğretmenler ─────────────────────────────────────────── */}
                    {activeTab === 'teachers' && (
                        !teachersFetched ? (
                            <LoadingSpinner />
                        ) : classTeachers.length === 0 ? (
                            <EmptyTab icon={<GraduationCap />} text={t('schools.detail.classDetail.noTeachers')} />
                        ) : (
                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th>{t('schools.detail.classDetail.teacherColHeader')}</th>
                                            <th>{t('schools.detail.classDetail.titleColHeader')}</th>
                                            <th>{t('schools.detail.classDetail.roleTypeColHeader')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {classTeachers.map(t => (
                                            <tr key={t.id}>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-info/10 text-xs font-bold text-info">
                                                            {t.name?.charAt(0)?.toUpperCase() ?? '?'}
                                                        </div>
                                                        <span className="font-medium text-dark dark:text-white">{t.name}</span>
                                                    </div>
                                                </td>
                                                <td className="text-sm text-[#888ea8]">{t.title ?? '—'}</td>
                                                <td>
                                                    {t.role_type ? (
                                                        <span className="badge badge-outline-primary text-xs">{t.role_type.name}</span>
                                                    ) : (
                                                        <span className="text-xs text-[#888ea8]">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}

                    {/* ── Devamsızlık ─────────────────────────────────────────── */}
                    {activeTab === 'attendance' && (
                        <div>
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-medium text-dark dark:text-white">{t('schools.detail.classDetail.dateLabel')}</label>
                                    <input
                                        type="date"
                                        className="form-input w-44"
                                        value={attendanceDate}
                                        onChange={e => setAttendanceDate(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-4 text-sm font-medium">
                                    <span className="text-success">{t('schools.detail.classDetail.presentLabel')} {Object.values(attendanceStatuses).filter(s => s === 'present').length}</span>
                                    <span className="text-danger">{t('schools.detail.classDetail.absentLabel')} {Object.values(attendanceStatuses).filter(s => s === 'absent').length}</span>
                                    <span className="text-warning">{t('schools.detail.classDetail.lateLabel')} {Object.values(attendanceStatuses).filter(s => s === 'late').length}</span>
                                    <span className="text-info">{t('schools.detail.classDetail.excusedLabel')} {Object.values(attendanceStatuses).filter(s => s === 'excused').length}</span>
                                </div>
                            </div>

                            {children.length === 0 ? (
                                <EmptyTab icon={<ClipboardList />} text={t('schools.detail.classDetail.noStudentsAttendance')} />
                            ) : (
                                <>
                                    <div className="table-responsive mb-5">
                                        <table className="table-hover">
                                            <thead>
                                                <tr>
                                                    <th>{t('schools.detail.classDetail.studentColHeader')}</th>
                                                    <th>{t('schools.detail.classDetail.statusAttColHeader')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {children.map(child => {
                                                    const current = attendanceStatuses[child.id] ?? 'present';
                                                    return (
                                                        <tr key={child.id}>
                                                            <td>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                                        {child.first_name?.charAt(0)}{child.last_name?.charAt(0)}
                                                                    </div>
                                                                    <span className="font-medium text-dark dark:text-white">{child.full_name}</span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {(['present', 'absent', 'late', 'excused'] as const).map(s => (
                                                                        <button
                                                                            key={s}
                                                                            type="button"
                                                                            onClick={() => setAttendanceStatuses(prev => ({ ...prev, [child.id]: s }))}
                                                                            className={`btn btn-sm px-3 py-1 text-xs ${current === s ? STATUS_ACTIVE[s] : 'btn-outline-secondary'}`}
                                                                        >
                                                                            {STATUS_LABELS[s]}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-primary gap-2"
                                        onClick={handleSaveAttendance}
                                        disabled={savingAttendance}
                                    >
                                        <ClipboardList className="h-4 w-4" />
                                        {savingAttendance ? t('common.loading') : t('schools.detail.classDetail.saveAttendanceBtn')}
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* ── Etkinlikler ─────────────────────────────────────────── */}
                    {activeTab === 'activities' && (
                        loadingActivities ? (
                            <LoadingSpinner />
                        ) : activities.length === 0 ? (
                            <EmptyTab icon={<BookOpen />} text={t('schools.detail.classDetail.noActivities')} />
                        ) : (
                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th>{t('schools.detail.classDetail.activityColHeader')}</th>
                                            <th>{t('schools.detail.classDetail.dateRangeColHeader')}</th>
                                            <th>{t('schools.detail.classDetail.typeColHeader')}</th>
                                            <th>{t('schools.detail.classDetail.capacityColHeader')}</th>
                                            <th>{t('schools.detail.classDetail.enrollmentColHeader')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activities.map(a => (
                                            <tr key={a.id}>
                                                <td>
                                                    <p className="font-medium text-dark dark:text-white">{a.name}</p>
                                                    {a.description && (
                                                        <p className="line-clamp-1 text-xs text-[#888ea8]">{a.description}</p>
                                                    )}
                                                </td>
                                                <td className="text-sm">
                                                    {a.start_date ? new Date(a.start_date).toLocaleDateString('tr-TR') : '—'}
                                                    {a.end_date && a.end_date !== a.start_date && (
                                                        <span className="text-[#888ea8]"> → {new Date(a.end_date).toLocaleDateString('tr-TR')}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {a.is_paid ? (
                                                        <span className="badge badge-outline-success text-xs">
                                                            {a.price ? `₺${a.price}` : t('schools.detail.classDetail.paidBadge')}
                                                        </span>
                                                    ) : (
                                                        <span className="badge badge-outline-secondary text-xs">{t('schools.detail.classDetail.freeBadge')}</span>
                                                    )}
                                                </td>
                                                <td className="text-sm">{a.capacity ?? '—'}</td>
                                                <td>
                                                    <span className="badge badge-outline-info text-xs">{t('schools.detail.classDetail.enrollmentsBadge').replace('{count}', String(a.enrollments_count ?? 0))}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}

                    {/* ── Yemek Takvimi ───────────────────────────────────────── */}
                    {activeTab === 'meals' && (
                        <div>
                            <div className="mb-4 flex justify-end">
                                <button type="button" className="btn btn-primary btn-sm gap-2" onClick={openMenuModal}>
                                    <Plus className="h-4 w-4" />{t('schools.detail.classDetail.addToMenuBtn')}
                                </button>
                            </div>
                            <MealCalendar
                                mealSchedules={mealSchedules}
                                year={calendarYear}
                                month={calendarMonth}
                                onPrev={() => {
                                    if (calendarMonth === 1) { setCalendarMonth(12); setCalendarYear(y => y - 1); }
                                    else { setCalendarMonth(m => m - 1); }
                                }}
                                onNext={() => {
                                    if (calendarMonth === 12) { setCalendarMonth(1); setCalendarYear(y => y + 1); }
                                    else { setCalendarMonth(m => m + 1); }
                                }}
                                onDelete={handleDeleteMenuEntry}
                                getConflicts={getMealAllergenConflicts}
                            />
                        </div>
                    )}

                    {/* ── İhtiyaç Listesi ─────────────────────────────────────── */}
                    {activeTab === 'supply' && (
                        <div>
                            <div className="mb-4 flex justify-end">
                                <button type="button" className="btn btn-primary btn-sm gap-2" onClick={openSupplyCreate}>
                                    <Plus className="h-4 w-4" />{t('schools.detail.classDetail.addItemBtn')}
                                </button>
                            </div>
                            {supplyItems.length === 0 ? (
                                <EmptyTab icon={<BookOpen />} text={t('schools.detail.classDetail.noSupply')} />
                            ) : (
                                <div className="table-responsive">
                                    <table className="table-hover">
                                        <thead>
                                            <tr>
                                                <th>{t('schools.detail.classDetail.materialColHeader')}</th>
                                                <th>{t('schools.detail.classDetail.descriptionColHeader')}</th>
                                                <th>{t('schools.detail.classDetail.quantityColHeader')}</th>
                                                <th>{t('schools.detail.classDetail.dueDateColHeader')}</th>
                                                <th>{t('schools.detail.classDetail.actionsColHeader')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {supplyItems.map(item => (
                                                <tr key={item.id}>
                                                    <td className="font-medium text-dark dark:text-white">{item.name}</td>
                                                    <td className="text-sm text-[#515365] dark:text-[#888ea8]">{item.description ?? '—'}</td>
                                                    <td className="text-sm">{item.quantity ?? 1}</td>
                                                    <td className="text-sm">
                                                        {item.due_date ? new Date(item.due_date).toLocaleDateString('tr-TR') : '—'}
                                                    </td>
                                                    <td>
                                                        <div className="flex gap-2">
                                                            <button type="button" className="btn btn-sm btn-outline-primary p-2" onClick={() => openSupplyEdit(item)}>
                                                                <Pencil className="h-4 w-4" />
                                                            </button>
                                                            <button type="button" className="btn btn-sm btn-outline-danger p-2" onClick={() => handleDeleteSupply(item)}>
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

                </div>
            </div>

            {/* ── Öğrenci Detay Modalı ────────────────────────────────────────── */}
            {(selectedChild !== null || loadingChildDetail) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white dark:bg-[#0e1726]">

                        {/* Modal header — sticky */}
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#ebedf2] bg-white px-5 py-4 dark:border-[#1b2e4b] dark:bg-[#0e1726]">
                            <h2 className="text-lg font-bold text-dark dark:text-white">{t('schools.detail.classDetail.studentDetailTitle')}</h2>
                            <button type="button" onClick={() => setSelectedChild(null)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {loadingChildDetail ? (
                            <div className="flex h-40 items-center justify-center"><LoadingSpinner /></div>
                        ) : selectedChild ? (
                            <div className="space-y-6 p-5">

                                {/* Avatar + özet */}
                                <div className="flex items-center gap-4 rounded-lg bg-primary/5 p-4">
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                                        {selectedChild.first_name?.charAt(0)}{selectedChild.last_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-dark dark:text-white">{selectedChild.full_name}</p>
                                        <div className="mt-1.5 flex flex-wrap gap-2">
                                            {selectedChild.gender && (
                                                <span className="badge badge-outline-info text-xs">
                                                    {GENDER_LABELS[selectedChild.gender] ?? selectedChild.gender}
                                                </span>
                                            )}
                                            {selectedChild.blood_type && (
                                                <span className="badge badge-outline-danger text-xs">{selectedChild.blood_type}</span>
                                            )}
                                            {selectedChild.birth_date && (
                                                <span className="badge badge-outline-secondary text-xs">
                                                    {calcAge(selectedChild.birth_date)}{t('schools.detail.classDetail.ageUnit')}
                                                </span>
                                            )}
                                            <span className={`badge text-xs ${selectedChild.status === 'active' ? 'badge-outline-success' : 'badge-outline-secondary'}`}>
                                                {selectedChild.status === 'active' ? t('schools.detail.classDetail.statusActive') : (selectedChild.status ?? t('schools.detail.classDetail.statusActive'))}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Kişisel Bilgiler */}
                                <Section title={t('schools.detail.classDetail.personalInfoSection')}>
                                    <InfoGrid rows={[
                                        { label: t('schools.detail.birthDateLabel'), value: selectedChild.birth_date ? new Date(selectedChild.birth_date).toLocaleDateString('tr-TR') : null },
                                        { label: t('schools.detail.idNumberLabel'), value: selectedChild.identity_number },
                                        { label: t('schools.detail.passportLabel'), value: selectedChild.passport_number },
                                        { label: t('schools.detail.nationalityLabel'), value: selectedChild.nationality ? `${selectedChild.nationality.flag_emoji ?? ''} ${selectedChild.nationality.name}` : null },
                                        { label: t('schools.detail.languagesLabel'), value: selectedChild.languages?.join(', ') ?? null },
                                    ]} />
                                    {selectedChild.parent_notes && (
                                        <div className="mt-3 rounded bg-[#f5f5f5] p-3 dark:bg-[#1b2e4b]">
                                            <p className="mb-1 text-xs font-semibold text-[#888ea8]">{t('schools.detail.classDetail.parentNoteLabel')}</p>
                                            <p className="text-sm text-dark dark:text-white">{selectedChild.parent_notes}</p>
                                        </div>
                                    )}
                                    {selectedChild.special_notes && (
                                        <div className="mt-2 rounded border border-warning/30 bg-warning/5 p-3">
                                            <p className="mb-1 text-xs font-semibold text-warning">{t('schools.detail.classDetail.specialNoteLabel')}</p>
                                            <p className="text-sm text-dark dark:text-white">{selectedChild.special_notes}</p>
                                        </div>
                                    )}
                                </Section>

                                {/* Sağlık Bilgileri */}
                                {((selectedChild.allergens?.length ?? 0) > 0 ||
                                    (selectedChild.conditions?.length ?? 0) > 0 ||
                                    (selectedChild.medications?.length ?? 0) > 0) && (
                                    <Section title={t('schools.detail.classDetail.healthInfoSection')}>
                                        {(selectedChild.allergens?.length ?? 0) > 0 && (
                                            <div className="mb-4">
                                                <p className="mb-2 text-xs font-semibold text-danger">{t('schools.detail.classDetail.allergensLabel')}</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {selectedChild.allergens!.map(a => (
                                                        <span
                                                            key={a.id}
                                                            className={`badge ${a.status === 'pending' ? 'badge-outline-warning' : 'badge-outline-danger'}`}
                                                        >
                                                            {a.name}{a.status === 'pending' ? t('schools.detail.classDetail.pendingApproval') : ''}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {(selectedChild.conditions?.length ?? 0) > 0 && (
                                            <div className="mb-4">
                                                <p className="mb-2 text-xs font-semibold text-[#888ea8]">{t('schools.detail.classDetail.conditionsLabel')}</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {selectedChild.conditions!.map(c => (
                                                        <span
                                                            key={c.id}
                                                            className={`badge ${c.status === 'pending' ? 'badge-outline-warning' : 'badge-outline-info'}`}
                                                        >
                                                            {c.name}{c.status === 'pending' ? t('schools.detail.classDetail.pendingApproval') : ''}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {(selectedChild.medications?.length ?? 0) > 0 && (
                                            <div>
                                                <p className="mb-2 text-xs font-semibold text-[#888ea8]">{t('schools.detail.classDetail.medicationsLabel')}</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {selectedChild.medications!.map(m => (
                                                        <span key={m.id} className="badge badge-outline-secondary">{m.name}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </Section>
                                )}

                                {/* Aile Bilgileri */}
                                {selectedChild.family_profile && (
                                    <Section title={t('schools.detail.classDetail.familyInfoSection')}>
                                        {selectedChild.family_profile.family_name && (
                                            <p className="mb-3 text-sm font-medium text-dark dark:text-white">
                                                {t('schools.detail.classDetail.familyNameLabel')} {selectedChild.family_profile.family_name}
                                            </p>
                                        )}
                                        <div className="space-y-2">
                                            {selectedChild.family_profile.owner && (
                                                <FamilyMemberCard
                                                    name={`${selectedChild.family_profile.owner.name} ${selectedChild.family_profile.owner.surname}`}
                                                    email={selectedChild.family_profile.owner.email}
                                                    phone={selectedChild.family_profile.owner.phone}
                                                    label={t('schools.detail.classDetail.mainParentLabel')}
                                                    primary
                                                />
                                            )}
                                            {(selectedChild.family_profile.members ?? []).filter(m => m.user).map(m => (
                                                <FamilyMemberCard
                                                    key={m.id}
                                                    name={`${m.user!.name} ${m.user!.surname}`}
                                                    email={m.user!.email}
                                                    phone={m.user!.phone}
                                                    label={m.role ?? ''}
                                                />
                                            ))}
                                        </div>
                                    </Section>
                                )}

                            </div>
                        ) : null}

                        {/* Modal footer — sticky */}
                        <div className="sticky bottom-0 border-t border-[#ebedf2] bg-white p-4 dark:border-[#1b2e4b] dark:bg-[#0e1726]">
                            <button type="button" className="btn btn-outline-secondary w-full" onClick={() => setSelectedChild(null)}>
                                {t('common.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Menü Ekle Modalı ──────────────────────────────────────────── */}
            {showMenuModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">{t('schools.detail.classDetail.addToMenuModalTitle')}</h2>
                            <button type="button" onClick={() => setShowMenuModal(false)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {showAllergenWarning ? (
                            <div>
                                <div className="mb-4 rounded-lg border border-warning/30 bg-warning/5 p-4">
                                    <p className="mb-2 font-semibold text-warning">{t('schools.detail.classDetail.allergenWarningTitle')}</p>
                                    <p className="mb-3 text-sm text-[#888ea8]">
                                        {t('schools.detail.classDetail.allergenWarningDesc')}
                                    </p>
                                    <ul className="space-y-1">
                                        {pendingAllergenConflicts.map((c, i) => (
                                            <li key={i} className="text-sm">
                                                <span className="font-medium text-dark dark:text-white">{c.childName}</span>
                                                <span className="text-[#888ea8]"> → </span>
                                                <span className="text-danger">{c.allergenName}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <p className="mb-4 text-sm text-[#888ea8]">{t('schools.detail.classDetail.allergenWarningQuestion')}</p>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        className="btn btn-warning flex-1"
                                        onClick={saveMenuEntry}
                                        disabled={savingMenu}
                                    >
                                        {savingMenu ? t('common.loading') : t('schools.detail.classDetail.allergenWarningConfirm')}
                                    </button>
                                    <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowAllergenWarning(false)}>
                                        {t('schools.detail.classDetail.allergenWarningBack')}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleMenuSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">{t('schools.detail.classDetail.mealSelectLabel')}</label>
                                    <select
                                        className="form-input mt-1"
                                        value={menuForm.meal_id}
                                        onChange={e => setMenuForm(p => ({ ...p, meal_id: e.target.value }))}
                                        required
                                    >
                                        <option value="">{t('schools.detail.classDetail.mealSelectPlaceholder')}</option>
                                        {availableMeals.map(m => (
                                            <option key={m.id} value={String(m.id)}>
                                                {m.name}{m.meal_type ? ` (${m.meal_type})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {availableMeals.length === 0 && availableMealsFetched && (
                                        <p className="mt-1 text-xs text-[#888ea8]">{t('schools.detail.classDetail.noMealDefined')}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">{t('schools.detail.classDetail.menuDateLabel')}</label>
                                    <input
                                        type="date" className="form-input mt-1"
                                        value={menuForm.menu_date}
                                        onChange={e => setMenuForm(p => ({ ...p, menu_date: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">{t('schools.detail.classDetail.menuTypeLabel')}</label>
                                    <select
                                        className="form-input mt-1"
                                        value={menuForm.schedule_type}
                                        onChange={e => setMenuForm(p => ({ ...p, schedule_type: e.target.value }))}
                                    >
                                        <option value="daily">{t('schools.detail.classDetail.menuTypeDaily')}</option>
                                        <option value="weekly">{t('schools.detail.classDetail.menuTypeWeekly')}</option>
                                        <option value="monthly">{t('schools.detail.classDetail.menuTypeMonthly')}</option>
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="submit" className="btn btn-primary flex-1" disabled={savingMenu}>
                                        {savingMenu ? t('common.loading') : t('schools.detail.classDetail.addToMenuBtn')}
                                    </button>
                                    <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowMenuModal(false)}>{t('common.cancel')}</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* ── İhtiyaç Listesi Modalı ──────────────────────────────────────── */}
            {showSupplyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">
                                {editingSupply ? t('schools.detail.classDetail.supplyEditModalTitle') : t('schools.detail.classDetail.supplyAddModalTitle')}
                            </h2>
                            <button type="button" onClick={() => setShowSupplyModal(false)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSupplySubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">{t('schools.detail.classDetail.materialNameLabel')}</label>
                                <input
                                    type="text" className="form-input mt-1"
                                    value={supplyForm.name}
                                    onChange={e => setSupplyForm(p => ({ ...p, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">{t('schools.detail.classDetail.descriptionDetailLabel')}</label>
                                <textarea
                                    className="form-input mt-1" rows={2}
                                    placeholder={t('schools.detail.classDetail.descriptionPlaceholder')}
                                    value={supplyForm.description}
                                    onChange={e => setSupplyForm(p => ({ ...p, description: e.target.value }))}
                                />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">{t('schools.detail.classDetail.quantityLabel')}</label>
                                    <input
                                        type="number" className="form-input mt-1" min={1}
                                        value={supplyForm.quantity}
                                        onChange={e => setSupplyForm(p => ({ ...p, quantity: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">{t('schools.detail.classDetail.dueDateLabel')}</label>
                                    <input
                                        type="date" className="form-input mt-1"
                                        value={supplyForm.due_date}
                                        onChange={e => setSupplyForm(p => ({ ...p, due_date: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn btn-primary flex-1" disabled={savingSupply}>
                                    {savingSupply ? t('common.loading') : (editingSupply ? t('schools.detail.classDetail.supplyUpdateBtn') : t('schools.detail.classDetail.supplyAddBtn'))}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowSupplyModal(false)}>{t('common.cancel')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Yardımcı bileşenler ───────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
    const bg: Record<string, string> = {
        primary: 'bg-primary/10 text-primary',
        info: 'bg-info/10 text-info',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
    };
    return (
        <div className="panel p-4">
            <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${bg[color] ?? bg.primary}`}>
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-[#888ea8]">{label}</p>
                    <p className="truncate text-lg font-bold text-dark dark:text-white">{value}</p>
                </div>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#888ea8]">{title}</p>
            {children}
        </div>
    );
}

function InfoGrid({ rows }: { rows: { label: string; value?: string | null }[] }) {
    const { t } = useTranslation();
    const filtered = rows.filter(r => r.value);
    if (filtered.length === 0) { return <p className="text-sm text-[#888ea8]">{t('schools.detail.classDetail.noInfoEntered')}</p>; }
    return (
        <div className="divide-y divide-[#ebedf2] dark:divide-[#1b2e4b]">
            {filtered.map(r => (
                <div key={r.label} className="flex justify-between py-2">
                    <span className="text-sm text-[#888ea8]">{r.label}</span>
                    <span className="text-sm font-medium text-dark dark:text-white">{r.value}</span>
                </div>
            ))}
        </div>
    );
}

function FamilyMemberCard({ name, email, phone, label, primary }: {
    name: string; email: string; phone?: string; label: string; primary?: boolean;
}) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-[#ebedf2] p-3 dark:border-[#1b2e4b]">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${primary ? 'bg-primary text-white' : 'bg-[#888ea8] text-white'}`}>
                {name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
                <p className="font-medium text-dark dark:text-white">
                    {name}
                    <span className="ml-2 text-xs text-[#888ea8]">{label}</span>
                </p>
                <p className="text-xs text-[#888ea8]">{email}</p>
                {phone && <p className="text-xs text-[#888ea8]">{phone}</p>}
            </div>
        </div>
    );
}

function MealCalendar({
    mealSchedules, year, month, onPrev, onNext, onDelete, getConflicts,
}: {
    mealSchedules: MealSchedule[];
    year: number; month: number;
    onPrev: () => void; onNext: () => void;
    onDelete?: (id: number) => void;
    getConflicts?: (s: MealSchedule) => AllergenConflict[];
}) {
    const { t } = useTranslation();
    const [allergenModal, setAllergenModal] = useState<{ mealName: string; conflicts: AllergenConflict[] } | null>(null);
    const MONTHS_TR = [
        t('schools.detail.classDetail.calMonthJan'), t('schools.detail.classDetail.calMonthFeb'),
        t('schools.detail.classDetail.calMonthMar'), t('schools.detail.classDetail.calMonthApr'),
        t('schools.detail.classDetail.calMonthMay'), t('schools.detail.classDetail.calMonthJun'),
        t('schools.detail.classDetail.calMonthJul'), t('schools.detail.classDetail.calMonthAug'),
        t('schools.detail.classDetail.calMonthSep'), t('schools.detail.classDetail.calMonthOct'),
        t('schools.detail.classDetail.calMonthNov'), t('schools.detail.classDetail.calMonthDec'),
    ];
    const DAY_NAMES = [
        t('schools.detail.classDetail.calDayMon'), t('schools.detail.classDetail.calDayTue'),
        t('schools.detail.classDetail.calDayWed'), t('schools.detail.classDetail.calDayThu'),
        t('schools.detail.classDetail.calDayFri'), t('schools.detail.classDetail.calDaySat'),
        t('schools.detail.classDetail.calDaySun'),
    ];
    const daysInMonth = new Date(year, month, 0).getDate();
    const rawFirstDay = new Date(year, month - 1, 1).getDay();
    const firstDay = rawFirstDay === 0 ? 6 : rawFirstDay - 1;
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) { cells.push(null); }
    for (let d = 1; d <= daysInMonth; d++) { cells.push(d); }

    const getMealsForDay = (day: number) => {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return mealSchedules.filter(s => s.menu_date === dateStr);
    };

    const todayD = new Date().getDate();
    const todayM = new Date().getMonth() + 1;
    const todayY = new Date().getFullYear();

    // Group conflicts by child for modal display
    const groupedConflicts = allergenModal
        ? allergenModal.conflicts.reduce<Record<string, string[]>>((acc, c) => {
            if (!acc[c.childName]) { acc[c.childName] = []; }
            acc[c.childName].push(c.allergenName);
            return acc;
        }, {})
        : {};

    return (
        <div>
            <div className="mb-5 flex items-center justify-between">
                <button type="button" className="btn btn-sm btn-outline-primary px-4" onClick={onPrev}>{t('schools.detail.classDetail.calPrevBtn')}</button>
                <span className="text-lg font-semibold text-dark dark:text-white">
                    {MONTHS_TR[month - 1]} {year}
                </span>
                <button type="button" className="btn btn-sm btn-outline-primary px-4" onClick={onNext}>{t('schools.detail.classDetail.calNextBtn')}</button>
            </div>
            <div className="grid grid-cols-7 gap-1">
                {DAY_NAMES.map(d => (
                    <div key={d} className="py-2 text-center text-xs font-semibold text-[#888ea8]">{d}</div>
                ))}
                {cells.map((day, i) => {
                    const meals = day ? getMealsForDay(day) : [];
                    const isToday = day === todayD && month === todayM && year === todayY;
                    return (
                        <div
                            key={i}
                            className={`min-h-[80px] rounded border p-1.5 text-xs ${
                                day ? 'border-[#ebedf2] dark:border-[#1b2e4b]' : 'border-transparent'
                            } ${isToday ? 'bg-primary/5 ring-1 ring-primary/30' : ''}`}
                        >
                            {day && (
                                <>
                                    <div className={`mb-1 text-xs font-semibold ${isToday ? 'text-primary' : 'text-dark dark:text-white'}`}>
                                        {day}
                                    </div>
                                    {meals.map(s => {
                                        const conflicts = getConflicts ? getConflicts(s) : [];
                                        const hasConflict = conflicts.length > 0;
                                        return (
                                            <div key={s.id} className="mb-0.5">
                                                <div
                                                    className={`flex items-center gap-0.5 rounded px-1 py-0.5 ${hasConflict ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'}`}
                                                >
                                                    <span className="min-w-0 flex-1 truncate" title={s.meal?.name}>
                                                        {s.meal?.name}
                                                    </span>
                                                    {hasConflict && (
                                                        <button
                                                            type="button"
                                                            className="ml-0.5 shrink-0 rounded bg-danger/20 px-0.5 font-bold text-danger hover:bg-danger/40"
                                                            title={t('schools.detail.classDetail.allergenConflictsTitle')}
                                                            onClick={() => setAllergenModal({ mealName: s.meal?.name ?? '', conflicts })}
                                                        >
                                                            ⚠
                                                        </button>
                                                    )}
                                                    {onDelete && (
                                                        <button
                                                            type="button"
                                                            className="shrink-0 opacity-60 hover:opacity-100"
                                                            onClick={() => onDelete(s.id)}
                                                            title={t('schools.detail.classDetail.removeFromMenuTitle')}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
            {mealSchedules.length === 0 && (
                <p className="mt-4 text-center text-sm text-[#888ea8]">{t('schools.detail.classDetail.noMenuThisMonth')}</p>
            )}

            {/* Alerjen Uyarı Modalı */}
            {allergenModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-lg bg-white dark:bg-[#0e1726]">
                        <div className="flex items-center justify-between border-b border-[#ebedf2] px-5 py-4 dark:border-[#1b2e4b]">
                            <div className="flex items-center gap-2">
                                <span className="text-lg text-danger">⚠</span>
                                <h3 className="font-bold text-dark dark:text-white">{t('schools.detail.classDetail.allergenConflictsTitle')}</h3>
                            </div>
                            <button type="button" onClick={() => setAllergenModal(null)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-5">
                            <p className="mb-4 text-sm text-[#888ea8]">
                                <span className="font-semibold text-dark dark:text-white">{allergenModal.mealName}</span>
                                {' '}{t('schools.detail.classDetail.allergenWarningDesc')}
                            </p>
                            <div className="space-y-3">
                                {Object.entries(groupedConflicts).map(([childName, allergens]) => (
                                    <div key={childName} className="rounded-lg border border-danger/20 bg-danger/5 p-3">
                                        <p className="mb-1.5 font-semibold text-dark dark:text-white">{childName}</p>
                                        <div className="flex flex-wrap gap-1">
                                            {allergens.map(allergen => (
                                                <span key={allergen} className="badge badge-outline-danger text-xs">{allergen}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="border-t border-[#ebedf2] p-4 dark:border-[#1b2e4b]">
                            <button type="button" className="btn btn-outline-secondary w-full" onClick={() => setAllergenModal(null)}>
                                {t('common.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function EmptyTab({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-[#888ea8]">
            <span className="opacity-40 [&>svg]:h-10 [&>svg]:w-10">{icon}</span>
            <p className="text-sm">{text}</p>
        </div>
    );
}

function LoadingSpinner() {
    return (
        <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
    );
}
