'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';
import { Package } from '@/types';
import { Check } from 'lucide-react';

export default function PricingPage() {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    useEffect(() => {
        apiClient.get('/packages').then((res) => {
            if (res.data?.data) {
                setPackages(res.data.data);
            }
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const getPrice = (pkg: Package) => {
        return billingCycle === 'monthly' ? pkg.monthly_price : pkg.yearly_price;
    };

    const formatLimit = (val: number) => (val === 0 ? 'Sınırsız' : val.toString());

    return (
        <section className="py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-extrabold text-dark dark:text-white">Fiyatlandırma</h1>
                    <p className="mt-4 text-lg text-[#515365] dark:text-[#888ea8]">
                        İhtiyacınıza uygun paketi seçin, istediğiniz zaman yükseltin
                    </p>

                    {/* Billing toggle */}
                    <div className="mt-8 inline-flex items-center gap-4 rounded-full bg-[#f1f2f3] p-1 dark:bg-[#1b2e4b]">
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
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                ) : (
                    <div className="grid gap-8 md:grid-cols-3">
                        {packages.map((pkg, idx) => (
                            <div
                                key={pkg.id}
                                className={`panel flex flex-col ${idx === 1 ? 'border-2 border-primary' : ''}`}
                            >
                                {idx === 1 && (
                                    <div className="mb-4 self-start rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
                                        En Popüler
                                    </div>
                                )}
                                {pkg.yearly_discount_percentage && billingCycle === 'yearly' && (
                                    <div className="mb-4 self-start rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
                                        %{pkg.yearly_discount_percentage} İndirim
                                    </div>
                                )}

                                <h2 className="text-2xl font-bold text-dark dark:text-white">{pkg.name}</h2>
                                {pkg.description && (
                                    <p className="mt-2 text-sm text-[#515365] dark:text-[#888ea8]">{pkg.description}</p>
                                )}

                                <div className="my-6">
                                    <span className="text-4xl font-extrabold text-primary">₺{getPrice(pkg)}</span>
                                    <span className="text-sm text-[#515365] dark:text-[#888ea8]">
                                        /{billingCycle === 'monthly' ? 'ay' : 'yıl'}
                                    </span>
                                </div>

                                {/* Limits */}
                                <ul className="mb-6 space-y-2 text-sm">
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
                                            <span className="text-[#515365] dark:text-[#888ea8]">
                                                {f.value_type === 'text' && f.value ? `${f.label}: ${f.value}` : f.label}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href="/register"
                                    className={`btn ${idx === 1 ? 'btn-primary' : 'btn-outline-primary'} mt-auto w-full`}
                                >
                                    Hemen Başla
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
