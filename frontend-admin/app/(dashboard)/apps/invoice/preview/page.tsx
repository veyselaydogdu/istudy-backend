'use client';
import Link from 'next/link';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconPrinter from '@/components/icon/icon-printer';
import IconDownload from '@/components/icon/icon-download';
import IconSend from '@/components/icon/icon-send';
import IconEdit from '@/components/icon/icon-edit';
import { LayoutDashboard } from 'lucide-react';

const items = [
    { id: 1, description: 'Aylık Abonelik - Başlangıç Paketi', qty: 1, unitPrice: 1990, amount: 1990 },
    { id: 2, description: 'Ek Şube Modülü', qty: 2, unitPrice: 500, amount: 1000 },
    { id: 3, description: 'Sağlık & Beslenme Modülü', qty: 1, unitPrice: 300, amount: 300 },
    { id: 4, description: 'Teknik Destek (Kurulum)', qty: 3, unitPrice: 250, amount: 750 },
];

const subtotal = items.reduce((s, i) => s + i.amount, 0);
const tax = Math.round(subtotal * 0.20);
const total = subtotal + tax;

export default function InvoicePreviewPage() {
    const handlePrint = () => window.print();

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li><Link href="/" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <Link href="/apps/invoice/list" className="text-primary hover:underline">Fatura Listesi</Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Fatura Önizleme</span></li>
            </ul>

            {/* Action Buttons */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <button type="button" className="btn btn-primary gap-2">
                        <IconSend className="h-4 w-4" /> Fatura Gönder
                    </button>
                    <button type="button" className="btn btn-secondary gap-2" onClick={handlePrint}>
                        <IconPrinter className="h-4 w-4" /> Yazdır
                    </button>
                    <button type="button" className="btn btn-success gap-2">
                        <IconDownload className="h-4 w-4" /> PDF İndir
                    </button>
                </div>
                <div className="flex gap-3">
                    <Link href="/apps/invoice/list" className="btn btn-outline-dark gap-2">
                        <IconArrowLeft className="h-4 w-4" /> Geri
                    </Link>
                    <button type="button" className="btn btn-info gap-2">
                        <IconEdit className="h-4 w-4" /> Düzenle
                    </button>
                </div>
            </div>

            {/* Invoice */}
            <div className="panel mt-5">
                {/* Header */}
                <div className="flex flex-wrap justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white">
                                <LayoutDashboard className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="text-2xl font-extrabold tracking-wide dark:text-white">iStudy Admin</span>
                                <p className="text-sm text-white-dark">Anaokulu Yönetim Sistemi</p>
                            </div>
                        </div>
                        <div className="mt-4 space-y-1 text-sm text-white-dark">
                            <p>Bağcılar Mah. Teknoloji Cad. No:42</p>
                            <p>İstanbul, 34200</p>
                            <p>Tel: +90 212 000 0000</p>
                            <p>info@istudy.com</p>
                        </div>
                    </div>

                    <div className="text-right">
                        <h3 className="text-3xl font-bold uppercase text-primary">Fatura</h3>
                        <div className="mt-3 space-y-2 text-sm">
                            <div className="flex justify-end gap-8">
                                <span className="font-semibold text-white-dark">Fatura No:</span>
                                <span className="font-bold dark:text-white">#INV-2026-001</span>
                            </div>
                            <div className="flex justify-end gap-8">
                                <span className="font-semibold text-white-dark">Düzenleme Tarihi:</span>
                                <span className="dark:text-white">22 Şub 2026</span>
                            </div>
                            <div className="flex justify-end gap-8">
                                <span className="font-semibold text-white-dark">Son Ödeme:</span>
                                <span className="text-danger font-semibold">22 Mar 2026</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Billing Info */}
                <div className="my-8 grid grid-cols-1 gap-6 rounded-lg bg-white-light/40 p-6 dark:bg-[#1b2e4b] sm:grid-cols-2">
                    <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">Fatura Edilen</p>
                        <p className="font-bold dark:text-white">Güneş Anaokulu</p>
                        <p className="text-sm text-white-dark">Kemal Bey Mah. Gül Sok. No:5</p>
                        <p className="text-sm text-white-dark">Kadıköy, İstanbul 34710</p>
                        <p className="text-sm text-white-dark">info@gunes.com</p>
                    </div>
                    <div className="sm:text-right">
                        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">Ödeme Bilgileri</p>
                        <p className="text-sm text-white-dark">Banka: Ziraat Bankası</p>
                        <p className="text-sm text-white-dark">IBAN: TR00 0000 0000 0000 0000 0000 00</p>
                        <p className="text-sm text-white-dark">Hesap Sahibi: iStudy Teknoloji A.Ş.</p>
                    </div>
                </div>

                {/* Table */}
                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th className="ltr:rounded-l-md rtl:rounded-r-md">S.No</th>
                                <th>Açıklama</th>
                                <th className="text-center">Adet</th>
                                <th className="ltr:text-right rtl:text-left">Birim Fiyat</th>
                                <th className="ltr:rounded-r-md rtl:rounded-l-md ltr:text-right rtl:text-left">Tutar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item.id}>
                                    <td>{item.id}</td>
                                    <td>{item.description}</td>
                                    <td className="text-center">{item.qty}</td>
                                    <td className="ltr:text-right rtl:text-left">₺{item.unitPrice.toLocaleString('tr-TR')}</td>
                                    <td className="ltr:text-right rtl:text-left font-semibold">₺{item.amount.toLocaleString('tr-TR')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="mt-6 flex flex-col items-end">
                    <div className="w-full max-w-xs space-y-2 text-sm">
                        <div className="flex justify-between border-b border-[#eee] pb-2 dark:border-[#1b2e4b]">
                            <span className="text-white-dark">Ara Toplam</span>
                            <span className="font-semibold dark:text-white">₺{subtotal.toLocaleString('tr-TR')}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#eee] pb-2 dark:border-[#1b2e4b]">
                            <span className="text-white-dark">KDV (%20)</span>
                            <span className="font-semibold dark:text-white">₺{tax.toLocaleString('tr-TR')}</span>
                        </div>
                        <div className="flex justify-between rounded-md bg-primary px-4 py-3 text-base text-white">
                            <span className="font-bold">Genel Toplam</span>
                            <span className="font-extrabold">₺{total.toLocaleString('tr-TR')}</span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="mt-8 border-t border-[#eee] pt-6 dark:border-[#1b2e4b]">
                    <p className="text-sm font-semibold dark:text-white">Notlar:</p>
                    <p className="mt-1 text-sm text-white-dark">
                        Son ödeme tarihine kadar ödeme yapılmaması halinde gecikme faizi uygulanacaktır.
                        Teşekkürler, iyi çalışmalar dileriz.
                    </p>
                </div>
            </div>
        </div>
    );
}
