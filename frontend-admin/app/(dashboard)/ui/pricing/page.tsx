'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Check } from 'lucide-react';

export default function PricingPage() {
    const [yearly, setYearly] = useState(false);

    const plans = [
        {
            name: 'Başlangıç',
            monthlyPrice: 199,
            yearlyPrice: 1990,
            description: 'Küçük anaokulu ve kreşler için ideal.',
            features: ['1 Şube', '50 Öğrenci', '5 Öğretmen', 'Temel Raporlar', 'E-posta Desteği'],
            cta: 'Başla',
            highlighted: false,
            color: 'primary',
        },
        {
            name: 'Profesyonel',
            monthlyPrice: 499,
            yearlyPrice: 4990,
            description: 'Büyüyen kurumlar için gelişmiş özellikler.',
            features: ['5 Şube', '250 Öğrenci', '25 Öğretmen', 'Gelişmiş Raporlar', 'Öncelikli Destek', 'API Erişimi'],
            cta: 'Hemen Başla',
            highlighted: true,
            color: 'secondary',
        },
        {
            name: 'Kurumsal',
            monthlyPrice: 999,
            yearlyPrice: 9990,
            description: 'Büyük kurumlar ve zincir okullar için.',
            features: ['Sınırsız Şube', 'Sınırsız Öğrenci', 'Sınırsız Öğretmen', 'Özel Raporlar', '7/24 Destek', 'Özel Entegrasyon', 'SLA Garantisi'],
            cta: 'İletişime Geç',
            highlighted: false,
            color: 'success',
        },
    ];

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li><Link href="/" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Fiyatlandırma</span></li>
            </ul>

            <div className="mt-5">
                <div className="panel">
                    <div className="mb-8 text-center">
                        <h2 className="mb-2 text-2xl font-bold dark:text-white">Fiyatlandırma Planları</h2>
                        <p className="text-white-dark">İhtiyacınıza uygun planı seçin. İstediğiniz zaman yükseltin.</p>

                        {/* Toggle */}
                        <div className="mt-6 flex items-center justify-center gap-4">
                            <span className={`font-semibold ${!yearly ? 'text-primary' : 'text-white-dark'}`}>Aylık</span>
                            <label className="relative h-6 w-12 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="custom_switch peer absolute top-0 z-10 h-full w-full cursor-pointer opacity-0 ltr:left-0 rtl:right-0"
                                    checked={yearly}
                                    onChange={() => setYearly(!yearly)}
                                />
                                <span className="outline_checkbox bg-icon block h-full rounded-full border-2 border-[#ebedf2] before:absolute before:bottom-1 before:left-1 before:h-4 before:w-4 before:rounded-full before:bg-[#ebedf2] before:bg-no-repeat before:transition-all before:duration-300 peer-checked:border-primary peer-checked:before:left-7 peer-checked:before:bg-primary dark:border-[#253b5c] dark:before:bg-[#253b5c] dark:peer-checked:before:bg-primary"></span>
                            </label>
                            <span className={`relative font-semibold ${yearly ? 'text-primary' : 'text-white-dark'}`}>
                                Yıllık
                                <span className="badge absolute -right-16 top-0 whitespace-nowrap rounded-full bg-success text-white text-xs px-2">%17 İndirim</span>
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {plans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`relative rounded-xl border-2 p-6 transition-transform hover:-translate-y-1 ${
                                    plan.highlighted
                                        ? 'border-secondary bg-secondary text-white shadow-xl'
                                        : 'border-[#e0e6ed] bg-white dark:border-[#1b2e4b] dark:bg-black'
                                }`}
                            >
                                {plan.highlighted && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <span className="badge rounded-full bg-warning px-4 py-1 text-xs font-bold text-white">En Popüler</span>
                                    </div>
                                )}
                                <div className="mb-5">
                                    <h3 className={`text-xl font-bold ${plan.highlighted ? 'text-white' : 'text-dark dark:text-white'}`}>{plan.name}</h3>
                                    <p className={`mt-1 text-sm ${plan.highlighted ? 'text-white/80' : 'text-white-dark'}`}>{plan.description}</p>
                                </div>
                                <div className="mb-6">
                                    <div className="flex items-end gap-1">
                                        <span className={`text-4xl font-extrabold ${plan.highlighted ? 'text-white' : 'text-dark dark:text-white'}`}>
                                            ₺{yearly ? plan.yearlyPrice.toLocaleString('tr-TR') : plan.monthlyPrice.toLocaleString('tr-TR')}
                                        </span>
                                        <span className={`mb-1 text-sm ${plan.highlighted ? 'text-white/70' : 'text-white-dark'}`}>
                                            /{yearly ? 'yıl' : 'ay'}
                                        </span>
                                    </div>
                                </div>
                                <ul className="mb-8 space-y-3">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className={`flex items-center gap-2 text-sm ${plan.highlighted ? 'text-white/90' : 'text-white-dark'}`}>
                                            <Check className={`h-4 w-4 shrink-0 ${plan.highlighted ? 'text-white' : 'text-success'}`} />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    type="button"
                                    className={`btn w-full ${plan.highlighted ? 'bg-white text-secondary hover:bg-white/90' : `btn-outline-${plan.color}`}`}
                                >
                                    {plan.cta}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
