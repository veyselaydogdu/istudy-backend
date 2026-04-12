'use client';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IRootState } from '@/store';
import { toggleTheme, toggleSidebar } from '@/store/themeConfigSlice';
import Dropdown from '@/components/dropdown';
import apiClient from '@/lib/apiClient';
import { User as UserType } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { availableLocales } from '@/i18n';
import {
    Menu,
    Sun,
    Moon,
    Monitor,
    Bell,
    LogOut,
    LayoutDashboard,
    Languages,
} from 'lucide-react';

const Header = () => {
    const { t, locale, switchLocale } = useTranslation();
    const pathname = usePathname();
    const dispatch = useDispatch();
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const isRtl = themeConfig.rtlClass === 'rtl';
    const [mounted, setMounted] = useState(false);
    const [user, setUser] = useState<UserType | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        setMounted(true);
        apiClient.get('/auth/me').then((res) => {
            if (res.data?.data) {
                setUser(res.data.data);
            }
        }).catch(() => {});
        apiClient.get('/notifications/unread-count').then((res) => {
            if (res.data?.data?.count !== undefined) {
                setUnreadCount(res.data.data.count);
            }
        }).catch(() => {});
    }, []);

    const pageTitles: Record<string, string> = {
        '/dashboard': t('sidebar.dashboard'),
        '/schools': t('schools.title'),
        '/academic-years': t('academicYears.title'),
        '/meals': t('meals.title'),
        '/activities': t('activities.title'),
        '/activity-classes': t('sidebar.activityClasses'),
        '/social': t('sidebar.socialNetwork'),
        '/approvals': t('sidebar.approvals'),
        '/subscription': t('subscription.title'),
        '/invoices': t('invoices.title'),
        '/notifications': t('notifications.title'),
        '/profile': t('profile.title'),
        '/teachers': t('teachers.title'),
    };

    function getPageTitle(p: string): string {
        if (pageTitles[p]) return pageTitles[p];
        for (const [key, value] of Object.entries(pageTitles)) {
            if (p.startsWith(key + '/')) return value;
        }
        return 'iStudy';
    }

    function getInitials(name: string): string {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    const pageTitle = getPageTitle(pathname);
    const initials = user ? getInitials(user.name) : '?';

    const handleLogout = () => {
        localStorage.removeItem('tenant_token');
        window.location.href = '/login';
    };

    return (
        <header className={`z-40 ${themeConfig.semidark && themeConfig.menu === 'horizontal' ? 'dark' : ''}`}>
            <div className="shadow-sm">
                <div className="relative flex w-full items-center bg-white px-5 py-2.5 dark:bg-black">
                    {/* Mobile logo + hamburger */}
                    <div className="horizontal-logo flex items-center justify-between ltr:mr-2 rtl:ml-2 lg:hidden">
                        <Link href="/dashboard" className="main-logo flex shrink-0 items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                                <LayoutDashboard className="h-4 w-4" />
                            </div>
                            <span className="ml-2 hidden align-middle text-xl font-bold dark:text-white-light md:inline">
                                iStudy
                            </span>
                        </Link>
                        <button
                            type="button"
                            className="collapse-icon flex flex-none rounded-full bg-white-light/40 p-2 hover:bg-white-light/90 hover:text-primary ltr:ml-2 rtl:mr-2 dark:bg-dark/40 dark:text-[#d0d2d6] dark:hover:bg-dark/60 dark:hover:text-primary"
                            onClick={() => dispatch(toggleSidebar())}
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Page title */}
                    <div className="hidden ltr:mr-4 rtl:ml-4 lg:block">
                        <h2 className="text-base font-semibold text-dark dark:text-white-light">{pageTitle}</h2>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center space-x-1.5 ltr:ml-auto rtl:mr-auto rtl:space-x-reverse dark:text-[#d0d2d6] lg:space-x-2">
                        {/* Language switcher */}
                        {mounted && (
                            <div className="dropdown flex shrink-0">
                                <Dropdown
                                    offset={[0, 8]}
                                    placement={isRtl ? 'bottom-start' : 'bottom-end'}
                                    btnClassName="relative group block"
                                    button={
                                        <span
                                            className="flex items-center gap-1.5 rounded-full bg-white-light/40 p-2 hover:bg-white-light/90 hover:text-primary dark:bg-dark/40 dark:hover:bg-dark/60"
                                        >
                                            <Languages className="h-5 w-5" />
                                            <span className="hidden text-xs font-semibold uppercase sm:inline">
                                                {locale}
                                            </span>
                                        </span>
                                    }
                                >
                                    <ul className="w-[160px] !py-0 font-semibold text-dark dark:text-white-dark dark:text-white-light/90">
                                        {availableLocales.map((loc) => (
                                            <li key={loc.code}>
                                                <button
                                                    type="button"
                                                    className={`flex w-full items-center gap-2 px-4 py-2.5 hover:text-primary ${locale === loc.code ? 'text-primary bg-primary/5' : ''}`}
                                                    onClick={() => switchLocale(loc.code)}
                                                >
                                                    <span className="text-base">{loc.flag}</span>
                                                    <span className="text-sm">{loc.label}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </Dropdown>
                            </div>
                        )}

                        {/* Theme toggle */}
                        {mounted && (
                            <div>
                                {themeConfig.theme === 'light' && (
                                    <button
                                        className="flex items-center rounded-full bg-white-light/40 p-2 hover:bg-white-light/90 hover:text-primary dark:bg-dark/40 dark:hover:bg-dark/60"
                                        onClick={() => dispatch(toggleTheme('dark'))}
                                        title={t('theme.switchToDark')}
                                    >
                                        <Sun className="h-5 w-5" />
                                    </button>
                                )}
                                {themeConfig.theme === 'dark' && (
                                    <button
                                        className="flex items-center rounded-full bg-white-light/40 p-2 hover:bg-white-light/90 hover:text-primary dark:bg-dark/40 dark:hover:bg-dark/60"
                                        onClick={() => dispatch(toggleTheme('system'))}
                                        title={t('theme.switchToSystem')}
                                    >
                                        <Moon className="h-5 w-5" />
                                    </button>
                                )}
                                {themeConfig.theme === 'system' && (
                                    <button
                                        className="flex items-center rounded-full bg-white-light/40 p-2 hover:bg-white-light/90 hover:text-primary dark:bg-dark/40 dark:hover:bg-dark/60"
                                        onClick={() => dispatch(toggleTheme('light'))}
                                        title={t('theme.switchToLight')}
                                    >
                                        <Monitor className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Notifications bell */}
                        <Link
                            href="/notifications"
                            className="relative rounded-full bg-white-light/40 p-2 hover:bg-white-light/90 hover:text-primary dark:bg-dark/40 dark:hover:bg-dark/60"
                        >
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] text-white">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </Link>

                        {/* User Dropdown */}
                        <div className="dropdown flex shrink-0">
                            <Dropdown
                                offset={[0, 8]}
                                placement={isRtl ? 'bottom-start' : 'bottom-end'}
                                btnClassName="relative group block"
                                button={
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white ring-2 ring-primary/20 group-hover:ring-primary/50">
                                        {initials}
                                    </div>
                                }
                            >
                                <ul className="w-[220px] !py-0 font-semibold text-dark dark:text-white-dark dark:text-white-light/90">
                                    <li>
                                        <div className="flex items-center px-4 py-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">
                                                {initials}
                                            </div>
                                            <div className="truncate ltr:pl-4 rtl:pr-4">
                                                <h4 className="text-sm text-black dark:text-white">{user?.name ?? ''}</h4>
                                                <span className="text-xs text-black/60 dark:text-dark-light/60">
                                                    {user?.email ?? ''}
                                                </span>
                                            </div>
                                        </div>
                                    </li>
                                    <li className="border-t border-white-light dark:border-white-light/10">
                                        <button
                                            type="button"
                                            className="flex w-full items-center !py-3 text-danger"
                                            onClick={handleLogout}
                                        >
                                            <LogOut className="h-4 w-4 shrink-0 rotate-90 ltr:mr-2 rtl:ml-2" />
                                            {t('common.logout')}
                                        </button>
                                    </li>
                                </ul>
                            </Dropdown>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
