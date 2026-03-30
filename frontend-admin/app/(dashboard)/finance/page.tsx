"use client"

import { useEffect, useState, useCallback } from "react"
import apiClient from "@/lib/apiClient"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    ArrowUpRight, ArrowDownLeft, Loader2, ChevronLeft, ChevronRight, Search, RefreshCw,
    CreditCard, TrendingUp, ReceiptText,
} from "lucide-react"
import { toast } from "sonner"
import type { Invoice, Transaction, TransactionStats } from "@/types"

type Meta = { current_page: number; last_page: number; per_page: number; total: number }

const INVOICE_STATUS_LABELS: Record<string, string> = {
    draft: "Taslak", pending: "Bekliyor", paid: "Ödendi",
    cancelled: "İptal", overdue: "Gecikmiş",
}

const TRANSACTION_STATUS_LABELS: Record<string, string> = {
    pending: "Bekliyor", success: "Başarılı", failed: "Başarısız", refunded: "İade",
}

function getInvoiceBadgeVariant(status: string): "default" | "success" | "warning" | "danger" | "secondary" {
    const map: Record<string, "default" | "success" | "warning" | "danger" | "secondary"> = {
        paid: "success", pending: "warning", overdue: "danger",
        cancelled: "secondary", draft: "secondary",
    }
    return map[status] ?? "secondary"
}

function getTransactionBadgeVariant(status: string): "default" | "success" | "warning" | "danger" | "secondary" {
    const map: Record<string, "default" | "success" | "warning" | "danger" | "secondary"> = {
        success: "success", pending: "warning", failed: "danger", refunded: "secondary",
    }
    return map[status] ?? "secondary"
}

const formatCurrency = (val: number, currency = "TRY") =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency }).format(val)

