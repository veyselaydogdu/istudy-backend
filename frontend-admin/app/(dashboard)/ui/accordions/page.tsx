'use client';
import Link from 'next/link';
import { useState } from 'react';
import AnimateHeight from 'react-animate-height';
import IconCaretDown from '@/components/icon/icon-caret-down';
import { HelpCircle, Info, Star } from 'lucide-react';

export default function AccordionsPage() {
    const [acc1, setAcc1] = useState<string>('1');
    const [acc2, setAcc2] = useState<string>('');
    const [acc3, setAcc3] = useState<string>('1');

    const toggle = (setter: typeof setAcc1, value: string) =>
        setter(old => old === value ? '' : value);

    const items = [
        { id: '1', title: 'Birinci Madde', content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent lacinia nisl a ex scelerisque, a tempor orci suscipit. Sed venenatis aliquet orci.' },
        { id: '2', title: 'İkinci Madde', content: 'Curabitur volutpat velit in libero ullamcorper sagittis. Donec commodo tincidunt ipsum sit amet iaculis.' },
        { id: '3', title: 'Üçüncü Madde', content: 'Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Phasellus congue.' },
    ];

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li><Link href="/" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Akordeonlar</span></li>
            </ul>

            <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Basic Accordion */}
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">Temel Akordeон</div>
                    <div className="space-y-2 font-semibold">
                        {items.map(item => (
                            <div key={item.id} className="rounded border border-[#d3d3d3] dark:border-[#1b2e4b]">
                                <button
                                    type="button"
                                    className={`flex w-full items-center p-4 text-white-dark dark:bg-[#1b2e4b] ${acc1 === item.id ? '!text-primary' : ''}`}
                                    onClick={() => toggle(setAcc1, item.id)}
                                >
                                    {item.title}
                                    <IconCaretDown className={`ltr:ml-auto rtl:mr-auto transition-transform ${acc1 === item.id ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimateHeight duration={300} height={acc1 === item.id ? 'auto' : 0}>
                                    <div className="space-y-2 border-t border-[#d3d3d3] p-4 text-[13px] text-white-dark dark:border-[#1b2e4b]">
                                        <p>{item.content}</p>
                                    </div>
                                </AnimateHeight>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Multi-open Accordion */}
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">Çoklu Açılır Akordeон</div>
                    <div className="space-y-2 font-semibold">
                        {items.map(item => (
                            <div key={item.id} className="rounded border border-[#d3d3d3] dark:border-[#1b2e4b]">
                                <button
                                    type="button"
                                    className={`flex w-full items-center p-4 text-white-dark dark:bg-[#1b2e4b] ${acc2 === item.id ? '!text-primary' : ''}`}
                                    onClick={() => toggle(setAcc2, item.id)}
                                >
                                    {item.title}
                                    <IconCaretDown className={`ltr:ml-auto rtl:mr-auto transition-transform ${acc2 === item.id ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimateHeight duration={300} height={acc2 === item.id ? 'auto' : 0}>
                                    <div className="border-t border-[#d3d3d3] p-4 text-[13px] text-white-dark dark:border-[#1b2e4b]">
                                        <p>{item.content}</p>
                                    </div>
                                </AnimateHeight>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Icon Accordion */}
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">İkonlu Akordeон</div>
                    <div className="space-y-2 font-semibold">
                        {[
                            { id: '1', title: 'Nasıl çalışır?', icon: HelpCircle, content: 'Sistem otomatik olarak tüm verileri senkronize eder.' },
                            { id: '2', title: 'Önemli Bilgi', icon: Info, content: 'Verileriniz güvenli bir şekilde şifrelenerek saklanır.' },
                            { id: '3', title: 'Özellikler', icon: Star, content: 'Çok kiracılı mimari, gerçek zamanlı bildirimler ve daha fazlası.' },
                        ].map(item => (
                            <div key={item.id} className="rounded border border-[#d3d3d3] dark:border-[#1b2e4b]">
                                <button
                                    type="button"
                                    className={`flex w-full items-center gap-3 p-4 text-white-dark dark:bg-[#1b2e4b] ${acc3 === item.id ? '!text-primary' : ''}`}
                                    onClick={() => toggle(setAcc3, item.id)}
                                >
                                    <item.icon className="h-5 w-5 shrink-0" />
                                    {item.title}
                                    <IconCaretDown className={`ltr:ml-auto rtl:mr-auto transition-transform ${acc3 === item.id ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimateHeight duration={300} height={acc3 === item.id ? 'auto' : 0}>
                                    <div className="border-t border-[#d3d3d3] p-4 text-[13px] text-white-dark dark:border-[#1b2e4b]">
                                        <p>{item.content}</p>
                                    </div>
                                </AnimateHeight>
                            </div>
                        ))}
                    </div>
                </div>

                {/* No Icon Accordion (flat style) */}
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">Düz Stil Akordeон</div>
                    <div className="font-semibold">
                        {items.map((item, idx) => (
                            <div key={item.id} className={idx > 0 ? 'border-t border-[#d3d3d3] dark:border-[#1b2e4b]' : ''}>
                                <button
                                    type="button"
                                    className={`flex w-full items-center py-3 text-white-dark ${acc1 === item.id ? '!text-primary' : ''}`}
                                    onClick={() => toggle(setAcc1, item.id)}
                                >
                                    {item.title}
                                    <IconCaretDown className={`ltr:ml-auto rtl:mr-auto transition-transform ${acc1 === item.id ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimateHeight duration={300} height={acc1 === item.id ? 'auto' : 0}>
                                    <div className="pb-3 text-[13px] text-white-dark">
                                        <p>{item.content}</p>
                                    </div>
                                </AnimateHeight>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
