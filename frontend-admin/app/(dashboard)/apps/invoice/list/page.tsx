'use client';
import Link from 'next/link';
import { useState } from 'react';
import IconPlus from '@/components/icon/icon-plus';
import IconEdit from '@/components/icon/icon-edit';
import IconEye from '@/components/icon/icon-eye';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconDownload from '@/components/icon/icon-download';

const invoices = [
    { id: 'INV-001', tenant: 'Güneş Anaokulu', email: 'info@gunes.com', date: '01 Şub 2026', amount: '4.500,00', status: 'Ödendi', statusColor: 'success' },
    { id: 'INV-002', tenant: 'Yıldız Kreş',     email: 'info@yildiz.com', date: '28 Oca 2026', amount: '3.200,00', status: 'Beklemede', statusColor: 'warning' },
    { id: 'INV-003', tenant: 'Bahar Nursery',    email: 'info@bahar.com',  date: '25 Oca 2026', amount: '6.800,00', status: 'İptal',     statusColor: 'danger' },
    { id: 'INV-004', tenant: 'Minikler Yuvası',  email: 'info@minikler.com', date: '22 Oca 2026', amount: '5.100,00', status: 'Ödendi', statusColor: 'success' },
    { id: 'INV-005', tenant: 'Gökkuşağı A.O.',  email: 'info@gokkusagi.com', date: '18 Oca 2026', amount: '4.200,00', status: 'Ödendi', statusColor: 'success' },
    { id: 'INV-006', tenant: 'Çiçek Kreş',      email: 'info@cicek.com',  date: '15 Oca 2026', amount: '2.900,00', status: 'Beklemede', statusColor: 'warning' },
    { id: 'INV-007', tenant: 'Deniz Anaokulu',   email: 'info@deniz.com',  date: '10 Oca 2026', amount: '7.500,00', status: 'Ödendi', statusColor: 'success' },
    { id: 'INV-008', tenant: 'Pembe Bulut Kreş', email: 'info@pembebulut.com', date: '05 Oca 2026', amount: '3.800,00', status: 'İşlemde', statusColor: 'info' },
];

export default function InvoiceListPage() {
    const [search, setSearch] = useState('');

    const filtered = invoices.filter(inv =>
        inv.id.toLowerCase().includes(search.toLowerCase()) ||
        inv.tenant.toLowerCase().includes(search.toLowerCase()) ||
        inv.status.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li><Link href="/" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Fatura Listesi</span></li>
            </ul>

            <div className="mt-5">
                <div className="panel border-white-light px-0 dark:border-[#1b2e4b]">
                    <div className="invoice-table">
                        <div className="mb-4.5 flex flex-col gap-5 px-5 md:flex-row md:items-center">
                            <div className="flex items-center gap-2">
                                <Link href="/apps/invoice/preview" className="btn btn-primary gap-2">
                                    <IconPlus className="h-4 w-4" />
                                    Yeni Fatura
                                </Link>
                            </div>
                            <div className="ltr:ml-auto rtl:mr-auto">
                                <input
                                    type="text"
                                    className="form-input w-auto"
                                    placeholder="Ara..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table>
                                <thead>
                                    <tr>
                                        <th className="ltr:rounded-l-md rtl:rounded-r-md">Fatura No</th>
                                        <th>Kurum</th>
                                        <th>E-posta</th>
                                        <th>Tarih</th>
                                        <th>Tutar</th>
                                        <th className="text-center">Durum</th>
                                        <th className="ltr:rounded-r-md rtl:rounded-l-md text-center">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(inv => (
                                        <tr key={inv.id}>
                                            <td className="font-semibold">{inv.id}</td>
                                            <td className="whitespace-nowrap">{inv.tenant}</td>
                                            <td className="whitespace-nowrap text-white-dark">{inv.email}</td>
                                            <td className="whitespace-nowrap">{inv.date}</td>
                                            <td className="font-semibold">₺{inv.amount}</td>
                                            <td className="text-center">
                                                <span className={`badge rounded-full bg-${inv.statusColor}/20 text-${inv.statusColor}`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link href="/apps/invoice/preview" className="text-info hover:text-info/80">
                                                        <IconEye className="h-4 w-4" />
                                                    </Link>
                                                    <button type="button" className="text-primary hover:text-primary/80">
                                                        <IconEdit className="h-4 w-4" />
                                                    </button>
                                                    <button type="button" className="text-success hover:text-success/80">
                                                        <IconDownload className="h-4 w-4" />
                                                    </button>
                                                    <button type="button" className="text-danger hover:text-danger/80">
                                                        <IconTrashLines className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && (
                                        <tr><td colSpan={7} className="py-8 text-center text-white-dark">Kayıt bulunamadı.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
