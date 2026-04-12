'use client';
import dynamic from 'next/dynamic';
import Dropdown from '@/components/dropdown';
import IconHorizontalDots from '@/components/icon/icon-horizontal-dots';
import IconCircleCheck from '@/components/icon/icon-circle-check';
import { IRootState } from '@/store';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Building2, Users, GraduationCap, CreditCard, TrendingUp, Loader2, AlertCircle, Package, Globe, Activity } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { useTranslation } from '@/hooks/useTranslation';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

type DashboardStats = {
    total_tenants: number;
    active_tenants: number;
    total_schools: number;
    total_users: number;
    active_subscriptions: number;
    monthly_revenue: number;
    total_revenue: number;
    pending_payments?: number;
    new_tenants_this_month?: number;
    new_subscriptions_this_month?: number;
};

type RevenueData = {
    monthly: { month: string; revenue: number; expense?: number }[];
};

type RecentActivity = {
    id: number;
    user?: { name?: string; email?: string };
    action: string;
    action_label?: string;
    model?: { label?: string; type?: string };
    created_at: string;
    time_ago?: string;
};

const ACTION_COLORS: Record<string, string> = {
    created: 'bg-success/20 text-success',
    updated: 'bg-info/20 text-info',
    deleted: 'bg-danger/20 text-danger',
    restored: 'bg-warning/20 text-warning',
};

