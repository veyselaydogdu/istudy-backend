'use client';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import apiClient from '@/lib/apiClient';
import { Activity, ActivityGalleryItem } from '@/types';
import {
    ArrowLeft, Calendar, DollarSign, Edit2, ImagePlus,
    Mail, PackagePlus, Phone, Trash2, Upload, User, Users, X,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EnrolledChild {
    id: number;
    full_name: string;
}

interface Enrollment {
    id: number;
    family_profile_id: number;
    owner_name: string | null;
    owner_phone: string | null;
    owner_email: string | null;
    children: EnrolledChild[];
    enrolled_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d: string | null | undefined) {
    if (!d) return null;
    return new Date(d + 'T00:00:00').toLocaleDateString('tr-TR');
}

function fmtBytes(b: number) {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

// ─── Participant Modal ────────────────────────────────────────────────────────

function ParticipantModal({ enrollment, onClose }: { enrollment: Enrollment; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div
                className="w-full max-w-md rounded-xl bg-white dark:bg-[#0e1726] shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#ebedf2] p-5 dark:border-[#1b2e4b]">
                    <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-dark dark:text-white">Katılımcı Detayı</h3>
                    </div>
                    <button
                        type="button"
                        className="rounded-full p-1 text-[#888ea8] hover:bg-[#f1f2f3] hover:text-danger dark:hover:bg-[#1b2e4b]"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    {/* Veli bilgileri */}
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#888ea8]">Veli Bilgileri</p>
                        <div className="rounded-lg border border-[#ebedf2] p-3 space-y-2 dark:border-[#1b2e4b]">
                            <p className="font-medium text-dark dark:text-white">
                                {enrollment.owner_name ?? '—'}
                            </p>
                            {enrollment.owner_phone && (
                                <div className="flex items-center gap-2 text-sm text-[#515365] dark:text-[#888ea8]">
                                    <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span>{enrollment.owner_phone}</span>
                                </div>
                            )}
                            {enrollment.owner_email && (
                                <div className="flex items-center gap-2 text-sm text-[#515365] dark:text-[#888ea8]">
                                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span>{enrollment.owner_email}</span>
                                </div>
                            )}
                            <p className="text-xs text-[#888ea8]">
                                Kayıt: {new Date(enrollment.enrolled_at).toLocaleDateString('tr-TR', {
                                    day: 'numeric', month: 'long', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit',
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Çocuklar */}
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#888ea8]">
                            Çocuklar ({enrollment.children.length})
                        </p>
                        {enrollment.children.length === 0 ? (
                            <p className="text-sm text-[#888ea8]">Kayıtlı çocuk bulunamadı.</p>
                        ) : (
                            <div className="space-y-1.5">
                                {enrollment.children.map(child => (
                                    <div
                                        key={child.id}
                                        className="flex items-center gap-2 rounded-lg bg-[#f1f2f3] px-3 py-2 dark:bg-[#1b2e4b]"
                                    >
                                        <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                                        <span className="text-sm font-medium text-dark dark:text-white">{child.full_name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ActivityDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [activity, setActivity] = useState<Activity | null>(null);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [gallery, setGallery] = useState<ActivityGalleryItem[]>([]);
    const totalEnrolledChildren = enrollments.reduce((sum, e) => sum + e.children.length, 0);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'info' | 'enrollments' | 'gallery'>('info');
    const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);

    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const schoolId = activity?.school_id;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const schoolsRes = await apiClient.get('/schools');
            const schools: { id: number }[] = schoolsRes.data?.data ?? [];

            let foundActivity: Activity | null = null;
            let foundSchoolId: number | null = null;

            for (const school of schools) {
                try {
                    const res = await apiClient.get(`/schools/${school.id}/activities/${id}`);
                    if (res.data?.data) {
                        foundActivity = res.data.data;
                        foundSchoolId = school.id;
                        break;
                    }
                } catch { /* not in this school */ }
            }

            if (!foundActivity || !foundSchoolId) {
                toast.error('Etkinlik bulunamadı.');
                router.back();
                return;
            }

            setActivity(foundActivity);

            const [enrollRes, galleryRes] = await Promise.all([
                apiClient.get(`/schools/${foundSchoolId}/activities/${id}/enrollments`),
                apiClient.get(`/schools/${foundSchoolId}/activities/${id}/gallery`),
            ]);

            setEnrollments(enrollRes.data?.data ?? []);
            setGallery(galleryRes.data?.data ?? []);
        } catch {
            toast.error('Etkinlik yüklenirken hata oluştu.');
            router.back();
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => { void load(); }, [load]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !schoolId) return;
        setUploading(true);
        const fd = new FormData();
        fd.append('file', file);
        try {
            await apiClient.post(`/schools/${schoolId}/activities/${id}/gallery`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Dosya yüklendi.');
            const res = await apiClient.get(`/schools/${schoolId}/activities/${id}/gallery`);
            setGallery(res.data?.data ?? []);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? 'Yükleme başarısız.');
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const handleDeleteGallery = async (item: ActivityGalleryItem) => {
        if (!schoolId) return;
        const result = await Swal.fire({
            title: 'Dosyayı Sil',
            text: 'Bu dosyayı silmek istediğinize emin misiniz?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sil',
            cancelButtonText: 'İptal',
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.delete(`/schools/${schoolId}/activities/${id}/gallery/${item.id}`);
            setGallery(prev => prev.filter(g => g.id !== item.id));
            toast.success('Dosya silindi.');
        } catch {
            toast.error('Silme başarısız.');
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!activity) return null;

    return (
        <div className="p-6">
            {selectedEnrollment && (
                <ParticipantModal
                    enrollment={selectedEnrollment}
                    onClose={() => setSelectedEnrollment(null)}
                />
            )}

            {/* Breadcrumb + back */}
            <div className="mb-6 flex items-center gap-3">
                <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary gap-1"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Geri
                </button>
                <h1 className="text-2xl font-bold text-dark dark:text-white">{activity.name}</h1>
                <div className="flex flex-wrap items-center gap-2">
                    {activity.is_enrollment_required && (
                        <span className="badge badge-outline-info text-xs">Kayıt Gerekli</span>
                    )}
                    {activity.is_paid && (
                        <span className="badge badge-outline-success text-xs">Ücretli</span>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-4 flex gap-1 border-b border-[#ebedf2] dark:border-[#1b2e4b]">
                {(['info', 'enrollments', 'gallery'] as const).map(t => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setTab(t)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            tab === t
                                ? 'border-primary text-primary'
                                : 'border-transparent text-[#515365] hover:text-primary dark:text-[#888ea8]'
                        }`}
                    >
                        {t === 'info' && 'Detaylar'}
                        {t === 'enrollments' && `Katılımcılar (${totalEnrolledChildren})`}
                        {t === 'gallery' && `Galeri (${gallery.length})`}
                    </button>
                ))}
            </div>

            {/* ── Info tab ── */}
            {tab === 'info' && (
                <div className="panel max-w-2xl space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-dark dark:text-white">Etkinlik Bilgileri</h2>
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-primary gap-1"
                            onClick={() => router.push(`/activities`)}
                        >
                            <Edit2 className="h-3.5 w-3.5" />
                            Düzenle
                        </button>
                    </div>

                    {activity.description && (
                        <p className="text-sm text-[#515365] dark:text-[#888ea8]">{activity.description}</p>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                        {activity.start_date && (
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span className="text-[#515365] dark:text-[#888ea8]">Başlangıç:</span>
                                <span className="font-medium text-dark dark:text-white">{fmtDate(activity.start_date)}</span>
                            </div>
                        )}
                        {activity.end_date && (
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span className="text-[#515365] dark:text-[#888ea8]">Bitiş:</span>
                                <span className="font-medium text-dark dark:text-white">{fmtDate(activity.end_date)}</span>
                            </div>
                        )}
                        {activity.is_paid && activity.price != null && (
                            <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="h-4 w-4 text-success" />
                                <span className="text-[#515365] dark:text-[#888ea8]">Ücret:</span>
                                <span className="font-medium text-success">{Number(activity.price).toFixed(2)} ₺</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="text-[#515365] dark:text-[#888ea8]">Katılımcı:</span>
                            <span className="font-medium text-dark dark:text-white">{totalEnrolledChildren} çocuk</span>
                        </div>
                    </div>

                    {activity.classes && activity.classes.length > 0 && (
                        <div>
                            <p className="mb-2 text-sm font-medium text-[#515365] dark:text-[#888ea8]">Atanan Sınıflar</p>
                            <div className="flex flex-wrap gap-2">
                                {activity.classes.map(c => (
                                    <span key={c.id} className="badge badge-outline-primary text-xs">{c.name}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {activity.materials && activity.materials.length > 0 && (
                        <div>
                            <p className="mb-2 flex items-center gap-1 text-sm font-medium text-[#515365] dark:text-[#888ea8]">
                                <PackagePlus className="h-4 w-4" />
                                Getirilmesi Gereken Materyaller
                            </p>
                            <ul className="space-y-1">
                                {activity.materials.map((m, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-dark dark:text-white">
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                        {m}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* ── Enrollments tab ── */}
            {tab === 'enrollments' && (
                <div className="panel">
                    {enrollments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-[#888ea8]">
                            <Users className="h-10 w-10 opacity-40" />
                            <p className="text-sm">Henüz katılımcı yok.</p>
                        </div>
                    ) : (
                        <>
                            <p className="mb-3 text-xs text-[#888ea8]">
                                Satıra tıklayarak veli ve çocuk detaylarını görüntüleyebilirsiniz.
                            </p>
                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Veli Adı</th>
                                            <th>Çocuklar</th>
                                            <th>Kayıt Tarihi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {enrollments.map((e, i) => (
                                            <tr
                                                key={e.id}
                                                className="cursor-pointer"
                                                onClick={() => setSelectedEnrollment(e)}
                                            >
                                                <td className="text-[#888ea8]">{i + 1}</td>
                                                <td className="font-medium text-dark dark:text-white">
                                                    {e.owner_name ?? '—'}
                                                </td>
                                                <td>
                                                    {e.children.length === 0 ? (
                                                        <span className="text-sm text-[#888ea8]">—</span>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-1">
                                                            {e.children.map(c => (
                                                                <span
                                                                    key={c.id}
                                                                    className="badge badge-outline-primary text-xs"
                                                                >
                                                                    {c.full_name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="text-sm text-[#515365] dark:text-[#888ea8]">
                                                    {new Date(e.enrolled_at).toLocaleDateString('tr-TR', {
                                                        day: 'numeric', month: 'long', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit',
                                                    })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── Gallery tab ── */}
            {tab === 'gallery' && (
                <div className="panel">
                    {/* Upload */}
                    <div className="mb-4 flex items-center gap-3">
                        <input
                            ref={fileRef}
                            type="file"
                            className="hidden"
                            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                            onChange={handleUpload}
                        />
                        <button
                            type="button"
                            className="btn btn-primary gap-2"
                            disabled={uploading}
                            onClick={() => fileRef.current?.click()}
                        >
                            {uploading
                                ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Yükleniyor...</>
                                : <><Upload className="h-4 w-4" /> Dosya Yükle</>
                            }
                        </button>
                        <p className="text-xs text-[#888ea8]">
                            Resim, video veya belge (maks. 50 MB)
                        </p>
                    </div>

                    {gallery.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-[#888ea8]">
                            <ImagePlus className="h-10 w-10 opacity-40" />
                            <p className="text-sm">Henüz galeri öğesi yok.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {gallery.map(item => (
                                <div key={item.id} className="group relative rounded-lg border border-[#ebedf2] overflow-hidden dark:border-[#1b2e4b]">
                                    {item.file_type === 'image' ? (
                                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={item.url}
                                                alt={item.original_name}
                                                className="h-32 w-full object-cover"
                                            />
                                        </a>
                                    ) : (
                                        <a href={item.url} target="_blank" rel="noopener noreferrer"
                                            className="flex h-32 items-center justify-center bg-[#f8f9fa] dark:bg-[#1b2e4b]">
                                            <div className="flex flex-col items-center gap-1 text-[#888ea8]">
                                                {item.file_type === 'video'
                                                    ? <span className="text-3xl">🎬</span>
                                                    : <span className="text-3xl">📄</span>
                                                }
                                                <span className="text-xs text-center px-1 line-clamp-2">{item.original_name}</span>
                                            </div>
                                        </a>
                                    )}
                                    <div className="p-2">
                                        <p className="text-xs text-[#515365] truncate dark:text-[#888ea8]">{item.original_name}</p>
                                        <p className="text-xs text-[#888ea8]">{fmtBytes(item.file_size)}</p>
                                    </div>
                                    <button
                                        type="button"
                                        className="absolute right-1 top-1 hidden rounded-full bg-danger p-1 text-white group-hover:flex"
                                        onClick={() => handleDeleteGallery(item)}
                                        title="Sil"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
