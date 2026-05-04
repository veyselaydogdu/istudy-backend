'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import apiClient from '@/lib/apiClient';
import { ActivityClass, ActivityClassEnrollment, ActivityClassInvoice, ActivityClassGalleryItem, ActivityClassMaterial, School } from '@/types';
import { ArrowLeft, Users, BookOpen, Image, DollarSign, Plus, Trash2, Check, X } from 'lucide-react';

type Tab = 'info' | 'enrollments' | 'teachers' | 'materials' | 'gallery' | 'invoices';

export default function ActivityClassDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [activityClass, setActivityClass] = useState<ActivityClass | null>(null);
    const [tab, setTab] = useState<Tab>('info');
    const [loading, setLoading] = useState(true);

    // Enrollments
    const [enrollments, setEnrollments] = useState<ActivityClassEnrollment[]>([]);
    const [enrollmentsFetched, setEnrollmentsFetched] = useState(false);
    const [schoolChildren, setSchoolChildren] = useState<Array<{ id: number; full_name: string; classes?: Array<{ id: number; name: string }> }>>([]);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [enrollChildId, setEnrollChildId] = useState('');
    const [enrollNotes, setEnrollNotes] = useState('');
    const [enrollGenerateInvoice, setEnrollGenerateInvoice] = useState(true);
    const [enrolling, setEnrolling] = useState(false);

    // Teachers
    const [teachers, setTeachers] = useState<Array<{ id: number; name: string; role?: string | null }>>([]);
    const [schoolTeachers, setSchoolTeachers] = useState<Array<{ id: number; name: string }>>([]);
    const [showTeacherModal, setShowTeacherModal] = useState(false);
    const [assignTeacherId, setAssignTeacherId] = useState('');
    const [assignTeacherRole, setAssignTeacherRole] = useState('');
    const [assigningTeacher, setAssigningTeacher] = useState(false);

    // Materials
    const [materials, setMaterials] = useState<ActivityClassMaterial[]>([]);
    const [showMaterialModal, setShowMaterialModal] = useState(false);
    const [materialForm, setMaterialForm] = useState({ name: '', description: '', quantity: '', is_required: true });
    const [savingMaterial, setSavingMaterial] = useState(false);

    // Gallery
    const [gallery, setGallery] = useState<ActivityClassGalleryItem[]>([]);
    const [galleryFetched, setGalleryFetched] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Invoices
    const [invoices, setInvoices] = useState<ActivityClassInvoice[]>([]);
    const [invoicesFetched, setInvoicesFetched] = useState(false);

    const refreshActivityClass = useCallback(async () => {
        try {
            const res = await apiClient.get(`/activity-classes/${id}`);
            const ac = res.data?.data as ActivityClass;
            setActivityClass(ac);
            setMaterials(ac.materials ?? []);
            setTeachers(ac.teachers ?? []);
        } catch { /* silent */ }
    }, [id]);

    const bootstrap = useCallback(async () => {
        try {
            const res = await apiClient.get(`/activity-classes/${id}`);
            const ac = res.data?.data as ActivityClass;
            setActivityClass(ac);
            setMaterials(ac.materials ?? []);
            setTeachers(ac.teachers ?? []);

            if (ac.school_id) {
                const [childrenRes, teachersRes] = await Promise.all([
                    apiClient.get(`/schools/${ac.school_id}/children`, { params: { per_page: 200 } }).catch(() => null),
                    apiClient.get(`/schools/${ac.school_id}/teachers`, { params: { detailed: 1 } }).catch(() => null),
                ]);
                setSchoolChildren(childrenRes?.data?.data ?? []);
                setSchoolTeachers(teachersRes?.data?.data ?? []);
            } else {
                // Tenant-wide: load children from all schools
                const schoolsRes = await apiClient.get('/schools').catch(() => null);
                const schoolList: School[] = schoolsRes?.data?.data ?? [];
                const childResults = await Promise.all(
                    schoolList.map(s => apiClient.get(`/schools/${s.id}/children`, { params: { per_page: 200 } }).catch(() => null))
                );
                const allChildren = childResults.flatMap(r => r?.data?.data ?? []);
                const uniqueChildren = allChildren.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);
                setSchoolChildren(uniqueChildren);

                // Teachers from all schools for tenant-wide
                const teacherResults = await Promise.all(
                    schoolList.map(s => apiClient.get(`/schools/${s.id}/teachers`, { params: { detailed: 1 } }).catch(() => null))
                );
                const allTeachers = teacherResults.flatMap(r => r?.data?.data ?? []);
                const uniqueTeachers = allTeachers.filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i);
                setSchoolTeachers(uniqueTeachers);
            }
        } catch {
            toast.error('Yüklenemedi.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { bootstrap(); }, [bootstrap]);

    const loadEnrollments = useCallback(async () => {
        if (!activityClass) return;
        try {
            const res = await apiClient.get(`/activity-classes/${activityClass.id}/enrollments`);
            setEnrollments(res.data?.data ?? []);
            setEnrollmentsFetched(true);
        } catch { /* silent */ }
    }, [activityClass]);

    const loadGallery = useCallback(async () => {
        if (!activityClass) return;
        try {
            const res = await apiClient.get(`/activity-classes/${activityClass.id}/gallery`);
            setGallery(res.data?.data ?? []);
            setGalleryFetched(true);
        } catch { /* silent */ }
    }, [activityClass]);

    const loadInvoices = useCallback(async () => {
        if (!activityClass) return;
        try {
            const res = await apiClient.get(`/activity-classes/${activityClass.id}/invoices`);
            setInvoices(res.data?.data ?? []);
            setInvoicesFetched(true);
        } catch { /* silent */ }
    }, [activityClass]);

    const handleTabChange = (t: Tab) => {
        setTab(t);
        if (t === 'enrollments' && !enrollmentsFetched) loadEnrollments();
        if (t === 'gallery' && !galleryFetched) loadGallery();
        if (t === 'invoices' && !invoicesFetched) loadInvoices();
    };

    const handleEnroll = async () => {
        if (!enrollChildId || !activityClass) return;
        setEnrolling(true);
        try {
            await apiClient.post(`/activity-classes/${activityClass.id}/enrollments`, {
                child_id: enrollChildId,
                notes: enrollNotes || undefined,
                generate_invoice: enrollGenerateInvoice,
            });
            toast.success('Öğrenci kayıt edildi.');
            setShowEnrollModal(false);
            setEnrollChildId('');
            setEnrollNotes('');
            loadEnrollments();
            // Refresh count
            refreshActivityClass();
        } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Kayıt yapılamadı.');
        } finally {
            setEnrolling(false);
        }
    };

    const handleCancelEnrollment = async (enrollmentId: number) => {
        if (!activityClass) return;
        const result = await Swal.fire({ title: 'Kaydı iptal et?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Evet', cancelButtonText: 'Hayır', confirmButtonColor: '#e7515a' });
        if (!result.isConfirmed) return;
        try {
            await apiClient.delete(`/activity-classes/${activityClass.id}/enrollments/${enrollmentId}`);
            toast.success('Kayıt iptal edildi.');
            loadEnrollments();
        } catch { toast.error('İptal edilemedi.'); }
    };

    const handleAssignTeacher = async () => {
        if (!assignTeacherId || !activityClass) return;
        setAssigningTeacher(true);
        try {
            const res = await apiClient.post(`/activity-classes/${activityClass.id}/teachers`, {
                teacher_profile_id: parseInt(assignTeacherId),
                role: assignTeacherRole || undefined,
            });
            setTeachers(res.data?.data ?? teachers);
            toast.success('Öğretmen atandı.');
            setShowTeacherModal(false);
            setAssignTeacherId('');
            setAssignTeacherRole('');
        } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Atama yapılamadı.');
        } finally {
            setAssigningTeacher(false);
        }
    };

    const handleRemoveTeacher = async (teacherProfileId: number) => {
        if (!activityClass) return;
        try {
            await apiClient.delete(`/activity-classes/${activityClass.id}/teachers/${teacherProfileId}`);
            setTeachers(prev => prev.filter(t => t.id !== teacherProfileId));
            toast.success('Öğretmen ataması kaldırıldı.');
        } catch { toast.error('Kaldırılamadı.'); }
    };

    const handleAddMaterial = async () => {
        if (!materialForm.name.trim() || !activityClass) return;
        setSavingMaterial(true);
        try {
            const res = await apiClient.post(`/activity-classes/${activityClass.id}/materials`, materialForm);
            setMaterials(prev => [...prev, res.data?.data]);
            setShowMaterialModal(false);
            setMaterialForm({ name: '', description: '', quantity: '', is_required: true });
            toast.success('Materyal eklendi.');
        } catch { toast.error('Eklenemedi.'); } finally { setSavingMaterial(false); }
    };

    const handleDeleteMaterial = async (materialId: number) => {
        if (!activityClass) return;
        try {
            await apiClient.delete(`/activity-classes/${activityClass.id}/materials/${materialId}`);
            setMaterials(prev => prev.filter(m => m.id !== materialId));
            toast.success('Materyal silindi.');
        } catch { toast.error('Silinemedi.'); }
    };

    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activityClass) return;
        setUploadingPhoto(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            const res = await apiClient.post(`/activity-classes/${activityClass.id}/gallery`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setGallery(prev => [...prev, res.data?.data]);
            toast.success('Fotoğraf yüklendi.');
        } catch { toast.error('Yüklenemedi.'); } finally {
            setUploadingPhoto(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteGalleryItem = async (itemId: number) => {
        if (!activityClass) return;
        try {
            await apiClient.delete(`/activity-classes/${activityClass.id}/gallery/${itemId}`);
            setGallery(prev => prev.filter(g => g.id !== itemId));
            toast.success('Fotoğraf silindi.');
        } catch { toast.error('Silinemedi.'); }
    };

    const handleMarkPaid = async (invoice: ActivityClassInvoice) => {
        if (!activityClass) return;
        const { value: method } = await Swal.fire({
            title: 'Ödeme Yöntemi',
            input: 'text',
            inputPlaceholder: 'Nakit, Havale, vs.',
            showCancelButton: true,
            confirmButtonText: 'Ödendi Olarak İşaretle',
            cancelButtonText: 'İptal',
        });
        try {
            await apiClient.patch(`/activity-classes/${activityClass.id}/invoices/${invoice.id}/mark-paid`, { payment_method: method });
            toast.success('Fatura güncellendi.');
            loadInvoices();
        } catch { toast.error('Güncellenemedi.'); }
    };

    const handleRefundInvoice = async (invoice: ActivityClassInvoice) => {
        if (!activityClass) return;
        const { value: reason, isConfirmed } = await Swal.fire({
            title: 'İade Faturası Oluştur',
            text: `${invoice.invoice_number} numaralı fatura için iade oluşturulacak.`,
            input: 'textarea',
            inputPlaceholder: 'İade nedeni (isteğe bağlı)...',
            showCancelButton: true,
            confirmButtonText: 'İade Oluştur',
            cancelButtonText: 'İptal',
            confirmButtonColor: '#e7515a',
        });
        if (!isConfirmed) return;
        try {
            await apiClient.post(`/activity-classes/${activityClass.id}/invoices/${invoice.id}/refund`, { refund_reason: reason });
            toast.success('İade faturası oluşturuldu.');
            loadInvoices();
        } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'İade oluşturulamadı.');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!activityClass) {
        return <div className="p-4 text-center text-[#888ea8]">Etkinlik sınıfı bulunamadı.</div>;
    }

    const tabs: Array<{ key: Tab; label: string; count?: number }> = [
        { key: 'info', label: 'Genel Bilgi' },
        { key: 'enrollments', label: 'Kayıtlar', count: activityClass.active_enrollments_count },
        { key: 'teachers', label: 'Öğretmenler', count: teachers.length },
        { key: 'materials', label: 'Materyaller', count: materials.length },
        { key: 'gallery', label: 'Galeri' },
        { key: 'invoices', label: 'Faturalar' },
    ];

    // Filter out already enrolled children
    const enrolledChildIds = new Set(enrollments.map(e => e.child_id));
    const restrictedClassIds = !activityClass.is_school_wide && activityClass.school_classes?.length
        ? new Set(activityClass.school_classes.map(sc => sc.id))
        : null;
    const availableChildren = schoolChildren
        .filter(c => !enrolledChildIds.has(c.id))
        .filter(c => !restrictedClassIds || c.classes?.some(cls => restrictedClassIds.has(cls.id)));

    return (
        <div className="p-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button type="button" onClick={() => router.back()} className="btn btn-sm btn-outline-secondary p-2">
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-[#3b3f5c] dark:text-white">{activityClass.name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`badge ${activityClass.is_active ? 'badge-outline-success' : 'badge-outline-danger'}`}>
                            {activityClass.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                        <span className="badge badge-outline-info uppercase">{activityClass.language}</span>
                        {activityClass.is_paid ? (
                            <span className="badge badge-outline-warning flex items-center gap-1">
                                <DollarSign className="h-3 w-3" /> {activityClass.price} {activityClass.currency}
                            </span>
                        ) : (
                            <span className="badge badge-outline-success">Ücretsiz</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="panel p-0">
                <div className="flex border-b dark:border-[#1b2e4b] overflow-x-auto">
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => handleTabChange(t.key)}
                            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${tab === t.key ? 'text-primary border-b-2 border-primary' : 'text-[#888ea8] hover:text-primary'}`}
                        >
                            {t.label}
                            {t.count != null && t.count > 0 && (
                                <span className="bg-primary text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{t.count}</span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-5">
                    {/* ── Genel Bilgi ── */}
                    {tab === 'info' && (
                        <div className="space-y-4">
                            {activityClass.description && <p className="text-[#515365] dark:text-[#bfc9d4]">{activityClass.description}</p>}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {(activityClass.age_min != null || activityClass.age_max != null) && (
                                    <div className="bg-[#f1f2f3] dark:bg-[#0e1726] rounded-lg p-3">
                                        <p className="text-xs text-[#888ea8]">Yaş Aralığı</p>
                                        <p className="font-semibold">{activityClass.age_min ?? '?'} - {activityClass.age_max ?? '?'}</p>
                                    </div>
                                )}
                                {activityClass.capacity && (
                                    <div className="bg-[#f1f2f3] dark:bg-[#0e1726] rounded-lg p-3">
                                        <p className="text-xs text-[#888ea8]">Kapasite</p>
                                        <p className="font-semibold">{activityClass.active_enrollments_count ?? 0} / {activityClass.capacity}</p>
                                    </div>
                                )}
                                {activityClass.schedule && (
                                    <div className="bg-[#f1f2f3] dark:bg-[#0e1726] rounded-lg p-3">
                                        <p className="text-xs text-[#888ea8]">Program</p>
                                        <p className="font-semibold text-sm">{activityClass.schedule}</p>
                                    </div>
                                )}
                                {activityClass.location && (
                                    <div className="bg-[#f1f2f3] dark:bg-[#0e1726] rounded-lg p-3">
                                        <p className="text-xs text-[#888ea8]">Konum</p>
                                        <p className="font-semibold text-sm">{activityClass.location}</p>
                                    </div>
                                )}
                                {(activityClass.start_date || activityClass.end_date) && (
                                    <div className="bg-[#f1f2f3] dark:bg-[#0e1726] rounded-lg p-3 col-span-2">
                                        <p className="text-xs text-[#888ea8]">Tarih Aralığı</p>
                                        <p className="font-semibold text-sm">
                                            {activityClass.start_date ? new Date(activityClass.start_date).toLocaleDateString('tr-TR') : '—'}
                                            {' — '}
                                            {activityClass.end_date ? new Date(activityClass.end_date).toLocaleDateString('tr-TR') : '—'}
                                        </p>
                                    </div>
                                )}
                            </div>
                            {!activityClass.is_school_wide && activityClass.school_classes && activityClass.school_classes.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium mb-2">Sınıf Kısıtlamaları</p>
                                    <div className="flex flex-wrap gap-2">
                                        {activityClass.school_classes.map(sc => (
                                            <span key={sc.id} className="badge badge-outline-info">{sc.name}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {activityClass.notes && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">{activityClass.notes}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Kayıtlar ── */}
                    {tab === 'enrollments' && (
                        <div>
                            <div className="flex justify-end mb-4">
                                <button type="button" onClick={() => setShowEnrollModal(true)} className="btn btn-primary flex items-center gap-2">
                                    <Plus className="h-4 w-4" /> Öğrenci Kayıt Et
                                </button>
                            </div>
                            {enrollments.length === 0 ? (
                                <div className="text-center py-10 text-[#888ea8]">
                                    <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                    <p>Kayıtlı öğrenci yok.</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table-hover">
                                        <thead>
                                            <tr>
                                                <th>Öğrenci</th>
                                                <th>Kayıt Türü</th>
                                                <th>Kayıt Tarihi</th>
                                                <th>Fatura</th>
                                                <th>İşlem</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {enrollments.map(e => (
                                                <tr key={e.id}>
                                                    <td className="font-medium">{e.child?.full_name ?? '—'}</td>
                                                    <td>
                                                        <span className={`badge ${e.enrolled_by === 'parent' ? 'badge-outline-info' : 'badge-outline-primary'}`}>
                                                            {e.enrolled_by === 'parent' ? 'Veli' : 'Tenant'}
                                                        </span>
                                                    </td>
                                                    <td className="text-sm">{new Date(e.enrolled_at).toLocaleDateString('tr-TR')}</td>
                                                    <td>
                                                        {e.invoice ? (
                                                            <span className={`badge ${e.invoice.status === 'paid' ? 'badge-outline-success' : e.invoice.status === 'cancelled' ? 'badge-outline-danger' : 'badge-outline-warning'}`}>
                                                                {e.invoice.status === 'paid' ? 'Ödendi' : e.invoice.status === 'cancelled' ? 'İptal' : 'Bekliyor'} — {e.invoice.amount} {e.invoice.currency}
                                                            </span>
                                                        ) : <span className="text-[#888ea8]">—</span>}
                                                    </td>
                                                    <td>
                                                        <button type="button" onClick={() => handleCancelEnrollment(e.id)} className="btn btn-sm btn-outline-danger p-2" title="Kaydı İptal Et">
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Öğretmenler ── */}
                    {tab === 'teachers' && (
                        <div>
                            <div className="flex justify-end mb-4">
                                <button type="button" onClick={() => setShowTeacherModal(true)} className="btn btn-primary flex items-center gap-2">
                                    <Plus className="h-4 w-4" /> Öğretmen Ata
                                </button>
                            </div>
                            {teachers.length === 0 ? (
                                <div className="text-center py-10 text-[#888ea8]">
                                    <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                    <p>Atanmış öğretmen yok.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {teachers.map(t => (
                                        <div key={t.id} className="flex items-center justify-between p-3 bg-[#f8f9fa] dark:bg-[#0e1726] rounded-lg">
                                            <div>
                                                <p className="font-medium">{t.name}</p>
                                                {t.role && <p className="text-sm text-[#888ea8]">{t.role}</p>}
                                            </div>
                                            <button type="button" onClick={() => handleRemoveTeacher(t.id)} className="btn btn-sm btn-outline-danger p-2">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Materyaller ── */}
                    {tab === 'materials' && (
                        <div>
                            <div className="flex justify-end mb-4">
                                <button type="button" onClick={() => setShowMaterialModal(true)} className="btn btn-primary flex items-center gap-2">
                                    <Plus className="h-4 w-4" /> Materyal Ekle
                                </button>
                            </div>
                            {materials.length === 0 ? (
                                <div className="text-center py-10 text-[#888ea8]">
                                    <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                    <p>Materyal eklenmemiş.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {materials.map(m => (
                                        <div key={m.id} className="flex items-start justify-between p-3 bg-[#f8f9fa] dark:bg-[#0e1726] rounded-lg">
                                            <div className="flex items-start gap-3">
                                                <span className={`mt-0.5 ${m.is_required ? 'text-red-500' : 'text-green-500'}`}>
                                                    {m.is_required ? '●' : '○'}
                                                </span>
                                                <div>
                                                    <p className="font-medium">{m.name} {m.quantity && <span className="text-sm text-[#888ea8]">× {m.quantity}</span>}</p>
                                                    {m.description && <p className="text-sm text-[#888ea8]">{m.description}</p>}
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => handleDeleteMaterial(m.id)} className="btn btn-sm btn-outline-danger p-2">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Galeri ── */}
                    {tab === 'gallery' && (
                        <div>
                            <div className="flex justify-end mb-4">
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleGalleryUpload} />
                                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto} className="btn btn-primary flex items-center gap-2">
                                    <Image className="h-4 w-4" /> {uploadingPhoto ? 'Yükleniyor...' : 'Fotoğraf Yükle'}
                                </button>
                            </div>
                            {gallery.length === 0 ? (
                                <div className="text-center py-10 text-[#888ea8]">
                                    <Image className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                    <p>Galeri boş.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {gallery.map(item => (
                                        <div key={item.id} className="relative group rounded-lg overflow-hidden bg-[#f1f2f3] dark:bg-[#0e1726] aspect-square">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={item.url} alt={item.caption ?? ''} className="w-full h-full object-cover" />
                                            {item.caption && (
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">{item.caption}</div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteGalleryItem(item.id)}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Faturalar ── */}
                    {tab === 'invoices' && (
                        <div>
                            {invoices.length === 0 ? (
                                <div className="text-center py-10 text-[#888ea8]">
                                    <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                    <p>Fatura bulunamadı.</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table-hover">
                                        <thead>
                                            <tr>
                                                <th>Fatura No</th>
                                                <th>Tür</th>
                                                <th>Öğrenci</th>
                                                <th>Tutar</th>
                                                <th>Durum</th>
                                                <th>Vade</th>
                                                <th>İşlem</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoices.map(inv => (
                                                <tr key={inv.id} className={inv.invoice_type === 'refund' ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                                                    <td className="font-mono text-sm">
                                                        {inv.invoice_number}
                                                        {inv.original_invoice_id && (
                                                            <div className="text-xs text-[#888ea8]">İade</div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${inv.invoice_type === 'refund' ? 'badge-outline-danger' : 'badge-outline-info'}`}>
                                                            {inv.invoice_type === 'refund' ? 'İade' : 'Fatura'}
                                                        </span>
                                                    </td>
                                                    <td>{inv.child?.full_name ?? '—'}</td>
                                                    <td>{inv.amount} {inv.currency}</td>
                                                    <td>
                                                        <span className={`badge ${inv.status === 'paid' ? 'badge-outline-success' : inv.status === 'cancelled' ? 'badge-outline-danger' : inv.status === 'refunded' ? 'badge-outline-warning' : inv.status === 'overdue' ? 'badge-outline-warning' : 'badge-outline-info'}`}>
                                                            {inv.status === 'paid' ? 'Ödendi' : inv.status === 'cancelled' ? 'İptal' : inv.status === 'refunded' ? 'İade Edildi' : inv.status === 'overdue' ? 'Gecikmiş' : 'Bekliyor'}
                                                        </span>
                                                    </td>
                                                    <td className="text-sm">{inv.due_date ? new Date(inv.due_date).toLocaleDateString('tr-TR') : '—'}</td>
                                                    <td>
                                                        <div className="flex gap-1">
                                                            {inv.status === 'pending' && (
                                                                <button type="button" onClick={() => handleMarkPaid(inv)} className="btn btn-sm btn-outline-success flex items-center gap-1">
                                                                    <Check className="h-3 w-3" /> Ödendi
                                                                </button>
                                                            )}
                                                            {inv.status === 'paid' && inv.invoice_type !== 'refund' && !inv.refund_invoice && (
                                                                <button type="button" onClick={() => handleRefundInvoice(inv)} className="btn btn-sm btn-outline-danger flex items-center gap-1">
                                                                    <X className="h-3 w-3" /> İade
                                                                </button>
                                                            )}
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

            {/* Enroll Modal */}
            {showEnrollModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#1b2e4b] rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b dark:border-[#1b2e4b]">
                            <h3 className="font-bold text-[#3b3f5c] dark:text-white">Öğrenci Kayıt Et</h3>
                            <button type="button" onClick={() => setShowEnrollModal(false)}>✕</button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-sm font-medium">Öğrenci *</label>
                                <select className="form-select mt-1 w-full" value={enrollChildId} onChange={e => setEnrollChildId(e.target.value)}>
                                    <option value="">Öğrenci seçin...</option>
                                    {availableChildren.map(c => (
                                        <option key={c.id} value={c.id}>{c.full_name}</option>
                                    ))}
                                </select>
                                {availableChildren.length === 0 && (
                                    <p className="text-xs text-[#888ea8] mt-1">Tüm öğrenciler zaten kayıtlı.</p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-medium">Notlar</label>
                                <textarea className="form-textarea mt-1 w-full" rows={2} value={enrollNotes} onChange={e => setEnrollNotes(e.target.value)} />
                            </div>
                            {activityClass.is_paid && (
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="form-checkbox" checked={enrollGenerateInvoice} onChange={e => setEnrollGenerateInvoice(e.target.checked)} />
                                    <span className="text-sm">Fatura oluştur ({activityClass.price} {activityClass.currency})</span>
                                </label>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 p-5 border-t dark:border-[#1b2e4b]">
                            <button type="button" onClick={() => setShowEnrollModal(false)} className="btn btn-outline-danger">İptal</button>
                            <button type="button" onClick={handleEnroll} disabled={!enrollChildId || enrolling} className="btn btn-primary">
                                {enrolling ? 'Kaydediliyor...' : 'Kayıt Et'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Teacher Modal */}
            {showTeacherModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#1b2e4b] rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b dark:border-[#1b2e4b]">
                            <h3 className="font-bold text-[#3b3f5c] dark:text-white">Öğretmen Ata</h3>
                            <button type="button" onClick={() => setShowTeacherModal(false)}>✕</button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-sm font-medium">Öğretmen *</label>
                                <select className="form-select mt-1 w-full" value={assignTeacherId} onChange={e => setAssignTeacherId(e.target.value)}>
                                    <option value="">Öğretmen seçin...</option>
                                    {schoolTeachers.filter(t => !teachers.some(at => at.id === t.id)).map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Rol</label>
                                <input className="form-input mt-1 w-full" placeholder="Örn: Baş Öğretmen, Asistan" value={assignTeacherRole} onChange={e => setAssignTeacherRole(e.target.value)} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-5 border-t dark:border-[#1b2e4b]">
                            <button type="button" onClick={() => setShowTeacherModal(false)} className="btn btn-outline-danger">İptal</button>
                            <button type="button" onClick={handleAssignTeacher} disabled={!assignTeacherId || assigningTeacher} className="btn btn-primary">
                                {assigningTeacher ? 'Atanıyor...' : 'Ata'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Material Modal */}
            {showMaterialModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#1b2e4b] rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b dark:border-[#1b2e4b]">
                            <h3 className="font-bold text-[#3b3f5c] dark:text-white">Materyal Ekle</h3>
                            <button type="button" onClick={() => setShowMaterialModal(false)}>✕</button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-sm font-medium">Materyal Adı *</label>
                                <input className="form-input mt-1 w-full" placeholder="Örn: Boya kalemi" value={materialForm.name} onChange={e => setMaterialForm(prev => ({ ...prev, name: e.target.value }))} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Miktar</label>
                                <input className="form-input mt-1 w-full" placeholder="Örn: 12 adet" value={materialForm.quantity} onChange={e => setMaterialForm(prev => ({ ...prev, quantity: e.target.value }))} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Açıklama</label>
                                <textarea className="form-textarea mt-1 w-full" rows={2} value={materialForm.description} onChange={e => setMaterialForm(prev => ({ ...prev, description: e.target.value }))} />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="form-checkbox" checked={materialForm.is_required} onChange={e => setMaterialForm(prev => ({ ...prev, is_required: e.target.checked }))} />
                                <span className="text-sm">Zorunlu Materyal</span>
                            </label>
                        </div>
                        <div className="flex justify-end gap-3 p-5 border-t dark:border-[#1b2e4b]">
                            <button type="button" onClick={() => setShowMaterialModal(false)} className="btn btn-outline-danger">İptal</button>
                            <button type="button" onClick={handleAddMaterial} disabled={!materialForm.name.trim() || savingMaterial} className="btn btn-primary">
                                {savingMaterial ? 'Ekleniyor...' : 'Ekle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
