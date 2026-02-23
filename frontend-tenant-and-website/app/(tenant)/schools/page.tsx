'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import apiClient from '@/lib/apiClient';
import { School } from '@/types';
import { Plus, Search, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

type SchoolForm = {
    name: string;
    address: string;
    phone: string;
    email: string;
};

export default function SchoolsPage() {
    const [schools, setSchools] = useState<School[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<SchoolForm>({ name: '', address: '', phone: '', email: '' });
    const [saving, setSaving] = useState(false);

    const fetchSchools = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/schools', { params: { page, search: search || undefined } });
            if (res.data?.data) {
                setSchools(res.data.data);
                setLastPage(res.data.meta?.last_page ?? 1);
            }
        } catch {
            toast.error('Okullar yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => { fetchSchools(); }, [fetchSchools]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await apiClient.post('/schools', form);
            toast.success('Okul oluşturuldu!');
            setShowModal(false);
            setForm({ name: '', address: '', phone: '', email: '' });
            setPage(1);
            fetchSchools();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? 'Hata oluştu.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (school: School) => {
        const result = await Swal.fire({
            title: 'Okulu Sil',
            text: `"${school.name}" okulunu silmek istediğinize emin misiniz?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Evet, Sil',
            cancelButtonText: 'İptal',
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.delete(`/schools/${school.id}`);
            toast.success('Okul silindi.');
            fetchSchools();
        } catch {
            toast.error('Silme işlemi başarısız.');
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-dark dark:text-white">Okullarım</h1>
                <button
                    type="button"
                    className="btn btn-primary gap-2"
                    onClick={() => setShowModal(true)}
                >
                    <Plus className="h-4 w-4" />
                    Yeni Okul
                </button>
            </div>

            <div className="panel">
                {/* Search */}
                <div className="mb-4 flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888ea8]" />
                        <input
                            type="text"
                            className="form-input pl-9"
                            placeholder="Okul ara..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex h-32 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                ) : schools.length === 0 ? (
                    <div className="py-12 text-center text-[#515365] dark:text-[#888ea8]">
                        Henüz okul eklenmemiş.
                    </div>
                ) : (
                    <>
                        <div className="table-responsive">
                            <table className="table-hover">
                                <thead>
                                    <tr>
                                        <th>Okul Adı</th>
                                        <th>E-posta</th>
                                        <th>Telefon</th>
                                        <th>Sınıf</th>
                                        <th>Öğrenci</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schools.map((school) => (
                                        <tr key={school.id}>
                                            <td>
                                                <Link href={`/schools/${school.id}`} className="font-medium text-primary hover:underline">
                                                    {school.name}
                                                </Link>
                                            </td>
                                            <td>{school.email ?? '—'}</td>
                                            <td>{school.phone ?? '—'}</td>
                                            <td>{school.classes_count ?? 0}</td>
                                            <td>{school.children_count ?? 0}</td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger p-2"
                                                    onClick={() => handleDelete(school)}
                                                    title="Sil"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {lastPage > 1 && (
                            <div className="mt-4 flex items-center justify-center gap-2">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="text-sm text-[#515365] dark:text-[#888ea8]">
                                    {page} / {lastPage}
                                </span>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary"
                                    disabled={page === lastPage}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <h2 className="mb-4 text-lg font-bold text-dark dark:text-white">Yeni Okul Ekle</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Okul Adı *</label>
                                <input
                                    type="text"
                                    className="form-input mt-1"
                                    value={form.name}
                                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Adres</label>
                                <input
                                    type="text"
                                    className="form-input mt-1"
                                    value={form.address}
                                    onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Telefon</label>
                                <input
                                    type="text"
                                    className="form-input mt-1"
                                    value={form.phone}
                                    onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">E-posta</label>
                                <input
                                    type="email"
                                    className="form-input mt-1"
                                    value={form.email}
                                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
                                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary flex-1"
                                    onClick={() => setShowModal(false)}
                                >
                                    İptal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
