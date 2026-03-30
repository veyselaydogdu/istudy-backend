'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';
import { Package } from '@/types';
import {
    Building2,
    Users,
    HeartPulse,
    BarChart3,
    Bell,
    ShieldCheck,
    ArrowRight,
    Check,
} from 'lucide-react';

const features = [
    {
        icon: Building2,
        title: 'Çoklu Şube',
        desc: 'Tek hesapla birden fazla okul ve şubenizi yönetin.',
    },
    {
        icon: Users,
        title: 'Öğrenci Takibi',
        desc: 'Devam, gelişim ve davranış takibini kolayca yapın.',
    },
    {
        icon: HeartPulse,
        title: 'Sağlık & Beslenme',
        desc: 'Alerjen ve sağlık bilgilerini güvenle saklayın.',
    },
    {
        icon: BarChart3,
        title: 'Raporlar',
        desc: 'Anlık istatistikler ve detaylı raporlarla kararlarınızı güçlendirin.',
    },
    {
        icon: Bell,
        title: 'Bildirimler',
        desc: 'Velileri anlık bildirimlerle her an bilgilendirin.',
    },
    {
        icon: ShieldCheck,
        title: 'Güvenli Veri',
        desc: 'Verileriniz şifreli ve izole ortamda saklanır.',
    },
];

const steps = [
    { num: '01', title: 'Kayıt Ol', desc: 'Ücretsiz hesap oluşturun, kurum bilgilerinizi girin.' },
    { num: '02', title: 'Paket Seç', desc: 'İhtiyacınıza uygun paketi seçin, hemen kullanmaya başlayın.' },
    { num: '03', title: 'Kullan', desc: 'Okullarınızı, sınıflarınızı ve öğrencilerinizi yönetin.' },
];

export default function HomePage() {
    const [packages, setPackages] = useState<Package[]>([]);

    useEffect(() => {
        apiClient.get('/packages').then((res) => {
            if (res.data?.data) {
                setPackages(res.data.data.slice(0, 3));
            }
        }).catch(() => {});
    }, []);

    return (
        <>
            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-white to-secondary/10 py-24 dark:from-primary/20 dark:via-[#060818] dark:to-secondary/20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-extrabold tracking-tight text-dark dark:text-white sm:text-5xl lg:text-6xl">
                            Anaokuluunuzu{' '}
                            <span className="text-primary">kolayca yönetin</span>
                        </h1>
                        <p className="mx-auto mt-6 max-w-2xl text-lg text-[#515365] dark:text-[#888ea8]">
                            iStudy ile öğrenci takibi, veli iletişimi, sağlık bilgileri ve raporlamayı tek platformdan yönetin.
                        </p>
                        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                            <Link href="/register" className="btn btn-primary btn-lg gap-2">
                                Ücretsiz Dene <ArrowRight className="h-5 w-5" />
                            </Link>
                            <Link href="/contact" className="btn btn-outline-primary btn-lg">
                                Demo İzle
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-12 text-center">
                        <h2 className="text-3xl font-bold text-dark dark:text-white">Her şey tek platformda</h2>
                        <p className="mt-4 text-[#515365] dark:text-[#888ea8]">
                            İhtiyacınız olan tüm araçlar, sezgisel bir arayüzde
                        </p>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((f) => {
                            const Icon = f.icon;
                            return (
                                <div key={f.title} className="panel">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                        <Icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <h3 className="mb-2 font-semibold text-dark dark:text-white">{f.title}</h3>
                                    <p className="text-sm text-[#515365] dark:text-[#888ea8]">{f.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="bg-[#f1f2f3] py-20 dark:bg-[#0e1726]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-12 text-center">
                        <h2 className="text-3xl font-bold text-dark dark:text-white">Nasıl çalışır?</h2>
                        <p className="mt-4 text-[#515365] dark:text-[#888ea8]">3 adımda hemen başlayın</p>
                    </div>
                    <div className="grid gap-8 md:grid-cols-3">
                        {steps.map((step) => (
                            <div key={step.num} className="text-center">
                                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-extrabold text-white">
                                    {step.num}
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-dark dark:text-white">{step.title}</h3>
                                <p className="text-[#515365] dark:text-[#888ea8]">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Preview */}
            {packages.length > 0 && (
                <section className="py-20">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-12 text-center">
                            <h2 className="text-3xl font-bold text-dark dark:text-white">Şeffaf fiyatlandırma</h2>
                            <p className="mt-4 text-[#515365] dark:text-[#888ea8]">
                                Kurumunuza uygun paketi seçin
                            </p>
                        </div>
                        <div className="grid gap-6 md:grid-cols-3">
                            {packages.map((pkg, idx) => (
                                <div
                                    key={pkg.id}
                                    className={`panel flex flex-col ${idx === 1 ? 'border-2 border-primary' : ''}`}
                                >
                                    {idx === 1 && (
                                        <div className="mb-3 self-start rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
                                            Popüler
                                        </div>
                                    )}
                                    <h3 className="mb-2 text-xl font-bold text-dark dark:text-white">{pkg.name}</h3>
                                    <div className="mb-4">
                                        <span className="text-3xl font-extrabold text-primary">₺{pkg.monthly_price}</span>
                                        <span className="text-sm text-[#515365] dark:text-[#888ea8]">/ay</span>
                                    </div>
                                    {pkg.package_features && (
                                        <ul className="mb-6 flex-1 space-y-2">
                                            {pkg.package_features.slice(0, 4).map((f) => (
                                                <li key={f.id} className="flex items-center gap-2 text-sm">
                                                    <Check className="h-4 w-4 flex-shrink-0 text-success" />
                                                    <span className="text-[#515365] dark:text-[#888ea8]">{f.label}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    <Link href="/register" className={`btn ${idx === 1 ? 'btn-primary' : 'btn-outline-primary'} mt-auto w-full`}>
                                        Başla
                                    </Link>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 text-center">
                            <Link href="/pricing" className="font-semibold text-primary hover:underline">
                                Tüm fiyatları gör →
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* CTA */}
            <section className="bg-gradient-to-r from-primary to-secondary py-20">
                <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-white">Hemen başlamaya hazır mısınız?</h2>
                    <p className="mt-4 text-lg text-white/80">
                        Binlerce anaokulu iStudy ile yönetiliyor. Siz de katılın.
                    </p>
                    <div className="mt-8">
                        <Link href="/register" className="btn bg-white text-primary hover:bg-white/90 btn-lg gap-2">
                            Hemen Başla <ArrowRight className="h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