const ComponentsDashboardIStudy = () => {
    const { t, locale } = useTranslation();
    const [isMounted, setIsMounted] = useState(false);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
    const [activities, setActivities] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);

    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl';

    useEffect(() => {
        setIsMounted(true);
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const [statsRes, revenueRes, activityRes] = await Promise.allSettled([
                apiClient.get('/admin/dashboard/stats'),
                apiClient.get('/admin/dashboard/revenue'),
                apiClient.get('/admin/dashboard/recent-activities'),
            ]);

            if (statsRes.status === 'fulfilled' && statsRes.value.data?.data) {
                setStats(statsRes.value.data.data);
            }
            if (revenueRes.status === 'fulfilled' && revenueRes.value.data?.data) {
                setRevenueData(revenueRes.value.data.data);
            }
            if (activityRes.status === 'fulfilled' && activityRes.value.data?.data) {
                setActivities(activityRes.value.data.data ?? []);
            }
        } catch { /* silently fail, UI shows fallback */ } finally {
            setLoading(false);
        }
    };

    const fmt = (n?: number) => n?.toLocaleString(locale === 'en' ? 'en-US' : 'tr-TR') ?? '—';
    const fmtCurrency = (n?: number) => n !== undefined ? '₺' + (n / 1000).toFixed(0) + 'K' : '—';

    const monthlyRevenueSeries = revenueData?.monthly
        ? [{ name: t('dashboard.revenue'), data: revenueData.monthly.map((m) => m.revenue) }]
        : [{ name: t('dashboard.revenue'), data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }];

    const monthLabels = [
        t('months.jan'), t('months.feb'), t('months.mar'), t('months.apr'),
        t('months.may'), t('months.jun'), t('months.jul'), t('months.aug'),
        t('months.sep'), t('months.oct'), t('months.nov'), t('months.dec'),
    ];

    const monthlyRevenueCategories = revenueData?.monthly
        ? revenueData.monthly.map((m) => m.month)
        : monthLabels;

    const monthlyRevenueOptions: object = {
        chart: { height: 200, type: 'area', toolbar: { show: false } },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        colors: ['#4361ee'],
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.05 } },
        xaxis: {
            categories: monthlyRevenueCategories,
            labels: { style: { fontSize: '11px' } },
        },
        yaxis: {
            labels: {
                formatter: (value: number) => '₺' + (value / 1000).toFixed(0) + 'K',
                style: { fontSize: '11px' },
            },
        },
        legend: { position: 'top' },
        grid: { borderColor: '#e0e6ed', strokeDashArray: 5, padding: { top: 0, right: 0, bottom: 0, left: 0 } },
        tooltip: { y: { formatter: (value: number) => '₺' + value.toLocaleString(locale === 'en' ? 'en-US' : 'tr-TR') } },
    };

    const statCards = [
        {
            title: t('dashboard.totalTenants'),
            value: fmt(stats?.total_tenants),
            sub: stats?.new_tenants_this_month !== undefined ? `+${stats.new_tenants_this_month} ${t('dashboard.thisMonth')}` : `${fmt(stats?.active_tenants)} ${t('common.active').toLowerCase()}`,
            color: 'bg-gradient-to-r from-cyan-500 to-cyan-400',
            icon: Building2,
            href: '/tenants',
            linkText: t('dashboard.manageTenants'),
        },
        {
            title: t('dashboard.totalUsers'),
            value: fmt(stats?.total_users),
            sub: `${fmt(stats?.total_schools)} ${t('dashboard.schoolRecords')}`,
            color: 'bg-gradient-to-r from-violet-500 to-violet-400',
            icon: Users,
            href: '/users',
            linkText: t('dashboard.viewUsers'),
        },
        {
            title: t('dashboard.activeSubscriptions'),
            value: fmt(stats?.active_subscriptions),
            sub: stats?.new_subscriptions_this_month !== undefined ? `+${stats.new_subscriptions_this_month} ${t('dashboard.thisMonth')}` : t('dashboard.activePlan'),
            color: 'bg-gradient-to-r from-blue-500 to-blue-400',
            icon: Package,
            href: '/subscriptions',
            linkText: t('dashboard.viewSubscriptions'),
        },
        {
            title: t('dashboard.monthlyRevenue'),
            value: fmtCurrency(stats?.monthly_revenue),
            sub: `${t('common.total')}: ${fmtCurrency(stats?.total_revenue)}`,
            color: 'bg-gradient-to-r from-fuchsia-500 to-fuchsia-400',
            icon: CreditCard,
            href: '/finance',
            linkText: t('dashboard.financeReport'),
        },
    ];

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link href="/" className="text-primary hover:underline">{t('sidebar.dashboard')}</Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>{t('dashboard.overview')}</span>
                </li>
            </ul>

            <div className="pt-5">
                {/* Stat Cards */}
                <div className="mb-6 grid grid-cols-1 gap-6 text-white sm:grid-cols-2 xl:grid-cols-4">
                    {statCards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <div key={card.title} className={`panel ${card.color}`}>
                                <div className="flex justify-between">
                                    <div className="text-md font-semibold ltr:mr-1 rtl:ml-1">{card.title}</div>
                                    <div className="dropdown">
                                        <Dropdown
                                            offset={[0, 5]}
                                            placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                            btnClassName="hover:opacity-80"
                                            button={<IconHorizontalDots className="opacity-70 hover:opacity-80" />}
                                        >
                                            <ul className="text-black dark:text-white-dark">
                                                <li><Link href={card.href}>{t('common.viewDetails')}</Link></li>
                                            </ul>
                                        </Dropdown>
                                    </div>
                                </div>
                                <div className="mt-5 flex items-center">
                                    <div className="text-3xl font-bold ltr:mr-3 rtl:ml-3">{card.value}</div>
                                    {card.sub && <div className="badge bg-white/30 text-white text-xs">{card.sub}</div>}
                                </div>
                                <div className="mt-5 flex items-center font-semibold">
                                    <Icon className="h-5 w-5 shrink-0 ltr:mr-2 rtl:ml-2" />
                                    <Link href={card.href} className="hover:underline text-sm opacity-90">{card.linkText}</Link>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    {/* Quick Metrics */}
                    <div>
                        <div className="mb-5 flex items-center font-bold">
                            <span className="text-lg">{t('dashboard.quickMetrics')}</span>
                            <Link href="/schools" className="text-primary hover:text-black ltr:ml-auto rtl:mr-auto dark:hover:text-white-dark text-sm font-normal">
                                {t('dashboard.viewSchools')}
                            </Link>
                        </div>
                        <div className="grid grid-cols-3 gap-6 md:mb-5">
                            <div className="panel">
                                <div className="mb-3 flex items-center font-semibold">
                                    <div className="grid h-10 w-10 shrink-0 place-content-center rounded-full bg-secondary/20 text-secondary">
                                        <GraduationCap className="h-5 w-5" />
                                    </div>
                                    <div className="ltr:ml-2 rtl:mr-2">
                                        <h6 className="text-dark dark:text-white-light">{t('dashboard.schools')}</h6>
                                        <p className="text-xs text-white-dark">{t('dashboard.allBranches')}</p>
                                    </div>
                                </div>
                                <div className="text-2xl font-bold">{fmt(stats?.total_schools)}</div>
                                <div className="mt-1 text-xs text-success flex items-center gap-1"><TrendingUp className="h-3 w-3" />{t('common.active')}</div>
                            </div>

                            <div className="panel">
                                <div className="mb-3 flex items-center font-semibold">
                                    <div className="grid h-10 w-10 shrink-0 place-content-center rounded-full bg-info/20 text-info">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div className="ltr:ml-2 rtl:mr-2">
                                        <h6 className="text-dark dark:text-white-light">{t('dashboard.tenants')}</h6>
                                        <p className="text-xs text-white-dark">{t('dashboard.activeTenant')}</p>
                                    </div>
                                </div>
                                <div className="text-2xl font-bold">{fmt(stats?.active_tenants)}</div>
                                <div className="mt-1 text-xs text-success flex items-center gap-1"><TrendingUp className="h-3 w-3" />{t('common.active')}</div>
                            </div>

                            <div className="panel">
                                <div className="mb-3 flex items-center font-semibold">
                                    <div className="grid h-10 w-10 shrink-0 place-content-center rounded-full bg-success/20 text-success">
                                        <Globe className="h-5 w-5" />
                                    </div>
                                    <div className="ltr:ml-2 rtl:mr-2">
                                        <h6 className="text-dark dark:text-white-light">{t('dashboard.subscription')}</h6>
                                        <p className="text-xs text-white-dark">{t('dashboard.activePlan')}</p>
                                    </div>
                                </div>
                                <div className="text-2xl font-bold">{fmt(stats?.active_subscriptions)}</div>
                                <div className="mt-1 text-xs text-success flex items-center gap-1"><TrendingUp className="h-3 w-3" />{t('common.running')}</div>
                            </div>
                        </div>
                    </div>

                    {/* Revenue Chart */}
                    <div>
                        <div className="mb-5 flex items-center font-bold">
                            <span className="text-lg">{t('dashboard.revenueTrend')}</span>
                            <Link href="/finance" className="text-primary hover:text-black ltr:ml-auto rtl:mr-auto dark:hover:text-white-dark text-sm font-normal">
                                {t('dashboard.financeReport')}
                            </Link>
                        </div>
                        <div className="panel">
                            {isMounted && (
                                <ReactApexChart
                                    series={monthlyRevenueSeries}
                                    options={monthlyRevenueOptions}
                                    type="area"
                                    height={200}
                                    width={'100%'}
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
                    {/* Summary Panel */}
                    <div className="panel overflow-hidden">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-lg font-bold">{t('dashboard.systemSummary')}</div>
                                <div className="text-success text-sm">{new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'tr-TR', { month: 'long', year: 'numeric' })}</div>
                            </div>
                            <IconCircleCheck className="h-10 w-10 text-success opacity-20" />
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-3">
                            <div>
                                <div className="text-primary text-sm">{t('dashboard.totalTenants')}</div>
                                <div className="mt-1 text-2xl font-semibold">{fmt(stats?.total_tenants)}</div>
                            </div>
                            <div>
                                <div className="text-primary text-sm">{t('dashboard.activeTenants')}</div>
                                <div className="mt-1 text-2xl font-semibold">{fmt(stats?.active_tenants)}</div>
                            </div>
                            <div>
                                <div className="text-primary text-sm">{t('dashboard.totalSchools')}</div>
                                <div className="mt-1 text-2xl font-semibold">{fmt(stats?.total_schools)}</div>
                            </div>
                            <div>
                                <div className="text-primary text-sm">{t('dashboard.totalUsers')}</div>
                                <div className="mt-1 text-2xl font-semibold">{fmt(stats?.total_users)}</div>
                            </div>
                            <div>
                                <div className="text-primary text-sm">{t('dashboard.activeSubscription')}</div>
                                <div className="mt-1 text-2xl font-semibold">{fmt(stats?.active_subscriptions)}</div>
                            </div>
                            <div>
                                <div className="text-primary text-sm">{t('dashboard.totalRevenue')}</div>
                                <div className="mt-1 text-2xl font-semibold">{fmtCurrency(stats?.total_revenue)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="panel">
                        <div className="mb-5 flex items-center justify-between">
                            <div className="text-lg font-bold flex items-center gap-2">
                                <Activity className="h-5 w-5 text-primary" /> {t('dashboard.recentActivity')}
                            </div>
                            <Link href="/activity-logs" className="text-primary text-sm hover:underline">{t('common.viewAll')}</Link>
                        </div>
                        {activities.length === 0 ? (
                            <div className="flex h-32 items-center justify-center text-muted-foreground gap-2">
                                <AlertCircle className="h-4 w-4" /> {t('dashboard.noActivity')}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {activities.slice(0, 8).map((a) => (
                                    <div key={a.id} className="flex items-start gap-3">
                                        <span className={`mt-0.5 inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_COLORS[a.action] ?? 'bg-gray-100 text-gray-600'}`}>
                                            {a.action_label ?? a.action}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm truncate">
                                                <span className="font-medium">{a.user?.name ?? a.user?.email ?? t('common.system')}</span>
                                                {a.model?.label ? ` → ${a.model.label}` : ''}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{a.time_ago ?? new Date(a.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'tr-TR')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComponentsDashboardIStudy;
