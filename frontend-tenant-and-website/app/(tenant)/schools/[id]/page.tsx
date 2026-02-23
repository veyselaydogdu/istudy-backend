'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import { School } from '@/types';
import { ArrowLeft } from 'lucide-react';

type SchoolClass = {
    id: number;
    name: string;
    capacity?: number;
    children_count?: number;
};

type Child = {
    id: number;
    name: string;
    surname?: string;
    birth_date?: string;
};

export default function SchoolDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [school, setSchool] = useState<School | null>(null);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [children, setChildren] = useState<Child[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'classes' | 'children'>('classes');

    useEffect(() => {
        Promise.all([
            apiClient.get(`/schools/${id}`),
            apiClient.get(`/schools/${id}/classes`).catch(() => ({ data: { data: [] } })),
            apiClient.get(`/schools/${id}/children`).catch(() => ({ data: { data: [] } })),
        ]).then(([schoolRes, classesRes, childrenRes]) => {
            if (schoolRes.data?.data) setSchool(schoolRes.data.data);
            if (classesRes.data?.data) setClasses(classesRes.data.data);
            if (childrenRes.data?.data) setChildren(childrenRes.data.data);
        }).catch(() => {
            toast.error('Okul bilgileri yüklenemedi.');
        }).finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!school) {
        return (
            <div className="p-6 text-center text-[#515365] dark:text-[#888ea8]">
                Okul bulunamadı.
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center gap-3">
                <Link href="/schools" className="btn btn-sm btn-outline-secondary gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Geri
                </Link>
                <h1 className="text-2xl font-bold text-dark dark:text-white">{school.name}</h1>
            </div>

            {/* School info */}
            <div className="panel mb-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                    {school.email && (
                        <div>
                            <p className="text-xs text-[#888ea8]">E-posta</p>
                            <p className="mt-1 font-medium text-dark dark:text-white">{school.email}</p>
                        </div>
                    )}
                    <div>
                        <p className="text-xs text-[#888ea8]">Durum</p>
                        <span className={`badge mt-1 ${school.status === 'active' ? 'badge-outline-success' : 'badge-outline-danger'}`}>
                            {school.status === 'active' ? 'Aktif' : 'Pasif'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="panel">
                <div className="mb-4 flex gap-2 border-b border-[#ebedf2] dark:border-[#1b2e4b]">
                    <button
                        type="button"
                        className={`px-4 py-2 text-sm font-semibold transition-colors ${
                            activeTab === 'classes'
                                ? 'border-b-2 border-primary text-primary'
                                : 'text-[#515365] hover:text-primary dark:text-[#888ea8]'
                        }`}
                        onClick={() => setActiveTab('classes')}
                    >
                        Sınıflar ({classes.length})
                    </button>
                    <button
                        type="button"
                        className={`px-4 py-2 text-sm font-semibold transition-colors ${
                            activeTab === 'children'
                                ? 'border-b-2 border-primary text-primary'
                                : 'text-[#515365] hover:text-primary dark:text-[#888ea8]'
                        }`}
                        onClick={() => setActiveTab('children')}
                    >
                        Öğrenciler ({children.length})
                    </button>
                </div>

                {activeTab === 'classes' && (
                    classes.length === 0 ? (
                        <p className="py-8 text-center text-[#515365] dark:text-[#888ea8]">Sınıf bulunamadı.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table-hover">
                                <thead>
                                    <tr>
                                        <th>Sınıf Adı</th>
                                        <th>Kapasite</th>
                                        <th>Öğrenci Sayısı</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classes.map((cls) => (
                                        <tr key={cls.id}>
                                            <td className="font-medium text-dark dark:text-white">{cls.name}</td>
                                            <td>{cls.capacity ?? '—'}</td>
                                            <td>{cls.children_count ?? 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}

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
                                    </tr>
                                </thead>
                                <tbody>
                                    {children.map((child) => (
                                        <tr key={child.id}>
                                            <td className="font-medium text-dark dark:text-white">{child.name}</td>
                                            <td>{child.surname ?? '—'}</td>
                                            <td>{child.birth_date ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
