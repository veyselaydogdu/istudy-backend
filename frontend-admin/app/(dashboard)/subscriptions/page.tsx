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
    Download,
} from "lucide-react"
import { toast } from "sonner"
import type { TenantSubscription } from "@/types"
import { exportToCsv } from "@/lib/exportUtils"
import { useTranslation } from "@/hooks/useTranslation"

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

export default function SubscriptionsPage() {
    const { t } = useTranslation()

    const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "danger" | "secondary" }> = {
        active: { label: t('subscriptions.statActive'), variant: "success" },
        trial: { label: t('subscriptions.trialStatus'), variant: "warning" },
        cancelled: { label: t('subscriptions.cancelledStatus'), variant: "danger" },
        expired: { label: t('subscriptions.expiredStatus'), variant: "secondary" },
    }

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
            // silent
        }
    }, [])

    const fetchSubscriptions = useCallback(async () => {
        setLoading(true)
        try {
            const params: Record<string, string | number> = { page, per_page: 15 }
            if (search) { params.search = search }
            if (statusFilter !== "all") { params.status = statusFilter }
            const res = await apiClient.get("/admin/subscriptions", { params })
            if (res.data?.data) {
                setSubscriptions(res.data.data)
                setMeta(res.data.meta ?? null)
            }
        } catch {
            toast.error(t('subscriptions.loadError'))
        } finally {
            setLoading(false)
        }
    }, [page, search, statusFilter, t])

    useEffect(() => { setPage(1) }, [search, statusFilter])
    useEffect(() => { fetchSubscriptions() }, [fetchSubscriptions])
    useEffect(() => { fetchStats() }, [fetchStats])

    const handleStatusChange = async (id: number, newStatus: string) => {
        try {
            await apiClient.patch(`/admin/subscriptions/${id}/status`, { status: newStatus })
            toast.success(t('subscriptions.statusUpdateSuccess'))
            fetchSubscriptions()
            fetchStats()
        } catch {
            toast.error(t('common.error'))
        }
    }

    const handleExtend = async () => {
        if (!extendDialog.subscription) { return }
        setExtendLoading(true)
        try {
            await apiClient.patch(`/admin/subscriptions/${extendDialog.subscription.id}/extend`, {
                days: parseInt(extendDays),
            })
            toast.success(t('subscriptions.extendSuccess'))
            setExtendDialog({ open: false, subscription: null })
            fetchSubscriptions()
        } catch {
            toast.error(t('common.error'))
        } finally {
            setExtendLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('subscriptions.title')}</h1>
                    <p className="text-muted-foreground">{t('subscriptions.subtitle')}</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        exportToCsv("abonelikler", subscriptions, [
                            { key: "tenant", label: t('subscriptions.subscriber'), format: (r) => r.tenant?.name ?? `Tenant #${r.tenant_id}` },
                            { key: "package", label: t('subscriptions.package'), format: (r) => r.package?.name ?? `Paket #${r.package_id}` },
                            { key: "status", label: t('common.status'), format: (r) => statusConfig[r.status]?.label ?? r.status },
                            { key: "billing_cycle", label: t('subscriptions.billingCycle'), format: (r) => (r.billing_cycle === "monthly" ? t('subscriptions.monthly') : t('subscriptions.yearly')) },
                            { key: "starts_at", label: t('subscriptions.startDate'), format: (r) => new Date(r.starts_at).toLocaleDateString("tr-TR") },
                            { key: "ends_at", label: t('subscriptions.endDate'), format: (r) => new Date(r.ends_at).toLocaleDateString("tr-TR") },
                        ])
                    }
                >
                    <Download className="mr-2 h-4 w-4" /> {t('common.csvExport')}
                </Button>
            </div>

            {stats && (
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                            <p className="text-xs text-muted-foreground mt-1">{t('subscriptions.statActive')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-yellow-600">{stats.suspended}</div>
                            <p className="text-xs text-muted-foreground mt-1">{t('subscriptions.statSuspended')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
                            <p className="text-xs text-muted-foreground mt-1">{t('subscriptions.statCancelled')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-slate-500">{stats.expired}</div>
                            <p className="text-xs text-muted-foreground mt-1">{t('subscriptions.statExpired')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <p className="text-xs text-muted-foreground mt-1">{t('subscriptions.statTotal')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-indigo-600">
                                ₺{stats.total_monthly_revenue?.toLocaleString("tr-TR") ?? "0"}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{t('subscriptions.statMonthlyRevenue')}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-8" placeholder={t('subscriptions.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-44">
                        <SelectValue placeholder={t('subscriptions.filterStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('subscriptions.allStatuses')}</SelectItem>
                        <SelectItem value="active">{t('subscriptions.statActive')}</SelectItem>
                        <SelectItem value="trial">{t('subscriptions.trial')}</SelectItem>
                        <SelectItem value="cancelled">{t('subscriptions.statCancelled')}</SelectItem>
                        <SelectItem value="expired">{t('subscriptions.statExpired')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-indigo-500" /> {t('subscriptions.listTitle')}
                    </CardTitle>
                    <CardDescription>{meta ? t('subscriptions.totalCount', { count: meta.total }) : t('common.loading')}</CardDescription>
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
                                        <TableHead>{t('subscriptions.subscriber')}</TableHead>
                                        <TableHead>{t('subscriptions.packageCol')}</TableHead>
                                        <TableHead>{t('common.status')}</TableHead>
                                        <TableHead>{t('subscriptions.billingCycleCol')}</TableHead>
                                        <TableHead>{t('subscriptions.startCol')}</TableHead>
                                        <TableHead>{t('subscriptions.endCol')}</TableHead>
                                        <TableHead className="text-right">{t('subscriptions.actionsCol')}</TableHead>
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
                                                    {sub.billing_cycle === "monthly" ? t('subscriptions.monthly') : t('subscriptions.yearly')}
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
                                                            <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => setExtendDialog({ open: true, subscription: sub })}>
                                                                <Clock className="mr-2 h-4 w-4" /> {t('subscriptions.extendAction')}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            {sub.status !== "active" && (
                                                                <DropdownMenuItem onClick={() => handleStatusChange(sub.id, "active")}>
                                                                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> {t('subscriptions.activate')}
                                                                </DropdownMenuItem>
                                                            )}
                                                            {sub.status === "active" && (
                                                                <DropdownMenuItem className="text-red-600" onClick={() => handleStatusChange(sub.id, "cancelled")}>
                                                                    <XCircle className="mr-2 h-4 w-4" /> {t('subscriptions.cancel')}
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
                                                {t('subscriptions.noRecord')}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            {meta && meta.last_page > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-sm text-muted-foreground">{t('subscriptions.pageOf', { current: meta.current_page, total: meta.last_page })}</p>
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

            <Dialog open={extendDialog.open} onOpenChange={(o) => !o && setExtendDialog({ open: false, subscription: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('subscriptions.extendTitle')}</DialogTitle>
                        <DialogDescription>
                            {extendDialog.subscription?.tenant?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{t('subscriptions.extendDays')}</Label>
                            <Select value={extendDays} onValueChange={setExtendDays}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7">7</SelectItem>
                                    <SelectItem value="14">14</SelectItem>
                                    <SelectItem value="30">30</SelectItem>
                                    <SelectItem value="90">90</SelectItem>
                                    <SelectItem value="180">180</SelectItem>
                                    <SelectItem value="365">365</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setExtendDialog({ open: false, subscription: null })}>{t('common.cancel')}</Button>
                        <Button onClick={handleExtend} disabled={extendLoading}>
                            {extendLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('subscriptions.extendAction')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
