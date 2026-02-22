'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Home, User, Phone, Settings } from 'lucide-react';

export default function TabsPage() {
    const [tab1, setTab1] = useState<string>('home');
    const [tab2, setTab2] = useState<string>('home');
    const [tab3, setTab3] = useState<string>('home');
    const [tab4, setTab4] = useState<string>('home');

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li><Link href="/" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Sekmeler</span></li>
            </ul>

            <div className="mt-5 space-y-6">
                {/* Simple Tabs */}
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">Basit Sekmeler</div>
                    <div>
                        <ul className="mb-5 flex flex-wrap border-b border-white-light dark:border-[#191e3a]">
                            {['home', 'profile', 'contact'].map(t => (
                                <li key={t}>
                                    <button
                                        onClick={() => setTab1(t)}
                                        className={`${tab1 === t ? '!border-white-light !border-b-white text-primary !outline-none dark:!border-[#191e3a] dark:!border-b-black' : ''} -mb-[1px] block border border-transparent p-3.5 py-2 hover:text-primary dark:hover:border-b-black`}
                                    >
                                        {t === 'home' ? 'Ana Sayfa' : t === 'profile' ? 'Profil' : 'İletişim'}
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="text-sm text-white-dark">
                            {tab1 === 'home' && <p>Ana sayfa içeriği. Lorem ipsum dolor sit amet consectetur adipisicing elit. Velit, dolorem.</p>}
                            {tab1 === 'profile' && <p>Profil içeriği. Kullanıcı bilgileri burada gösterilir.</p>}
                            {tab1 === 'contact' && <p>İletişim içeriği. İletişim formu ve bilgileri burada yer alır.</p>}
                        </div>
                    </div>
                </div>

                {/* Line Tabs */}
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">Çizgili Sekmeler</div>
                    <div>
                        <ul className="mb-5 flex flex-wrap">
                            {['home', 'profile', 'contact'].map(t => (
                                <li key={t} className="border-b-2 border-transparent">
                                    <button
                                        onClick={() => setTab2(t)}
                                        className={`${tab2 === t ? '!border-primary text-primary' : 'text-white-dark'} border-b-2 border-transparent p-4 py-2 hover:border-primary hover:text-primary`}
                                    >
                                        {t === 'home' ? 'Ana Sayfa' : t === 'profile' ? 'Profil' : 'İletişim'}
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="text-sm text-white-dark">
                            {tab2 === 'home' && <p>Ana sayfa içeriği. Lorem ipsum dolor sit amet consectetur adipisicing elit.</p>}
                            {tab2 === 'profile' && <p>Profil içeriği.</p>}
                            {tab2 === 'contact' && <p>İletişim içeriği.</p>}
                        </div>
                    </div>
                </div>

                {/* Pills / Badge Tabs */}
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">Pill Sekmeler</div>
                    <div>
                        <ul className="mb-5 flex flex-wrap gap-2">
                            {['home', 'profile', 'contact', 'settings'].map(t => (
                                <li key={t}>
                                    <button
                                        onClick={() => setTab3(t)}
                                        className={`${tab3 === t ? 'bg-primary text-white' : 'bg-white-light text-dark dark:bg-[#1b2e4b] dark:text-white-light'} rounded-full px-4 py-1.5 text-sm font-semibold transition-colors hover:bg-primary hover:text-white`}
                                    >
                                        {t === 'home' ? 'Ana Sayfa' : t === 'profile' ? 'Profil' : t === 'contact' ? 'İletişim' : 'Ayarlar'}
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="text-sm text-white-dark">
                            {tab3 === 'home' && <p>Ana sayfa içeriği.</p>}
                            {tab3 === 'profile' && <p>Profil içeriği.</p>}
                            {tab3 === 'contact' && <p>İletişim içeriği.</p>}
                            {tab3 === 'settings' && <p>Ayarlar içeriği.</p>}
                        </div>
                    </div>
                </div>

                {/* Icon Tabs */}
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">İkonlu Sekmeler</div>
                    <div>
                        <ul className="mb-5 flex flex-wrap border-b border-white-light dark:border-[#191e3a]">
                            {[
                                { key: 'home', label: 'Ana Sayfa', icon: Home },
                                { key: 'profile', label: 'Profil', icon: User },
                                { key: 'contact', label: 'İletişim', icon: Phone },
                                { key: 'settings', label: 'Ayarlar', icon: Settings },
                            ].map(({ key, label, icon: Icon }) => (
                                <li key={key}>
                                    <button
                                        onClick={() => setTab4(key)}
                                        className={`${tab4 === key ? '!border-white-light !border-b-white text-primary !outline-none dark:!border-[#191e3a] dark:!border-b-black' : ''} -mb-[1px] flex items-center gap-2 border border-transparent p-3.5 py-2 hover:text-primary dark:hover:border-b-black`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="text-sm text-white-dark">
                            {tab4 === 'home' && <p>Ana sayfa içeriği. İkonlu sekme örneği.</p>}
                            {tab4 === 'profile' && <p>Profil içeriği.</p>}
                            {tab4 === 'contact' && <p>İletişim içeriği.</p>}
                            {tab4 === 'settings' && <p>Ayarlar içeriği.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
