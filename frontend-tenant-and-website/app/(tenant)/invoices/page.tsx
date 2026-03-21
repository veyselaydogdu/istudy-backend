'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import { Invoice, InvoiceStats } from '@/types';
import {
    ChevronLeft, ChevronRight, FileText, TrendingUp, Clock, AlertCircle,
    Search, Filter, X, Eye, Calendar, Building2, User,
} from 'lucide-react';

type ModuleTab = 'all' | 'activity_class' | 'subscription' | 'manual';
type StatusFilter = '' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'draft' | 'refunded';

const MODULE_LABELS: Record<string, string> = {
    subscription: 'Abonelik', activity_class: 'Etkinlik Sınıfı', manual: 'Manuel',
    event: 'Etkinlik', activity: 'Aktivite',
};
const STATUS_LABELS: Record<string, string> = {
    draft: 'Taslak', pending: 'Bekliyor', paid: 'Ödendi',
    cancelled: 'İptal', overdue: 'Gecikmiş', refunded: 'İade',
};
const STATUS_BADGE: Record<string, string> = {
    paid: 'badge-outline-success', pending: 'badge-outline-warning',
    overdue: 'badge-outline-danger', cancelled: 'badge-outline-secondary',
    draft: 'badge-outline-info', refunded: 'badge-outline-warning',
};
const MODULE_BADGE: Record<string, string> = {
    subscription: 'badge-outline-primary', activity_class: 'badge-outline-info',
    manual: 'badge-outline-secondary', event: 'badge-outline-warning', activity: 'badge-outline-success',
};

