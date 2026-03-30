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
    GraduationCap, Loader2, ArrowLeft, Mail, Phone, MapPin,
    Users, BookOpen,
} from "lucide-react"
import { toast } from "sonner"
import type { School } from "@/types"

type ClassItem = {
    id: number
    name: string
    capacity?: number
    children_count?: number
    teacher?: { id: number; name: string; email: string }
    created_at: string
}

type ChildItem = {
    id: number
    first_name: string
    last_name: string
    birth_date?: string
    gender?: string
    classroom?: { id: number; name: string }
    created_at: string
}

export default function SchoolDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const [school, setSchool] = useState<School | null>(null)
    const [classes, setClasses] = useState<ClassItem[]>([])
    const [children, setChildren] = useState<ChildItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true)
            try {
                const [schoolRes, classesRes, childrenRes] = await Promise.all([
                    apiClient.get(`/admin/schools/${id}`),
                    apiClient.get(`/admin/schools/${id}/classes`).catch(() => ({ data: { data: [] } })),
                    apiClient.get(`/admin/schools/${id}/children`).catch(() => ({ data: { data: [] } })),
                ])
                if (schoolRes.data?.data) setSchool(schoolRes.data.data)
                if (classesRes.data?.data) setClasses(classesRes.data.data)
                if (childrenRes.data?.data) setChildren(childrenRes.data.data)
            } catch {
                toast.error("Okul bilgileri yüklenemedi.")
                router.push("/schools")
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

    if (!school) return null

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Geri
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{school.name}</h1>
                    {school.tenant && (
                        <p className="text-muted-foreground">{school.tenant.name} kurumuna bağlı</p>
                    )}
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <GraduationCap className="h-8 w-8 text-indigo-500" />
                            <div>
                                <p className="text-xs text-muted-foreground">Durum</p>
                                <Badge variant={school.status === "active" || !school.status ? "success" : "secondary"}>
                                    {school.status === "active" || !school.status ? "Aktif" : "Pasif"}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <BookOpen className="h-8 w-8 text-blue-500" />
                            <div>
                                <p className="text-xs text-muted-foreground">Sınıf Sayısı</p>
                                <p className="text-2xl font-bold">{classes.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Users className="h-8 w-8 text-green-500" />
                            <div>
                                <p className="text-xs text-muted-foreground">Öğrenci Sayısı</p>
                                <p className="text-2xl font-bold">{children.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Users className="h-8 w-8 text-purple-500" />
                            <div>
                                <p className="text-xs text-muted-foreground">Maks. Öğrenci</p>
                                <p className="text-2xl font-bold">{school.max_students ?? "—"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Contact Info */}
            {(school.email || school.phone || school.address) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">İletişim Bilgileri</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        {school.email && (
                            <p className="text-sm flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4" /> {school.email}
                            </p>
                        )}
                        {school.phone && (
                            <p className="text-sm flex items-center gap-2 text-muted-foreground">
                                <Phone className="h-4 w-4" /> {school.phone}
                            </p>
                        )}
                        {school.address && (
                            <p className="text-sm flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4" /> {school.address}
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Tabs */}
            <Tabs defaultValue="classes">
                <TabsList>
                    <TabsTrigger value="classes">Sınıflar ({classes.length})</TabsTrigger>
                    <TabsTrigger value="children">Öğrenciler ({children.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="classes" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-blue-500" /> Sınıflar
                            </CardTitle>
                            <CardDescription>Bu okuldaki sınıflar ve öğretmenler</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {classes.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">Henüz sınıf oluşturulmamış.</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Sınıf Adı</TableHead>
                                            <TableHead>Öğretmen</TableHead>
                                            <TableHead>Kapasite</TableHead>
                                            <TableHead>Öğrenci Sayısı</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {classes.map((cls) => (
                                            <TableRow key={cls.id}>
                                                <TableCell className="font-medium">{cls.name}</TableCell>
                                                <TableCell className="text-sm">
                                                    {cls.teacher ? (
                                                        <div>
                                                            <div>{cls.teacher.name}</div>
                                                            <div className="text-xs text-muted-foreground">{cls.teacher.email}</div>
                                                        </div>
                                                    ) : <span className="text-muted-foreground italic">Atanmamış</span>}
                                                </TableCell>
                                                <TableCell>{cls.capacity ?? "—"}</TableCell>
                                                <TableCell>{cls.children_count ?? "—"}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="children" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-green-500" /> Öğrenciler
                            </CardTitle>
                            <CardDescription>Bu okuldaki öğrenciler</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {children.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">Henüz öğrenci kaydı yok.</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Ad Soyad</TableHead>
                                            <TableHead>Sınıf</TableHead>
                                            <TableHead>Doğum Tarihi</TableHead>
                                            <TableHead>Cinsiyet</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {children.map((child) => (
                                            <TableRow key={child.id}>
                                                <TableCell className="font-medium">
                                                    {child.first_name} {child.last_name}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {child.classroom?.name ?? <span className="text-muted-foreground italic">—</span>}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {child.birth_date
                                                        ? new Date(child.birth_date).toLocaleDateString("tr-TR")
                                                        : "—"}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {child.gender === "male" ? "Erkek" : child.gender === "female" ? "Kız" : "—"}
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
