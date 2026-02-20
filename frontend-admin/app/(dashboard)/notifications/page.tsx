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
    body: z.string().min(10, "Mesaj en az 10 karakter olmalıdır"),
    type: z.enum(["general", "maintenance", "update", "announcement"]),
    priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
    target_roles: z.array(z.string()).optional(),
})

type NotificationFormValues = z.infer<typeof notificationSchema>

type SentNotification = {
    id: number
    title: string
    body: string
    target_roles?: string[]
    type: string
    priority?: string
    sent_at: string
    recipient_count?: number
}

const TARGET_OPTIONS = [
    { value: "tenant_owner", label: "Kurum Sahipleri" },
    { value: "school_admin", label: "Okul Yöneticileri" },
    { value: "teacher", label: "Öğretmenler" },
    { value: "parent", label: "Veliler" },
]

const TYPE_OPTIONS = [
    { value: "general", label: "Genel" },
    { value: "maintenance", label: "Bakım" },
    { value: "update", label: "Güncelleme" },
    { value: "announcement", label: "Duyuru" },
]

const PRIORITY_OPTIONS = [
    { value: "low", label: "Düşük" },
    { value: "normal", label: "Normal" },
    { value: "high", label: "Yüksek" },
    { value: "urgent", label: "Acil" },
]

const TYPE_VARIANT_MAP: Record<string, "default" | "warning" | "success" | "danger" | "secondary"> = {
    general: "default",
    maintenance: "warning",
    update: "success",
    announcement: "secondary",
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
        defaultValues: { title: "", body: "", type: "general", priority: "normal", target_roles: [] },
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
                        body: data.body,
                        target_roles: data.target_roles,
                        type: data.type,
                        priority: data.priority,
                        sent_at: new Date().toISOString(),
                    },
                    ...prev,
                ])
                setTimeout(() => setSent(false), 3000)
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
            const errorMsg = error.response?.data?.message ?? "Bildirim gönderilemedi."
            const errors = error.response?.data?.errors
            if (errors) {
                toast.error(errorMsg, { description: Object.values(errors).flat().join(", ") })
            } else {
                toast.error(errorMsg)
            }
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
                                    <Label>Bildirim Tipi</Label>
                                    <select
                                        {...register("type")}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    >
                                        {TYPE_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Öncelik</Label>
                                    <select
                                        {...register("priority")}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    >
                                        {PRIORITY_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Hedef Roller (Opsiyonel, çoklu seçim)</Label>
                                <select
                                    multiple
                                    {...register("target_roles")}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                >
                                    {TARGET_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-muted-foreground">Boş bırakılırsa tüm kullanıcılara gönderilir. Ctrl/Cmd tuşuyla çoklu seçim yapabilirsiniz.</p>
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
                                    {...register("body")}
                                />
                                {errors.body && <p className="text-xs text-red-500">{errors.body.message}</p>}
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
                                        <p className="text-xs text-muted-foreground line-clamp-2">{notif.body}</p>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>
                                                {notif.target_roles && notif.target_roles.length > 0
                                                    ? notif.target_roles.map(r => TARGET_OPTIONS.find(t => t.value === r)?.label ?? r).join(", ")
                                                    : "Tüm kullanıcılar"}
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
