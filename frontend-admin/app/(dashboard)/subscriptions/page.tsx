"use client"

import { useEffect, useState, useCallback } from "react"
import apiClient from "@/lib/apiClient"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    CreditCard, Loader2, Search, ChevronLeft, ChevronRight,
    MoreHorizontal, CheckCircle, XCircle, Clock, AlertTriangle,
    TrendingUp, Users, BarChart3, Download,
} from "lucide-react"
import { toast } from "sonner"
import type { TenantSubscription } from "@/types"
import { exportToCsv } from "@/lib/exportUtils"

type Meta = { current_page: number; last_page: number; per_page: number; total: number }

type SubscriptionStats = {
    total: number
    active: number
    suspended: number
    cancelled: number
    expired: number
    expiring_this_week: number
    total_monthly_revenue: number
    total_yearly_revenue: number
}

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "danger" | "secondary" }> = {
    active: { label: "Aktif", variant: "success" },
    trial: { label: "Deneme", variant: "warning" },
    cancelled: { label: "İptal", variant: "danger" },
    expired: { label: "Süresi Dolmuş", variant: "secondary" },
}

export default function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<TenantSubscription[]>([])
    const [meta, setMeta] = useState<Meta | null>(null)
    const [stats, setStats] = useState<SubscriptionStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [page, setPage] = useState(1)

    const [extendDialog, setExtendDialog] = useState<{ open: boolean; subscription: TenantSubscription | null }>({ open: false, subscription: null })
    const [extendDays, setExtendDays] = useState("30")
    const [extendLoading, setExtendLoading] = useState(false)

    const fetchStats = useCallback(async () => {
        try {
            const res = await apiClient.get("/admin/subscriptions/stats")
            if (res.data?.data) setStats(res.data.data)
        } catch {
            // sessiz hata
        }
    }, [])

    const fetchSubscriptions = useCallback(async () => {
        setLoading(true)
        try {
            const params: Record<string, string | number> = { page, per_page: 15 }
            if (search) params.search = search
            if (statusFilter !== "all") params.status = statusFilter
            const res = await apiClient.get("/admin/subscriptions", { params })
            if (res.data?.data) {
                setSubscriptions(res.data.data)
                setMeta(res.data.meta ?? null)
            }
        } catch {
            toast.error("Abonelikler yüklenirken hata oluştu.")
        } finally {
            setLoading(false)
        }
    }, [page, search, statusFilter])

    useEffect(() => { setPage(1) }, [search, statusFilter])
    useEffect(() => { fetchSubscriptions() }, [fetchSubscriptions])
    useEffect(() => { fetchStats() }, [fetchStats])

    const handleStatusChange = async (id: number, newStatus: string) => {
        try {
            await apiClient.patch(`/admin/subscriptions/${id}/status`, { status: newStatus })
            toast.success("Abonelik durumu güncellendi.")
            fetchSubscriptions()
            fetchStats()
        } catch {
            toast.error("Durum güncellenemedi.")
        }
    }

    const handleExtend = async () => {
        if (!extendDialog.subscription) return
        setExtendLoading(true)
        try {
            await apiClient.patch(`/admin/subscriptions/${extendDialog.subscription.id}/extend`, {
                days: parseInt(extendDays),
            })
            toast.success(`Abonelik ${extendDays} gün uzatıldı.`)
            setExtendDialog({ open: false, subscription: null })
            fetchSubscriptions()
        } catch {
            toast.error("Abonelik uzatılamadı.")
        } finally {
            setExtendLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Abonelikler</h1>
                    <p className="text-muted-foreground">Kurum aboneliklerini ve paket durumlarını yönetin.</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        exportToCsv("abonelikler", subscriptions, [
                            { key: "tenant", label: "Kurum", format: (r) => r.tenant?.name ?? `Tenant #${r.tenant_id}` },
                            { key: "package", label: "Paket", format: (r) => r.package?.name ?? `Paket #${r.package_id}` },
                            { key: "status", label: "Durum", format: (r) => statusConfig[r.status]?.label ?? r.status },
                            { key: "billing_cycle", label: "Fatura Döngüsü", format: (r) => (r.billing_cycle === "monthly" ? "Aylık" : "Yıllık") },
                            { key: "starts_at", label: "Başlangıç", format: (r) => new Date(r.starts_at).toLocaleDateString("tr-TR") },
                            { key: "ends_at", label: "Bitiş", format: (r) => new Date(r.ends_at).toLocaleDateString("tr-TR") },
                        ])
                    }
                >
                    <Download className="mr-2 h-4 w-4" /> CSV İndir
                </Button>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                            <p className="text-xs text-muted-foreground mt-1">Aktif</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-yellow-600">{stats.suspended}</div>
                            <p className="text-xs text-muted-foreground mt-1">Askıda</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
                            <p className="text-xs text-muted-foreground mt-1">İptal</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-slate-500">{stats.expired}</div>
                            <p className="text-xs text-muted-foreground mt-1">Süresi Dolmuş</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <p className="text-xs text-muted-foreground mt-1">Toplam</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-indigo-600">
                                ₺{stats.total_monthly_revenue?.toLocaleString("tr-TR") ?? "0"}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Aylık Gelir</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-8" placeholder="Kurum adı ile ara..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-44">
                        <SelectValue placeholder="Durum filtrele" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Durumlar</SelectItem>
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="trial">Deneme</SelectItem>
                        <SelectItem value="cancelled">İptal</SelectItem>
                        <SelectItem value="expired">Süresi Dolmuş</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-indigo-500" /> Abonelik Listesi
                    </CardTitle>
                    <CardDescription>{meta ? `Toplam ${meta.total} abonelik` : "Yükleniyor..."}</CardDescription>
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
                                        <TableHead>Kurum</TableHead>
                                        <TableHead>Paket</TableHead>
                                        <TableHead>Durum</TableHead>
                                        <TableHead>Fatura Döngüsü</TableHead>
                                        <TableHead>Başlangıç</TableHead>
                                        <TableHead>Bitiş</TableHead>
                                        <TableHead className="text-right">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {subscriptions.map((sub) => {
                                        const cfg = statusConfig[sub.status] ?? { label: sub.status, variant: "secondary" as const }
                                        const isExpiringSoon = sub.ends_at && new Date(sub.ends_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                                        return (
                                            <TableRow key={sub.id}>
                                                <TableCell className="font-medium">
                                                    {sub.tenant?.name ?? `Tenant #${sub.tenant_id}`}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {sub.package?.name ?? `Paket #${sub.package_id}`}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {sub.billing_cycle === "monthly" ? "Aylık" : "Yıllık"}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {new Date(sub.starts_at).toLocaleDateString("tr-TR")}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    <span className={isExpiringSoon && sub.status === "active" ? "text-orange-600 font-medium" : "text-muted-foreground"}>
                                                        {new Date(sub.ends_at).toLocaleDateString("tr-TR")}
                                                        {isExpiringSoon && sub.status === "active" && (
                                                            <AlertTriangle className="inline ml-1 h-3 w-3" />
                                                        )}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => setExtendDialog({ open: true, subscription: sub })}>
                                                                <Clock className="mr-2 h-4 w-4" /> Uzat
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            {sub.status !== "active" && (
                                                                <DropdownMenuItem onClick={() => handleStatusChange(sub.id, "active")}>
                                                                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Aktif Yap
                                                                </DropdownMenuItem>
                                                            )}
                                                            {sub.status === "active" && (
                                                                <DropdownMenuItem className="text-red-600" onClick={() => handleStatusChange(sub.id, "cancelled")}>
                                                                    <XCircle className="mr-2 h-4 w-4" /> İptal Et
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                    {subscriptions.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                Kayıtlı abonelik bulunamadı.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            {meta && meta.last_page > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-sm text-muted-foreground">Sayfa {meta.current_page} / {meta.last_page}</p>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" disabled={meta.current_page === 1} onClick={() => setPage((p) => p - 1)}>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="sm" disabled={meta.current_page === meta.last_page} onClick={() => setPage((p) => p + 1)}>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Extend Dialog */}
            <Dialog open={extendDialog.open} onOpenChange={(o) => !o && setExtendDialog({ open: false, subscription: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Aboneliği Uzat</DialogTitle>
                        <DialogDescription>
                            {extendDialog.subscription?.tenant?.name} kurumunun aboneliğini uzatın.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Uzatma Süresi (Gün)</Label>
                            <Select value={extendDays} onValueChange={setExtendDays}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7">7 gün</SelectItem>
                                    <SelectItem value="14">14 gün</SelectItem>
                                    <SelectItem value="30">30 gün (1 ay)</SelectItem>
                                    <SelectItem value="90">90 gün (3 ay)</SelectItem>
                                    <SelectItem value="180">180 gün (6 ay)</SelectItem>
                                    <SelectItem value="365">365 gün (1 yıl)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setExtendDialog({ open: false, subscription: null })}>İptal</Button>
                        <Button onClick={handleExtend} disabled={extendLoading}>
                            {extendLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Uzat
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