export default function FinancePage() {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [invoiceMeta, setInvoiceMeta] = useState<Meta | null>(null)
    const [invoicePage, setInvoicePage] = useState(1)

    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [transactionMeta, setTransactionMeta] = useState<Meta | null>(null)
    const [transactionPage, setTransactionPage] = useState(1)

    const [stats, setStats] = useState<TransactionStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [txLoading, setTxLoading] = useState(false)
    const [search, setSearch] = useState("")

    const fetchInvoices = useCallback(async () => {
        setLoading(true)
        try {
            const params: Record<string, string | number> = { page: invoicePage, per_page: 15 }
            if (search) { params.search = search }
            const res = await apiClient.get("/admin/invoices", { params })
            if (res.data?.data) {
                setInvoices(res.data.data)
                setInvoiceMeta(res.data.meta ?? null)
            }
        } catch {
            toast.error("Faturalar yüklenirken hata oluştu.")
        } finally {
            setLoading(false)
        }
    }, [invoicePage, search])

    const fetchTransactions = useCallback(async () => {
        setTxLoading(true)
        try {
            const res = await apiClient.get("/admin/transactions", {
                params: { page: transactionPage, per_page: 15 },
            })
            if (res.data?.data) {
                setTransactions(res.data.data)
                setTransactionMeta(res.data.meta ?? null)
            }
        } catch {
            toast.error("İşlemler yüklenirken hata oluştu.")
        } finally {
            setTxLoading(false)
        }
    }, [transactionPage])

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await apiClient.get("/admin/transactions/stats")
                if (res.data?.data) { setStats(res.data.data) }
            } catch {
                // İstatistik yüklenemedi
            }
        }
        fetchStats()
        fetchInvoices()
        fetchTransactions()
    }, [fetchInvoices, fetchTransactions])

    const statCards = [
        {
            title: "Bu Ay Tahsilat",
            value: stats ? formatCurrency(stats.this_month_amount) : "—",
            sub: `Bugün: ${stats ? formatCurrency(stats.today_amount) : "—"}`,
            icon: ArrowDownLeft,
            color: "text-green-500",
        },
        {
            title: "Toplam İşlem",
            value: stats?.total_count ?? "—",
            sub: `${stats?.success_count ?? 0} başarılı`,
            icon: CreditCard,
            color: "text-indigo-500",
        },
        {
            title: "Başarılı Tutar",
            value: stats ? formatCurrency(stats.success_amount) : "—",
            sub: "Onaylanmış ödemeler",
            icon: TrendingUp,
            color: "text-emerald-500",
        },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Finans & Ödemeler</h1>
                <p className="text-muted-foreground">B2B fatura takibi, sanal POS işlemleri ve finansal raporlar.</p>
            </div>

            {/* İstatistik Kartları */}
            <div className="grid gap-4 md:grid-cols-3">
                {statCards.map((card) => (
                    <Card key={card.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                            <card.icon className={`h-4 w-4 ${card.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value}</div>
                            <p className="text-xs text-muted-foreground">{card.sub}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Tabs defaultValue="invoices">
                <TabsList>
                    <TabsTrigger value="invoices">
                        <ReceiptText className="mr-2 h-4 w-4" /> Faturalar
                    </TabsTrigger>
                    <TabsTrigger value="transactions">
                        <CreditCard className="mr-2 h-4 w-4" /> POS İşlemleri
                    </TabsTrigger>
                </TabsList>

                {/* Faturalar */}
                <TabsContent value="invoices">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Fatura Listesi</CardTitle>
                                    <CardDescription>
                                        {invoiceMeta ? `Toplam ${invoiceMeta.total} fatura` : "Yükleniyor..."}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            className="pl-8 w-48"
                                            placeholder="Ara..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>
                                    <Button variant="outline" size="icon" onClick={fetchInvoices}>
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex h-32 items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                </div>
                            ) : (
                                <>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Fatura No</TableHead>
                                                <TableHead>Kurum</TableHead>
                                                <TableHead>Tip</TableHead>
                                                <TableHead>Tutar</TableHead>
                                                <TableHead>Para Birimi</TableHead>
                                                <TableHead>Durum</TableHead>
                                                <TableHead>Vade</TableHead>
                                                <TableHead>Tarih</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {invoices.map((inv) => (
                                                <TableRow key={inv.id}>
                                                    <TableCell className="font-mono text-sm">
                                                        {inv.invoice_number ?? `#${inv.id}`}
                                                    </TableCell>
                                                    <TableCell className="text-sm">{inv.tenant?.name ?? "—"}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={inv.type === "b2b" ? "default" : "secondary"}>
                                                            {inv.type.toUpperCase()}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {formatCurrency(inv.total_amount, inv.currency)}
                                                    </TableCell>
                                                    <TableCell className="text-sm">{inv.currency}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={getInvoiceBadgeVariant(inv.status)}>
                                                            {INVOICE_STATUS_LABELS[inv.status] ?? inv.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {inv.due_date
                                                            ? new Date(inv.due_date).toLocaleDateString("tr-TR")
                                                            : "—"}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {new Date(inv.created_at).toLocaleDateString("tr-TR")}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {invoices.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                                        Fatura bulunamadı.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                    {invoiceMeta && invoiceMeta.last_page > 1 && (
                                        <div className="flex items-center justify-between mt-4">
                                            <p className="text-sm text-muted-foreground">
                                                Sayfa {invoiceMeta.current_page} / {invoiceMeta.last_page}
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline" size="sm"
                                                    disabled={invoiceMeta.current_page === 1}
                                                    onClick={() => setInvoicePage((p) => p - 1)}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline" size="sm"
                                                    disabled={invoiceMeta.current_page === invoiceMeta.last_page}
                                                    onClick={() => setInvoicePage((p) => p + 1)}
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* POS İşlemleri */}
                <TabsContent value="transactions">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Sanal POS İşlemleri</CardTitle>
                                    <CardDescription>
                                        {transactionMeta ? `Toplam ${transactionMeta.total} işlem` : "Yükleniyor..."}
                                    </CardDescription>
                                </div>
                                <Button variant="outline" size="icon" onClick={fetchTransactions}>
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {txLoading ? (
                                <div className="flex h-32 items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                </div>
                            ) : (
                                <>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>İşlem ID</TableHead>
                                                <TableHead>Gateway ID</TableHead>
                                                <TableHead>Tutar</TableHead>
                                                <TableHead>Gateway</TableHead>
                                                <TableHead>Durum</TableHead>
                                                <TableHead>Tarih</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transactions.map((tx) => (
                                                <TableRow key={tx.id}>
                                                    <TableCell className="font-mono text-sm">#{tx.id}</TableCell>
                                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                                        {tx.gateway_transaction_id ?? "—"}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        <span className="flex items-center gap-1">
                                                            {tx.status === "success"
                                                                ? <ArrowDownLeft className="h-3 w-3 text-green-500" />
                                                                : <ArrowUpRight className="h-3 w-3 text-red-500" />}
                                                            {formatCurrency(tx.amount, tx.currency)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-sm capitalize">{tx.gateway ?? "—"}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={getTransactionBadgeVariant(tx.status)}>
                                                            {TRANSACTION_STATUS_LABELS[tx.status] ?? tx.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {new Date(tx.created_at).toLocaleDateString("tr-TR")}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {transactions.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                        İşlem bulunamadı.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                    {transactionMeta && transactionMeta.last_page > 1 && (
                                        <div className="flex items-center justify-between mt-4">
                                            <p className="text-sm text-muted-foreground">
                                                Sayfa {transactionMeta.current_page} / {transactionMeta.last_page}
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline" size="sm"
                                                    disabled={transactionMeta.current_page === 1}
                                                    onClick={() => setTransactionPage((p) => p - 1)}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline" size="sm"
                                                    disabled={transactionMeta.current_page === transactionMeta.last_page}
                                                    onClick={() => setTransactionPage((p) => p + 1)}
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
