"use client"

import { useEffect, useState, useCallback } from "react"
import apiClient from "@/lib/apiClient"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    School, Search, Loader2, MoreHorizontal, ChevronLeft, ChevronRight, Filter, Download,
} from "lucide-react"
import { toast } from "sonner"
import type { School as SchoolType } from "@/types"
import { exportToCsv } from "@/lib/exportUtils"

type Meta = { current_page: number; last_page: number; per_page: number; total: number }

export default function SchoolsPage() {
    const [schools, setSchools] = useState<SchoolType[]>([])
    const [meta, setMeta] = useState<Meta | null>(null)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [statusFilter, setStatusFilter] = useState("")

    const fetchSchools = useCallback(async () => {
        setLoading(true)
        try {
            const params: Record<string, string | number> = { page, per_page: 15 }
            if (search) { params.search = search }
            if (statusFilter) { params.status = statusFilter }

            const res = await apiClient.get("/admin/schools", { params })
            if (res.data?.data) {
                setSchools(res.data.data)
                setMeta(res.data.meta ?? null)
            }
        } catch {
            toast.error("Okullar yüklenirken hata oluştu.")
        } finally {
            setLoading(false)
        }
    }, [search, page, statusFilter])

    useEffect(() => {
        setPage(1)
    }, [search, statusFilter])

    useEffect(() => {
        fetchSchools()
    }, [fetchSchools])

    const handleToggleStatus = async (schoolId: number) => {
        try {
            await apiClient.patch(`/admin/schools/${schoolId}/toggle-status`)
            toast.success("Okul durumu güncellendi.")
            fetchSchools()
        } catch {
            toast.error("Durum güncellenirken hata oluştu.")
        }
    }

    const handleDelete = async (schoolId: number) => {
        if (!confirm("Bu okulu silmek istediğinizden emin misiniz?")) { return }
        try {
            await apiClient.delete(`/admin/schools/${schoolId}`)
            toast.success("Okul silindi.")
            fetchSchools()
        } catch {
            toast.error("Okul silinirken hata oluştu.")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Okullar & Şubeler</h1>
                    <p className="text-muted-foreground">Tüm tenant'lardaki okulların global listesi.</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        exportToCsv("okullar", schools, [
                            { key: "id", label: "ID" },
                            { key: "name", label: "Okul Adı" },
                            { key: "tenant", label: "Kurum", format: (r) => (r.tenant as SchoolType["tenant"])?.name ?? "" },
                            { key: "status", label: "Durum", format: (r) => (r.status === "active" || !r.status ? "Aktif" : "Pasif") },
                            { key: "classes_count", label: "Sınıf Sayısı", format: (r) => String(r.classes_count ?? "") },
                            { key: "created_at", label: "Kayıt Tarihi", format: (r) => new Date(r.created_at as string).toLocaleDateString("tr-TR") },
                        ])
                    }
                >
                    <Download className="mr-2 h-4 w-4" /> CSV İndir
                </Button>
            </div>

            {/* Filtreler */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-8"
                        placeholder="Okul adı veya e-posta ile ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                        <option value="">Tüm Durumlar</option>
                        <option value="active">Aktif</option>
                        <option value="inactive">Pasif</option>
                    </select>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <School className="h-5 w-5 text-indigo-500" />
                        Okul Listesi
                    </CardTitle>
                    <CardDescription>
                        {meta ? `Toplam ${meta.total} okul` : "Yükleniyor..."}
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
                                        <TableHead>Okul Adı</TableHead>
                                        <TableHead>Kurum</TableHead>
                                        <TableHead>E-posta</TableHead>
                                        <TableHead>Sınıf</TableHead>
                                        <TableHead>Öğrenci</TableHead>
                                        <TableHead>Durum</TableHead>
                                        <TableHead>Kayıt</TableHead>
                                        <TableHead className="text-right">İşlem</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {schools.map((school) => (
                                        <TableRow key={school.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                                                        <School className="h-4 w-4" />
                                                    </div>
                                                    {school.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">{school.tenant?.name ?? "—"}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{school.email ?? "—"}</TableCell>
                                            <TableCell className="text-sm">{school.classes_count ?? "—"}</TableCell>
                                            <TableCell className="text-sm">{school.children_count ?? "—"}</TableCell>
                                            <TableCell>
                                                <Badge variant={school.status === "active" || !school.status ? "success" : "secondary"}>
                                                    {school.status === "active" || !school.status ? "Aktif" : "Pasif"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(school.created_at).toLocaleDateString("tr-TR")}
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
                                                        <DropdownMenuItem onClick={() => handleToggleStatus(school.id)}>
                                                            Durumu Değiştir
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => handleDelete(school.id)}
                                                        >
                                                            Sil
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {schools.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                                Okul bulunamadı.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {meta && meta.last_page > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Sayfa {meta.current_page} / {meta.last_page} — Toplam {meta.total} kayıt
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline" size="sm"
                                            disabled={meta.current_page === 1}
                                            onClick={() => setPage((p) => p - 1)}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline" size="sm"
                                            disabled={meta.current_page === meta.last_page}
                                            onClick={() => setPage((p) => p + 1)}
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
        </div>
    )
}
