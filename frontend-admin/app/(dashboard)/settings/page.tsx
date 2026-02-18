"use client"

import { useEffect, useState, useCallback } from "react"
import apiClient from "@/lib/apiClient"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
    Globe, DollarSign, Loader2, RefreshCw, Plus, Search, ChevronLeft, ChevronRight, Star,
} from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import type { Country, Currency } from "@/types"

type Meta = { current_page: number; last_page: number; per_page: number; total: number }

const currencySchema = z.object({
    code: z.string().min(3).max(3, "ISO 4217 — 3 karakter"),
    name: z.string().min(2, "Para birimi adı gereklidir"),
    symbol: z.string().min(1, "Sembol gereklidir"),
    decimal_places: z.coerce.number().min(0).max(6),
})
type CurrencyFormValues = z.infer<typeof currencySchema>

// ─── Countries Tab ─────────────────────────────────────────────────────────

function CountriesTab() {
    const [countries, setCountries] = useState<Country[]>([])
    const [meta, setMeta] = useState<Meta | null>(null)
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)

    const fetchCountries = useCallback(async () => {
        setLoading(true)
        try {
            const params: Record<string, string | number> = { page, per_page: 20 }
            if (search) { params.search = search }
            const res = await apiClient.get("/admin/countries", { params })
            if (res.data?.data) {
                setCountries(res.data.data)
                setMeta(res.data.meta ?? null)
            }
        } catch {
            toast.error("Ülkeler yüklenirken hata oluştu.")
        } finally {
            setLoading(false)
        }
    }, [page, search])

    useEffect(() => { setPage(1) }, [search])
    useEffect(() => { fetchCountries() }, [fetchCountries])

    const handleSync = async () => {
        if (!confirm("Tüm ülkeler RestCountries API'den senkronize edilecek. Devam edilsin mi?")) { return }
        setSyncing(true)
        try {
            const res = await apiClient.post("/admin/countries/sync")
            toast.success(res.data?.message ?? "Senkronizasyon tamamlandı.")
            fetchCountries()
        } catch {
            toast.error("Senkronizasyon sırasında hata oluştu.")
        } finally {
            setSyncing(false)
        }
    }

    const handleToggleActive = async (id: number) => {
        try {
            await apiClient.patch(`/admin/countries/${id}/toggle-active`)
            setCountries((prev) =>
                prev.map((c) => c.id === id ? { ...c, is_active: !c.is_active } : c)
            )
        } catch {
            toast.error("Durum güncellenemedi.")
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-blue-500" /> Ülke Tanımları
                        </CardTitle>
                        <CardDescription>
                            {meta ? `${meta.total} ülke` : "Yükleniyor..."} — RestCountries API ile senkronize edilir.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                className="pl-8 w-40"
                                placeholder="Ülke ara..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" onClick={handleSync} disabled={syncing}>
                            {syncing
                                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                : <RefreshCw className="mr-2 h-4 w-4" />}
                            Senkronize Et
                        </Button>
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
                                    <TableHead>Bayrak</TableHead>
                                    <TableHead>Ülke</TableHead>
                                    <TableHead>ISO2</TableHead>
                                    <TableHead>Telefon Kodu</TableHead>
                                    <TableHead>Bölge</TableHead>
                                    <TableHead>Para Birimi</TableHead>
                                    <TableHead>Durum</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {countries.map((country) => (
                                    <TableRow key={country.id}>
                                        <TableCell className="text-xl">{country.flag_emoji ?? "🏳"}</TableCell>
                                        <TableCell className="font-medium">{country.name}</TableCell>
                                        <TableCell className="font-mono text-sm">{country.iso2}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {country.phone_code ? `+${country.phone_code}` : "—"}
                                        </TableCell>
                                        <TableCell className="text-sm">{country.region ?? "—"}</TableCell>
                                        <TableCell className="text-sm">{country.currency_code ?? "—"}</TableCell>
                                        <TableCell>
                                            <button onClick={() => handleToggleActive(country.id)}>
                                                <Badge variant={country.is_active ? "success" : "secondary"}>
                                                    {country.is_active ? "Aktif" : "Pasif"}
                                                </Badge>
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {countries.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            Ülke bulunamadı. Önce senkronize edin.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
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
    )
}

// ─── Currencies Tab ────────────────────────────────────────────────────────

function CurrenciesTab() {
    const [currencies, setCurrencies] = useState<Currency[]>([])
    const [loading, setLoading] = useState(true)
    const [fetchingRates, setFetchingRates] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const {
        register, handleSubmit, reset,
        formState: { errors, isSubmitting },
    } = useForm<CurrencyFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(currencySchema) as any,
        defaultValues: { code: "", name: "", symbol: "", decimal_places: 2 },
    })

    const fetchCurrencies = useCallback(async () => {
        setLoading(true)
        try {
            const res = await apiClient.get("/admin/currencies")
            if (res.data?.data) { setCurrencies(res.data.data) }
        } catch {
            toast.error("Para birimleri yüklenirken hata oluştu.")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchCurrencies() }, [fetchCurrencies])

    const onSubmit = async (data: CurrencyFormValues) => {
        try {
            const res = await apiClient.post("/admin/currencies", data)
            if (res.data?.success) {
                toast.success("Para birimi eklendi.")
                setIsDialogOpen(false)
                reset()
                fetchCurrencies()
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } }
            toast.error(error.response?.data?.message ?? "Hata oluştu.")
        }
    }

    const handleFetchRates = async () => {
        setFetchingRates(true)
        try {
            const res = await apiClient.post("/admin/currencies/fetch-rates")
            toast.success(res.data?.message ?? "Kurlar güncellendi.")
            fetchCurrencies()
        } catch {
            toast.error("Kur güncellenirken hata oluştu.")
        } finally {
            setFetchingRates(false)
        }
    }

    const handleSetBase = async (id: number) => {
        try {
            await apiClient.patch(`/admin/currencies/${id}/set-base`)
            toast.success("Baz para birimi güncellendi.")
            fetchCurrencies()
        } catch {
            toast.error("Baz para birimi ayarlanamadı.")
        }
    }

    const handleToggleStatus = async (id: number) => {
        try {
            await apiClient.patch(`/admin/currencies/${id}/toggle-status`)
            setCurrencies((prev) =>
                prev.map((c) => c.id === id ? { ...c, is_active: !c.is_active } : c)
            )
        } catch {
            toast.error("Durum güncellenemedi.")
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-emerald-500" /> Para Birimleri
                        </CardTitle>
                        <CardDescription>Döviz kurları ve aktif para birimleri yönetimi.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleFetchRates} disabled={fetchingRates}>
                            {fetchingRates
                                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                : <RefreshCw className="mr-2 h-4 w-4" />}
                            Kurları Güncelle
                        </Button>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button><Plus className="mr-2 h-4 w-4" /> Para Birimi Ekle</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Yeni Para Birimi</DialogTitle>
                                    <DialogDescription>ISO 4217 para birimi kodu ile yeni para birimi ekleyin.</DialogDescription>
                                </DialogHeader>
                                {/* @ts-ignore */}
                                <form onSubmit={handleSubmit(onSubmit as any)}>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Kod (ISO 4217)</Label>
                                                <Input placeholder="USD" maxLength={3} {...register("code")} className="uppercase" />
                                                {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Sembol</Label>
                                                <Input placeholder="$" {...register("symbol")} />
                                                {errors.symbol && <p className="text-xs text-red-500">{errors.symbol.message}</p>}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Para Birimi Adı</Label>
                                            <Input placeholder="US Dollar" {...register("name")} />
                                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Ondalık Basamak</Label>
                                            <Input type="number" min={0} max={6} {...register("decimal_places")} />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>İptal</Button>
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Ekle
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
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kod</TableHead>
                                <TableHead>Adı</TableHead>
                                <TableHead>Sembol</TableHead>
                                <TableHead>Güncel Kur</TableHead>
                                <TableHead>Ondalık</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead className="text-right">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currencies.map((currency) => (
                                <TableRow key={currency.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold">{currency.code}</span>
                                            {currency.is_base && (
                                                <Badge variant="default">
                                                    <Star className="mr-1 h-3 w-3" /> Baz
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{currency.name}</TableCell>
                                    <TableCell className="text-lg">{currency.symbol}</TableCell>
                                    <TableCell className="font-mono text-sm">
                                        {currency.exchange_rate?.rate
                                            ? currency.exchange_rate.rate.toFixed(4)
                                            : "—"}
                                    </TableCell>
                                    <TableCell>{currency.decimal_places}</TableCell>
                                    <TableCell>
                                        <button onClick={() => handleToggleStatus(currency.id)}>
                                            <Badge variant={currency.is_active ? "success" : "secondary"}>
                                                {currency.is_active ? "Aktif" : "Pasif"}
                                            </Badge>
                                        </button>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {!currency.is_base && (
                                            <Button
                                                variant="ghost" size="sm"
                                                onClick={() => handleSetBase(currency.id)}
                                            >
                                                Baz Yap
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {currencies.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        Para birimi tanımlanmamış.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}

// ─── Ana Sayfa ─────────────────────────────────────────────────────────────

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Sistem Ayarları</h1>
                <p className="text-muted-foreground">Global parametreleri ve referans verileri yönetin.</p>
            </div>

            <Tabs defaultValue="countries" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="countries">
                        <Globe className="mr-2 h-4 w-4" /> Ülkeler
                    </TabsTrigger>
                    <TabsTrigger value="currencies">
                        <DollarSign className="mr-2 h-4 w-4" /> Para Birimleri
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="countries"><CountriesTab /></TabsContent>
                <TabsContent value="currencies"><CurrenciesTab /></TabsContent>
            </Tabs>
        </div>
    )
}
