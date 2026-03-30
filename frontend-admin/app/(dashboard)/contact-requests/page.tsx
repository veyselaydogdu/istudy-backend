"use client"

import { useEffect, useState, useCallback } from "react"
import apiClient from "@/lib/apiClient"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    Mail, Search, ChevronLeft, ChevronRight, MoreHorizontal,
    Eye, Trash2, MessageSquare, Clock, CheckCircle, MailOpen,
} from "lucide-react"
import { toast } from "sonner"
import Swal from "sweetalert2"

type ContactRequest = {
    id: number
    name: string
    email: string
    subject: string
    message: string
    status: "pending" | "read" | "replied"
    admin_note: string | null
    replied_at: string | null
    replied_by: { id: number; name: string; email: string } | null
    created_at: string
}

type Meta = { current_page: number; last_page: number; per_page: number; total: number }
type Stats = { total: number; pending: number; read: number; replied: number }

const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: "Bekliyor", color: "bg-warning/20 text-warning" },
    read: { label: "Okundu", color: "bg-info/20 text-info" },
    replied: { label: "Yanıtlandı", color: "bg-success/20 text-success" },
}

export default function ContactRequestsPage() {
    const [requests, setRequests] = useState<ContactRequest[]>([])
    const [meta, setMeta] = useState<Meta | null>(null)
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("")
    const [page, setPage] = useState(1)

    // Detail modal
    const [selected, setSelected] = useState<ContactRequest | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [adminNote, setAdminNote] = useState("")
    const [updatingStatus, setUpdatingStatus] = useState(false)

    const fetchStats = async () => {
        try {
            const res = await apiClient.get("/admin/contact-requests/stats")
            if (res.data?.data) setStats(res.data.data)
        } catch { /* ignore */ }
    }

    const fetchRequests = useCallback(async () => {
        setLoading(true)
        try {
            const params: Record<string, string | number> = { page, per_page: 15 }
            if (search) params.search = search
            if (statusFilter) params.status = statusFilter
            const res = await apiClient.get("/admin/contact-requests", { params })
            if (res.data?.data) {
                setRequests(res.data.data)
                setMeta(res.data.meta ?? null)
            }
        } catch {
            toast.error("İletişim talepleri yüklenirken hata oluştu.")
        } finally {
            setLoading(false)
        }
    }, [page, search, statusFilter])

    useEffect(() => { setPage(1) }, [search, statusFilter])
    useEffect(() => { fetchRequests() }, [fetchRequests])
    useEffect(() => { fetchStats() }, [])

    const openDetail = async (item: ContactRequest) => {
        setSelected(item)
        setAdminNote(item.admin_note || "")
        setDetailOpen(true)
        // Show as read if pending
        if (item.status === "pending") {
            try {
                await apiClient.patch(`/admin/contact-requests/${item.id}/status`, { status: "read" })
                setRequests((prev) =>
                    prev.map((r) => (r.id === item.id ? { ...r, status: "read" } : r))
                )
                setSelected((prev) => (prev ? { ...prev, status: "read" } : prev))
                fetchStats()
            } catch { /* ignore */ }
        }
    }

    const updateStatus = async (status: "read" | "replied") => {
        if (!selected) return
        setUpdatingStatus(true)
        try {
            const res = await apiClient.patch(`/admin/contact-requests/${selected.id}/status`, {
                status,
                admin_note: adminNote || undefined,
            })
            const updated = res.data?.data
            if (updated) {
                setSelected(updated)
                setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
                toast.success("Durum güncellendi.")
                fetchStats()
            }
        } catch {
            toast.error("Durum güncellenirken hata oluştu.")
        } finally {
            setUpdatingStatus(false)
        }
    }

    const deleteRequest = async (id: number) => {
        const result = await Swal.fire({
            title: "Talebi sil",
            text: "Bu iletişim talebi kalıcı olarak silinecek. Emin misiniz?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#e7515a",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Evet, Sil",
            cancelButtonText: "İptal",
        })
        if (!result.isConfirmed) return
        try {
            await apiClient.delete(`/admin/contact-requests/${id}`)
            setRequests((prev) => prev.filter((r) => r.id !== id))
            if (selected?.id === id) setDetailOpen(false)
            toast.success("Talep silindi.")
            fetchStats()
        } catch {
            toast.error("Silme işlemi başarısız.")
        }
    }

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString("tr-TR", {
            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
        })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dark dark:text-white">İletişim Talepleri</h1>
                    <p className="mt-1 text-sm text-[#888ea8]">Web sitesi iletişim formundan gelen mesajlar</p>
                </div>
            </div>

            {/* İstatistik kartları */}
            {stats && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-medium text-[#888ea8]">
                                <Mail className="h-4 w-4" /> Toplam
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-dark dark:text-white">{stats.total}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-medium text-[#888ea8]">
                                <Clock className="h-4 w-4 text-warning" /> Bekliyor
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-warning">{stats.pending}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-medium text-[#888ea8]">
                                <MailOpen className="h-4 w-4 text-info" /> Okundu
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-info">{stats.read}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-medium text-[#888ea8]">
                                <CheckCircle className="h-4 w-4 text-success" /> Yanıtlandı
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-success">{stats.replied}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filtreler */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888ea8]" />
                    <Input
                        placeholder="Ad, e-posta veya konu ara..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {["", "pending", "read", "replied"].map((s) => (
                        <button
                            key={s}
                            type="button"
                            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                                statusFilter === s
                                    ? "bg-primary text-white"
                                    : "bg-[#f1f2f3] text-[#515365] hover:bg-primary/10 dark:bg-[#1b2e4b] dark:text-[#888ea8]"
                            }`}
                            onClick={() => setStatusFilter(s)}
                        >
                            {s === "" ? "Tümü" : statusConfig[s]?.label || s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tablo */}
            <div className="panel overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Gönderen</TableHead>
                            <TableHead>Konu</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead>Tarih</TableHead>
                            <TableHead className="w-12" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-16 text-center text-[#888ea8]">
                                    Yükleniyor...
                                </TableCell>
                            </TableRow>
                        ) : requests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-16 text-center text-[#888ea8]">
                                    İletişim talebi bulunamadı.
                                </TableCell>
                            </TableRow>
                        ) : (
                            requests.map((item) => (
                                <TableRow
                                    key={item.id}
                                    className={`cursor-pointer transition-colors hover:bg-[#f1f2f3] dark:hover:bg-[#1b2e4b] ${
                                        item.status === "pending" ? "font-semibold" : ""
                                    }`}
                                    onClick={() => openDetail(item)}
                                >
                                    <TableCell>
                                        <div>
                                            <p className="text-sm text-dark dark:text-white">{item.name}</p>
                                            <p className="text-xs text-[#888ea8]">{item.email}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <p className="max-w-xs truncate text-sm text-dark dark:text-white">
                                            {item.subject}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                statusConfig[item.status]?.color || ""
                                            }`}
                                        >
                                            {statusConfig[item.status]?.label || item.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-xs text-[#888ea8]">
                                        {formatDate(item.created_at)}
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openDetail(item)}>
                                                    <Eye className="mr-2 h-4 w-4" /> Görüntüle
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-danger focus:text-danger"
                                                    onClick={() => deleteRequest(item.id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Sil
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Sayfalama */}
                {meta && meta.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-white-light/40 px-4 py-3 dark:border-[#1b2e4b]">
                        <p className="text-sm text-[#888ea8]">
                            Toplam {meta.total} talep — Sayfa {meta.current_page} / {meta.last_page}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={meta.current_page === 1}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={meta.current_page === meta.last_page}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Detay Modal */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            İletişim Talebi
                        </DialogTitle>
                        <DialogDescription>
                            {selected && `${selected.name} — ${formatDate(selected.created_at)}`}
                        </DialogDescription>
                    </DialogHeader>

                    {selected && (
                        <div className="space-y-4">
                            {/* Gönderen bilgileri */}
                            <div className="grid grid-cols-2 gap-3 rounded-lg bg-[#f1f2f3] p-3 dark:bg-[#1b2e4b]">
                                <div>
                                    <p className="text-xs text-[#888ea8]">Ad Soyad</p>
                                    <p className="text-sm font-semibold text-dark dark:text-white">{selected.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[#888ea8]">E-posta</p>
                                    <a
                                        href={`mailto:${selected.email}`}
                                        className="text-sm font-semibold text-primary hover:underline"
                                    >
                                        {selected.email}
                                    </a>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-[#888ea8]">Konu</p>
                                    <p className="text-sm font-semibold text-dark dark:text-white">{selected.subject}</p>
                                </div>
                            </div>

                            {/* Mesaj */}
                            <div>
                                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#888ea8]">Mesaj</p>
                                <div className="rounded-lg border border-white-light p-3 text-sm leading-relaxed text-dark dark:border-[#1b2e4b] dark:text-white">
                                    {selected.message}
                                </div>
                            </div>

                            {/* Admin notu */}
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-[#888ea8]">
                                    Admin Notu
                                </label>
                                <textarea
                                    className="w-full rounded-lg border border-white-light bg-transparent p-2.5 text-sm text-dark outline-none transition focus:border-primary dark:border-[#1b2e4b] dark:text-white"
                                    rows={3}
                                    placeholder="Dahili notunuzu buraya yazın..."
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                />
                            </div>

                            {/* Yanıtlandı bilgisi */}
                            {selected.replied_at && (
                                <p className="text-xs text-[#888ea8]">
                                    Yanıtlandı: {formatDate(selected.replied_at)}
                                    {selected.replied_by ? ` — ${selected.replied_by.name}` : ""}
                                </p>
                            )}
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDetailOpen(false)}>
                            Kapat
                        </Button>
                        <Button
                            variant="outline"
                            className="border-info text-info hover:bg-info/10"
                            disabled={updatingStatus || selected?.status === "read"}
                            onClick={() => updateStatus("read")}
                        >
                            <MailOpen className="mr-2 h-4 w-4" />
                            Okundu İşaretle
                        </Button>
                        <Button
                            className="bg-success hover:bg-success/90"
                            disabled={updatingStatus || selected?.status === "replied"}
                            onClick={() => updateStatus("replied")}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {updatingStatus ? "Güncelleniyor..." : "Yanıtlandı İşaretle"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
