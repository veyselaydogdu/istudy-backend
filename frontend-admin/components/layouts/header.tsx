'use client';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { IRootState } from '@/store';
import { toggleTheme, toggleSidebar } from '@/store/themeConfigSlice';
import Dropdown from '@/components/dropdown';
import {
    Menu,
    Sun,
    Moon,
    Monitor,
    Bell,
    User,
    LogOut,
    LayoutDashboard,
} from 'lucide-react';

const pageTitles: Record<string, string> = {
    '/': 'Dashboard',
    '/tenants': 'Kurumlar',
    '/schools': 'Okullar & Şubeler',
    '/users': 'Kullanıcılar',
    '/health': 'Sağlık & Beslenme',
    '/packages': 'Paket Yönetimi',
    '/finance': 'Finans & Ödemeler',
    '/subscriptions': 'Abonelikler',
    '/activity-logs': 'Aktivite Kayıtları',
    '/notifications': 'Bildirimler',
    '/settings': 'Ayarlar',
};

function getPageTitle(pathname: string): string {
    if (pageTitles[pathname]) return pageTitles[pathname];
    for (const [key, value] of Object.entries(pageTitles)) {
        if (key !== '/' && pathname.startsWith(key + '/')) return value;
    }
    return 'iStudy Admin';
}

const Header = () => {
    const pathname = usePathname();
    const dispatch = useDispatch();
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const isRtl = themeConfig.rtlClass === 'rtl';
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const pageTitle = getPageTitle(pathname);

    return (
        <header className={`z-40 ${themeConfig.semidark && themeConfig.menu === 'horizontal' ? 'dark' : ''}`}>
            <div className="shadow-sm">
                <div className="relative flex w-full items-center bg-white px-5 py-2.5 dark:bg-black">
                    {/* Mobile logo + hamburger */}
                    <div className="horizontal-logo flex items-center justify-between ltr:mr-2 rtl:ml-2 lg:hidden">
                        <Link href="/" className="main-logo flex shrink-0 items-center">
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
                        {/* Theme toggle */}
                        {mounted && (
                            <div>
                                {themeConfig.theme === 'light' && (
                                    <button
                                        className="flex items-center rounded-full bg-white-light/40 p-2 hover:bg-white-light/90 hover:text-primary dark:bg-dark/40 dark:hover:bg-dark/60"
                                        onClick={() => dispatch(toggleTheme('dark'))}
                                        title="Koyu Temaya Geç"
                                    >
                                        <Sun className="h-5 w-5" />
                                    </button>
                                )}
                                {themeConfig.theme === 'dark' && (
                                    <button
                                        className="flex items-center rounded-full bg-white-light/40 p-2 hover:bg-white-light/90 hover:text-primary dark:bg-dark/40 dark:hover:bg-dark/60"
                                        onClick={() => dispatch(toggleTheme('system'))}
                                        title="Sistem Temasına Geç"
                                    >
                                        <Moon className="h-5 w-5" />
                                    </button>
                                )}
                                {themeConfig.theme === 'system' && (
                                    <button
                                        className="flex items-center rounded-full bg-white-light/40 p-2 hover:bg-white-light/90 hover:text-primary dark:bg-dark/40 dark:hover:bg-dark/60"
                                        onClick={() => dispatch(toggleTheme('light'))}
                                        title="Açık Temaya Geç"
                                    >
                                        <Monitor className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Notifications */}
                        <button className="relative rounded-full bg-white-light/40 p-2 hover:bg-white-light/90 hover:text-primary dark:bg-dark/40 dark:hover:bg-dark/60">
                            <Bell className="h-5 w-5" />
                            <span className="absolute right-0 top-0 flex h-3 w-3">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/50 opacity-75" />
                                <span className="relative inline-flex h-[6px] w-[6px] rounded-full bg-success" />
                            </span>
                        </button>

                        {/* User Dropdown */}
                        <div className="dropdown flex shrink-0">
                            <Dropdown
                                offset={[0, 8]}
                                placement={isRtl ? 'bottom-start' : 'bottom-end'}
                                btnClassName="relative group block"
                                button={
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white ring-2 ring-primary/20 group-hover:ring-primary/50">
                                        SA
                                    </div>
                                }
                            >
                                <ul className="w-[220px] !py-0 font-semibold text-dark dark:text-white-dark dark:text-white-light/90">
                                    <li>
                                        <div className="flex items-center px-4 py-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">
                                                SA
                                            </div>
                                            <div className="truncate ltr:pl-4 rtl:pr-4">
                                                <h4 className="text-sm text-black dark:text-white">Süper Admin</h4>
                                                <span className="text-xs text-black/60 dark:text-dark-light/60">
                                                    admin@istudy.com
                                                </span>
                                            </div>
                                        </div>
                                    </li>
                                    <li className="border-t border-white-light dark:border-white-light/10">
                                        <button
                                            type="button"
                                            className="flex w-full items-center !py-3 text-danger"
                                            onClick={() => {
                                                localStorage.removeItem('admin_token');
                                                window.location.href = '/login';
                                            }}
                                        >
                                            <LogOut className="h-4 w-4 shrink-0 rotate-90 ltr:mr-2 rtl:ml-2" />
                                            Çıkış Yap
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
