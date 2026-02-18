"use client"

import { useEffect, useState } from "react"
import apiClient from "@/lib/apiClient"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, CreditCard, DollarSign, Loader2, TrendingUp, School, Package } from "lucide-react"
import type { DashboardStats, RecentActivity } from "@/types"
import {
    AreaChart, Area, BarChart, Bar, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"

type DailySummaryItem = {
    date: string
    total: number
    created: number
    updated: number
    deleted: number
}

type SubStats = {
    active: number
    cancelled: number
    expired: number
    suspended: number
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
    const [dailySummary, setDailySummary] = useState<DailySummaryItem[]>([])
    const [subStats, setSubStats] = useState<SubStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const [statsRes, activitiesRes, dailyRes, subStatsRes] = await Promise.allSettled([
                    apiClient.get("/admin/dashboard/stats"),
                    apiClient.get("/admin/dashboard/recent-activities"),
                    apiClient.get("/admin/activity-logs/daily-summary"),
                    apiClient.get("/admin/subscriptions/stats"),
                ])

                if (statsRes.status === "fulfilled" && statsRes.value.data?.data) {
                    setStats(statsRes.value.data.data)
                }
                if (activitiesRes.status === "fulfilled" && activitiesRes.value.data?.data) {
                    setRecentActivities(activitiesRes.value.data.data)
                }
                if (dailyRes.status === "fulfilled" && dailyRes.value.data?.data) {
                    setDailySummary(dailyRes.value.data.data)
                }
                if (subStatsRes.status === "fulfilled" && subStatsRes.value.data?.data) {
                    const d = subStatsRes.value.data.data
                    setSubStats({
                        active: d.active ?? 0,
                        cancelled: d.cancelled ?? 0,
                        expired: d.expired ?? 0,
                        suspended: d.suspended ?? 0,
                    })
                }
            } catch {
                // Sessizce geç, fallback veriler gösterilecek
            } finally {
                setLoading(false)
            }
        }

        fetchDashboard()
    }, [])

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(val)

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
        if (diff < 60) return `${diff} saniye önce`
        if (diff < 3600) return `${Math.floor(diff / 60)} dakika önce`
        if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`
        return `${Math.floor(diff / 86400)} gün önce`
    }

    const statCards = [
        {
            title: "Toplam Kurum",
            value: stats?.total_tenants ?? "—",
            sub: `${stats?.active_tenants ?? 0} aktif`,
            icon: Building2,
            color: "text-indigo-500",
        },
        {
            title: "Toplam Okul",
            value: stats?.total_schools ?? "—",
            sub: "Tüm tenant'larda",
            icon: School,
            color: "text-blue-500",
        },
        {
            title: "Aktif Abonelik",
            value: stats?.active_subscriptions ?? "—",
            sub: "Geçerli dönem",
            icon: Package,
            color: "text-green-500",
        },
        {
            title: "Bu Ay Gelir",
            value: stats ? formatCurrency(stats.monthly_revenue) : "—",
            sub: `Toplam: ${stats ? formatCurrency(stats.total_revenue) : "—"}`,
            icon: DollarSign,
            color: "text-emerald-500",
        },
        {
            title: "Toplam Kullanıcı",
            value: stats?.total_users ?? "—",
            sub: "Öğretmen + Veli",
            icon: Users,
            color: "text-violet-500",
        },
        {
            title: "Bekleyen Ödeme",
            value: stats?.pending_payments ?? "—",
            sub: "Fatura bekleniyor",
            icon: CreditCard,
            color: "text-orange-500",
        },
    ]

    const subChartData = subStats
        ? [
              { name: "Aktif", value: subStats.active, color: "#22c55e" },
              { name: "İptal", value: subStats.cancelled, color: "#ef4444" },
              { name: "Dolmuş", value: subStats.expired, color: "#94a3b8" },
              { name: "Askıda", value: subStats.suspended, color: "#f59e0b" },
          ]
        : []

    const formatAxisDate = (dateStr: string) => {
        const d = new Date(dateStr)
        return `${d.getDate()}/${d.getMonth() + 1}`
    }

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">iStudy Süper Admin Paneli</p>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-1.5 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                    </span>
                    Sistem Aktif
                </div>
            </div>

            {/* İstatistik Kartları */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

            {/* Aktivite Trend Grafiği */}
            {dailySummary.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-indigo-500" />
                            Aktivite Trendi (Son 14 Gün)
                        </CardTitle>
                        <CardDescription>Günlük oluşturma, güncelleme ve silme işlemleri</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={dailySummary} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatAxisDate}
                                    tick={{ fontSize: 11 }}
                                />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip
                                    labelFormatter={(v) => new Date(v as string).toLocaleDateString("tr-TR")}
                                    formatter={(value, name) => {
                                        const labels: Record<string, string> = {
                                            created: "Oluşturuldu",
                                            updated: "Güncellendi",
                                            deleted: "Silindi",
                                        }
                                        return [value, labels[name as string] ?? name]
                                    }}
                                />
                                <Legend
                                    formatter={(value) => {
                                        const labels: Record<string, string> = {
                                            created: "Oluşturuldu",
                                            updated: "Güncellendi",
                                            deleted: "Silindi",
                                        }
                                        return labels[value] ?? value
                                    }}
                                />
                                <Area type="monotone" dataKey="created" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                                <Area type="monotone" dataKey="updated" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                                <Area type="monotone" dataKey="deleted" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Alt Satır: Abonelik Grafiği + Son Aktiviteler */}
            <div className="grid gap-4 md:grid-cols-2">
                {subStats && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-green-500" />
                                Abonelik Dağılımı
                            </CardTitle>
                            <CardDescription>Mevcut abonelik durum dağılımı</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={subChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Bar dataKey="value" name="Sayı" radius={[4, 4, 0, 0]}>
                                        {subChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}

                <Card className={!subStats ? "md:col-span-2" : ""}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-indigo-500" />
                            Son Aktiviteler
                        </CardTitle>
                        <CardDescription>Sistem genelindeki son değişiklikler</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentActivities.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                Henüz aktivite kaydı yok.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {recentActivities.map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-3 text-sm">
                                        <span className="relative flex h-2 w-2 mt-1.5 shrink-0">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
                                        </span>
                                        <div className="flex-1">
                                            <p className="font-medium">
                                                {activity.user_name} — {activity.action}{" "}
                                                <span className="text-indigo-600">{activity.model_label}</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDate(activity.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
