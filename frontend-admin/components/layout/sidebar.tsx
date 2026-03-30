"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Building2,
    Users,
    Package,
    CreditCard,
    Settings,
    LogOut,
    HeartPulse,
    Bell,
    GraduationCap,
    ClipboardList,
    Activity,
    ChevronLeft,
    ChevronRight,
    X,
} from "lucide-react"

interface SidebarProps {
    collapsed: boolean
    onCollapse: (v: boolean) => void
    mobileOpen: boolean
    onMobileClose: () => void
}

type NavItem = {
    title: string
    href: string
    icon: React.ElementType
}

type NavGroup = {
    label: string
    items: NavItem[]
}

const navGroups: NavGroup[] = [
    {
        label: "Ana Menü",
        items: [
            { title: "Dashboard", href: "/", icon: LayoutDashboard },
        ],
    },
    {
        label: "Yönetim",
        items: [
            { title: "Kurumlar", href: "/tenants", icon: Building2 },
            { title: "Okullar & Şubeler", href: "/schools", icon: GraduationCap },
            { title: "Kullanıcılar", href: "/users", icon: Users },
            { title: "Sağlık & Beslenme", href: "/health", icon: HeartPulse },
        ],
    },
    {
        label: "Finans",
        items: [
            { title: "Paket Yönetimi", href: "/packages", icon: Package },
            { title: "Finans & Ödemeler", href: "/finance", icon: CreditCard },
            { title: "Abonelikler", href: "/subscriptions", icon: ClipboardList },
        ],
    },
    {
        label: "Sistem",
        items: [
            { title: "Aktivite Kayıtları", href: "/activity-logs", icon: Activity },
            { title: "Bildirimler", href: "/notifications", icon: Bell },
            { title: "Ayarlar", href: "/settings", icon: Settings },
        ],
    },
]

function NavLink({
    item,
    collapsed,
    onClick,
}: {
    item: NavItem
    collapsed: boolean
    onClick?: () => void
}) {
    const pathname = usePathname()
    const Icon = item.icon
    const isActive =
        item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(item.href + "/")

    return (
        <div className="relative group/navitem">
            <Link
                href={item.href}
                onClick={onClick}
                className={cn(
                    "flex items-center rounded-lg text-sm font-medium transition-all duration-150",
                    collapsed ? "justify-center px-0 py-2.5 mx-1" : "gap-3 px-3 py-2 mx-2",
                    isActive
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-l-2 border-indigo-600 dark:border-indigo-500 rounded-l-none"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                )}
            >
                <Icon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
                {!collapsed && <span className="truncate">{item.title}</span>}
            </Link>

            {/* CSS tooltip when collapsed */}
            {collapsed && (
                <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 opacity-0 group-hover/navitem:opacity-100 transition-opacity duration-150">
                    <div className="rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg whitespace-nowrap dark:bg-slate-100 dark:text-slate-900">
                        {item.title}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-100" />
                    </div>
                </div>
            )}
        </div>
    )
}

function SidebarContent({
    collapsed,
    onCollapse,
    onClose,
    isMobile = false,
}: {
    collapsed: boolean
    onCollapse: (v: boolean) => void
    onClose?: () => void
    isMobile?: boolean
}) {
    const effectiveCollapsed = isMobile ? false : collapsed

    return (
        <div className="flex h-full flex-col">
            {/* Logo */}
            <div className={cn("flex h-16 items-center border-b border-slate-200 dark:border-slate-800 shrink-0", effectiveCollapsed ? "justify-center px-2" : "justify-between px-4")}>
                <Link href="/" className="flex items-center gap-2.5 min-w-0" onClick={onClose}>
                    <div className="flex shrink-0 h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                        <LayoutDashboard className="h-4 w-4" />
                    </div>
                    {!effectiveCollapsed && (
                        <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                            iStudy Admin
                        </span>
                    )}
                </Link>
                {isMobile && (
                    <button
                        onClick={onClose}
                        className="ml-2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4 space-y-5">
                {navGroups.map((group) => (
                    <div key={group.label}>
                        {!effectiveCollapsed && (
                            <p className="mb-1 px-5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 select-none">
                                {group.label}
                            </p>
                        )}
                        {effectiveCollapsed && (
                            <div className="my-1 mx-3 border-t border-slate-200 dark:border-slate-800" />
                        )}
                        <div className="space-y-0.5">
                            {group.items.map((item) => (
                                <NavLink
                                    key={item.href}
                                    item={item}
                                    collapsed={effectiveCollapsed}
                                    onClick={onClose}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 p-3 space-y-1">
                {/* Collapse toggle — desktop only */}
                {!isMobile && (
                    <div className="relative group/collapse">
                        <button
                            onClick={() => onCollapse(!collapsed)}
                            className={cn(
                                "flex w-full items-center rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors",
                                effectiveCollapsed ? "justify-center px-0 py-2.5 mx-1 w-auto" : "gap-3 px-3 py-2"
                            )}
                        >
                            {effectiveCollapsed ? (
                                <ChevronRight className="h-4 w-4" />
                            ) : (
                                <>
                                    <ChevronLeft className="h-4 w-4 shrink-0" />
                                    <span>Daralt</span>
                                </>
                            )}
                        </button>
                        {effectiveCollapsed && (
                            <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 opacity-0 group-hover/collapse:opacity-100 transition-opacity duration-150">
                                <div className="rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg whitespace-nowrap dark:bg-slate-100 dark:text-slate-900">
                                    Genişlet
                                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-100" />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Logout */}
                <div className="relative group/logout">
                    <button
                        onClick={() => {
                            localStorage.removeItem("admin_token")
                            window.location.href = "/login"
                        }}
                        className={cn(
                            "flex w-full items-center rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300 transition-colors",
                            effectiveCollapsed ? "justify-center px-0 py-2.5 mx-1 w-auto" : "gap-3 px-3 py-2"
                        )}
                    >
                        <LogOut className={cn("shrink-0", effectiveCollapsed ? "h-5 w-5" : "h-4 w-4")} />
                        {!effectiveCollapsed && <span>Çıkış Yap</span>}
                    </button>
                    {effectiveCollapsed && (
                        <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 opacity-0 group-hover/logout:opacity-100 transition-opacity duration-150">
                            <div className="rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg whitespace-nowrap dark:bg-slate-100 dark:text-slate-900">
                                Çıkış Yap
                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-100" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export function Sidebar({ collapsed, onCollapse, mobileOpen, onMobileClose }: SidebarProps) {
    return (
        <>
            {/* Desktop sidebar */}
            <motion.div
                animate={{ width: collapsed ? 64 : 256 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="fixed inset-y-0 left-0 z-30 hidden lg:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
            >
                <SidebarContent
                    collapsed={collapsed}
                    onCollapse={onCollapse}
                />
            </motion.div>

            {/* Mobile overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                            onClick={onMobileClose}
                        />

                        {/* Drawer */}
                        <motion.div
                            key="drawer"
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl lg:hidden"
                        >
                            <SidebarContent
                                collapsed={false}
                                onCollapse={onCollapse}
                                onClose={onMobileClose}
                                isMobile
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
