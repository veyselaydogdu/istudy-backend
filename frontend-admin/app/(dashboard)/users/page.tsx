"use client"

import { useEffect, useState, useCallback } from "react"
import apiClient from "@/lib/apiClient"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2, MoreHorizontal, Plus, UserCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import type { User } from "@/types"

const ROLE_FILTERS: Record<string, string> = {
    teachers: "teacher",
    parents: "parent",
    students: "student",
}

const ROLE_LABELS: Record<string, string> = {
    teacher: "Öğretmen",
    parent: "Veli",
    student: "Öğrenci",
    tenant_owner: "Kurum Sahibi",
    school_admin: "Okul Yöneticisi",
    super_admin: "Süper Admin",
}

const userSchema = z.object({
    name: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
    surname: z.string().optional(),
    email: z.string().email("Geçerli bir e-posta giriniz"),
    password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
    role: z.string().min(1, "Rol seçiniz"),
})

type UserFormValues = z.infer<typeof userSchema>

type Meta = {
    current_page: number
    last_page: number
    per_page: number
    total: number
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [meta, setMeta] = useState<Meta | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("teachers")
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const fetchUsers = useCallback(async () => {
        setLoading(true)
        try {
            const role = ROLE_FILTERS[activeTab]
            const params: Record<string, string | number> = { page, per_page: 15 }
            if (role) { params.role = role }
            if (search) { params.search = search }

            const res = await apiClient.get("/admin/users", { params })
            if (res.data?.data) {
                setUsers(res.data.data)
                setMeta(res.data.meta ?? null)
            }
        } catch {
            toast.error("Kullanıcılar yüklenirken hata oluştu.")
        } finally {
            setLoading(false)
        }
    }, [activeTab, search, page])

    useEffect(() => {
        setPage(1)
    }, [activeTab, search])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    const {
        register, handleSubmit, reset,
        formState: { errors, isSubmitting },
    } = useForm<UserFormValues>({ resolver: zodResolver(userSchema) })

    const onSubmit = async (data: UserFormValues) => {
        try {
            const res = await apiClient.post("/admin/users", data)
            if (res.data?.success) {
                toast.success("Kullanıcı başarıyla oluşturuldu.")
                setIsDialogOpen(false)
                reset()
                fetchUsers()
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } }
            toast.error(error.response?.data?.message || "Kullanıcı oluşturulurken hata oluştu.")
        }
    }

    const handleDelete = async (userId: number) => {
        if (!confirm("Bu kullanıcıyı silmek istediğinizden emin misiniz?")) { return }
        try {
            await apiClient.delete(`/admin/users/${userId}`)
            toast.success("Kullanıcı silindi.")
            fetchUsers()
        } catch {
            toast.error("Kullanıcı silinirken hata oluştu.")
        }
    }

    const getRoleVariant = (role: string): "default" | "success" | "secondary" | "warning" | "danger" => {
        const variants: Record<string, "default" | "success" | "secondary" | "warning" | "danger"> = {
            super_admin: "danger",
            tenant_owner: "default",
            school_admin: "warning",
            teacher: "success",
            parent: "secondary",
        }
        return variants[role] ?? "secondary"
    }

    const tabCounts: Record<string, number | undefined> = {
        teachers: activeTab === "teachers" ? meta?.total : undefined,
        parents: activeTab === "parents" ? meta?.total : undefined,
        students: activeTab === "students" ? meta?.total : undefined,
        all: activeTab === "all" ? meta?.total : undefined,
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Kullanıcı Havuzu</h1>
                    <p className="text-muted-foreground">Tüm kullanıcıları görüntüleyin ve yönetin.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Yeni Kullanıcı</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Yeni Kullanıcı Oluştur</DialogTitle>
                            <DialogDescription>Sisteme yeni bir kullanıcı ekleyin.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Ad</Label>
                                        <Input placeholder="Ad" {...register("name")} />
                                        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Soyad</Label>
                                        <Input placeholder="Soyad" {...register("surname")} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>E-posta</Label>
                                    <Input type="email" placeholder="kullanici@ornek.com" {...register("email")} />
                                    {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Şifre</Label>
                                    <Input type="password" {...register("password")} />
                                    {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Rol</Label>
                                    <select
                                        {...register("role")}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    >
                                        <option value="">Rol seçin...</option>
                                        <option value="teacher">Öğretmen</option>
                                        <option value="parent">Veli</option>
                                        <option value="school_admin">Okul Yöneticisi</option>
                                        <option value="tenant_owner">Kurum Sahibi</option>
                                    </select>
                                    {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>İptal</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Oluştur
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Arama */}
            <div className="flex items-center gap-2 max-w-md">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-8"
                        placeholder="Ad, soyad veya e-posta ile ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="teachers">
                        Öğretmenler {tabCounts.teachers !== undefined && `(${tabCounts.teachers})`}
                    </TabsTrigger>
                    <TabsTrigger value="parents">
                        Veliler {tabCounts.parents !== undefined && `(${tabCounts.parents})`}
                    </TabsTrigger>
                    <TabsTrigger value="students">
                        Öğrenciler {tabCounts.students !== undefined && `(${tabCounts.students})`}
                    </TabsTrigger>
                    <TabsTrigger value="all">Tümü</TabsTrigger>
                </TabsList>

                {["teachers", "parents", "students", "all"].map((tab) => (
                    <TabsContent key={tab} value={tab}>
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {tab === "teachers" && "Öğretmen Listesi"}
                                    {tab === "parents" && "Veli Listesi"}
                                    {tab === "students" && "Öğrenci Listesi"}
                                    {tab === "all" && "Tüm Kullanıcılar"}
                                </CardTitle>
                                <CardDescription>
                                    {meta ? `Toplam ${meta.total} kullanıcı` : "Yükleniyor..."}
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
                                                    <TableHead>Kullanıcı</TableHead>
                                                    <TableHead>E-posta</TableHead>
                                                    <TableHead>Rol</TableHead>
                                                    <TableHead>Kurum</TableHead>
                                                    <TableHead>Kayıt</TableHead>
                                                    <TableHead className="text-right">İşlem</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {users.map((user) => (
                                                    <TableRow key={user.id}>
                                                        <TableCell className="font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                                                                    {user.name?.[0]?.toUpperCase()}{user.surname?.[0]?.toUpperCase()}
                                                                </div>
                                                                {user.name} {user.surname}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                                                        <TableCell>
                                                            {user.roles?.map((role) => (
                                                                <Badge key={role.id} variant={getRoleVariant(role.name)}>
                                                                    {ROLE_LABELS[role.name] ?? role.name}
                                                                </Badge>
                                                            ))}
                                                        </TableCell>
                                                        <TableCell className="text-sm">{user.tenant?.name ?? "—"}</TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {new Date(user.created_at).toLocaleDateString("tr-TR")}
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
                                                                    <DropdownMenuItem>
                                                                        <UserCircle className="mr-2 h-4 w-4" /> Profili Gör
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="text-red-600"
                                                                        onClick={() => handleDelete(user.id)}
                                                                    >
                                                                        Sil
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {users.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                            Kullanıcı bulunamadı.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>

                                        {/* Pagination */}
                                        {meta && meta.last_page > 1 && (
                                            <div className="flex items-center justify-between mt-4">
                                                <p className="text-sm text-muted-foreground">
                                                    Sayfa {meta.current_page} / {meta.last_page}
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
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}
