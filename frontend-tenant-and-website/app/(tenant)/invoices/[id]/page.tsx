'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import apiClient from '@/lib/apiClient';
import { Invoice, Transaction } from '@/types';
import {
    ArrowLeft, FileText, CheckCircle, Clock, XCircle, AlertCircle,
    User, Building2, Calendar, CreditCard, RefreshCcw, Tag, Hash,
} from 'lucide-react';

const MODULE_LABELS: Record<string, string> = {
    subscription: 'Abonelik', activity_class: 'Etkinlik Sınıfı',
    manual: 'Manuel', event: 'Etkinlik', activity: 'Aktivite',
};
const STATUS_LABELS: Record<string, string> = {
    draft: 'Taslak', pending: 'Bekliyor', paid: 'Ödendi',
    cancelled: 'İptal', overdue: 'Gecikmiş', refunded: 'İade Edildi',
};
const STATUS_BADGE: Record<string, string> = {
    paid: 'badge-outline-success', pending: 'badge-outline-warning',
    overdue: 'badge-outline-danger', cancelled: 'badge-outline-secondary',
    draft: 'badge-outline-info', refunded: 'badge-outline-warning',
};
const TX_STATUS: Record<number, { label: string; cls: string }> = {
    0: { label: 'Bekliyor', cls: 'badge-outline-warning' },
    1: { label: 'Başarılı', cls: 'badge-outline-success' },
    2: { label: 'Başarısız', cls: 'badge-outline-danger' },
};

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [txLoading, setTxLoading] = useState(false);

    const loadInvoice = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/invoices/${id}`);
            setInvoice(res.data?.data ?? null);
        } catch {
            toast.error('Fatura bulunamadı.');
            router.push('/invoices');
        } finally {
            setLoading(false);
        }
    };

    const loadTransactions = async () => {
        setTxLoading(true);
        try {
            const res = await apiClient.get(`/invoices/${id}/transactions`);
            setTransactions(res.data?.data ?? []);
        } catch { /* silent */ } finally {
            setTxLoading(false);
        }
    };

    useEffect(() => {
        loadInvoice();
        loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const formatCurrency = (amount: number, currency = 'TRY') =>
        amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + currency;

    const getStatusIcon = (status: string) => {
        if (status === 'paid') return <CheckCircle className="h-5 w-5 text-success" />;
        if (status === 'pending') return <Clock className="h-5 w-5 text-warning" />;
        if (status === 'overdue') return <AlertCircle className="h-5 w-5 text-danger" />;
        if (status === 'cancelled' || status === 'refunded') return <XCircle className="h-5 w-5 text-[#888ea8]" />;
        return <FileText className="h-5 w-5 text-[#888ea8]" />;
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
            </div>
        );
    }

    if (!invoice) return null;

    const effectiveStatus = invoice.is_overdue ? 'overdue' : invoice.status;
    const clientName = invoice.activity_class_invoice?.child?.full_name ?? invoice.user?.name ?? '—';

    return (
        <div className="space-y-6 p-6">
            {/* Back */}
            <div className="flex items-center gap-3">
                <button type="button" onClick={() => router.push('/invoices')} className="btn btn-sm btn-outline-secondary p-2">
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-[#3b3f5c] dark:text-white">
                        Fatura Detayı
                    </h1>
                    <p className="text-sm text-[#888ea8]">{invoice.invoice_no ?? `#${invoice.id}`}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left — Main info */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Invoice header card */}
                    <div className="panel">
                        <div className="mb-6 flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                    <FileText className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="font-mono text-lg font-bold text-[#3b3f5c] dark:text-white">
                                        {invoice.invoice_no ?? `#${invoice.id}`}
                                    </p>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className={`badge ${STATUS_BADGE[effectiveStatus] ?? 'badge-outline-secondary'}`}>
                                            {getStatusIcon(effectiveStatus)}
                                            <span className="ml-1">{STATUS_LABELS[effectiveStatus] ?? effectiveStatus}</span>
                                        </span>
                                        <span className="badge badge-outline-info">
                                            {MODULE_LABELS[invoice.module] ?? invoice.module}
                                        </span>
                                        {invoice.invoice_type === 'refund' && (
                                            <span className="badge badge-outline-danger">
                                                <RefreshCcw className="mr-1 h-3 w-3" /> İade Faturası
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Total amount */}
                            <div className="text-right">
                                <p className="text-sm text-[#888ea8]">Toplam Tutar</p>
                                <p className="text-2xl font-bold text-[#3b3f5c] dark:text-white">
                                    {formatCurrency(invoice.total_amount, invoice.currency)}
                                </p>
                            </div>
                        </div>

                        {/* Date info */}
                        <div className="grid grid-cols-2 gap-4 border-t border-[#e0e6ed] pt-4 dark:border-[#1b2e4b] sm:grid-cols-3">
                            <div>
                                <p className="flex items-center gap-1 text-xs text-[#888ea8]">
                                    <Calendar className="h-3.5 w-3.5" /> Düzenleme Tarihi
                                </p>
                                <p className="mt-0.5 text-sm font-medium text-[#3b3f5c] dark:text-white">
                                    {invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString('tr-TR') : new Date(invoice.created_at).toLocaleDateString('tr-TR')}
                                </p>
                            </div>
                            {invoice.due_date && (
                                <div>
                                    <p className="flex items-center gap-1 text-xs text-[#888ea8]">
                                        <Clock className="h-3.5 w-3.5" /> Son Ödeme
                                    </p>
                                    <p className={`mt-0.5 text-sm font-medium ${invoice.is_overdue ? 'text-danger' : 'text-[#3b3f5c] dark:text-white'}`}>
                                        {new Date(invoice.due_date).toLocaleDateString('tr-TR')}
                                    </p>
                                </div>
                            )}
                            {invoice.paid_at && (
                                <div>
                                    <p className="flex items-center gap-1 text-xs text-[#888ea8]">
                                        <CheckCircle className="h-3.5 w-3.5" /> Ödeme Tarihi
                                    </p>
                                    <p className="mt-0.5 text-sm font-medium text-success">
                                        {new Date(invoice.paid_at).toLocaleDateString('tr-TR')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Items */}
                    {invoice.items && invoice.items.length > 0 && (
                        <div className="panel">
                            <h3 className="mb-4 flex items-center gap-2 font-semibold text-[#3b3f5c] dark:text-white">
                                <Tag className="h-4 w-4" /> Fatura Kalemleri
                            </h3>
                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th>Açıklama</th>
                                            <th className="text-right">Adet</th>
                                            <th className="text-right">Birim Fiyat</th>
                                            <th className="text-right">Toplam</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoice.items.map(item => (
                                            <tr key={item.id}>
                                                <td>
                                                    <div>
                                                        <span className="font-medium">{item.description}</span>
                                                        {item.item_type && (
                                                            <span className="ml-2 text-xs text-[#888ea8]">({item.item_type})</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="text-right">{item.quantity}</td>
                                                <td className="text-right">{formatCurrency(item.unit_price, invoice.currency)}</td>
                                                <td className="text-right font-semibold">{formatCurrency(item.total_price, invoice.currency)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals summary */}
                            <div className="mt-4 flex justify-end">
                                <div className="w-64 space-y-1.5 text-sm">
                                    <div className="flex justify-between text-[#515365] dark:text-[#888ea8]">
                                        <span>Ara Toplam</span>
                                        <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                                    </div>
                                    {invoice.tax_rate > 0 && (
                                        <div className="flex justify-between text-[#515365] dark:text-[#888ea8]">
                                            <span>KDV ({invoice.tax_rate}%)</span>
                                            <span>{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
                                        </div>
                                    )}
                                    {invoice.discount_amount > 0 && (
                                        <div className="flex justify-between text-success">
                                            <span>İndirim</span>
                                            <span>-{formatCurrency(invoice.discount_amount, invoice.currency)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between border-t border-[#e0e6ed] pt-1.5 font-bold text-[#3b3f5c] dark:border-[#1b2e4b] dark:text-white">
                                        <span>Genel Toplam</span>
                                        <span>{formatCurrency(invoice.total_amount, invoice.currency)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Transaction History */}
                    <div className="panel">
                        <h3 className="mb-4 flex items-center gap-2 font-semibold text-[#3b3f5c] dark:text-white">
                            <CreditCard className="h-4 w-4" /> Ödeme Geçmişi
                        </h3>
                        {txLoading ? (
                            <div className="flex h-20 items-center justify-center">
                                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary" />
                            </div>
                        ) : transactions.length === 0 ? (
                            <p className="py-6 text-center text-sm text-[#888ea8]">Ödeme işlemi bulunamadı.</p>
                        ) : (
                            <div className="space-y-3">
                                {transactions.map(tx => (
                                    <div key={tx.id} className="flex items-center justify-between rounded-lg border border-[#e0e6ed] p-3 dark:border-[#1b2e4b]">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-9 w-9 items-center justify-center rounded-full ${tx.status === 1 ? 'bg-success/10' : tx.status === 2 ? 'bg-danger/10' : 'bg-warning/10'}`}>
                                                {tx.status === 1 ? <CheckCircle className="h-4 w-4 text-success" /> : tx.status === 2 ? <XCircle className="h-4 w-4 text-danger" /> : <Clock className="h-4 w-4 text-warning" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`badge text-xs ${TX_STATUS[tx.status]?.cls ?? ''}`}>{TX_STATUS[tx.status]?.label}</span>
                                                    {tx.payment_gateway && <span className="text-xs text-[#888ea8] uppercase">{tx.payment_gateway}</span>}
                                                </div>
                                                <p className="mt-0.5 font-mono text-xs text-[#888ea8]">{tx.order_id}</p>
                                                {tx.bank_name && <p className="text-xs text-[#515365] dark:text-[#888ea8]">{tx.bank_name} {tx.card_last_four ? `•••• ${tx.card_last_four}` : ''}</p>}
                                                {tx.error_message && <p className="text-xs text-danger">{tx.error_message}</p>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-[#3b3f5c] dark:text-white">{formatCurrency(tx.amount, tx.currency)}</p>
                                            <p className="text-xs text-[#888ea8]">{new Date(tx.created_at).toLocaleDateString('tr-TR')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right — Sidebar */}
                <div className="space-y-6">
                    {/* Client info */}
                    <div className="panel">
                        <h3 className="mb-4 flex items-center gap-2 font-semibold text-[#3b3f5c] dark:text-white">
                            <User className="h-4 w-4" /> Müşteri Bilgisi
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 shrink-0 text-[#888ea8]" />
                                <span className="font-medium">{clientName}</span>
                            </div>
                            {invoice.user?.email && (
                                <div className="flex items-center gap-2 text-[#515365] dark:text-[#888ea8]">
                                    <Hash className="h-4 w-4 shrink-0" />
                                    <span className="break-all">{invoice.user.email}</span>
                                </div>
                            )}
                            {invoice.school && (
                                <div className="flex items-center gap-2 text-[#515365] dark:text-[#888ea8]">
                                    <Building2 className="h-4 w-4 shrink-0" />
                                    <span>{invoice.school.name}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    {invoice.notes && (
                        <div className="panel">
                            <h3 className="mb-2 font-semibold text-[#3b3f5c] dark:text-white">Notlar</h3>
                            <p className="text-sm text-[#515365] dark:text-[#888ea8]">{invoice.notes}</p>
                        </div>
                    )}

                    {/* Refund info */}
                    {invoice.invoice_type === 'refund' && invoice.refund_reason && (
                        <div className="panel border-l-4 border-danger">
                            <h3 className="mb-2 flex items-center gap-2 font-semibold text-danger">
                                <RefreshCcw className="h-4 w-4" /> İade Nedeni
                            </h3>
                            <p className="text-sm text-[#515365] dark:text-[#888ea8]">{invoice.refund_reason}</p>
                            {invoice.original_invoice_id && (
                                <button
                                    type="button"
                                    onClick={() => router.push(`/invoices/${invoice.original_invoice_id}`)}
                                    className="mt-3 text-sm text-primary underline"
                                >
                                    Orijinal Faturayı Gör →
                                </button>
                            )}
                        </div>
                    )}

                    {/* Activity class detail */}
                    {invoice.activity_class_invoice && (
                        <div className="panel">
                            <h3 className="mb-3 font-semibold text-[#3b3f5c] dark:text-white">Etkinlik Detayı</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-[#888ea8]">Fatura No</span>
                                    <span className="font-mono font-medium">{invoice.activity_class_invoice.invoice_number}</span>
                                </div>
                                {invoice.activity_class_invoice.child && (
                                    <div className="flex justify-between">
                                        <span className="text-[#888ea8]">Öğrenci</span>
                                        <span className="font-medium">{invoice.activity_class_invoice.child.full_name}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Quick stats */}
                    <div className="panel">
                        <h3 className="mb-3 font-semibold text-[#3b3f5c] dark:text-white">Özet</h3>
                        <div className="space-y-2 text-sm">
                            {[
                                { label: 'Ara Toplam', value: formatCurrency(invoice.subtotal, invoice.currency) },
                                ...(invoice.tax_rate > 0 ? [{ label: `KDV (${invoice.tax_rate}%)`, value: formatCurrency(invoice.tax_amount, invoice.currency) }] : []),
                                ...(invoice.discount_amount > 0 ? [{ label: 'İndirim', value: `-${formatCurrency(invoice.discount_amount, invoice.currency)}` }] : []),
                            ].map(row => (
                                <div key={row.label} className="flex justify-between text-[#515365] dark:text-[#888ea8]">
                                    <span>{row.label}</span><span>{row.value}</span>
                                </div>
                            ))}
                            <div className="flex justify-between border-t border-[#e0e6ed] pt-2 font-bold text-[#3b3f5c] dark:border-[#1b2e4b] dark:text-white">
                                <span>Toplam</span>
                                <span>{formatCurrency(invoice.total_amount, invoice.currency)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
