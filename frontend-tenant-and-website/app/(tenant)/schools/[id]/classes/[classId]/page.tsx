'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import apiClient from '@/lib/apiClient';
import { Child, Attendance, SupplyItem } from '@/types';
import { ArrowLeft, Plus, Trash2, Edit2, X, Calendar, ClipboardList, BookOpen, Users } from 'lucide-react';

type Tab = 'students' | 'attendance' | 'supply' | 'meal-calendar';

type ClassInfo = { id: number; name: string; school_id: number };
type MealSchedule = {
    id: number;
    menu_date: string;
    schedule_type: string;
    meal?: { id: number; name: string; meal_type?: string };
};

const MEAL_TYPE_LABELS: Record<string, string> = {
    breakfast: 'Kahvaltı', lunch: 'Öğle', snack: 'Ara Öğün', dinner: 'Akşam',
};
const STATUS_LABELS: Record<string, string> = {
    present: 'Geldi', absent: 'Gelmedi', late: 'Geç Geldi', excused: 'İzinli',
};
const STATUS_COLORS: Record<string, string> = {
    present: 'badge-outline-success', absent: 'badge-outline-danger', late: 'badge-outline-warning', excused: 'badge-outline-info',
};

export default function ClassDetailPage() {
    const params = useParams();
    const schoolId = params.id as string;
    const classId = params.classId as string;

    const [cls, setCls] = useState<ClassInfo | null>(null);
    const [children, setChildren] = useState<Child[]>([]);
    const [attendances, setAttendances] = useState<Attendance[]>([]);
    const [supplyItems, setSupplyItems] = useState<SupplyItem[]>([]);
    const [mealSchedules, setMealSchedules] = useState<MealSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('students');

    // Attendance form
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceStatuses, setAttendanceStatuses] = useState<Record<number, string>>({});
    const [savingAttendance, setSavingAttendance] = useState(false);

    // Supply list form
    const [showSupplyModal, setShowSupplyModal] = useState(false);
    const [editingSupply, setEditingSupply] = useState<SupplyItem | null>(null);
    const [supplyForm, setSupplyForm] = useState({ name: '', description: '', quantity: '1', due_date: '' });
    const [savingSupply, setSavingSupply] = useState(false);

    // Meal calendar
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);

    const loadClassInfo = useCallback(async () => {
        try {
            const res = await apiClient.get(`/schools/${schoolId}/classes/${classId}`);
            if (res.data?.data) setCls(res.data.data);
        } catch { /* sessizce geç */ }
    }, [schoolId, classId]);

    const loadChildren = useCallback(async () => {
        try {
            const res = await apiClient.get(`/schools/${schoolId}/children`, { params: { class_id: classId } });
            setChildren(res.data?.data ?? []);
        } catch { /* sessizce geç */ }
    }, [schoolId, classId]);

    const loadAttendances = useCallback(async () => {
        try {
            const res = await apiClient.get(`/schools/${schoolId}/attendances`, {
                params: { class_id: classId, date: attendanceDate },
            });
            const data: Attendance[] = res.data?.data ?? [];
            setAttendances(data);
            const statuses: Record<number, string> = {};
            data.forEach(a => { statuses[a.child_id] = a.status; });
            setAttendanceStatuses(statuses);
        } catch { /* sessizce geç */ }
    }, [schoolId, classId, attendanceDate]);

    const loadSupplyList = useCallback(async () => {
        try {
            const res = await apiClient.get(`/schools/${schoolId}/classes/${classId}/supply-list`);
            setSupplyItems(res.data?.data ?? []);
        } catch { /* sessizce geç */ }
    }, [schoolId, classId]);

    const loadMealCalendar = useCallback(async () => {
        try {
            const res = await apiClient.get('/meal-menus/monthly', {
                params: { school_id: schoolId, class_id: classId, year: calendarYear, month: calendarMonth },
            });
            setMealSchedules(res.data?.data ?? []);
        } catch { /* sessizce geç */ }
    }, [schoolId, classId, calendarYear, calendarMonth]);

    const loadAll = useCallback(async () => {
        setLoading(true);
        await Promise.all([loadClassInfo(), loadChildren()]);
        setLoading(false);
    }, [loadClassInfo, loadChildren]);

    useEffect(() => { loadAll(); }, [loadAll]);

    useEffect(() => {
        if (activeTab === 'attendance') loadAttendances();
        if (activeTab === 'supply') loadSupplyList();
        if (activeTab === 'meal-calendar') loadMealCalendar();
    }, [activeTab, loadAttendances, loadSupplyList, loadMealCalendar]);

    useEffect(() => {
        if (activeTab === 'attendance') loadAttendances();
    }, [attendanceDate, activeTab, loadAttendances]);

    useEffect(() => {
        if (activeTab === 'meal-calendar') loadMealCalendar();
    }, [calendarYear, calendarMonth, activeTab, loadMealCalendar]);

    // ── Devamsızlık ──────────────────────────────────────────────
    const handleSaveAttendance = async () => {
        if (children.length === 0) return;
        setSavingAttendance(true);
        const records = children.map(child => ({
            child_id: child.id,
            class_id: Number(classId),
            attendance_date: attendanceDate,
            status: attendanceStatuses[child.id] ?? 'present',
        }));
        try {
            await apiClient.post(`/schools/${schoolId}/attendances`, { attendances: records });
            toast.success('Yoklama kaydedildi.');
            loadAttendances();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? 'Yoklama kaydedilemedi.');
        } finally {
            setSavingAttendance(false);
        }
    };

    // ── İhtiyaç Listesi ──────────────────────────────────────────
    const openSupplyCreate = () => {
        setEditingSupply(null);
        setSupplyForm({ name: '', description: '', quantity: '1', due_date: '' });
        setShowSupplyModal(true);
    };

    const openSupplyEdit = (item: SupplyItem) => {
        setEditingSupply(item);
        setSupplyForm({
            name: item.name,
            description: item.description ?? '',
            quantity: String(item.quantity ?? 1),
            due_date: item.due_date ?? '',
        });
        setShowSupplyModal(true);
    };

    const handleSupplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingSupply(true);
        const payload = { ...supplyForm, quantity: Number(supplyForm.quantity) };
        try {
            if (editingSupply) {
                await apiClient.put(`/schools/${schoolId}/classes/${classId}/supply-list/${editingSupply.id}`, payload);
                toast.success('İhtiyaç kalemi güncellendi.');
            } else {
                await apiClient.post(`/schools/${schoolId}/classes/${classId}/supply-list`, payload);
                toast.success('İhtiyaç kalemi eklendi.');
            }
            setShowSupplyModal(false);
            loadSupplyList();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? 'Hata oluştu.');
        } finally {
            setSavingSupply(false);
        }
    };

    const handleDeleteSupply = async (item: SupplyItem) => {
        const result = await Swal.fire({
            title: 'İhtiyaç Kalemini Sil',
            text: `"${item.name}" silinecek.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Evet, Sil',
            cancelButtonText: 'İptal',
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.delete(`/schools/${schoolId}/classes/${classId}/supply-list/${item.id}`);
            toast.success('İhtiyaç kalemi silindi.');
            loadSupplyList();
        } catch {
            toast.error('Silme başarısız.');
        }
    };

    const sf = (field: keyof typeof supplyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setSupplyForm(prev => ({ ...prev, [field]: e.target.value }));

    // ── Yemek Takvimi Render ─────────────────────────────────────
    const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
    const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m - 1, 1).getDay();

    const renderMealCalendar = () => {
        const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
        const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);
        const cells = [];

        for (let i = 0; i < firstDay; i++) { cells.push(null); }
        for (let d = 1; d <= daysInMonth; d++) { cells.push(d); }

        const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

        const getMealsForDay = (day: number) => {
            const dateStr = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return mealSchedules.filter(s => s.menu_date === dateStr);
        };

        return (
            <div>
                <div className="mb-4 flex items-center justify-between">
                    <button type="button" className="btn btn-sm btn-outline-primary"
                        onClick={() => { if (calendarMonth === 1) { setCalendarMonth(12); setCalendarYear(y => y - 1); } else { setCalendarMonth(m => m - 1); } }}>
                        ‹
                    </button>
                    <span className="font-semibold text-dark dark:text-white">
                        {calendarYear} / {String(calendarMonth).padStart(2, '0')}
                    </span>
                    <button type="button" className="btn btn-sm btn-outline-primary"
                        onClick={() => { if (calendarMonth === 12) { setCalendarMonth(1); setCalendarYear(y => y + 1); } else { setCalendarMonth(m => m + 1); } }}>
                        ›
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {dayNames.map(d => (
                        <div key={d} className="py-1 text-center text-xs font-semibold text-[#888ea8]">{d}</div>
                    ))}
                    {cells.map((day, i) => (
                        <div key={i} className={`min-h-[60px] rounded border p-1 text-xs ${day ? 'border-[#ebedf2] dark:border-[#1b2e4b]' : 'border-transparent'}`}>
                            {day && (
                                <>
                                    <div className="mb-1 font-semibold text-dark dark:text-white">{day}</div>
                                    {getMealsForDay(day).map(s => (
                                        <div key={s.id} className="mb-0.5 truncate rounded bg-primary/10 px-1 text-primary">
                                            {s.meal?.name}
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const tabBtn = (tab: Tab, label: string, icon: React.ReactNode) => (
        <button
            type="button"
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-[#515365] hover:text-primary dark:text-[#888ea8]'}`}
            onClick={() => setActiveTab(tab)}
        >
            {icon}
            {label}
        </button>
    );

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center gap-3">
                <Link href={`/schools/${schoolId}`} className="btn btn-sm btn-outline-secondary gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Geri
                </Link>
                <h1 className="text-2xl font-bold text-dark dark:text-white">{cls?.name ?? 'Sınıf'}</h1>
            </div>

            <div className="panel">
                <div className="mb-4 flex flex-wrap gap-1 border-b border-[#ebedf2] dark:border-[#1b2e4b]">
                    {tabBtn('students', `Öğrenciler (${children.length})`, <Users className="h-4 w-4" />)}
                    {tabBtn('attendance', 'Devamsızlık', <ClipboardList className="h-4 w-4" />)}
                    {tabBtn('supply', 'İhtiyaç Listesi', <BookOpen className="h-4 w-4" />)}
                    {tabBtn('meal-calendar', 'Yemek Takvimi', <Calendar className="h-4 w-4" />)}
                </div>

                {/* Öğrenciler */}
                {activeTab === 'students' && (
                    children.length === 0 ? (
                        <p className="py-8 text-center text-[#515365] dark:text-[#888ea8]">Bu sınıfta öğrenci yok.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table-hover">
                                <thead>
                                    <tr>
                                        <th>Ad Soyad</th>
                                        <th>Doğum Tarihi</th>
                                        <th>Durum</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {children.map(c => (
                                        <tr key={c.id}>
                                            <td className="font-medium text-dark dark:text-white">{c.name} {c.surname ?? ''}</td>
                                            <td>{c.birth_date ?? '—'}</td>
                                            <td><span className={`badge ${c.status === 'active' ? 'badge-outline-success' : 'badge-outline-secondary'}`}>{c.status ?? 'aktif'}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}

                {/* Devamsızlık */}
                {activeTab === 'attendance' && (
                    <div>
                        <div className="mb-4 flex items-center gap-4">
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Tarih</label>
                                <input type="date" className="form-input mt-1" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} />
                            </div>
                        </div>

                        {children.length === 0 ? (
                            <p className="py-8 text-center text-[#515365] dark:text-[#888ea8]">Sınıfta öğrenci yok.</p>
                        ) : (
                            <>
                                <div className="table-responsive mb-4">
                                    <table className="table-hover">
                                        <thead>
                                            <tr>
                                                <th>Öğrenci</th>
                                                <th>Durum</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {children.map(child => (
                                                <tr key={child.id}>
                                                    <td className="font-medium text-dark dark:text-white">{child.name} {child.surname ?? ''}</td>
                                                    <td>
                                                        <select
                                                            className="form-select"
                                                            value={attendanceStatuses[child.id] ?? 'present'}
                                                            onChange={e => setAttendanceStatuses(prev => ({ ...prev, [child.id]: e.target.value }))}
                                                        >
                                                            <option value="present">Geldi</option>
                                                            <option value="absent">Gelmedi</option>
                                                            <option value="late">Geç Geldi</option>
                                                            <option value="excused">İzinli</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <button type="button" className="btn btn-primary" onClick={handleSaveAttendance} disabled={savingAttendance}>
                                    {savingAttendance ? 'Kaydediliyor...' : 'Yoklamayı Kaydet'}
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* İhtiyaç Listesi */}
                {activeTab === 'supply' && (
                    <div>
                        <div className="mb-4 flex justify-end">
                            <button type="button" className="btn btn-primary btn-sm gap-2" onClick={openSupplyCreate}>
                                <Plus className="h-4 w-4" />
                                Kalem Ekle
                            </button>
                        </div>
                        {supplyItems.length === 0 ? (
                            <p className="py-8 text-center text-[#515365] dark:text-[#888ea8]">İhtiyaç listesi boş.</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th>Malzeme</th>
                                            <th>Açıklama</th>
                                            <th>Adet</th>
                                            <th>Son Tarih</th>
                                            <th>İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {supplyItems.map(item => (
                                            <tr key={item.id}>
                                                <td className="font-medium text-dark dark:text-white">{item.name}</td>
                                                <td className="text-sm text-[#515365] dark:text-[#888ea8]">{item.description ?? '—'}</td>
                                                <td>{item.quantity ?? 1}</td>
                                                <td>{item.due_date ? new Date(item.due_date).toLocaleDateString('tr-TR') : '—'}</td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <button type="button" className="btn btn-sm btn-outline-primary p-2" onClick={() => openSupplyEdit(item)}>
                                                            <Edit2 className="h-4 w-4" />
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

                {/* Yemek Takvimi */}
                {activeTab === 'meal-calendar' && renderMealCalendar()}
            </div>

            {/* Supply Modal */}
            {showSupplyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">
                                {editingSupply ? 'İhtiyaç Kalemi Düzenle' : 'İhtiyaç Kalemi Ekle'}
                            </h2>
                            <button type="button" onClick={() => setShowSupplyModal(false)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSupplySubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Malzeme Adı *</label>
                                <input type="text" className="form-input mt-1" value={supplyForm.name} onChange={sf('name')} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Açıklama / Detay</label>
                                <textarea className="form-input mt-1" rows={2} value={supplyForm.description} onChange={sf('description')} placeholder="Renk, marka, boyut vb." />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">Adet</label>
                                    <input type="number" className="form-input mt-1" min={1} value={supplyForm.quantity} onChange={sf('quantity')} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">Son Tarih</label>
                                    <input type="date" className="form-input mt-1" value={supplyForm.due_date} onChange={sf('due_date')} />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn btn-primary flex-1" disabled={savingSupply}>
                                    {savingSupply ? 'Kaydediliyor...' : (editingSupply ? 'Güncelle' : 'Ekle')}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowSupplyModal(false)}>İptal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
