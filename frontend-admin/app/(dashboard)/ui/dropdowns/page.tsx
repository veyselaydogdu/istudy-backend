'use client';
import Link from 'next/link';
import Dropdown from '@/components/dropdown';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import { Edit, Trash2, Eye, Download, Settings } from 'lucide-react';
import IconCaretDown from '@/components/icon/icon-caret-down';

export default function DropdownsPage() {
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl';

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li><Link href="/" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Açılır Menüler</span></li>
            </ul>

            <div className="mt-5 space-y-6">
                {/* Basic Dropdowns */}
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">Temel Açılır Menüler</div>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="dropdown">
                            <Dropdown placement={isRtl ? 'bottom-start' : 'bottom-end'} button={
                                <button type="button" className="btn btn-primary dropdown-toggle">
                                    Primary <IconCaretDown className="inline-block ml-1" />
                                </button>
                            }>
                                <ul className="!py-0 text-dark dark:text-white-dark dark:text-white-light/90">
                                    <li><button type="button">Görüntüle</button></li>
                                    <li><button type="button">Düzenle</button></li>
                                    <li><button type="button">Sil</button></li>
                                </ul>
                            </Dropdown>
                        </div>

                        <div className="dropdown">
                            <Dropdown placement={isRtl ? 'bottom-start' : 'bottom-end'} button={
                                <button type="button" className="btn btn-success dropdown-toggle">
                                    Başarılı <IconCaretDown className="inline-block ml-1" />
                                </button>
                            }>
                                <ul className="!py-0 text-dark dark:text-white-dark">
                                    <li><button type="button">Seçenek 1</button></li>
                                    <li><button type="button">Seçenek 2</button></li>
                                    <li><button type="button">Seçenek 3</button></li>
                                </ul>
                            </Dropdown>
                        </div>

                        <div className="dropdown">
                            <Dropdown placement={isRtl ? 'bottom-start' : 'bottom-end'} button={
                                <button type="button" className="btn btn-danger dropdown-toggle">
                                    Danger <IconCaretDown className="inline-block ml-1" />
                                </button>
                            }>
                                <ul className="!py-0 text-dark dark:text-white-dark">
                                    <li><button type="button">Seçenek 1</button></li>
                                    <li><button type="button">Seçenek 2</button></li>
                                </ul>
                            </Dropdown>
                        </div>

                        <div className="dropdown">
                            <Dropdown placement={isRtl ? 'bottom-start' : 'bottom-end'} button={
                                <button type="button" className="btn btn-outline-primary dropdown-toggle">
                                    Outline <IconCaretDown className="inline-block ml-1" />
                                </button>
                            }>
                                <ul className="!py-0 text-dark dark:text-white-dark">
                                    <li><button type="button">Seçenek 1</button></li>
                                    <li><button type="button">Seçenek 2</button></li>
                                </ul>
                            </Dropdown>
                        </div>
                    </div>
                </div>

                {/* Dropdown with Icons */}
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">İkonlu Menü</div>
                    <div className="flex flex-wrap gap-4">
                        <div className="dropdown">
                            <Dropdown placement={isRtl ? 'bottom-start' : 'bottom-end'} button={
                                <button type="button" className="btn btn-primary">
                                    İşlemler <IconCaretDown className="inline-block ml-1" />
                                </button>
                            }>
                                <ul className="w-48 !py-0 text-dark dark:text-white-dark dark:text-white-light/90">
                                    <li>
                                        <button type="button" className="flex items-center gap-2">
                                            <Eye className="h-4 w-4" /> Görüntüle
                                        </button>
                                    </li>
                                    <li>
                                        <button type="button" className="flex items-center gap-2">
                                            <Edit className="h-4 w-4" /> Düzenle
                                        </button>
                                    </li>
                                    <li>
                                        <button type="button" className="flex items-center gap-2">
                                            <Download className="h-4 w-4" /> İndir
                                        </button>
                                    </li>
                                    <li className="border-t border-[#eee] dark:border-white/10">
                                        <button type="button" className="flex items-center gap-2 text-danger">
                                            <Trash2 className="h-4 w-4" /> Sil
                                        </button>
                                    </li>
                                </ul>
                            </Dropdown>
                        </div>

                        <div className="dropdown">
                            <Dropdown placement={isRtl ? 'bottom-start' : 'bottom-end'} button={
                                <button type="button" className="btn btn-secondary">
                                    <Settings className="h-4 w-4" />
                                </button>
                            }>
                                <ul className="w-44 !py-0 text-dark dark:text-white-dark">
                                    <li><button type="button">Profil Ayarları</button></li>
                                    <li><button type="button">Bildirimler</button></li>
                                    <li><button type="button">Güvenlik</button></li>
                                    <li className="border-t border-[#eee] dark:border-white/10">
                                        <button type="button" className="text-danger">Çıkış Yap</button>
                                    </li>
                                </ul>
                            </Dropdown>
                        </div>
                    </div>
                </div>

                {/* Dropdown Positions */}
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">Konumlar</div>
                    <div className="flex flex-wrap items-center gap-4">
                        {(['bottom-end', 'bottom-start', 'top-end', 'top-start'] as const).map(pos => (
                            <div key={pos} className="dropdown">
                                <Dropdown placement={pos} button={
                                    <button type="button" className="btn btn-info">
                                        {pos} <IconCaretDown className="inline-block ml-1" />
                                    </button>
                                }>
                                    <ul className="!py-0 text-dark dark:text-white-dark">
                                        <li><button type="button">Seçenek 1</button></li>
                                        <li><button type="button">Seçenek 2</button></li>
                                        <li><button type="button">Seçenek 3</button></li>
                                    </ul>
                                </Dropdown>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
