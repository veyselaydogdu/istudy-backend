"use client"

import { useEffect, useState } from "react"
import apiClient from "@/lib/apiClient"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Plus, Loader2, Building, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { cn } from "@/lib/utils"

// Tenant Data Type Definition
type Tenant = {
    id: number
    name: string
    contact_email?: string
    status?: string // active, suspended etc.
    created_at: string
    subscription?: {
        package: {
            name: string
        }
        status: string
    }
}

// Zod Schema for New Tenant
const tenantSchema = z.object({
    name: z.string().min(2, "Kurum adı en az 2 karakter olmalıdır"),
    email: z.string().email("Geçerli bir e-posta adresi giriniz"),
    password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
})

type TenantFormValues = z.infer<typeof tenantSchema>

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Fetch Tenants
    const fetchTenants = async () => {
        try {
            setLoading(true)
            const response = await apiClient.get("/tenants")
            if (response.data.data) {
                setTenants(response.data.data)
            }
        } catch (error) {
            console.error(error)
            toast.error("Kurumlar yüklenirken bir hata oluştu.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTenants()
    }, [])

    // Form Handling
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<TenantFormValues>({
        resolver: zodResolver(tenantSchema),
    })

    const onSubmit = async (data: TenantFormValues) => {
        try {
            // According to PROJECT_MEMORY, register endpoint creates Tenant + User
            // But here we are admin creating a tenant. 
            // We probably need a specific admin endpoint or use the register endpoint.
            // Assuming we use the register endpoint for now as it creates both user & tenant
            const response = await apiClient.post("/auth/register", {
                institution_name: data.name,
                email: data.email,
                password: data.password,
                password_confirmation: data.password // Backend might require this
            })

            if (response.status === 201 || response.data.success) {
                toast.success("Kurum başarıyla oluşturuldu.")
                setIsDialogOpen(false)
                reset()
                fetchTenants() // Refresh list
            }
        } catch (error: any) {
            console.error(error)
            const message = error.response?.data?.message || "Kurum oluşturulurken hata."
            toast.error("Hata", { description: message })
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Kurumlar</h1>
                    <p className="text-muted-foreground">
                        Sisteme kayıtlı eğitim kurumlarını yönetin.
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Yeni Kurum Ekle
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Yeni Kurum Ekle</DialogTitle>
                            <DialogDescription>
                                Yeni bir eğitim kurumu ve yönetici hesabı oluşturun.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Kurum Adı</Label>
                                    <Input id="name" placeholder="Örn: Bilge Kağan Koleji" {...register("name")} />
                                    {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Yönetici E-posta</Label>
                                    <Input id="email" type="email" placeholder="admin@kolej.com" {...register("email")} />
                                    {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Yönetici Şifresi</Label>
                                    <Input id="password" type="password" {...register("password")} />
                                    {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Oluştur
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Kurum Listesi</CardTitle>
                    <CardDescription>Toplam {tenants.length} kayıtlı kurum bulunuyor.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex h-32 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kurum Adı</TableHead>
                                    <TableHead>İletişim</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead>Paket</TableHead>
                                    <TableHead>Kayıt Tarihi</TableHead>
                                    <TableHead className="text-right">İşlemler</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tenants.map((tenant) => (
                                    <TableRow key={tenant.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Building className="h-4 w-4 text-slate-500" />
                                                {tenant.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>{tenant.contact_email || "-"}</TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                                tenant.status === "active" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"
                                            )}>
                                                {tenant.status || "Aktif"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {tenant.subscription?.package?.name || "Paket Yok"}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(tenant.created_at).toLocaleDateString("tr-TR")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Menü aç</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(tenant.id.toString())}>
                                                        ID Kopyala
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>Düzenle</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Sil
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!loading && tenants.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-slate-500">
                                            Kayıtlı kurum bulunamadı.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