export default function InvoicesPage() {
    const router = useRouter();

    // Stats
    const [stats, setStats] = useState<InvoiceStats | null>(null);

    // Listing
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);

    // Filters
    const [moduleTab, setModuleTab] = useState<ModuleTab>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const searchTimer = useRef<NodeJS.Timeout | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            const res = await apiClient.get('/invoices/stats');
            setStats(res.data?.data ?? null);
        } catch { /* silent */ }
    }, []);

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page, per_page: 20 };
            if (moduleTab !== 'all') params.module = moduleTab;
            if (statusFilter) params.status = statusFilter;
            if (search) params.search = search;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;

            const res = await apiClient.get('/invoices/tenant', { params });
            setInvoices(res.data?.data ?? []);
            setLastPage(res.data?.meta?.last_page ?? 1);
            setTotal(res.data?.meta?.total ?? 0);
        } catch {
            toast.error('Faturalar yüklenemedi.');
        } finally {
            setLoading(false);
        }
    }, [page, moduleTab, statusFilter, search, dateFrom, dateTo]);

    useEffect(() => { fetchStats(); }, [fetchStats]);
    useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

    // Reset page when filters change
    useEffect(() => { setPage(1); }, [moduleTab, statusFilter, search, dateFrom, dateTo]);

    const handleSearchChange = (val: string) => {
        setSearchInput(val);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => setSearch(val), 400);
    };

    const clearFilters = () => {
        setStatusFilter('');
        setDateFrom('');
        setDateTo('');
        setSearchInput('');
        setSearch('');
    };

    const hasActiveFilters = statusFilter !== '' || dateFrom !== '' || dateTo !== '' || search !== '';

    const formatCurrency = (amount: number, currency = 'TRY') =>
        amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + currency;

    const getClientName = (inv: Invoice) => {
        if (inv.activity_class_invoice?.child?.full_name) return inv.activity_class_invoice.child.full_name;
        if (inv.user?.name) return inv.user.name;
        return '—';
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#3b3f5c] dark:text-white">Faturalar</h1>
                    <p className="mt-1 text-sm text-[#888ea8]">Tüm ödeme ve fatura kayıtları</p>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="panel flex items-center gap-4 !p-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success/10">
                            <TrendingUp className="h-6 w-6 text-success" />
                        </div>
                        <div>
                            <p className="text-xs text-[#888ea8]">Toplam Gelir</p>
                            <p className="text-lg font-bold text-[#3b3f5c] dark:text-white">
                                {formatCurrency(stats.total_revenue)}
                            </p>
                        </div>
                    </div>
                    <div className="panel flex items-center gap-4 !p-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning/10">
                            <Clock className="h-6 w-6 text-warning" />
                        </div>
                        <div>
                            <p className="text-xs text-[#888ea8]">Bekleyen</p>
                            <p className="text-lg font-bold text-[#3b3f5c] dark:text-white">
                                {formatCurrency(stats.pending_revenue)}
                            </p>
                            <p className="text-xs text-[#888ea8]">{stats.pending_count} fatura</p>
                        </div>
                    </div>
                    <div className="panel flex items-center gap-4 !p-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-[#888ea8]">Bu Ay</p>
                            <p className="text-lg font-bold text-[#3b3f5c] dark:text-white">
                                {formatCurrency(stats.this_month_revenue)}
                            </p>
                            <p className="text-xs text-[#888ea8]">{stats.this_month_invoices} fatura</p>
                        </div>
                    </div>
                    <div className="panel flex items-center gap-4 !p-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-danger/10">
                            <AlertCircle className="h-6 w-6 text-danger" />
                        </div>
                        <div>
                            <p className="text-xs text-[#888ea8]">Gecikmiş</p>
                            <p className="text-lg font-bold text-[#3b3f5c] dark:text-white">{stats.overdue_count}</p>
                            <p className="text-xs text-[#888ea8]">fatura</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Module breakdown mini bar */}
            {stats && (
                <div className="panel !p-4">
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="font-medium text-[#3b3f5c] dark:text-white">Modüle Göre:</span>
                        <span className="text-[#888ea8]">
                            Abonelik: <strong className="text-[#3b3f5c] dark:text-white">{stats.by_module.subscription}</strong>
                        </span>
                        <span className="text-[#888ea8]">
                            Etkinlik Sınıfı: <strong className="text-[#3b3f5c] dark:text-white">{stats.by_module.activity_class}</strong>
                        </span>
                        <span className="text-[#888ea8]">
                            Manuel: <strong className="text-[#3b3f5c] dark:text-white">{stats.by_module.manual}</strong>
                        </span>
                        <span className="ml-auto text-[#888ea8]">
                            Toplam: <strong className="text-[#3b3f5c] dark:text-white">{stats.total_invoices}</strong> fatura
                        </span>
                    </div>
                </div>
            )}

            <div className="panel">
                {/* Module Tabs */}
                <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-[#e0e6ed] pb-4 dark:border-[#1b2e4b]">
                    {([
                        { key: 'all', label: 'Tümü' },
                        { key: 'activity_class', label: 'Etkinlik Sınıfı' },
                        { key: 'subscription', label: 'Abonelik' },
                        { key: 'manual', label: 'Manuel' },
                    ] as { key: ModuleTab; label: string }[]).map(tab => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setModuleTab(tab.key)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                moduleTab === tab.key
                                    ? 'bg-primary text-white'
                                    : 'text-[#515365] hover:bg-[#f1f2f3] dark:text-[#888ea8] dark:hover:bg-[#1b2e4b]'
                            }`}
                        >
                            {tab.label}
                            {tab.key !== 'all' && stats?.by_module[tab.key as keyof typeof stats.by_module] !== undefined && (
                                <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                                    {stats.by_module[tab.key as keyof typeof stats.by_module]}
                                </span>
                            )}
                        </button>
                    ))}

                    <div className="ml-auto flex items-center gap-2">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888ea8]" />
                            <input
                                type="text"
                                placeholder="Fatura no, isim ara..."
                                value={searchInput}
                                onChange={e => handleSearchChange(e.target.value)}
                                className="form-input !py-2 !pl-9 !pr-4 text-sm"
                            />
                        </div>

                        {/* Filter toggle */}
                        <button
                            type="button"
                            onClick={() => setShowFilters(v => !v)}
                            className={`btn btn-sm flex items-center gap-1.5 ${hasActiveFilters ? 'btn-warning' : 'btn-outline-secondary'}`}
                        >
                            <Filter className="h-3.5 w-3.5" />
                            Filtre
                            {hasActiveFilters && <span className="ml-1 h-2 w-2 rounded-full bg-white" />}
                        </button>
                    </div>
                </div>

                {/* Extended Filters */}
                {showFilters && (
                    <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg bg-[#f8f9fa] p-4 dark:bg-[#1b2e4b]">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-[#515365] dark:text-[#888ea8]">Durum</label>
                            <select
                                className="form-select text-sm"
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                            >
                                <option value="">Tüm Durumlar</option>
                                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-[#515365] dark:text-[#888ea8]">Başlangıç Tarihi</label>
                            <input type="date" className="form-input text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-[#515365] dark:text-[#888ea8]">Bitiş Tarihi</label>
                            <input type="date" className="form-input text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                        </div>
                        {hasActiveFilters && (
                            <button type="button" onClick={clearFilters} className="btn btn-sm btn-outline-danger flex items-center gap-1">
                                <X className="h-3.5 w-3.5" /> Temizle
                            </button>
                        )}
                    </div>
                )}

                {/* Table */}
                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-[#888ea8]">
                        <FileText className="mb-3 h-12 w-12 opacity-30" />
                        <p className="text-sm">Fatura bulunamadı.</p>
                        {hasActiveFilters && (
                            <button type="button" onClick={clearFilters} className="mt-2 text-sm text-primary underline">
                                Filtreleri temizle
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="table-responsive">
                            <table className="table-hover">
                                <thead>
                                    <tr>
                                        <th>Fatura No</th>
                                        <th>Modül</th>
                                        <th>Müşteri / Öğrenci</th>
                                        <th>Okul</th>
                                        <th>Tutar</th>
                                        <th>Durum</th>
                                        <th>Tarih</th>
                                        <th>Vade</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map(inv => (
                                        <tr
                                            key={inv.id}
                                            className={`cursor-pointer transition-colors hover:bg-[#f1f2f3] dark:hover:bg-[#1b2e4b] ${inv.invoice_type === 'refund' ? 'bg-red-50/50 dark:bg-red-900/5' : ''} ${(inv.is_overdue || inv.status === 'overdue') ? 'bg-orange-50/50 dark:bg-orange-900/5' : ''}`}
                                            onClick={() => router.push(`/invoices/${inv.id}`)}
                                        >
                                            <td>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-mono text-sm font-medium text-[#3b3f5c] dark:text-white">
                                                        {inv.invoice_no ?? `#${inv.id}`}
                                                    </span>
                                                    {inv.invoice_type === 'refund' && (
                                                        <span className="text-xs text-danger">İade Faturası</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${MODULE_BADGE[inv.module] ?? 'badge-outline-secondary'}`}>
                                                    {MODULE_LABELS[inv.module] ?? inv.module}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-1.5">
                                                    <User className="h-3.5 w-3.5 shrink-0 text-[#888ea8]" />
                                                    <span className="text-sm">{getClientName(inv)}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {inv.school ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <Building2 className="h-3.5 w-3.5 shrink-0 text-[#888ea8]" />
                                                        <span className="text-sm">{inv.school.name}</span>
                                                    </div>
                                                ) : <span className="text-[#888ea8]">—</span>}
                                            </td>
                                            <td>
                                                <span className="font-semibold text-[#3b3f5c] dark:text-white">
                                                    {formatCurrency(inv.total_amount, inv.currency)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${STATUS_BADGE[inv.is_overdue ? 'overdue' : inv.status] ?? 'badge-outline-secondary'}`}>
                                                    {STATUS_LABELS[inv.is_overdue ? 'overdue' : inv.status] ?? inv.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-1 text-sm text-[#515365] dark:text-[#888ea8]">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {inv.issue_date ? new Date(inv.issue_date).toLocaleDateString('tr-TR') : new Date(inv.created_at).toLocaleDateString('tr-TR')}
                                                </div>
                                            </td>
                                            <td>
                                                {inv.due_date ? (
                                                    <span className={`text-sm ${inv.is_overdue ? 'font-medium text-danger' : 'text-[#515365] dark:text-[#888ea8]'}`}>
                                                        {new Date(inv.due_date).toLocaleDateString('tr-TR')}
                                                    </span>
                                                ) : <span className="text-[#888ea8]">—</span>}
                                            </td>
                                            <td onClick={e => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    onClick={() => router.push(`/invoices/${inv.id}`)}
                                                    className="btn btn-sm btn-outline-primary p-1.5"
                                                    title="Detayı Gör"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="mt-4 flex items-center justify-between text-sm text-[#888ea8]">
                            <span>Toplam {total} fatura</span>
                            {lastPage > 1 && (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary p-1.5"
                                        disabled={page === 1}
                                        onClick={() => setPage(p => p - 1)}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <span className="min-w-[80px] text-center">{page} / {lastPage}</span>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary p-1.5"
                                        disabled={page === lastPage}
                                        onClick={() => setPage(p => p + 1)}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
