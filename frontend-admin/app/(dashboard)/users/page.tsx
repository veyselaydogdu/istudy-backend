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
import { Search, Loader2, MoreHorizontal, Plus, UserCircle, ChevronLeft, ChevronRight, Mail, Building, Calendar } from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import type { User } from "@/types"
import { useTranslation } from "@/hooks/useTranslation"

const ROLE_FILTERS: Record<string, string> = {
    teachers: "teacher",
    parents: "parent",
    students: "student",
}

type Meta = {
    current_page: number
    last_page: number
    per_page: number
    total: number
}

export default function UsersPage() {
    const { t } = useTranslation()

    const ROLE_LABELS: Record<string, string> = {
        teacher: t('users.roles.teacher'),
        parent: t('users.roles.parent'),
        student: t('users.roles.student'),
        tenant_owner: t('users.roles.tenantOwner'),
        school_admin: t('users.roles.schoolAdmin'),
        super_admin: t('users.roles.superAdmin'),
    }

    const userSchema = z.object({
        name: z.string().min(2, t('users.form.nameMin')),
        surname: z.string().optional(),
        email: z.string().email(t('validation.emailRequired')),
        password: z.string().min(6, t('validation.passwordMin')),
        role: z.string().min(1, t('users.form.roleRequired')),
    })
    type UserFormValues = z.infer<typeof userSchema>

    const [users, setUsers] = useState<User[]>([])
    const [meta, setMeta] = useState<Meta | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("teachers")
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [profileUser, setProfileUser] = useState<User | null>(null)
    const [isProfileOpen, setIsProfileOpen] = useState(false)

    const fetchUsers = useCallback(async () => {
        setLoading(true)
        setUsers([])
        try {
            const role = ROLE_FILTERS[activeTab]
            const params: Record<string, string | number> = { page, per_page: 15 }
            if (role) { params.role = role }
            if (search) { params.search = search }

            const res = await apiClient.get("/admin/users", { params })
            if (res.data?.data) {
                setUsers(res.data.data)
                setMeta(res.data.meta ?? null)
            } else {
                setUsers([])
                setMeta(null)
            }
        } catch {
            toast.error(t('users.loadError'))
            setUsers([])
            setMeta(null)
        } finally {
            setLoading(false)
        }
    }, [activeTab, search, page, t])

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
                toast.success(t('users.createSuccess'))
                setIsDialogOpen(false)
                reset()
                fetchUsers()
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } }
            toast.error(error.response?.data?.message || t('users.createError'))
        }
    }

    const handleDelete = async (userId: number) => {
        if (!confirm(t('swal.deleteTitle'))) { return }
        try {
            await apiClient.delete(`/admin/users/${userId}`)
            toast.success(t('users.deleteSuccess'))
            fetchUsers()
        } catch {
            toast.error(t('users.deleteError'))
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

    const getTabListTitle = (tab: string) => {
        if (tab === "teachers") { return t('users.listTitles.teachers') }
        if (tab === "parents") { return t('users.listTitles.parents') }
        if (tab === "students") { return t('users.listTitles.students') }
        return t('users.listTitles.all')
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('users.title')}</h1>
                    <p className="text-muted-foreground">{t('users.subtitle')}</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> {t('users.addUser')}</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('users.createTitle')}</DialogTitle>
                            <DialogDescription>{t('users.createDescription')}</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{t('users.form.firstName')}</Label>
                                        <Input placeholder={t('users.form.firstName')} {...register("name")} />
                                        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('users.form.lastName')}</Label>
                                        <Input placeholder={t('users.form.lastName')} {...register("surname")} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('common.email')}</Label>
                                    <Input type="email" placeholder="kullanici@ornek.com" {...register("email")} />
                                    {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('auth.password')}</Label>
                                    <Input type="password" {...register("password")} />
                                    {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('users.role')}</Label>
                                    <select
                                        {...register("role")}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    >
                                        <option value="">{t('users.form.selectRole')}</option>
                                        <option value="teacher">{t('users.roles.teacher')}</option>
                                        <option value="parent">{t('users.roles.parent')}</option>
                                        <option value="school_admin">{t('users.roles.schoolAdmin')}</option>
                                        <option value="tenant_owner">{t('users.roles.tenantOwner')}</option>
                                    </select>
                                    {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t('common.cancel')}</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t('common.create')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center gap-2 max-w-md">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-8"
                        placeholder={t('users.searchPlaceholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="teachers">
                        {t('users.tabs.teachers')} {tabCounts.teachers !== undefined && `(${tabCounts.teachers})`}
                    </TabsTrigger>
                    <TabsTrigger value="parents">
                        {t('users.tabs.parents')} {tabCounts.parents !== undefined && `(${tabCounts.parents})`}
                    </TabsTrigger>
                    <TabsTrigger value="students">
                        {t('users.tabs.students')} {tabCounts.students !== undefined && `(${tabCounts.students})`}
                    </TabsTrigger>
                    <TabsTrigger value="all">{t('users.tabs.all')}</TabsTrigger>
                </TabsList>

                {["teachers", "parents", "students", "all"].map((tab) => (
                    <TabsContent key={tab} value={tab}>
                        <Card>
                            <CardHeader>
                                <CardTitle>{getTabListTitle(tab)}</CardTitle>
                                <CardDescription>
                                    {meta ? t('users.totalCount', { count: meta.total }) : t('common.loading')}
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
                                                    <TableHead>{t('users.userName')}</TableHead>
                                                    <TableHead>{t('common.email')}</TableHead>
                                                    <TableHead>{t('users.role')}</TableHead>
                                                    <TableHead>{t('users.tenant')}</TableHead>
                                                    <TableHead>{t('tenants.createdAt')}</TableHead>
                                                    <TableHead className="text-right">{t('common.actions')}</TableHead>
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
                                                                    <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                                                                    <DropdownMenuItem onClick={() => { setProfileUser(user); setIsProfileOpen(true) }}>
                                                                        <UserCircle className="mr-2 h-4 w-4" /> {t('users.viewProfile')}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="text-red-600"
                                                                        onClick={() => handleDelete(user.id)}
                                                                    >
                                                                        {t('common.delete')}
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {users.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                            {t('users.noRecord')}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>

                                        {meta && meta.last_page > 1 && (
                                            <div className="flex items-center justify-between mt-4">
                                                <p className="text-sm text-muted-foreground">
                                                    {t('subscriptions.pageOf', { current: meta.current_page, total: meta.last_page })}
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

            <Dialog open={isProfileOpen} onOpenChange={(o) => { if (!o) { setIsProfileOpen(false); setProfileUser(null) } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('users.profileTitle')}</DialogTitle>
                        <DialogDescription>{t('users.profileDescription')}</DialogDescription>
                    </DialogHeader>
                    {profileUser && (
                        <div className="space-y-4 py-2">
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xl font-bold">
                                    {profileUser.name?.[0]?.toUpperCase()}{profileUser.surname?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-lg font-semibold">{profileUser.name} {profileUser.surname ?? ""}</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {profileUser.roles?.map((role) => (
                                            <Badge key={role.id} variant={getRoleVariant(role.name)}>
                                                {ROLE_LABELS[role.name] ?? role.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="grid gap-3 border rounded-md p-4 bg-muted/30">
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span>{profileUser.email}</span>
                                </div>
                                {profileUser.tenant?.name && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <span>{profileUser.tenant.name}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-sm">
                                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span>{t('users.registeredAt')}: {new Date(profileUser.created_at).toLocaleDateString("tr-TR")}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsProfileOpen(false); setProfileUser(null) }}>{t('common.close')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
