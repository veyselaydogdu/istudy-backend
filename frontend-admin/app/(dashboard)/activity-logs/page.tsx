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
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
    Activity, Loader2, Search, ChevronLeft, ChevronRight,
    Eye, PlusCircle, Pencil, Trash2, RotateCcw,
} from "lucide-react"
import { toast } from "sonner"
import type { ActivityLog, ActivityLogStats } from "@/types"
import { useTranslation } from "@/hooks/useTranslation"

type Meta = { current_page: number; last_page: number; per_page: number; total: number }

export default function ActivityLogsPage() {
    const { t } = useTranslation()
    const [logs, setLogs] = useState<ActivityLog[]>([])
    const [meta, setMeta] = useState<Meta | null>(null)
    const [stats, setStats] = useState<ActivityLogStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [actionFilter, setActionFilter] = useState("all")
    const [page, setPage] = useState(1)
    const [detailLog, setDetailLog] = useState<ActivityLog | null>(null)

    const actionConfig: Record<string, { label: string; variant: "success" | "warning" | "danger" | "secondary"; icon: React.ReactNode }> = {
        created: { label: t('activityLogs.created'), variant: "success", icon: <PlusCircle className="h-3 w-3" /> },
        updated: { label: t('activityLogs.updated'), variant: "warning", icon: <Pencil className="h-3 w-3" /> },
        deleted: { label: t('activityLogs.deleted'), variant: "danger", icon: <Trash2 className="h-3 w-3" /> },
        restored: { label: t('activityLogs.restored'), variant: "secondary", icon: <RotateCcw className="h-3 w-3" /> },
        force_deleted: { label: t('activityLogs.forceDeleted'), variant: "danger", icon: <Trash2 className="h-3 w-3" /> },
    }

    const fetchStats = useCallback(async () => {
        try {
            const res = await apiClient.get("/admin/activity-logs/stats")
            if (res.data?.data) { setStats(res.data.data) }
        } catch {
            // silent
        }
    }, [])

    const fetchLogs = useCallback(async () => {
        setLoading(true)
        setLogs([])
        try {
            const params: Record<string, string | number> = { page, per_page: 20 }
            if (search) { params.search = search }
            if (actionFilter !== "all") { params.action = actionFilter }
            const res = await apiClient.get("/admin/activity-logs", { params })
            if (res.data?.data) {
                setLogs(res.data.data)
                setMeta(res.data.meta ?? null)
            } else {
                setLogs([])
                setMeta(null)
            }
        } catch {
            toast.error(t('activityLogs.loadError'))
            setLogs([])
            setMeta(null)
        } finally {
            setLoading(false)
        }
    }, [page, search, actionFilter, t])

    useEffect(() => { setPage(1) }, [search, actionFilter])
    useEffect(() => { fetchLogs() }, [fetchLogs])
    useEffect(() => { fetchStats() }, [fetchStats])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('activityLogs.title')}</h1>
                <p className="text-muted-foreground">{t('activityLogs.subtitle')}</p>
            </div>

            {stats && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{stats.total_logs.toLocaleString("tr-TR")}</div>
                            <p className="text-xs text-muted-foreground mt-1">{t('activityLogs.totalRecords')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-indigo-600">{stats.today.toLocaleString("tr-TR")}</div>
                            <p className="text-xs text-muted-foreground mt-1">{t('activityLogs.today')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-blue-600">{stats.this_week.toLocaleString("tr-TR")}</div>
                            <p className="text-xs text-muted-foreground mt-1">{t('activityLogs.thisWeek')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-purple-600">{stats.this_month.toLocaleString("tr-TR")}</div>
                            <p className="text-xs text-muted-foreground mt-1">{t('activityLogs.thisMonth')}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {stats?.by_action && Object.keys(stats.by_action).length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {Object.entries(stats.by_action).map(([action, count]) => {
                        const cfg = actionConfig[action]
                        return (
                            <Badge key={action} variant={cfg?.variant ?? "secondary"}>
                                {cfg?.label ?? action}: {count}
                            </Badge>
                        )
                    })}
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-8"
                        placeholder={t('activityLogs.filterPlaceholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-44">
                        <SelectValue placeholder={t('activityLogs.filterAction')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('activityLogs.allActions')}</SelectItem>
                        <SelectItem value="created">{t('activityLogs.created')}</SelectItem>
                        <SelectItem value="updated">{t('activityLogs.updated')}</SelectItem>
                        <SelectItem value="deleted">{t('activityLogs.deleted')}</SelectItem>
                        <SelectItem value="restored">{t('activityLogs.restored')}</SelectItem>
                        <SelectItem value="force_deleted">{t('activityLogs.forceDeleted')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-indigo-500" /> {t('activityLogs.listTitle')}
                    </CardTitle>
                    <CardDescription>
                        {meta
                            ? t('activityLogs.totalEntry', { count: meta.total.toLocaleString("tr-TR") })
                            : t('common.loading')}
                    </CardDescription>
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
                                        <TableHead>{t('activityLogs.user')}</TableHead>
                                        <TableHead>{t('activityLogs.action')}</TableHead>
                                        <TableHead>{t('activityLogs.model')}</TableHead>
                                        <TableHead>{t('activityLogs.ipAddress')}</TableHead>
                                        <TableHead>{t('activityLogs.dateCol')}</TableHead>
                                        <TableHead className="text-right">{t('activityLogs.detailCol')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((log) => {
                                        const cfg = actionConfig[log.action] ?? { label: log.action, variant: "secondary" as const, icon: null }
                                        return (
                                            <TableRow key={log.id}>
                                                <TableCell>
                                                    <div className="font-medium text-sm">{log.user?.name ?? "—"}</div>
                                                    {log.user?.email && (
                                                        <div className="text-xs text-muted-foreground">{log.user.email}</div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={cfg.variant} className="gap-1">
                                                        {cfg.icon}{cfg.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {log.model?.label ?? log.model?.type ?? "—"}
                                                    {log.model?.id && <span className="text-muted-foreground ml-1">#{log.model.id}</span>}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground font-mono">
                                                    {log.context?.ip_address ?? "—"}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {new Date(log.created_at).toLocaleString("tr-TR")}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {(log.changes?.old_values || log.changes?.new_values) && (
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setDetailLog(log)}>
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                    {logs.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                {t('activityLogs.noRecord')}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            {meta && meta.last_page > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        {t('activityLogs.pageOf', { current: meta.current_page, total: meta.last_page })}
                                    </p>
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

            <Dialog open={!!detailLog} onOpenChange={(o) => !o && setDetailLog(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{t('activityLogs.changeDetail')} — {detailLog?.model?.label} #{detailLog?.model?.id}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-auto">
                        {detailLog?.changes?.old_values && (
                            <div>
                                <p className="text-sm font-semibold text-red-600 mb-2">{t('activityLogs.oldValues')}</p>
                                <pre className="text-xs bg-red-50 dark:bg-red-950/20 rounded-md p-3 overflow-auto border border-red-200 dark:border-red-900">
                                    {JSON.stringify(detailLog.changes.old_values, null, 2)}
                                </pre>
                            </div>
                        )}
                        {detailLog?.changes?.new_values && (
                            <div>
                                <p className="text-sm font-semibold text-green-600 mb-2">{t('activityLogs.newValues')}</p>
                                <pre className="text-xs bg-green-50 dark:bg-green-950/20 rounded-md p-3 overflow-auto border border-green-200 dark:border-green-900">
                                    {JSON.stringify(detailLog.changes.new_values, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                    {detailLog?.changes?.changed_fields && detailLog.changes.changed_fields.length > 0 && (
                        <div className="mt-2">
                            <p className="text-sm font-medium text-muted-foreground mb-1">{t('activityLogs.changedFields')}</p>
                            <div className="flex flex-wrap gap-1">
                                {detailLog.changes.changed_fields.map((f) => (
                                    <Badge key={f} variant="secondary">{f}</Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
