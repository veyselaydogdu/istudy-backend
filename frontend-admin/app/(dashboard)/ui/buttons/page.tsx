'use client';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import IconPlus from '@/components/icon/icon-plus';
import IconSend from '@/components/icon/icon-send';

export default function ButtonsPage() {
    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li><Link href="/" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>UI Bileşenleri</span></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Butonlar</span></li>
            </ul>

            <div className="mt-5 space-y-6">
                {/* Default Buttons */}
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">Varsayılan Butonlar</div>
                    <div className="flex flex-wrap gap-3">
                        <button type="button" className="btn btn-primary">Primary</button>
                        <button type="button" className="btn btn-secondary">Secondary</button>
                        <button type="button" className="btn btn-success">Success</button>
                        <button type="button" className="btn btn-danger">Danger</button>
                        <button type="button" className="btn btn-warning">Warning</button>
                        <button type="button" className="btn btn-info">Info</button>
                        <button type="button" className="btn btn-dark">Dark</button>
                        <button type="button" className="btn btn-primary" disabled>Disabled</button>
                    </div>
                </div>

                {/* Outline Buttons */}
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">Outline Butonlar</div>
                    <div className="flex flex-wrap gap-3">
                        <button type="button" className="btn btn-outline-primary">Primary</button>
                        <button type="button" className="btn btn-outline-secondary">Secondary</button>
                        <button type="button" className="btn btn-outline-success">Success</button>
                        <button type="button" className="btn btn-outline-danger">Danger</button>
                        <button type="button" className="btn btn-outline-warning">Warning</button>
                        <button type="button" className="btn btn-outline-info">Info</button>
                        <button type="button" className="btn btn-outline-dark">Dark</button>
                    </div>
                </div>

                {/* Rounded Buttons */}
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">Yuvarlak Butonlar</div>
                    <div className="flex flex-wrap gap-3">
                        <button type="button" className="btn btn-primary rounded-full">Primary</button>
                        <button type="button" className="btn btn-secondary rounded-full">Secondary</button>
                        <button type="button" className="btn btn-success rounded-full">Success</button>
                        <button type="button" className="btn btn-danger rounded-full">Danger</button>
                        <button type="button" className="btn btn-warning rounded-full">Warning</button>
                        <button type="button" className="btn btn-info rounded-full">Info</button>
                        <button type="button" className="btn btn-dark rounded-full">Dark</button>
                    </div>
                </div>

                {/* Button Sizes */}
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">Boyutlar</div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button type="button" className="btn btn-primary btn-lg">Büyük</button>
                        <button type="button" className="btn btn-primary">Normal</button>
                        <button type="button" className="btn btn-primary btn-sm">Küçük</button>
                    </div>
                </div>

                {/* Gradient Buttons */}
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">Gradient Butonlar</div>
                    <div className="flex flex-wrap gap-3">
                        <button type="button" className="btn btn-gradient border-0">Gradient</button>
                        <button type="button" className="btn btn-gradient border-0 rounded-full">Rounded Gradient</button>
                    </div>
                </div>

                {/* Buttons with Icons */}
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">İkonlu Butonlar</div>
                    <div className="flex flex-wrap gap-3">
                        <button type="button" className="btn btn-primary flex items-center gap-2">
                            <IconPlus className="h-4 w-4" />
                            Ekle
                        </button>
                        <button type="button" className="btn btn-success flex items-center gap-2">
                            <IconSend className="h-4 w-4" />
                            Gönder
                        </button>
                        <button type="button" className="btn btn-info flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Yükleniyor
                        </button>
                    </div>
                </div>

                {/* Block Buttons */}
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">Tam Genişlik Butonlar</div>
                    <div className="space-y-3">
                        <button type="button" className="btn btn-primary w-full">Tam Genişlik Primary</button>
                        <button type="button" className="btn btn-outline-success w-full">Tam Genişlik Outline</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
