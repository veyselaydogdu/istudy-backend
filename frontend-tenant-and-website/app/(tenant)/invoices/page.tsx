'use client';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import { Invoice } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/invoices/tenant', { params: { page } });
            if (res.data?.data) {
                setInvoices(res.data.data);
                setLastPage(res.data.meta?.last_page ?? 1);
            }
        } catch {
            toast.error('Faturalar yüklenemedi.');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

    const getStatusLabel = (status: string) => {
        const map: Record<string, string> = { draft: 'Taslak', pending: 'Bekliyor', paid: 'Ödendi', cancelled: 'İptal', overdue: 'Gecikmiş' };
        return map[status] ?? status;
    };
    const getStatusClass = (status: string) => {
        const map: Record<string, string> = { paid: 'badge-outline-success', pending: 'badge-outline-warning', overdue: 'badge-outline-danger', cancelled: 'badge-outline-secondary', draft: 'badge-outline-info' };
        return map[status] ?? 'badge-outline-secondary';
    };

    return (
        <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold text-dark dark:text-white">Faturalar</h1>

            <div className="panel">
                {loading ? (
                    <div className="flex h-32 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="py-12 text-center text-[#515365] dark:text-[#888ea8]">
                        Henüz fatura bulunmuyor.
                    </div>
                ) : (
                    <>
                        <div className="table-responsive">
                            <table className="table-hover">
                                <thead>
                                    <tr>
                                        <th>Fatura No</th>
                                        <th>Tarih</th>
                                        <th>Tutar</th>
                                        <th>Para Birimi</th>
                                        <th>Durum</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map((invoice) => (
                                        <tr key={invoice.id}>
                                            <td className="font-mono text-sm font-medium text-dark dark:text-white">
                                                {invoice.invoice_number ?? `#${invoice.id}`}
                                            </td>
                                            <td>{new Date(invoice.created_at).toLocaleDateString('tr-TR')}</td>
                                            <td className="font-semibold">
                                                {invoice.total_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td>{invoice.currency}</td>
                                            <td>
                                                <span className={`badge ${getStatusClass(invoice.status)}`}>
                                                    {getStatusLabel(invoice.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {lastPage > 1 && (
                            <div className="mt-4 flex items-center justify-center gap-2">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="text-sm text-[#515365] dark:text-[#888ea8]">{page} / {lastPage}</span>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary"
                                    disabled={page === lastPage}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
