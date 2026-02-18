"use client"

import { useEffect, useState } from "react"
import apiClient from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Send, Loader2, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const notificationSchema = z.object({
    title: z.string().min(3, "Başlık en az 3 karakter olmalıdır"),
    message: z.string().min(10, "Mesaj en az 10 karakter olmalıdır"),
    target: z.string().min(1, "Hedef kitle seçiniz"),
    type: z.string().min(1, "Bildirim tipi seçiniz"),
})

type NotificationFormValues = z.infer<typeof notificationSchema>

type SentNotification = {
    id: number
    title: string
    message: string
    target: string
    type: string
    sent_at: string
    recipient_count?: number
}

const TARGET_OPTIONS = [
    { value: "all", label: "Tüm Kullanıcılar" },
    { value: "tenant_owners", label: "Kurum Sahipleri" },
    { value: "school_admins", label: "Okul Yöneticileri" },
    { value: "teachers", label: "Öğretmenler" },
    { value: "parents", label: "Veliler" },
]

const TYPE_OPTIONS = [
    { value: "info", label: "Bilgi" },
    { value: "warning", label: "Uyarı" },
    { value: "success", label: "Başarı" },
    { value: "error", label: "Hata" },
]

const TYPE_VARIANT_MAP: Record<string, "default" | "warning" | "success" | "danger" | "secondary"> = {
    info: "default",
    warning: "warning",
    success: "success",
    error: "danger",
}

export default function NotificationsPage() {
    const [sentNotifications, setSentNotifications] = useState<SentNotification[]>([])
    const [loading, setLoading] = useState(true)
    const [sent, setSent] = useState(false)

    const {
        register, handleSubmit, reset,
        formState: { errors, isSubmitting },
    } = useForm<NotificationFormValues>({
        resolver: zodResolver(notificationSchema),
        defaultValues: { title: "", message: "", target: "", type: "info" },
    })

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await apiClient.get("/admin/system/notifications")
                if (res.data?.data) { setSentNotifications(res.data.data) }
            } catch {
                // Geçmiş yüklenemedi
            } finally {
                setLoading(false)
            }
        }
        fetchNotifications()
    }, [])

    const onSubmit = async (data: NotificationFormValues) => {
        try {
            const res = await apiClient.post("/admin/system/notifications", data)
            if (res.data?.success !== false) {
                toast.success("Bildirim başarıyla gönderildi.")
                setSent(true)
                reset()
                setSentNotifications((prev) => [
                    {
                        id: Date.now(),
                        title: data.title,
                        message: data.message,
                        target: data.target,
                        type: data.type,
                        sent_at: new Date().toISOString(),
                    },
                    ...prev,
                ])
                setTimeout(() => setSent(false), 3000)
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } }
            toast.error(error.response?.data?.message ?? "Bildirim gönderilemedi.")
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Bildirim Merkezi</h1>
                <p className="text-muted-foreground">
                    Kullanıcı gruplarına toplu sistem bildirimi gönderin.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Bildirim Gönderme Formu */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5 text-indigo-500" />
                            Yeni Bildirim Gönder
                        </CardTitle>
                        <CardDescription>
                            Seçilen kullanıcı grubuna anlık bildirim gönderin.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Hedef Kitle</Label>
                                    <select
                                        {...register("target")}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    >
                                        <option value="">Seçin...</option>
                                        {TARGET_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    {errors.target && <p className="text-xs text-red-500">{errors.target.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Bildirim Tipi</Label>
                                    <select
                                        {...register("type")}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    >
                                        {TYPE_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Başlık</Label>
                                <Input placeholder="Bildirim başlığı..." {...register("title")} />
                                {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Mesaj</Label>
                                <Textarea
                                    placeholder="Bildirim içeriğini yazın..."
                                    rows={5}
                                    {...register("message")}
                                />
                                {errors.message && <p className="text-xs text-red-500">{errors.message.message}</p>}
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gönderiliyor...</>
                                ) : sent ? (
                                    <><CheckCircle className="mr-2 h-4 w-4" /> Gönderildi!</>
                                ) : (
                                    <><Send className="mr-2 h-4 w-4" /> Bildirimi Gönder</>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Geçmiş */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-indigo-500" />
                            Gönderim Geçmişi
                        </CardTitle>
                        <CardDescription>Son gönderilen sistem bildirimleri.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex h-32 items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            </div>
                        ) : sentNotifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Bell className="h-8 w-8 text-muted-foreground mb-3" />
                                <p className="text-sm text-muted-foreground">
                                    Henüz bildirim gönderilmemiş.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {sentNotifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className="rounded-lg border p-4 space-y-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-medium text-sm">{notif.title}</p>
                                            <Badge variant={TYPE_VARIANT_MAP[notif.type] ?? "default"}>
                                                {TYPE_OPTIONS.find((t) => t.value === notif.type)?.label ?? notif.type}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>
                                                {TARGET_OPTIONS.find((t) => t.value === notif.target)?.label ?? notif.target}
                                                {notif.recipient_count !== undefined && ` • ${notif.recipient_count} alıcı`}
                                            </span>
                                            <span>
                                                {new Date(notif.sent_at).toLocaleDateString("tr-TR", {
                                                    hour: "2-digit", minute: "2-digit",
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
