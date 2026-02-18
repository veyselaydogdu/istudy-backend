import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Building2,
    Users,
    Package,
    CreditCard,
    Settings,
    LogOut,
    MapPin,
    HeartPulse,   // Health
    Bell,         // Notifications
    GraduationCap // Schools
} from "lucide-react"

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        title: "Kurumlar (Tenants)",
        href: "/tenants",
        icon: Building2,
    },
    {
        title: "Okullar & Şubeler",
        href: "/schools",
        icon: GraduationCap,
    },
    {
        title: "Kullanıcılar",
        href: "/users",
        icon: Users,
    },
    {
        title: "Sağlık & Beslenme",
        href: "/health",
        icon: HeartPulse,
    },
    {
        title: "Paket Yönetimi",
        href: "/packages",
        icon: Package,
    },
    {
        title: "Finans & Ödemeler",
        href: "/finance",
        icon: CreditCard,
    },
    {
        title: "Bildirimler",
        href: "/notifications",
        icon: Bell,
    },
    {
        title: "Ayarlar",
        href: "/settings",
        icon: Settings,
    },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="flex flex-col h-full border-r bg-white dark:bg-slate-900/40 w-64 fixed left-0 top-0 bottom-0 z-30 hidden lg:block">
            <div className="h-16 flex items-center px-6 border-b">
                <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
                    <div className="bg-indigo-600 text-white p-1 rounded-md">
                        <LayoutDashboard className="h-5 w-5" />
                    </div>
                    <span>iStudy Admin</span>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <nav className="grid items-start px-4 text-sm font-medium gap-1">
                    {sidebarItems.map((item, index) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-indigo-600 dark:hover:text-indigo-400",
                                    isActive
                                        ? "bg-indigo-50 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400 font-semibold"
                                        : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {item.title}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            <div className="border-t p-4">
                <button
                    onClick={() => {
                        localStorage.removeItem('admin_token');
                        window.location.href = '/login';
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                >
                    <LogOut className="h-4 w-4" />
                    Çıkış Yap
                </button>
            </div>
        </div>
    )
}
