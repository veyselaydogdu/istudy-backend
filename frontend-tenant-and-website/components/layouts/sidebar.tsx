'use client';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toggleSidebar } from '@/store/themeConfigSlice';
import { IRootState } from '@/store';
import {
    LayoutDashboard,
    School,
    CreditCard,
    FileText,
    Bell,
    User,
    LogOut,
    ChevronDown,
    Utensils,
    Calendar,
    GraduationCap,
    MessageSquare,
    Users,
} from 'lucide-react';

type NavItem = {
    title: string;
    href: string;
    icon: React.ElementType;
};

type NavGroup = {
    label: string;
    items: NavItem[];
};

const navGroups: NavGroup[] = [
    {
        label: 'ANA MENÜ',
        items: [{ title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
    },
    {
        label: 'YÖNETİM',
        items: [
            { title: 'Okullarım', href: '/schools', icon: School },
            { title: 'Öğretmenler', href: '/teachers', icon: Users },
            { title: 'Eğitim Yılları', href: '/academic-years', icon: GraduationCap },
            { title: 'Yemekler', href: '/meals', icon: Utensils },
            { title: 'Etkinlikler', href: '/activities', icon: Calendar },
            { title: 'Sosyal Ağ', href: '/social', icon: MessageSquare },
        ],
    },
    {
        label: 'HESAP',
        items: [
            { title: 'Aboneliğim', href: '/subscription', icon: CreditCard },
            { title: 'Faturalar', href: '/invoices', icon: FileText },
        ],
    },
    {
        label: 'SİSTEM',
        items: [
            { title: 'Bildirimler', href: '/notifications', icon: Bell },
            { title: 'Profil', href: '/profile', icon: User },
        ],
    },
];

const Sidebar = () => {
    const pathname = usePathname();
    const dispatch = useDispatch();
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = themeConfig.semidark;

    const isActive = (href: string) => {
        return pathname === href || pathname.startsWith(href + '/');
    };

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav
                className={`sidebar fixed bottom-0 top-0 z-50 h-full min-h-screen w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] transition-all duration-300`}
            >
                <div className="h-full bg-white dark:bg-black">
                    <div className="flex items-center justify-between px-4 py-3">
                        <Link href="/dashboard" className="main-logo flex shrink-0 items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
                                <LayoutDashboard className="h-4 w-4" />
                            </div>
                            <span className="main-logo-span ml-2 align-middle text-xl font-bold dark:text-white-light">
                                iStudy
                            </span>
                        </Link>
                        <button
                            type="button"
                            className="collapse-icon flex h-8 w-8 items-center justify-center rounded-full text-dark/60 hover:bg-black/10 dark:text-white dark:hover:bg-white/10"
                            onClick={() => dispatch(toggleSidebar())}
                        >
                            <ChevronDown className="h-4 w-4 rotate-90" />
                        </button>
                    </div>

                    <PerfectScrollbar className="relative h-[calc(100vh-60px)]">
                        <ul className="relative space-y-0.5 p-4 py-0 font-semibold">
                            {navGroups.map((group) => (
                                <li key={group.label} className="menu nav-item">
                                    <h2 className="mb-1 mt-4 flex items-center px-7 py-3">
                                        <span className="collapse-icon hidden h-5 min-w-[20px] rotate-90 dark:text-white-dark">
                                            <ChevronDown className="h-4 w-4" />
                                        </span>
                                        <span className="text-xs font-bold uppercase tracking-widest text-white-dark dark:text-white-dark">
                                            {group.label}
                                        </span>
                                    </h2>
                                    <ul>
                                        {group.items.map((item) => {
                                            const Icon = item.icon;
                                            const active = isActive(item.href);
                                            return (
                                                <li key={item.href} className="nav-item">
                                                    <Link
                                                        href={item.href}
                                                        className={`group ${active ? 'active' : ''}`}
                                                        onClick={() => {
                                                            if (window.innerWidth < 1024) {
                                                                dispatch(toggleSidebar());
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex items-center">
                                                            <Icon className="h-5 w-5 shrink-0 group-hover:!text-primary" />
                                                            <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">
                                                                {item.title}
                                                            </span>
                                                        </div>
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </li>
                            ))}

                            {/* Logout */}
                            <li className="nav-item mt-4 border-t border-white-light/40 pt-4 dark:border-[#1b2e4b]">
                                <button
                                    type="button"
                                    className="group flex w-full items-center justify-between rounded-md p-2.5 text-[#506690] hover:bg-[#000]/[0.08] hover:text-black dark:hover:bg-[#181f32] dark:hover:text-white-dark"
                                    onClick={() => {
                                        localStorage.removeItem('tenant_token');
                                        window.location.href = '/login';
                                    }}
                                >
                                    <div className="flex items-center">
                                        <LogOut className="h-5 w-5 text-danger/70 group-hover:!text-danger" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-danger/70 group-hover:text-danger">Çıkış Yap</span>
                                    </div>
                                </button>
                            </li>
                        </ul>
                    </PerfectScrollbar>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
