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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Loader2, Package as PackageIcon, Pencil, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { cn } from "@/lib/utils"

// Package Data Type
type Package = {
    id: number
    name: string
    max_schools: number
    max_classes_per_school: number
    max_students: number
    price_monthly: number
    price_yearly: number
    is_active: boolean
    features?: string[] // JSON array or similar
}

const packageSchema = z.object({
    name: z.string().min(2, "Paket adı gereklidir"),
    max_schools: z.coerce.number().min(0), // 0 for unlimited
    max_classes_per_school: z.coerce.number().min(0),
    max_students: z.coerce.number().min(0),
    price_monthly: z.coerce.number().min(0),
    price_yearly: z.coerce.number().min(0),
})

type PackageFormValues = z.infer<typeof packageSchema>

export default function PackagesPage() {
    const [packages, setPackages] = useState<Package[]>([])
    const [loading, setLoading] = useState(true)
    const [editingPackage, setEditingPackage] = useState<Package | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<PackageFormValues>({
        // @ts-ignore
        resolver: zodResolver(packageSchema),
        defaultValues: {
            name: "",
            max_schools: 0,
            max_classes_per_school: 0,
            max_students: 0,
            price_monthly: 0,
            price_yearly: 0,
        }
    })

    const fetchPackages = async () => {
        try {
            setLoading(true)
            const response = await apiClient.get("/packages")
            // Assuming response structure based on standard API
            if (response.data.data) {
                setPackages(response.data.data)
            } else if (Array.isArray(response.data)) {
                setPackages(response.data)
            }
        } catch (error) {
            console.error(error)
            toast.error("Paketler yüklenirken hata oluştu.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPackages()
    }, [])

    useEffect(() => {
        if (editingPackage) {
            setValue("name", editingPackage.name)
            setValue("max_schools", editingPackage.max_schools)
            setValue("max_classes_per_school", editingPackage.max_classes_per_school)
            setValue("max_students", editingPackage.max_students)
            setValue("price_monthly", editingPackage.price_monthly)
            setValue("price_yearly", editingPackage.price_yearly)
            setIsDialogOpen(true)
        } else {
            reset()
        }
    }, [editingPackage, setValue, reset])

    const onSubmit = async (data: PackageFormValues) => {
        try {
            let response;
            if (editingPackage) {
                // Update
                response = await apiClient.put(`/admin/packages/${editingPackage.id}`, data)
            } else {
                // Create
                response = await apiClient.post("/admin/packages", data)
            }

            if (response.status === 200 || response.status === 201 || response.data.success) {
                toast.success(`Paket başarıyla ${editingPackage ? 'güncellendi' : 'oluşturuldu'}.`)
                setIsDialogOpen(false)
                setEditingPackage(null)
                fetchPackages()
            }
        } catch (error: any) {
            console.error(error)
            const message = error.response?.data?.message || "İşlem sırasında hata oluştu."
            toast.error("Hata", { description: message })
        }
    }

    const formatLimit = (val: number) => val === 0 ? "Sınırsız" : val;
    const formatCurrency = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Paket Yönetimi</h1>
                    <p className="text-muted-foreground">
                        SaaS abonelik paketlerini ve limitlerini yönetin.
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) setEditingPackage(null);
                }}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setEditingPackage(null)}>
                            <PackageIcon className="mr-2 h-4 w-4" /> Yeni Paket
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingPackage ? 'Paketi Düzenle' : 'Yeni Paket Oluştur'}</DialogTitle>
                            <DialogDescription>
                                Paket limitlerini ve fiyatlandırmasını belirleyin. "0" sınırsız anlamına gelir.
                            </DialogDescription>
                        </DialogHeader>
                        {/* @ts-ignore */}
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Paket Adı</Label>
                                        <Input id="name" placeholder="Örn: Başlangıç" {...register("name")} />
                                        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="max_schools">Max Okul</Label>
                                        <Input id="max_schools" type="number" {...register("max_schools")} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="max_classes">Max Sınıf (Okul Başı)</Label>
                                        <Input id="max_classes" type="number" {...register("max_classes_per_school")} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="max_students">Max Öğrenci</Label>
                                        <Input id="max_students" type="number" {...register("max_students")} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 relative">
                                        <Label htmlFor="price_monthly">Aylık Fiyat (₺)</Label>
                                        <Input id="price_monthly" type="number" step="0.01" {...register("price_monthly")} />
                                    </div>
                                    <div className="space-y-2 relative">
                                        <Label htmlFor="price_yearly">Yıllık Fiyat (₺)</Label>
                                        <Input id="price_yearly" type="number" step="0.01" {...register("price_yearly")} />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>İptal</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Kaydet
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {loading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    </div>
                ) : packages.map((pkg) => (
                    <Card key={pkg.id} className="relative overflow-hidden transition-all hover:shadow-md border-t-4 border-t-indigo-500">
                        <div className="absolute top-4 right-4">
                            <Button size="icon" variant="ghost" onClick={() => setEditingPackage(pkg)}>
                                <Pencil className="h-4 w-4 text-slate-500" />
                            </Button>
                        </div>
                        <CardHeader>
                            <CardTitle className="text-xl">{pkg.name}</CardTitle>
                            <CardDescription className="flex items-baseline gap-1 mt-2">
                                <span className="text-2xl font-bold text-indigo-600">{formatCurrency(pkg.price_monthly)}</span>
                                <span className="text-sm text-slate-500">/ay</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span className="font-semibold">{formatLimit(pkg.max_schools)}</span> Okul
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span className="font-semibold">{formatLimit(pkg.max_classes_per_school)}</span> Sınıf (Okul başı)
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span className="font-semibold">{formatLimit(pkg.max_students)}</span> Öğrenci
                                </li>
                                <li className="flex items-center gap-2 text-slate-500">
                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                                    Yıllık {formatCurrency(pkg.price_yearly)}
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                ))}
                {!loading && packages.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        Henüz paket tanımlanmamış.
                    </div>
                )}
            </div>
        </div>
    )
}
