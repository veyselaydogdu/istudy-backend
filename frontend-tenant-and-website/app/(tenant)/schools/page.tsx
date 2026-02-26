'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import apiClient from '@/lib/apiClient';
import { School, Country } from '@/types';
import { Plus, Search, Trash2, ChevronLeft, ChevronRight, Edit2, X } from 'lucide-react';

type SchoolForm = {
    name: string;
    code: string;
    country_id: string;
    city: string;
    address: string;
    phone: string;
    fax: string;
    gsm: string;
    whatsapp: string;
    email: string;
    website: string;
    description: string;
};

const emptyForm: SchoolForm = {
    name: '', code: '', country_id: '', city: '', address: '',
    phone: '', fax: '', gsm: '', whatsapp: '', email: '', website: '', description: '',
};

export default function SchoolsPage() {
    const [schools, setSchools] = useState<School[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editingSchool, setEditingSchool] = useState<School | null>(null);
    const [form, setForm] = useState<SchoolForm>(emptyForm);
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

    const fetchCountries = useCallback(async () => {
        try {
            const res = await apiClient.get('/countries');
            if (res.data?.data) setCountries(res.data.data);
        } catch {
            // sessizce geç
        }
    }, []);

    useEffect(() => { fetchSchools(); }, [fetchSchools]);
    useEffect(() => { fetchCountries(); }, [fetchCountries]);

    const openCreate = () => {
        setEditingSchool(null);
        setForm(emptyForm);
        setShowModal(true);
    };

    const openEdit = (school: School) => {
        setEditingSchool(school);
        setForm({
            name: school.name ?? '',
            code: school.code ?? '',
            country_id: school.country_id ? String(school.country_id) : '',
            city: school.city ?? '',
            address: school.address ?? '',
            phone: school.phone ?? '',
            fax: school.fax ?? '',
            gsm: school.gsm ?? '',
            whatsapp: school.whatsapp ?? '',
            email: school.email ?? '',
            website: school.website ?? '',
            description: school.description ?? '',
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const payload = {
            ...form,
            country_id: form.country_id ? Number(form.country_id) : null,
        };
        try {
            if (editingSchool) {
                await apiClient.put(`/schools/${editingSchool.id}`, payload);
                toast.success('Okul güncellendi!');
            } else {
                await apiClient.post('/schools', payload);
                toast.success('Okul oluşturuldu!');
            }
            setShowModal(false);
            setForm(emptyForm);
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

    const f = (field: keyof SchoolForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [field]: e.target.value }));

    return (
        <div className="p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-dark dark:text-white">Okullarım</h1>
                <button type="button" className="btn btn-primary gap-2" onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                    Yeni Okul
                </button>
            </div>

            <div className="panel">
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
                                        <th>Şehir</th>
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
                                            <td>{school.city ?? '—'}</td>
                                            <td>{school.email ?? '—'}</td>
                                            <td>{school.phone ?? '—'}</td>
                                            <td>{school.classes_count ?? 0}</td>
                                            <td>{school.children_count ?? 0}</td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-primary p-2"
                                                        onClick={() => openEdit(school)}
                                                        title="Düzenle"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger p-2"
                                                        onClick={() => handleDelete(school)}
                                                        title="Sil"
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

                        {lastPage > 1 && (
                            <div className="mt-4 flex items-center justify-center gap-2">
                                <button type="button" className="btn btn-sm btn-outline-primary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="text-sm text-[#515365] dark:text-[#888ea8]">{page} / {lastPage}</span>
                                <button type="button" className="btn btn-sm btn-outline-primary" disabled={page === lastPage} onClick={() => setPage(p => p + 1)}>
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">
                                {editingSchool ? 'Okul Düzenle' : 'Yeni Okul Ekle'}
                            </h2>
                            <button type="button" onClick={() => setShowModal(false)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Temel Bilgiler */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">Okul Adı *</label>
                                    <input type="text" className="form-input mt-1" value={form.name} onChange={f('name')} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">Okul Kodu *</label>
                                    <input type="text" className="form-input mt-1" placeholder="Örn: OKUL-001" value={form.code} onChange={f('code')} required={!editingSchool} />
                                </div>
                            </div>

                            {/* Konum */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">Ülke</label>
                                    <select className="form-select mt-1" value={form.country_id} onChange={f('country_id')}>
                                        <option value="">Ülke seçin</option>
                                        {countries.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">Şehir</label>
                                    <input type="text" className="form-input mt-1" value={form.city} onChange={f('city')} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Adres</label>
                                <textarea className="form-input mt-1" rows={2} value={form.address} onChange={f('address')} />
                            </div>

                            {/* İletişim */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">Telefon</label>
                                    <input type="text" className="form-input mt-1" placeholder="+90 555 000 0000" value={form.phone} onChange={f('phone')} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">Faks</label>
                                    <input type="text" className="form-input mt-1" value={form.fax} onChange={f('fax')} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">GSM (Cep)</label>
                                    <input type="text" className="form-input mt-1" value={form.gsm} onChange={f('gsm')} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">WhatsApp</label>
                                    <input type="text" className="form-input mt-1" placeholder="+90 555 000 0000" value={form.whatsapp} onChange={f('whatsapp')} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">E-posta</label>
                                    <input type="email" className="form-input mt-1" value={form.email} onChange={f('email')} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">Web Sitesi</label>
                                    <input type="text" className="form-input mt-1" placeholder="https://" value={form.website} onChange={f('website')} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Açıklama</label>
                                <textarea className="form-input mt-1" rows={2} value={form.description} onChange={f('description')} />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
                                    {saving ? 'Kaydediliyor...' : (editingSchool ? 'Güncelle' : 'Kaydet')}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowModal(false)}>
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
