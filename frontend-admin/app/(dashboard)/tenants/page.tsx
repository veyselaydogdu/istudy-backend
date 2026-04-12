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
import { useTranslation } from "@/hooks/useTranslation"

type Meta = { current_page: number; last_page: number; per_page: number; total: number }

export default function TenantsPage() {
    const { t } = useTranslation()
    const router = useRouter()
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [meta, setMeta] = useState<Meta | null>(null)
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)

    const newTenantSchema = z.object({
        full_name: z.string().min(2, t('tenants.form.fullNameRequired')),
        institution_name: z.string().min(2, t('tenants.form.institutionNameMin')),
        email: z.string().email(t('validation.emailRequired')),
        password: z.string().min(6, t('validation.passwordMin')),
    })
    type NewTenantFormValues = z.infer<typeof newTenantSchema>

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
            toast.error(t('tenants.loadError'))
        } finally {
            setLoading(false)
        }
    }, [page, search, t])

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
            toast.success(t('tenants.createSuccess'))
            setIsDialogOpen(false)
            reset()
            fetchTenants()
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } }
            toast.error(error.response?.data?.message ?? t('tenants.createError'))
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm(t('tenants.deleteConfirmTitle'))) { return }
        try {
            await apiClient.delete(`/admin/tenants/${id}`)
            toast.success(t('tenants.deleteSuccess'))
            fetchTenants()
        } catch {
            toast.error(t('tenants.deleteError'))
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('tenants.title')}</h1>
                    <p className="text-muted-foreground">{t('tenants.subtitle')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            exportToCsv("kurumlar", tenants, [
                                { key: "id", label: "ID" },
                                { key: "name", label: t('tenants.tenantName') },
                                { key: "status", label: t('common.status'), format: (r) => (r.status === "active" || !r.status ? t('common.active') : t('common.inactive')) },
                                { key: "subscription", label: t('subscriptions.package'), format: (r) => (r.subscription as Tenant["subscription"])?.package?.name ?? "" },
                                { key: "schools_count", label: t('tenants.schoolCount'), format: (r) => String(r.schools_count ?? "") },
                                { key: "created_at", label: t('tenants.createdAt'), format: (r) => new Date(r.created_at as string).toLocaleDateString("tr-TR") },
                            ])
                        }
                    >
                        <Download className="mr-2 h-4 w-4" /> {t('common.csvExport')}
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> {t('tenants.addTenant')}</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('tenants.addTenant')}</DialogTitle>
                            <DialogDescription>{t('tenants.addDescription')}</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>{t('tenants.form.adminFullName')}</Label>
                                    <Input placeholder={t('tenants.form.adminFullNamePlaceholder')} {...register("full_name")} />
                                    {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('tenants.form.institutionName')}</Label>
                                    <Input placeholder={t('tenants.form.institutionNamePlaceholder')} {...register("institution_name")} />
                                    {errors.institution_name && <p className="text-xs text-red-500">{errors.institution_name.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('tenants.form.adminEmail')}</Label>
                                    <Input type="email" placeholder="admin@kolej.com" {...register("email")} />
                                    {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('tenants.form.adminPassword')}</Label>
                                    <Input type="password" {...register("password")} />
                                    {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t('common.cancel')}</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('common.create')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
                </div>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder={t('tenants.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-indigo-500" /> {t('tenants.listTitle')}
                    </CardTitle>
                    <CardDescription>{meta ? t('tenants.totalCount', { count: meta.total }) : t('common.loading')}</CardDescription>
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
                                        <TableHead>{t('tenants.tenantName')}</TableHead>
                                        <TableHead>{t('common.status')}</TableHead>
                                        <TableHead>{t('subscriptions.package')}</TableHead>
                                        <TableHead>{t('tenants.schoolCount')}</TableHead>
                                        <TableHead>{t('tenants.createdAt')}</TableHead>
                                        <TableHead className="text-right">{t('common.actions')}</TableHead>
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
                                                    {tenant.status === "active" || !tenant.status ? t('common.active') : t('common.inactive')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {tenant.subscription?.package?.name ?? (
                                                    <span className="text-muted-foreground italic">{t('tenants.noPackage')}</span>
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
                                                        <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => router.push(`/tenants/${tenant.id}`)}>
                                                            <Eye className="mr-2 h-4 w-4" /> {t('common.viewDetails')}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => handleDelete(tenant.id)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> {t('common.delete')}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {tenants.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                {t('tenants.noRecord')}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            {meta && meta.last_page > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-sm text-muted-foreground">{t('tenants.pageOf', { current: meta.current_page, total: meta.last_page })}</p>
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
