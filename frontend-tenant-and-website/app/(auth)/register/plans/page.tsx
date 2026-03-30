'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import { Package } from '@/types';
import { Check, Loader2 } from 'lucide-react';

export default function PlansPage() {
    const router = useRouter();
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
    const [subscribing, setSubscribing] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && !localStorage.getItem('tenant_token')) {
            router.push('/register');
            return;
        }
        apiClient.get('/packages').then((res) => {
            if (res.data?.data) {
                setPackages(res.data.data);
            }
        }).catch(() => {}).finally(() => setLoading(false));
    }, [router]);

    const handleSubscribe = async () => {
        if (!selectedPackageId) {
            toast.error('Lütfen bir paket seçin.');
            return;
        }
        setSubscribing(true);
        try {
            await apiClient.post('/tenant/subscribe', {
                package_id: selectedPackageId,
                billing_cycle: billingCycle,
            });
            toast.success('Abonelik başarıyla oluşturuldu!');
            router.push('/dashboard');
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: { message?: string } } };
            const message = axiosError.response?.data?.message || 'Abonelik oluşturulurken hata oluştu.';
            toast.error(message);
        } finally {
            setSubscribing(false);
        }
    };

    const formatLimit = (val: number) => (val === 0 ? 'Sınırsız' : val.toString());
    const getPrice = (pkg: Package) => billingCycle === 'monthly' ? pkg.monthly_price : pkg.yearly_price;

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-secondary/10 px-4 py-16 dark:from-primary/20 dark:via-[#060818] dark:to-secondary/20">
            <div className="mx-auto max-w-5xl">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-extrabold text-dark dark:text-white">Adım 2/2 — Paket Seç</h1>
                    <p className="mt-3 text-[#515365] dark:text-[#888ea8]">
                        Kurumunuza uygun paketi seçin. İstediğiniz zaman değiştirebilirsiniz.
                    </p>

                    {/* Billing toggle */}
                    <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-[#f1f2f3] p-1 dark:bg-[#1b2e4b]">
                        <button
                            type="button"
                            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                                billingCycle === 'monthly'
                                    ? 'bg-white text-primary shadow dark:bg-[#0e1726]'
                                    : 'text-[#515365] dark:text-[#888ea8]'
                            }`}
                            onClick={() => setBillingCycle('monthly')}
                        >
                            Aylık
                        </button>
                        <button
                            type="button"
                            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                                billingCycle === 'yearly'
                                    ? 'bg-white text-primary shadow dark:bg-[#0e1726]'
                                    : 'text-[#515365] dark:text-[#888ea8]'
                            }`}
                            onClick={() => setBillingCycle('yearly')}
                        >
                            Yıllık
                            <span className="ml-2 rounded-full bg-success px-2 py-0.5 text-xs text-white">İndirimli</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-3">
                        {packages.map((pkg, idx) => {
                            const selected = selectedPackageId === pkg.id;
                            return (
                                <button
                                    key={pkg.id}
                                    type="button"
                                    onClick={() => setSelectedPackageId(pkg.id)}
                                    className={`panel flex flex-col text-left transition-all ${
                                        selected
                                            ? 'border-2 border-primary ring-4 ring-primary/20'
                                            : idx === 1
                                            ? 'border-2 border-dashed border-primary/30'
                                            : ''
                                    }`}
                                >
                                    {idx === 1 && !selected && (
                                        <div className="mb-3 self-start rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                                            Önerilen
                                        </div>
                                    )}
                                    {selected && (
                                        <div className="mb-3 self-start rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
                                            ✓ Seçildi
                                        </div>
                                    )}

                                    <h2 className="text-xl font-bold text-dark dark:text-white">{pkg.name}</h2>
                                    <div className="my-4">
                                        <span className="text-3xl font-extrabold text-primary">₺{getPrice(pkg)}</span>
                                        <span className="text-sm text-[#515365] dark:text-[#888ea8]">
                                            /{billingCycle === 'monthly' ? 'ay' : 'yıl'}
                                        </span>
                                    </div>

                                    <ul className="mb-4 flex-1 space-y-2 text-sm">
                                        <li className="flex items-center gap-2">
                                            <Check className="h-4 w-4 flex-shrink-0 text-success" />
                                            <span className="text-[#515365] dark:text-[#888ea8]">
                                                {formatLimit(pkg.max_schools)} Okul
                                            </span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="h-4 w-4 flex-shrink-0 text-success" />
                                            <span className="text-[#515365] dark:text-[#888ea8]">
                                                {formatLimit(pkg.max_classes_per_school)} Sınıf/Okul
                                            </span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="h-4 w-4 flex-shrink-0 text-success" />
                                            <span className="text-[#515365] dark:text-[#888ea8]">
                                                {formatLimit(pkg.max_students)} Öğrenci
                                            </span>
                                        </li>
                                        {pkg.package_features?.map((f) => (
                                            <li key={f.id} className="flex items-center gap-2">
                                                <Check className="h-4 w-4 flex-shrink-0 text-success" />
                                                <span className="text-[#515365] dark:text-[#888ea8]">{f.label}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                    <button
                        type="button"
                        onClick={handleSubscribe}
                        className="btn btn-primary btn-lg w-full sm:w-auto"
                        disabled={subscribing || !selectedPackageId}
                    >
                        {subscribing ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                İşleniyor...
                            </span>
                        ) : (
                            'Paketi Seç ve Devam Et'
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push('/dashboard')}
                        className="btn btn-outline-secondary btn-lg w-full sm:w-auto"
                    >
                        Şimdi Değil, Atla
                    </button>
                </div>
            </div>
        </div>
    );
}
