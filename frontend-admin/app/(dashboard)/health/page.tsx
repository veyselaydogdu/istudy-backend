"use client"

import { useEffect, useState, useCallback } from "react"
import apiClient from "@/lib/apiClient"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
    Plus, Loader2, Trash2, AlertTriangle, Stethoscope, Apple, Pill,
    ChevronLeft, ChevronRight, Search, Pencil,
} from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import type { Allergen, MedicalCondition, FoodIngredient, Medication } from "@/types"

type Meta = { current_page: number; last_page: number; per_page: number; total: number }

const RISK_LABELS: Record<string, string> = { low: "Düşük", medium: "Orta", high: "Yüksek" }
const RISK_VARIANT_MAP: Record<string, "success" | "warning" | "danger"> = {
    low: "success", medium: "warning", high: "danger",
}

// ─── Generic CRUD Tab ─────────────────────────────────────────────────────────

type CrudTabProps<T extends { id: number; name: string; created_at: string }> = {
    endpoint: string
    columns: { key: keyof T | string; label: string; render?: (item: T) => React.ReactNode }[]
    formFields: { name: string; label: string; type?: string; options?: { value: string; label: string }[]; required?: boolean }[]
    schema: z.ZodTypeAny
    title: string
    description: string
    icon: React.ReactNode
    addLabel: string
}

