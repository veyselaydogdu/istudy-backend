'use client';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toggleSidebar } from '@/store/themeConfigSlice';
import { IRootState } from '@/store';
import { useTranslation } from '@/hooks/useTranslation';
import {
    LayoutDashboard,
    Building2,
    GraduationCap,
    Users,
    Package,
    CreditCard,
    ClipboardList,
    Activity,
    Bell,
    Settings,
    LogOut,
    ChevronDown,
    MessageSquare,
    Globe,
    AlertTriangle,
    Stethoscope,
    Pill,
    Apple,
    Coins,
    ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

type NavItem = {
    titleKey: string;
    href: string;
    icon: React.ElementType;
};

type NavGroup = {
    labelKey: string;
    items: NavItem[];
    collapsible?: boolean;
};

const navGroups: NavGroup[] = [
    {
        labelKey: 'nav.overview',
        items: [{ titleKey: 'sidebar.dashboard', href: '/', icon: LayoutDashboard }],
    },
    {
        labelKey: 'nav.management',
        items: [
            { titleKey: 'sidebar.tenants', href: '/tenants', icon: Building2 },
            { titleKey: 'sidebar.schools', href: '/schools', icon: GraduationCap },
            { titleKey: 'sidebar.users', href: '/users', icon: Users },
        ],
    },
    {
        labelKey: 'nav.packageSales',
        items: [
            { titleKey: 'sidebar.packages', href: '/packages', icon: Package },
            { titleKey: 'sidebar.subscriptions', href: '/subscriptions', icon: ClipboardList },
            { titleKey: 'sidebar.finance', href: '/finance', icon: CreditCard },
        ],
    },
    {
        labelKey: 'nav.globalData',
        collapsible: true,
        items: [
            { titleKey: 'sidebar.allergens', href: '/global/allergens', icon: AlertTriangle },
            { titleKey: 'sidebar.medicalConditions', href: '/global/medical-conditions', icon: Stethoscope },
            { titleKey: 'sidebar.medications', href: '/global/medications', icon: Pill },
            { titleKey: 'sidebar.foodIngredients', href: '/global/food-ingredients', icon: Apple },
            { titleKey: 'sidebar.countries', href: '/global/countries', icon: Globe },
            { titleKey: 'sidebar.currencies', href: '/global/currencies', icon: Coins },
        ],
    },
    {
        labelKey: 'nav.support',
        items: [
            { titleKey: 'sidebar.contactRequests', href: '/contact-requests', icon: MessageSquare },
        ],
    },
    {
        labelKey: 'nav.system',
        items: [
            { titleKey: 'sidebar.activityLogs', href: '/activity-logs', icon: Activity },
            { titleKey: 'sidebar.notifications', href: '/notifications', icon: Bell },
            { titleKey: 'sidebar.settings', href: '/settings', icon: Settings },
        ],
    },
];

const Sidebar = () => {
    const { t } = useTranslation();
    const pathname = usePathname();
    const dispatch = useDispatch();
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = themeConfig.semidark;

    const globalActive = pathname.startsWith('/global');
    const [globalOpen, setGlobalOpen] = useState(globalActive);

    const isActive = (href: string) => {
        if (href === '/') { return pathname === '/'; }
        return pathname === href || pathname.startsWith(href + '/');
    };

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav className="sidebar fixed bottom-0 top-0 z-50 h-full min-h-screen w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] transition-all duration-300">
                <div className="h-full bg-white dark:bg-black">
                    <div className="flex items-center justify-between px-4 py-3">
                        <Link href="/" className="main-logo flex shrink-0 items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
                                <LayoutDashboard className="h-4 w-4" />
                            </div>
                            <span className="main-logo-span ml-2 align-middle text-xl font-bold dark:text-white-light">
                                iStudy Admin
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
                                <li key={group.labelKey} className="menu nav-item">
                                    {group.collapsible ? (
                                        <button
                                            type="button"
                                            className="mb-1 mt-4 flex w-full items-center justify-between px-7 py-3"
                                            onClick={() => setGlobalOpen((o) => !o)}
                                        >
                                            <span className="text-xs font-bold uppercase tracking-widest text-white-dark dark:text-white-dark">
                                                {t(group.labelKey)}
                                            </span>
                                            <ChevronRight
                                                className={`h-3 w-3 text-white-dark transition-transform duration-200 ${globalOpen ? 'rotate-90' : ''}`}
                                            />
                                        </button>
                                    ) : (
                                        <h2 className="mb-1 mt-4 flex items-center px-7 py-3">
                                            <span className="text-xs font-bold uppercase tracking-widest text-white-dark dark:text-white-dark">
                                                {t(group.labelKey)}
                                            </span>
                                        </h2>
                                    )}

                                    {(!group.collapsible || globalOpen) && (
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
                                                                    {t(item.titleKey)}
                                                                </span>
                                                            </div>
                                                        </Link>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </li>
                            ))}

                            <li className="nav-item mt-4 border-t border-white-light/40 pt-4 dark:border-[#1b2e4b]">
                                <button
                                    type="button"
                                    className="group flex w-full items-center justify-between rounded-md p-2.5 text-[#506690] hover:bg-[#000]/[0.08] hover:text-black dark:hover:bg-[#181f32] dark:hover:text-white-dark"
                                    onClick={() => {
                                        localStorage.removeItem('admin_token');
                                        window.location.href = '/login';
                                    }}
                                >
                                    <div className="flex items-center">
                                        <LogOut className="h-5 w-5 text-danger/70 group-hover:!text-danger" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-danger/70 group-hover:text-danger">{t('common.logout')}</span>
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
