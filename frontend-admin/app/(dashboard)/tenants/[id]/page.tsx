"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import apiClient from "@/lib/apiClient"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Building, Loader2, ArrowLeft, Mail, Calendar, CreditCard,
    GraduationCap, Package, Users,
} from "lucide-react"
import { toast } from "sonner"
import type { Tenant, School, TenantSubscription } from "@/types"
import { useTranslation } from "@/hooks/useTranslation"

export default function TenantDetailPage() {
    const { t } = useTranslation()
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const [tenant, setTenant] = useState<Tenant | null>(null)
    const [schools, setSchools] = useState<School[]>([])
    const [subscriptions, setSubscriptions] = useState<TenantSubscription[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true)
            try {
                const [tenantRes, schoolsRes, subsRes] = await Promise.all([
                    apiClient.get(`/admin/tenants/${id}`),
                    apiClient.get(`/admin/tenants/${id}/schools`).catch(() => ({ data: { data: [] } })),
                    apiClient.get(`/admin/tenants/${id}/subscriptions`).catch(() => ({ data: { data: [] } })),
                ])
                const rawData = tenantRes.data?.data
                if (rawData?.tenant) {
                    setTenant(rawData.tenant as Tenant)
                } else if (rawData) {
                    setTenant(rawData as Tenant)
                }
                if (Array.isArray(schoolsRes.data?.data)) setSchools(schoolsRes.data.data)
                if (Array.isArray(subsRes.data?.data)) setSubscriptions(subsRes.data.data)
            } catch {
                toast.error(t('tenants.loadError2'))
                router.push("/tenants")
            } finally {
                setLoading(false)
            }
        }
        fetchAll()
    }, [id, router, t])

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
        )
    }

    if (!tenant) return null

    const activeSub = subscriptions.find((s) => s.status === "active")

    const getSubStatusLabel = (status: string) => {
        if (status === "active") { return t('tenants.detail.activeStatus') }
        if (status === "trial") { return t('tenants.detail.trialStatus') }
        if (status === "cancelled") { return t('tenants.detail.cancelledStatus') }
        return t('tenants.detail.expiredStatus')
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => router.push("/tenants")}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> {t('common.back')}
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
                    <p className="text-muted-foreground">{t('tenants.detail.managementSubtitle')}</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 text-sm font-bold">
                                {tenant.name[0]?.toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-medium">{t('tenants.detail.statusCard')}</p>
                                <Badge variant={tenant.status === "active" || !tenant.status ? "success" : "secondary"}>
                                    {tenant.status === "active" || !tenant.status ? t('tenants.detail.activeStatus') : t('tenants.detail.inactiveStatus')}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <GraduationCap className="h-8 w-8 text-blue-500" />
                            <div>
                                <p className="text-xs text-muted-foreground">{t('tenants.detail.schoolCountCard')}</p>
                                <p className="text-2xl font-bold">{schools.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Package className="h-8 w-8 text-purple-500" />
                            <div>
                                <p className="text-xs text-muted-foreground">{t('tenants.detail.activePackageCard')}</p>
                                <p className="text-sm font-semibold">{activeSub?.package?.name ?? "—"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-8 w-8 text-green-500" />
                            <div>
                                <p className="text-xs text-muted-foreground">{t('tenants.detail.registrationDateCard')}</p>
                                <p className="text-sm font-semibold">{new Date(tenant.created_at).toLocaleDateString("tr-TR")}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {tenant.owner && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4" /> {t('tenants.detail.ownerTitle')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-semibold">
                                {tenant.owner.name[0]?.toUpperCase()}
                            </div>
                            <div>
                                <p className="font-medium">{tenant.owner.name} {tenant.owner.surname ?? ""}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Mail className="h-3 w-3" />{tenant.owner.email}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Tabs defaultValue="schools">
                <TabsList>
                    <TabsTrigger value="schools">{t('tenants.detail.schoolsTitle')} ({schools.length})</TabsTrigger>
                    <TabsTrigger value="subscriptions">{t('tenants.detail.subscriptionTitle')} ({subscriptions.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="schools" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <GraduationCap className="h-5 w-5 text-blue-500" /> {t('tenants.detail.schoolsTitle')}
                            </CardTitle>
                            <CardDescription>{t('tenants.detail.schoolsSubtitle')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {schools.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">{t('tenants.detail.noSchool')}</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('tenants.detail.schoolNameCol')}</TableHead>
                                            <TableHead>{t('common.status')}</TableHead>
                                            <TableHead>{t('tenants.detail.classCountCol')}</TableHead>
                                            <TableHead>{t('tenants.detail.studentCountCol')}</TableHead>
                                            <TableHead>{t('tenants.detail.registrationDateCol')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {schools.map((school) => (
                                            <TableRow
                                                key={school.id}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => router.push(`/schools/${school.id}`)}
                                            >
                                                <TableCell className="font-medium">{school.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant={school.status === "active" || !school.status ? "success" : "secondary"}>
                                                        {school.status === "active" || !school.status ? t('tenants.detail.activeStatus') : t('tenants.detail.inactiveStatus')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{school.classes_count ?? "—"}</TableCell>
                                                <TableCell>{school.children_count ?? "—"}</TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {new Date(school.created_at).toLocaleDateString("tr-TR")}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="subscriptions" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-purple-500" /> {t('tenants.detail.subscriptionTitle')}
                            </CardTitle>
                            <CardDescription>{t('tenants.detail.subscriptionSubtitle')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {subscriptions.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">{t('tenants.detail.noSubscription')}</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('tenants.detail.packageCol')}</TableHead>
                                            <TableHead>{t('common.status')}</TableHead>
                                            <TableHead>{t('tenants.detail.billingCycleCol')}</TableHead>
                                            <TableHead>{t('tenants.detail.startCol')}</TableHead>
                                            <TableHead>{t('tenants.detail.endCol')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {subscriptions.map((sub) => (
                                            <TableRow key={sub.id}>
                                                <TableCell className="font-medium">{sub.package?.name ?? `Paket #${sub.package_id}`}</TableCell>
                                                <TableCell>
                                                    <Badge variant={
                                                        sub.status === "active" ? "success" :
                                                        sub.status === "trial" ? "warning" :
                                                        sub.status === "cancelled" ? "danger" : "secondary"
                                                    }>
                                                        {getSubStatusLabel(sub.status)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {sub.billing_cycle === "monthly" ? t('subscriptions.monthly') : t('subscriptions.yearly')}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {new Date(sub.starts_at).toLocaleDateString("tr-TR")}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {new Date(sub.ends_at).toLocaleDateString("tr-TR")}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
