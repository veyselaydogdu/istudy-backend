"use client"

import { useEffect, useState, useCallback } from "react"
import apiClient from "@/lib/apiClient"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Building, Plus, Loader2, MoreHorizontal, Search, ChevronLeft, ChevronRight,
    Eye, Trash2, Download,
} from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import type { Tenant } from "@/types"
import { exportToCsv } from "@/lib/exportUtils"

type Meta = { current_page: number; last_page: number; per_page: number; total: number }

const newTenantSchema = z.object({
    full_name: z.string().min(2, "Yönetici adı soyadı gereklidir"),
    institution_name: z.string().min(2, "Kurum adı en az 2 karakter olmalıdır"),
    email: z.string().email("Geçerli bir e-posta adresi giriniz"),
    password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
})
type NewTenantFormValues = z.infer<typeof newTenantSchema>

export default function TenantsPage() {
    const router = useRouter()
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [meta, setMeta] = useState<Meta | null>(null)
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)

    const fetchTenants = useCallback(async () => {
        setLoading(true)
        try {
            const params: Record<string, string | number> = { page, per_page: 15 }
            if (search) { params.search = search }
            const res = await apiClient.get("/admin/tenants", { params })
            if (res.data?.data) {
                setTenants(res.data.data)
                setMeta(res.data.meta ?? null)
            }
        } catch {
            toast.error("Kurumlar yüklenirken hata oluştu.")
        } finally {
            setLoading(false)
        }
    }, [page, search])

    useEffect(() => { setPage(1) }, [search])
    useEffect(() => { fetchTenants() }, [fetchTenants])

    const {
        register, handleSubmit, reset,
        formState: { errors, isSubmitting },
    } = useForm<NewTenantFormValues>({ resolver: zodResolver(newTenantSchema) })

    const onSubmit = async (data: NewTenantFormValues) => {
        try {
            await apiClient.post("/auth/register", {
                name: data.full_name,
                institution_name: data.institution_name,
                email: data.email,
                password: data.password,
                password_confirmation: data.password,
            })
            toast.success("Kurum başarıyla oluşturuldu.")
            setIsDialogOpen(false)
            reset()
            fetchTenants()
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } }
            toast.error(error.response?.data?.message ?? "Kurum oluşturulurken hata.")
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Bu kurumu silmek istediğinizden emin misiniz? Tüm veriler silinecektir.")) { return }
        try {
            await apiClient.delete(`/admin/tenants/${id}`)
            toast.success("Kurum silindi.")
            fetchTenants()
        } catch {
            toast.error("Kurum silinemedi.")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Kurumlar</h1>
                    <p className="text-muted-foreground">Sisteme kayıtlı eğitim kurumlarını yönetin.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            exportToCsv("kurumlar", tenants, [
                                { key: "id", label: "ID" },
                                { key: "name", label: "Kurum Adı" },
                                { key: "status", label: "Durum", format: (r) => (r.status === "active" || !r.status ? "Aktif" : "Pasif") },
                                { key: "subscription", label: "Paket", format: (r) => (r.subscription as Tenant["subscription"])?.package?.name ?? "" },
                                { key: "schools_count", label: "Okul Sayısı", format: (r) => String(r.schools_count ?? "") },
                                { key: "created_at", label: "Kayıt Tarihi", format: (r) => new Date(r.created_at as string).toLocaleDateString("tr-TR") },
                            ])
                        }
                    >
                        <Download className="mr-2 h-4 w-4" /> CSV İndir
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Yeni Kurum Ekle</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Yeni Kurum Ekle</DialogTitle>
                            <DialogDescription>Yeni bir eğitim kurumu ve yönetici hesabı oluşturun.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>Yönetici Adı Soyadı</Label>
                                    <Input placeholder="Örn: Ahmet Yılmaz" {...register("full_name")} />
                                    {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Kurum Adı</Label>
                                    <Input placeholder="Örn: Bilge Kağan Koleji" {...register("institution_name")} />
                                    {errors.institution_name && <p className="text-xs text-red-500">{errors.institution_name.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Yönetici E-posta</Label>
                                    <Input type="email" placeholder="admin@kolej.com" {...register("email")} />
                                    {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Yönetici Şifresi</Label>
                                    <Input type="password" {...register("password")} />
                                    {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>İptal</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Oluştur
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
                </div>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="Kurum adı ile ara..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-indigo-500" /> Kurum Listesi
                    </CardTitle>
                    <CardDescription>{meta ? `Toplam ${meta.total} kayıtlı kurum` : "Yükleniyor..."}</CardDescription>
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
                                        <TableHead>Kurum Adı</TableHead>
                                        <TableHead>Durum</TableHead>
                                        <TableHead>Paket</TableHead>
                                        <TableHead>Okul Sayısı</TableHead>
                                        <TableHead>Kayıt Tarihi</TableHead>
                                        <TableHead className="text-right">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tenants.map((tenant) => (
                                        <TableRow key={tenant.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold">
                                                        {tenant.name[0]?.toUpperCase()}
                                                    </div>
                                                    {tenant.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={tenant.status === "active" || !tenant.status ? "success" : "secondary"}>
                                                    {tenant.status === "active" || !tenant.status ? "Aktif" : "Pasif"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {tenant.subscription?.package?.name ?? (
                                                    <span className="text-muted-foreground italic">Paket Yok</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm">{tenant.schools_count ?? "—"}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(tenant.created_at).toLocaleDateString("tr-TR")}
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
                                                        <DropdownMenuItem onClick={() => router.push(`/tenants/${tenant.id}`)}>
                                                            <Eye className="mr-2 h-4 w-4" /> Detayı Gör
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => handleDelete(tenant.id)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Sil
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {tenants.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                Kayıtlı kurum bulunamadı.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            {meta && meta.last_page > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-sm text-muted-foreground">Sayfa {meta.current_page} / {meta.last_page}</p>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" disabled={meta.current_page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                                        <Button variant="outline" size="sm" disabled={meta.current_page === meta.last_page} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
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
