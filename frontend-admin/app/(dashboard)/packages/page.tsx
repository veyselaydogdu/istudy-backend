"use client"

import { useEffect, useState } from "react"
import apiClient from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { Loader2, Package as PackageIcon, Pencil, CheckCircle2, X, Trash2, Plus, Settings } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import type { Package, PackageFeature } from "@/types"
import { useTranslation } from "@/hooks/useTranslation"

const packageSchema = z.object({
    name: z.string().min(2, "Paket adı gereklidir"),
    description: z.string().optional(),
    max_schools: z.coerce.number().min(0),
    max_classes_per_school: z.coerce.number().min(0),
    max_students: z.coerce.number().min(0),
    monthly_price: z.coerce.number().min(0.01),
    yearly_price: z.coerce.number().min(0.01),
    sort_order: z.coerce.number().min(0).optional(),
})

const featureSchema = z.object({
    key: z.string().min(2).regex(/^[a-z0-9_]+$/),
    label: z.string().min(2),
    value_type: z.enum(["bool", "text"]),
    description: z.string().optional(),
    display_order: z.coerce.number().min(0).optional(),
})

type PackageFormValues = z.infer<typeof packageSchema>
type FeatureFormValues = z.infer<typeof featureSchema>

export default function PackagesPage() {
    const { t } = useTranslation()
    const [packages, setPackages] = useState<Package[]>([])
    const [availableFeatures, setAvailableFeatures] = useState<PackageFeature[]>([])
    const [selectedFeatures, setSelectedFeatures] = useState<Record<number, string>>({}) // feature_id => value
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
            description: "",
            max_schools: 0,
            max_classes_per_school: 0,
            max_students: 0,
            monthly_price: 0,
            yearly_price: 0,
            sort_order: 0,
        }
    })

    const fetchPackages = async () => {
        try {
            setLoading(true)
            const response = await apiClient.get("/admin/packages")
            if (response.data?.data) {
                setPackages(response.data.data)
            }
        } catch (error) {
            console.error(error)
            toast.error(t('packages.loadError'))
        } finally {
            setLoading(false)
        }
    }

    const fetchFeatures = async () => {
        try {
            const response = await apiClient.get("/admin/package-features")
            if (response.data?.data) {
                setAvailableFeatures(response.data.data)
            }
        } catch (error) {
            console.error("Features fetch error:", error)
        }
    }

    useEffect(() => {
        fetchPackages()
        fetchFeatures()
    }, [])

    useEffect(() => {
        if (editingPackage) {
            reset({
                name: editingPackage.name,
                description: editingPackage.description || "",
                max_schools: editingPackage.max_schools,
                max_classes_per_school: editingPackage.max_classes_per_school,
                max_students: editingPackage.max_students,
                monthly_price: editingPackage.monthly_price,
                yearly_price: editingPackage.yearly_price,
                sort_order: editingPackage.sort_order || 0,
            })
            // Set selected features
            const featureMap: Record<number, string> = {}
            editingPackage.package_features?.forEach(f => {
                featureMap[f.id] = f.value || ""
            })
            setSelectedFeatures(featureMap)
            setIsDialogOpen(true)
        } else {
            reset({
                name: "",
                description: "",
                max_schools: 0,
                max_classes_per_school: 0,
                max_students: 0,
                monthly_price: 0,
                yearly_price: 0,
                sort_order: 0,
            })
            setSelectedFeatures({})
        }
    }, [editingPackage, reset])

    const onSubmit = async (data: PackageFormValues) => {
        try {
            // Prepare package_features array
            const package_features = Object.entries(selectedFeatures)
                .filter(([_, value]) => value !== "" && value !== undefined)
                .map(([feature_id, value]) => ({
                    feature_id: parseInt(feature_id),
                    value: value
                }))

            const payload = {
                ...data,
                package_features: package_features.length > 0 ? package_features : undefined
            }

            let response;
            if (editingPackage) {
                response = await apiClient.put(`/admin/packages/${editingPackage.id}`, payload)
            } else {
                response = await apiClient.post("/admin/packages", payload)
            }

            if (response.status === 200 || response.status === 201 || response.data.success) {
                toast.success(editingPackage ? t('packages.updateSuccess') : t('packages.createSuccess'))
                setIsDialogOpen(false)
                setEditingPackage(null)
                setSelectedFeatures({})
                fetchPackages()
            }
        } catch (error: any) {
            console.error(error)
            const message = error.response?.data?.message || t('common.error')
            toast.error(t('common.error'), { description: message })
        }
    }

    const formatLimit = (val: number) => val === 0 ? t('packages.unlimited') : val;
    const formatCurrency = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('packages.title')}</h1>
                <p className="text-muted-foreground">
                    {t('packages.subtitle')}
                </p>
            </div>

            <Tabs defaultValue="packages" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="packages">
                        <PackageIcon className="mr-1.5 h-4 w-4" />{t('packages.packagesTab')}
                    </TabsTrigger>
                    <TabsTrigger value="features">
                        <Settings className="mr-1.5 h-4 w-4" />{t('packages.featuresTab')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="packages" className="space-y-4">
                    <div className="flex justify-end">
                        <Dialog open={isDialogOpen} onOpenChange={(open) => {
                            setIsDialogOpen(open);
                            if (!open) setEditingPackage(null);
                        }}>
                            <DialogTrigger asChild>
                                <Button onClick={() => setEditingPackage(null)}>
                                    <Plus className="mr-2 h-4 w-4" /> {t('packages.addPackage')}
                                </Button>
                            </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingPackage ? t('packages.editPackage') : t('packages.createPackage')}</DialogTitle>
                            <DialogDescription>
                                {t('packages.limitDescription')}
                            </DialogDescription>
                        </DialogHeader>
                        {/* @ts-ignore */}
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">{t('packages.packageName')}</Label>
                                        <Input id="name" placeholder="Örn: Başlangıç" {...register("name")} />
                                        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="sort_order">{t('packages.sortOrder')}</Label>
                                        <Input id="sort_order" type="number" {...register("sort_order")} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">{t('common.description')}</Label>
                                    <Textarea id="description" rows={2} {...register("description")} />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="max_schools">{t('packages.maxSchools')}</Label>
                                        <Input id="max_schools" type="number" {...register("max_schools")} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="max_classes">{t('packages.maxClassPerSchool')}</Label>
                                        <Input id="max_classes" type="number" {...register("max_classes_per_school")} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="max_students">{t('packages.maxStudents')}</Label>
                                        <Input id="max_students" type="number" {...register("max_students")} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 relative">
                                        <Label htmlFor="monthly_price">{t('packages.monthlyPriceTL')}</Label>
                                        <Input id="monthly_price" type="number" step="0.01" {...register("monthly_price")} />
                                        {errors.monthly_price && <p className="text-xs text-red-500">{errors.monthly_price.message}</p>}
                                    </div>
                                    <div className="space-y-2 relative">
                                        <Label htmlFor="yearly_price">{t('packages.yearlyPriceTL')}</Label>
                                        <Input id="yearly_price" type="number" step="0.01" {...register("yearly_price")} />
                                        {errors.yearly_price && <p className="text-xs text-red-500">{errors.yearly_price.message}</p>}
                                    </div>
                                </div>

                                {/* Package Features */}
                                {availableFeatures.length > 0 && (
                                    <div className="space-y-2">
                                        <Label>{t('packages.packageFeatures')}</Label>
                                        <div className="border rounded-md p-3 space-y-2">
                                            {availableFeatures.map((feature) => (
                                                <div key={feature.id} className="flex items-center gap-3">
                                                    {feature.value_type === 'bool' ? (
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedFeatures[feature.id] === "1"}
                                                                onChange={(e) => setSelectedFeatures(prev => ({
                                                                    ...prev,
                                                                    [feature.id]: e.target.checked ? "1" : ""
                                                                }))}
                                                                className="rounded border-gray-300"
                                                            />
                                                            <span className="text-sm">{feature.label}</span>
                                                        </label>
                                                    ) : (
                                                        <div className="flex-1 flex items-center gap-2">
                                                            <Label className="text-sm w-32">{feature.label}:</Label>
                                                            <Input
                                                                size={1}
                                                                value={selectedFeatures[feature.id] || ""}
                                                                onChange={(e) => setSelectedFeatures(prev => ({
                                                                    ...prev,
                                                                    [feature.id]: e.target.value
                                                                }))}
                                                                placeholder={t('packages.valuePlaceholder')}
                                                                className="flex-1"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t('common.cancel')}</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t('common.save')}
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
                            {pkg.description && (
                                <p className="text-xs text-muted-foreground mt-1">{pkg.description}</p>
                            )}
                            <CardDescription className="flex items-baseline gap-1 mt-2">
                                <span className="text-2xl font-bold text-indigo-600">{formatCurrency(pkg.monthly_price)}</span>
                                <span className="text-sm text-slate-500">/ay</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span className="font-semibold">{formatLimit(pkg.max_schools)}</span> {t('packages.schoolUnit')}
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span className="font-semibold">{formatLimit(pkg.max_classes_per_school)}</span> {t('packages.classPerSchool')}
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span className="font-semibold">{formatLimit(pkg.max_students)}</span> {t('packages.studentUnit')}
                                </li>
                                <li className="flex items-center gap-2 text-slate-500">
                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                                    {t('packages.yearlyLabel')} {formatCurrency(pkg.yearly_price)}
                                </li>
                            </ul>
                            {pkg.package_features && pkg.package_features.length > 0 && (
                                <div className="border-t pt-3 mt-3">
                                    <p className="text-xs font-semibold text-muted-foreground mb-2">{t('packages.features')}:</p>
                                    <ul className="space-y-1">
                                        {pkg.package_features.map((f) => (
                                            <li key={f.id} className="text-xs flex items-center gap-1.5">
                                                <CheckCircle2 className="h-3 w-3 text-blue-500" />
                                                {f.label}
                                                {f.value_type === 'text' && f.value && `: ${f.value}`}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {!loading && packages.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        {t('packages.noPackage')}
                    </div>
                )}
            </div>
        </TabsContent>

        <TabsContent value="features">
            <FeaturesManagement
                availableFeatures={availableFeatures}
                onUpdate={fetchFeatures}
            />
        </TabsContent>
    </Tabs>
        </div>
    )
}

// ─── Features Management Component ────────────────────────────────────────────

function FeaturesManagement({
    availableFeatures,
    onUpdate
}: {
    availableFeatures: PackageFeature[]
    onUpdate: () => void
}) {
    const { t } = useTranslation()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingFeature, setEditingFeature] = useState<PackageFeature | null>(null)

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FeatureFormValues>({
        // @ts-ignore
        resolver: zodResolver(featureSchema),
        defaultValues: {
            key: "",
            label: "",
            value_type: "bool",
            description: "",
            display_order: 0,
        }
    })

    useEffect(() => {
        if (editingFeature) {
            reset({
                key: editingFeature.key,
                label: editingFeature.label,
                value_type: editingFeature.value_type,
                description: editingFeature.description || "",
                display_order: editingFeature.display_order || 0,
            })
            setIsDialogOpen(true)
        } else {
            reset({
                key: "",
                label: "",
                value_type: "bool",
                description: "",
                display_order: 0,
            })
        }
    }, [editingFeature, reset])

    const onSubmit = async (data: FeatureFormValues) => {
        try {
            if (editingFeature) {
                await apiClient.put(`/admin/package-features/${editingFeature.id}`, data)
                toast.success(t('packages.featureUpdated'))
            } else {
                await apiClient.post("/admin/package-features", data)
                toast.success(t('packages.featureCreated'))
            }
            setIsDialogOpen(false)
            setEditingFeature(null)
            onUpdate()
        } catch (error: any) {
            const message = error.response?.data?.message || t('common.error')
            toast.error(message)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm(t('swal.deleteTitle'))) { return }
        try {
            await apiClient.delete(`/admin/package-features/${id}`)
            toast.success(t('packages.featureDeleted'))
            onUpdate()
        } catch (error: any) {
            const message = error.response?.data?.message || t('common.error')
            toast.error(message)
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5 text-indigo-500" />
                            {t('packages.featuresTitle')}
                        </CardTitle>
                        <CardDescription>
                            {t('packages.featuresSubtitle')}
                        </CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open)
                        if (!open) setEditingFeature(null)
                    }}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setEditingFeature(null)}>
                                <Plus className="mr-2 h-4 w-4" /> {t('packages.addFeatureBtn')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingFeature ? t('packages.editFeature') : t('packages.addFeatureTitle')}</DialogTitle>
                                <DialogDescription>
                                    {t('packages.featureSubtitle')}
                                </DialogDescription>
                            </DialogHeader>
                            {/* @ts-ignore */}
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label>{t('packages.featureKeyLabel')}</Label>
                                        <Input placeholder="unlimited_users" {...register("key")} />
                                        <p className="text-xs text-muted-foreground">{t('packages.featureKeyHint')}</p>
                                        {errors.key && <p className="text-xs text-red-500">{errors.key.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('packages.featureLabelLabel')}</Label>
                                        <Input placeholder="Sınırsız Kullanıcı" {...register("label")} />
                                        {errors.label && <p className="text-xs text-red-500">{errors.label.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('packages.featureValueType')}</Label>
                                        <select {...register("value_type")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                                            <option value="bool">{t('packages.featureTypeCheckbox')}</option>
                                            <option value="text">{t('packages.featureTypeText')}</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('packages.featureDescriptionLabel')}</Label>
                                        <Textarea rows={2} {...register("description")} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('packages.featureSortOrder')}</Label>
                                        <Input type="number" {...register("display_order")} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t('common.cancel')}</Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {t('common.save')}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('packages.featureKeyCol')}</TableHead>
                            <TableHead>{t('packages.featureLabelCol')}</TableHead>
                            <TableHead>{t('packages.featureTypeCol')}</TableHead>
                            <TableHead>{t('packages.featureOrderCol')}</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {availableFeatures.map((feature) => (
                            <TableRow key={feature.id}>
                                <TableCell className="font-mono text-sm">{feature.key}</TableCell>
                                <TableCell className="font-medium">{feature.label}</TableCell>
                                <TableCell>
                                    <Badge variant={feature.value_type === "bool" ? "success" : "secondary"}>
                                        {feature.value_type === "bool" ? "Checkbox" : "Text"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{feature.display_order || 0}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8"
                                            onClick={() => setEditingFeature(feature)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-red-500 hover:text-red-700"
                                            onClick={() => handleDelete(feature.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {availableFeatures.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    {t('packages.noFeature')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
