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
import { useTranslation } from "@/hooks/useTranslation"

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

const TYPE_VARIANT_MAP: Record<string, "default" | "warning" | "success" | "danger" | "secondary"> = {
    general: "default",
    maintenance: "warning",
    update: "success",
    announcement: "secondary",
}

export default function NotificationsPage() {
    const { t } = useTranslation()

    const notificationSchema = z.object({
        title: z.string().min(3, t('notifications.titleLabel')),
        body: z.string().min(10, t('notifications.messageLabel')),
        type: z.enum(["general", "maintenance", "update", "announcement"]),
        priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
        target_roles: z.array(z.string()).optional(),
    })

    type NotificationFormValues = z.infer<typeof notificationSchema>

    const TARGET_OPTIONS = [
        { value: "tenant_owner", label: t('notifications.targetTenantOwners') },
        { value: "school_admin", label: t('notifications.targetSchoolAdmins') },
        { value: "teacher", label: t('notifications.targetTeachers') },
        { value: "parent", label: t('notifications.targetParents') },
    ]

    const TYPE_OPTIONS = [
        { value: "general", label: t('notifications.typeGeneral') },
        { value: "maintenance", label: t('notifications.typeMaintenance') },
        { value: "update", label: t('notifications.typeUpdate') },
        { value: "announcement", label: t('notifications.typeAnnouncement') },
    ]

    const PRIORITY_OPTIONS = [
        { value: "low", label: t('notifications.priorityLow') },
        { value: "normal", label: t('notifications.priorityNormal') },
        { value: "high", label: t('notifications.priorityHigh') },
        { value: "urgent", label: t('notifications.priorityUrgent') },
    ]

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
                // silent
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
                toast.success(t('notifications.sendSuccess'))
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
            const errorMsg = error.response?.data?.message ?? t('notifications.sendError')
            const errs = error.response?.data?.errors
            if (errs) {
                toast.error(errorMsg, { description: Object.values(errs).flat().join(", ") })
            } else {
                toast.error(errorMsg)
            }
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('notifications.center')}</h1>
                <p className="text-muted-foreground">{t('notifications.centerSubtitle')}</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5 text-indigo-500" />
                            {t('notifications.sendFormTitle')}
                        </CardTitle>
                        <CardDescription>{t('notifications.sendFormSubtitle')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{t('notifications.notificationType')}</Label>
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
                                    <Label>{t('notifications.priority')}</Label>
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
                                <Label>{t('notifications.targetRoles')}</Label>
                                <select
                                    multiple
                                    {...register("target_roles")}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                >
                                    {TARGET_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-muted-foreground">{t('notifications.targetRolesHint')}</p>
                            </div>

                            <div className="space-y-2">
                                <Label>{t('notifications.titleLabel')}</Label>
                                <Input placeholder={t('notifications.titlePlaceholder')} {...register("title")} />
                                {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>{t('notifications.messageLabel')}</Label>
                                <Textarea
                                    placeholder={t('notifications.messagePlaceholder')}
                                    rows={5}
                                    {...register("body")}
                                />
                                {errors.body && <p className="text-xs text-red-500">{errors.body.message}</p>}
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('notifications.sending')}</>
                                ) : sent ? (
                                    <><CheckCircle className="mr-2 h-4 w-4" /> {t('notifications.sent')}</>
                                ) : (
                                    <><Send className="mr-2 h-4 w-4" /> {t('notifications.sendBtn')}</>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-indigo-500" />
                            {t('notifications.historyTitle')}
                        </CardTitle>
                        <CardDescription>{t('notifications.historySubtitle')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex h-32 items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            </div>
                        ) : sentNotifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Bell className="h-8 w-8 text-muted-foreground mb-3" />
                                <p className="text-sm text-muted-foreground">{t('notifications.noHistory')}</p>
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
                                                    : t('notifications.allUsersLabel')}
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
