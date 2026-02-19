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

export default function TenantDetailPage() {
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
                if (tenantRes.data?.data) setTenant(tenantRes.data.data)
                if (schoolsRes.data?.data) setSchools(schoolsRes.data.data)
                if (subsRes.data?.data) setSubscriptions(subsRes.data.data)
            } catch {
                toast.error("Kurum bilgileri yüklenemedi.")
                router.push("/tenants")
            } finally {
                setLoading(false)
            }
        }
        fetchAll()
    }, [id, router])

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
        )
    }

    if (!tenant) return null

    const activeSub = subscriptions.find((s) => s.status === "active")

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => router.push("/tenants")}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Geri
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
                    <p className="text-muted-foreground">Kurum detayları ve yönetim</p>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 text-sm font-bold">
                                {tenant.name[0]?.toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-medium">Durum</p>
                                <Badge variant={tenant.status === "active" || !tenant.status ? "success" : "secondary"}>
                                    {tenant.status === "active" || !tenant.status ? "Aktif" : "Pasif"}
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
                                <p className="text-xs text-muted-foreground">Okul Sayısı</p>
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
                                <p className="text-xs text-muted-foreground">Aktif Paket</p>
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
                                <p className="text-xs text-muted-foreground">Kayıt Tarihi</p>
                                <p className="text-sm font-semibold">{new Date(tenant.created_at).toLocaleDateString("tr-TR")}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Owner Info */}
            {tenant.owner && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4" /> Kurum Sahibi
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

            {/* Tabs */}
            <Tabs defaultValue="schools">
                <TabsList>
                    <TabsTrigger value="schools">Okullar ({schools.length})</TabsTrigger>
                    <TabsTrigger value="subscriptions">Abonelik Geçmişi ({subscriptions.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="schools" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <GraduationCap className="h-5 w-5 text-blue-500" /> Okullar
                            </CardTitle>
                            <CardDescription>Bu kuruma bağlı okullar</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {schools.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">Henüz okul eklenmemiş.</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Okul Adı</TableHead>
                                            <TableHead>Durum</TableHead>
                                            <TableHead>Sınıf Sayısı</TableHead>
                                            <TableHead>Öğrenci Sayısı</TableHead>
                                            <TableHead>Kayıt Tarihi</TableHead>
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
                                                        {school.status === "active" || !school.status ? "Aktif" : "Pasif"}
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
                                <CreditCard className="h-5 w-5 text-purple-500" /> Abonelik Geçmişi
                            </CardTitle>
                            <CardDescription>Bu kurumun tüm abonelik kayıtları</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {subscriptions.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">Abonelik kaydı bulunamadı.</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Paket</TableHead>
                                            <TableHead>Durum</TableHead>
                                            <TableHead>Döngü</TableHead>
                                            <TableHead>Başlangıç</TableHead>
                                            <TableHead>Bitiş</TableHead>
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
                                                        {sub.status === "active" ? "Aktif" :
                                                         sub.status === "trial" ? "Deneme" :
                                                         sub.status === "cancelled" ? "İptal" : "Süresi Dolmuş"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {sub.billing_cycle === "monthly" ? "Aylık" : "Yıllık"}
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
