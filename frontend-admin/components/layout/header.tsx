"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { Button } from "@/components/ui/button"
import {
    Bell, Moon, Sun, Menu, ChevronLeft, ChevronRight,
    LogOut, User,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface HeaderProps {
    collapsed: boolean
    onCollapse: (v: boolean) => void
    onMobileOpen: () => void
}

const pageTitles: Record<string, string> = {
    "/": "Dashboard",
    "/tenants": "Kurumlar",
    "/schools": "Okullar & Şubeler",
    "/users": "Kullanıcılar",
    "/health": "Sağlık & Beslenme",
    "/packages": "Paket Yönetimi",
    "/finance": "Finans & Ödemeler",
    "/subscriptions": "Abonelikler",
    "/activity-logs": "Aktivite Kayıtları",
    "/notifications": "Bildirimler",
    "/settings": "Ayarlar",
}

function getPageTitle(pathname: string): string {
    if (pageTitles[pathname]) return pageTitles[pathname]
    // Match prefix e.g. /tenants/123
    for (const [key, value] of Object.entries(pageTitles)) {
        if (key !== "/" && pathname.startsWith(key + "/")) return value
    }
    return "Admin Panel"
}

export function Header({ collapsed, onCollapse, onMobileOpen }: HeaderProps) {
    const pathname = usePathname()
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    const pageTitle = getPageTitle(pathname)

    return (
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 dark:border-slate-800 dark:bg-slate-950/95 shadow-sm">
            {/* Mobile hamburger */}
            <button
                onClick={onMobileOpen}
                className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                aria-label="Menüyü aç"
            >
                <Menu className="h-5 w-5" />
            </button>

            {/* Desktop collapse toggle */}
            <button
                onClick={() => onCollapse(!collapsed)}
                className="hidden lg:inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                aria-label={collapsed ? "Genişlet" : "Daralt"}
            >
                {collapsed ? (
                    <ChevronRight className="h-4 w-4" />
                ) : (
                    <ChevronLeft className="h-4 w-4" />
                )}
            </button>

            {/* Page title */}
            <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {pageTitle}
                </h2>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1">
                {/* Theme toggle */}
                {mounted && (
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        title="Tema Değiştir"
                        className="text-slate-500 dark:text-slate-400"
                    >
                        {theme === "dark" ? (
                            <Sun className="h-4 w-4" />
                        ) : (
                            <Moon className="h-4 w-4" />
                        )}
                        <span className="sr-only">Tema Değiştir</span>
                    </Button>
                )}

                {/* Notification bell */}
                <Button size="icon" variant="ghost" className="relative text-slate-500 dark:text-slate-400" title="Bildirimler">
                    <Bell className="h-4 w-4" />
                    <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-950" />
                    <span className="sr-only">Bildirimler</span>
                </Button>

                {/* User dropdown */}
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                        <button
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white ring-2 ring-indigo-100 dark:ring-indigo-900 hover:ring-indigo-200 dark:hover:ring-indigo-800 transition-all focus-visible:outline-none focus-visible:ring-indigo-500"
                            aria-label="Kullanıcı menüsü"
                        >
                            SA
                        </button>
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Portal>
                        <DropdownMenu.Content
                            align="end"
                            sideOffset={8}
                            className="z-50 min-w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900 animate-in fade-in-0 zoom-in-95"
                        >
                            {/* User info header */}
                            <div className="px-3 py-2 mb-1">
                                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Süper Admin</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">admin@istudy.com</p>
                            </div>

                            <DropdownMenu.Separator className="my-1 h-px bg-slate-200 dark:bg-slate-700" />

                            <DropdownMenu.Item
                                className={cn(
                                    "flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-300",
                                    "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                                    "focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800",
                                    "select-none"
                                )}
                            >
                                <User className="h-4 w-4 shrink-0" />
                                Profil
                            </DropdownMenu.Item>

                            {mounted && (
                                <DropdownMenu.Item
                                    onSelect={() => setTheme(theme === "dark" ? "light" : "dark")}
                                    className={cn(
                                        "flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-300",
                                        "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                                        "focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800",
                                        "select-none"
                                    )}
                                >
                                    {theme === "dark" ? (
                                        <Sun className="h-4 w-4 shrink-0" />
                                    ) : (
                                        <Moon className="h-4 w-4 shrink-0" />
                                    )}
                                    {theme === "dark" ? "Açık Tema" : "Koyu Tema"}
                                </DropdownMenu.Item>
                            )}

                            <DropdownMenu.Separator className="my-1 h-px bg-slate-200 dark:bg-slate-700" />

                            <DropdownMenu.Item
                                onSelect={() => {
                                    localStorage.removeItem("admin_token")
                                    window.location.href = "/login"
                                }}
                                className={cn(
                                    "flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-500 dark:text-red-400",
                                    "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-300",
                                    "focus:outline-none focus:bg-red-50 dark:focus:bg-red-950/30",
                                    "select-none"
                                )}
                            >
                                <LogOut className="h-4 w-4 shrink-0" />
                                Çıkış Yap
                            </DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                </DropdownMenu.Root>
            </div>
        </header>
    )
}