function CrudTab<T extends { id: number; name: string; created_at: string }>({
    endpoint, columns, formFields, schema, title, description, icon, addLabel,
}: CrudTabProps<T>) {
    const [items, setItems] = useState<T[]>([])
    const [meta, setMeta] = useState<Meta | null>(null)
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (useForm as any)({ resolver: zodResolver(schema as any) })

    const fetchItems = useCallback(async () => {
        setLoading(true)
        try {
            const params: Record<string, string | number> = { page, per_page: 15 }
            if (search) { params.search = search }
            const res = await apiClient.get(`/admin/${endpoint}`, { params })
            if (res.data?.data) {
                setItems(res.data.data)
                setMeta(res.data.meta ?? null)
            }
        } catch {
            toast.error("Veriler yüklenirken hata oluştu.")
        } finally {
            setLoading(false)
        }
    }, [endpoint, page, search])

    useEffect(() => { setPage(1) }, [search])
    useEffect(() => { fetchItems() }, [fetchItems])

    const onSubmit = async (data: unknown) => {
        try {
            const res = await apiClient.post(`/admin/${endpoint}`, data)
            if (res.data?.success !== false) {
                toast.success("Kayıt başarıyla eklendi.")
                setIsDialogOpen(false)
                reset()
                fetchItems()
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } }
            toast.error(error.response?.data?.message ?? "Kayıt eklenemedi.")
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Bu kaydı silmek istediğinizden emin misiniz?")) { return }
        try {
            await apiClient.delete(`/admin/${endpoint}/${id}`)
            toast.success("Kayıt silindi.")
            setItems((prev) => prev.filter((i) => i.id !== id))
        } catch {
            toast.error("Kayıt silinemedi.")
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">{icon} {title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                className="pl-8 w-40"
                                placeholder="Ara..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm"><Plus className="mr-2 h-4 w-4" />{addLabel}</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{addLabel}</DialogTitle>
                                    <DialogDescription>Sisteme yeni kayıt ekleyin (global — tüm tenant'lar kullanabilir).</DialogDescription>
                                </DialogHeader>
                                {/* @ts-ignore */}
                                <form onSubmit={handleSubmit(onSubmit as any)}>
                                    <div className="grid gap-4 py-4">
                                        {formFields.map((field) => (
                                            <div key={field.name} className="space-y-2">
                                                <Label>{field.label}{field.required && " *"}</Label>
                                                {field.options ? (
                                                    <select
                                                        {...register(field.name)}
                                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                                    >
                                                        <option value="">Seçin (opsiyonel)</option>
                                                        {field.options.map((o) => (
                                                            <option key={o.value} value={o.value}>{o.label}</option>
                                                        ))}
                                                    </select>
                                                ) : field.type === "textarea" ? (
                                                    <Textarea rows={3} {...register(field.name)} />
                                                ) : (
                                                    <Input type={field.type ?? "text"} {...register(field.name)} />
                                                )}
                                                {errors[field.name] && (
                                                    <p className="text-xs text-red-500">
                                                        {(errors[field.name] as { message?: string })?.message}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); reset() }}>İptal</Button>
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Ekle
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
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
                                    {columns.map((col) => (
                                        <TableHead key={String(col.key)}>{col.label}</TableHead>
                                    ))}
                                    <TableHead className="w-12" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item.id}>
                                        {columns.map((col) => (
                                            <TableCell key={String(col.key)} className="text-sm">
                                                {col.render
                                                    ? col.render(item)
                                                    : String((item as Record<string, unknown>)[col.key as string] ?? "—")}
                                            </TableCell>
                                        ))}
                                        <TableCell>
                                            <Button
                                                variant="ghost" size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-700"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {items.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={columns.length + 1} className="h-24 text-center text-muted-foreground">
                                            Kayıt bulunamadı.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        {meta && meta.last_page > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">Sayfa {meta.current_page} / {meta.last_page} — {meta.total} kayıt</p>
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
    )
}

// ─── Ingredient Tab with Allergen Support ────────────────────────────────────

function IngredientTab() {
    const [items, setItems] = useState<FoodIngredient[]>([])
    const [allergens, setAllergens] = useState<Allergen[]>([])
    const [meta, setMeta] = useState<Meta | null>(null)
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editItem, setEditItem] = useState<FoodIngredient | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)

    const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
        useForm({ resolver: zodResolver(ingredientSchema) })

    const {
        register: registerEdit,
        handleSubmit: handleSubmitEdit,
        reset: resetEdit,
        setValue: setEditValue,
        watch: watchEdit,
        formState: { errors: editErrors, isSubmitting: isEditSubmitting },
    } = useForm({ resolver: zodResolver(ingredientSchema) })

    const selectedAllergenIds = watch("allergen_ids") || []
    const selectedEditAllergenIds = watchEdit("allergen_ids") || []

    const fetchItems = useCallback(async () => {
        setLoading(true)
        try {
            const params: Record<string, string | number> = { page, per_page: 15 }
            if (search) { params.search = search }
            const res = await apiClient.get("/admin/food-ingredients", { params })
            if (res.data?.data) {
                setItems(res.data.data)
                setMeta(res.data.meta ?? null)
            }
        } catch {
            toast.error("Veriler yüklenirken hata oluştu.")
        } finally {
            setLoading(false)
        }
    }, [page, search])

    const fetchAllergens = useCallback(async () => {
        try {
            const res = await apiClient.get("/admin/allergens?per_page=100")
            if (res.data?.data) {
                setAllergens(res.data.data)
            }
        } catch {
            // Silent failure - allergens are optional
        }
    }, [])

    useEffect(() => { setPage(1) }, [search])
    useEffect(() => { fetchItems() }, [fetchItems])
    useEffect(() => { fetchAllergens() }, [fetchAllergens])

    const onSubmit = async (data: { name: string; allergen_info?: string; allergen_ids?: number[] }) => {
        try {
            const res = await apiClient.post("/admin/food-ingredients", data)
            if (res.data?.success !== false) {
                toast.success("Besin içeriği başarıyla eklendi.")
                setIsDialogOpen(false)
                reset()
                fetchItems()
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } }
            toast.error(error.response?.data?.message ?? "Besin eklenemedi.")
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Bu kaydı silmek istediğinizden emin misiniz?")) { return }
        try {
            await apiClient.delete(`/admin/food-ingredients/${id}`)
            toast.success("Besin silindi.")
            setItems((prev) => prev.filter((i) => i.id !== id))
        } catch {
            toast.error("Besin silinemedi.")
        }
    }

    const handleOpenEdit = (item: FoodIngredient) => {
        setEditItem(item)
        resetEdit({
            name: item.name,
            allergen_info: item.allergen_info ?? "",
            allergen_ids: item.allergens?.map((a) => a.id) ?? [],
        })
        setIsEditDialogOpen(true)
    }

    const onEditSubmit = async (data: { name: string; allergen_info?: string; allergen_ids?: number[] }) => {
        if (!editItem) { return }
        try {
            const res = await apiClient.put(`/admin/food-ingredients/${editItem.id}`, data)
            if (res.data?.success !== false) {
                toast.success("Besin içeriği güncellendi.")
                setIsEditDialogOpen(false)
                setEditItem(null)
                fetchItems()
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } }
            toast.error(error.response?.data?.message ?? "Besin güncellenemedi.")
        }
    }

    const toggleAllergen = (allergenId: number) => {
        const current = selectedAllergenIds as number[]
        if (current.includes(allergenId)) {
            setValue("allergen_ids", current.filter((id) => id !== allergenId))
        } else {
            setValue("allergen_ids", [...current, allergenId])
        }
    }

    const toggleEditAllergen = (allergenId: number) => {
        const current = selectedEditAllergenIds as number[]
        if (current.includes(allergenId)) {
            setEditValue("allergen_ids", current.filter((id) => id !== allergenId))
        } else {
            setEditValue("allergen_ids", [...current, allergenId])
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Apple className="h-5 w-5 text-green-500" /> Besin & Yemek İçerikleri
                        </CardTitle>
                        <CardDescription>Menülerde kullanılan standart besin tanımları.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                className="pl-8 w-40"
                                placeholder="Ara..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm"><Plus className="mr-2 h-4 w-4" />Besin Ekle</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Besin Ekle</DialogTitle>
                                    <DialogDescription>
                                        Sisteme yeni besin içeriği ekleyin. İçerdiği alerjenleri seçebilirsiniz.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit(onSubmit)}>
                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Besin Adı *</Label>
                                            <Input {...register("name")} />
                                            {errors.name && (
                                                <p className="text-xs text-red-500">{errors.name.message}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Alerjen Bilgisi</Label>
                                            <Textarea rows={2} {...register("allergen_info")} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>İçerdiği Alerjenler (Seçmeli)</Label>
                                            <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                                                {allergens.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground">Alerjen bulunamadı</p>
                                                ) : (
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {allergens.map((allergen) => (
                                                            <label key={allergen.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={(selectedAllergenIds as number[]).includes(allergen.id)}
                                                                    onChange={() => toggleAllergen(allergen.id)}
                                                                    className="rounded border-gray-300"
                                                                />
                                                                <span className="text-sm">{allergen.name}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {(selectedAllergenIds as number[]).length} alerjen seçildi
                                            </p>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); reset() }}>
                                            İptal
                                        </Button>
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Ekle
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
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
                                    <TableHead>Besin Adı</TableHead>
                                    <TableHead>Alerjenler</TableHead>
                                    <TableHead>Alerjen Bilgisi</TableHead>
                                    <TableHead>Eklenme</TableHead>
                                    <TableHead className="w-12" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>
                                            {item.allergens && item.allergens.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {item.allergens.map((a) => (
                                                        <Badge key={a.id} variant="warning" className="text-xs">
                                                            {a.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {item.allergen_info ?? "—"}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(item.created_at).toLocaleDateString("tr-TR")}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost" size="icon"
                                                    className="h-8 w-8 text-slate-500 hover:text-slate-700"
                                                    onClick={() => handleOpenEdit(item)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost" size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-700"
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {items.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            Besin içeriği bulunamadı.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        {meta && meta.last_page > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Sayfa {meta.current_page} / {meta.last_page} — {meta.total} kayıt
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" disabled={meta.current_page === 1} onClick={() => setPage((p) => p - 1)}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" disabled={meta.current_page === meta.last_page} onClick={() => setPage((p) => p + 1)}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>

            {/* Düzenle Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={(o) => { if (!o) { setIsEditDialogOpen(false); setEditItem(null) } }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Besin Düzenle</DialogTitle>
                        <DialogDescription>
                            Besin içeriği bilgilerini güncelleyin.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitEdit(onEditSubmit)}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Besin Adı *</Label>
                                <Input {...registerEdit("name")} />
                                {editErrors.name && (
                                    <p className="text-xs text-red-500">{(editErrors.name as { message?: string })?.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Alerjen Bilgisi</Label>
                                <Textarea rows={2} {...registerEdit("allergen_info")} />
                            </div>
                            <div className="space-y-2">
                                <Label>İçerdiği Alerjenler (Seçmeli)</Label>
                                <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                                    {allergens.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">Alerjen bulunamadı</p>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            {allergens.map((allergen) => (
                                                <label key={allergen.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={(selectedEditAllergenIds as number[]).includes(allergen.id)}
                                                        onChange={() => toggleEditAllergen(allergen.id)}
                                                        className="rounded border-gray-300"
                                                    />
                                                    <span className="text-sm">{allergen.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {(selectedEditAllergenIds as number[]).length} alerjen seçildi
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditItem(null) }}>
                                İptal
                            </Button>
                            <Button type="submit" disabled={isEditSubmitting}>
                                {isEditSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Kaydet
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    )
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────

const allergenSchema = z.object({
    name: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
    description: z.string().optional(),
    risk_level: z.enum(["low", "medium", "high"]).optional(),
})

const conditionSchema = z.object({
    name: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
    description: z.string().optional(),
})

const ingredientSchema = z.object({
    name: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
    allergen_info: z.string().optional(),
    allergen_ids: z.array(z.number()).optional(),
})

const medicationSchema = z.object({
    name: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
    usage_notes: z.string().optional(),
})

export default function HealthPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Sağlık & Beslenme</h1>
                <p className="text-muted-foreground">
                    Merkezi alerjen, tıbbi durum, ilaç ve besin veritabanı yönetimi (global havuz).
                </p>
            </div>

            <Tabs defaultValue="allergens" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="allergens"><AlertTriangle className="mr-1.5 h-4 w-4" />Alerjenler</TabsTrigger>
                    <TabsTrigger value="conditions"><Stethoscope className="mr-1.5 h-4 w-4" />Tıbbi Durumlar</TabsTrigger>
                    <TabsTrigger value="ingredients"><Apple className="mr-1.5 h-4 w-4" />Besin İçerikleri</TabsTrigger>
                    <TabsTrigger value="medications"><Pill className="mr-1.5 h-4 w-4" />İlaçlar</TabsTrigger>
                </TabsList>

                <TabsContent value="allergens">
                    <CrudTab<Allergen>
                        endpoint="allergens"
                        schema={allergenSchema}
                        title="Alerjen Havuzu"
                        description="Sistemde tanımlı global alerjenler. Okullar bu havuzdan seçim yapar."
                        icon={<AlertTriangle className="h-5 w-5 text-orange-500" />}
                        addLabel="Alerjen Ekle"
                        columns={[
                            { key: "name", label: "Alerjen Adı", render: (a) => <span className="font-medium">{a.name}</span> },
                            { key: "description", label: "Açıklama", render: (a) => <span className="text-muted-foreground">{a.description ?? "—"}</span> },
                            {
                                key: "risk_level", label: "Risk",
                                render: (a: Allergen) => a.risk_level
                                    ? <Badge variant={RISK_VARIANT_MAP[a.risk_level]}>{RISK_LABELS[a.risk_level]}</Badge>
                                    : <span className="text-muted-foreground">—</span>,
                            },
                            {
                                key: "created_at", label: "Eklenme",
                                render: (a) => <span className="text-muted-foreground">{new Date(a.created_at).toLocaleDateString("tr-TR")}</span>,
                            },
                        ]}
                        formFields={[
                            { name: "name", label: "Alerjen Adı", required: true },
                            { name: "description", label: "Açıklama", type: "textarea" },
                            {
                                name: "risk_level", label: "Risk Seviyesi",
                                options: [{ value: "low", label: "Düşük" }, { value: "medium", label: "Orta" }, { value: "high", label: "Yüksek" }],
                            },
                        ]}
                    />
                </TabsContent>

                <TabsContent value="conditions">
                    <CrudTab<MedicalCondition>
                        endpoint="medical-conditions"
                        schema={conditionSchema}
                        title="Tıbbi Durumlar"
                        description="Kronik hastalıklar ve tıbbi durumlar (Astım, Epilepsi, Diyabet vb.)."
                        icon={<Stethoscope className="h-5 w-5 text-red-500" />}
                        addLabel="Durum Ekle"
                        columns={[
                            { key: "name", label: "Durum Adı", render: (c) => <span className="font-medium">{c.name}</span> },
                            { key: "description", label: "Açıklama", render: (c) => <span className="text-muted-foreground">{c.description ?? "—"}</span> },
                            {
                                key: "created_at", label: "Eklenme",
                                render: (c) => <span className="text-muted-foreground">{new Date(c.created_at).toLocaleDateString("tr-TR")}</span>,
                            },
                        ]}
                        formFields={[
                            { name: "name", label: "Durum Adı", required: true },
                            { name: "description", label: "Açıklama", type: "textarea" },
                        ]}
                    />
                </TabsContent>

                <TabsContent value="ingredients">
                    <IngredientTab />
                </TabsContent>

                <TabsContent value="medications">
                    <CrudTab<Medication>
                        endpoint="medications"
                        schema={medicationSchema}
                        title="İlaç Havuzu"
                        description="Çocuklar için takibi yapılan ilaç tanımları."
                        icon={<Pill className="h-5 w-5 text-violet-500" />}
                        addLabel="İlaç Ekle"
                        columns={[
                            { key: "name", label: "İlaç Adı", render: (m) => <span className="font-medium">{m.name}</span> },
                            { key: "usage_notes", label: "Kullanım Notu", render: (m: Medication) => <span className="text-muted-foreground">{m.usage_notes ?? "—"}</span> },
                            {
                                key: "created_at", label: "Eklenme",
                                render: (m) => <span className="text-muted-foreground">{new Date(m.created_at).toLocaleDateString("tr-TR")}</span>,
                            },
                        ]}
                        formFields={[
                            { name: "name", label: "İlaç Adı", required: true },
                            { name: "usage_notes", label: "Kullanım Notu", type: "textarea" },
                        ]}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
