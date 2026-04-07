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

    const fmt = (n?: number) => n?.toLocaleString('tr-TR') ?? '—';
    const fmtCurrency = (n?: number) => n !== undefined ? '₺' + (n / 1000).toFixed(0) + 'K' : '—';

    const monthlyRevenueSeries = revenueData?.monthly
        ? [{ name: 'Gelir', data: revenueData.monthly.map((m) => m.revenue) }]
        : [{ name: 'Gelir', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }];

    const monthlyRevenueCategories = revenueData?.monthly
        ? revenueData.monthly.map((m) => m.month)
        : ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

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
        tooltip: { y: { formatter: (value: number) => '₺' + value.toLocaleString('tr-TR') } },
    };

    const statCards = [
        {
            title: 'Toplam Kurum',
            value: fmt(stats?.total_tenants),
            sub: stats?.new_tenants_this_month !== undefined ? `+${stats.new_tenants_this_month} bu ay` : `${fmt(stats?.active_tenants)} aktif`,
            color: 'bg-gradient-to-r from-cyan-500 to-cyan-400',
            icon: Building2,
            href: '/tenants',
        },
        {
            title: 'Toplam Kullanıcı',
            value: fmt(stats?.total_users),
            sub: `${fmt(stats?.total_schools)} okul kaydı`,
            color: 'bg-gradient-to-r from-violet-500 to-violet-400',
            icon: Users,
            href: '/users',
        },
        {
            title: 'Aktif Abonelik',
            value: fmt(stats?.active_subscriptions),
            sub: stats?.new_subscriptions_this_month !== undefined ? `+${stats.new_subscriptions_this_month} bu ay` : 'aktif plan',
            color: 'bg-gradient-to-r from-blue-500 to-blue-400',
            icon: Package,
            href: '/subscriptions',
        },
        {
            title: 'Aylık Gelir',
            value: fmtCurrency(stats?.monthly_revenue),
            sub: `Toplam: ${fmtCurrency(stats?.total_revenue)}`,
            color: 'bg-gradient-to-r from-fuchsia-500 to-fuchsia-400',
            icon: CreditCard,
            href: '/finance',
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
                    <Link href="/" className="text-primary hover:underline">Dashboard</Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Genel Bakış</span>
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
                                                <li><Link href={card.href}>Detayları Gör</Link></li>
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
                                    <Link href={card.href} className="hover:underline text-sm opacity-90">{card.href === '/tenants' ? 'Kurumları Yönet' : card.href === '/users' ? 'Kullanıcıları Gör' : card.href === '/subscriptions' ? 'Abonelikleri Gör' : 'Finans Raporu'}</Link>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    {/* Quick Metrics */}
                    <div>
                        <div className="mb-5 flex items-center font-bold">
                            <span className="text-lg">Hızlı Metrikler</span>
                            <Link href="/schools" className="text-primary hover:text-black ltr:ml-auto rtl:mr-auto dark:hover:text-white-dark text-sm font-normal">
                                Okulları Gör
                            </Link>
                        </div>
                        <div className="grid grid-cols-3 gap-6 md:mb-5">
                            <div className="panel">
                                <div className="mb-3 flex items-center font-semibold">
                                    <div className="grid h-10 w-10 shrink-0 place-content-center rounded-full bg-secondary/20 text-secondary">
                                        <GraduationCap className="h-5 w-5" />
                                    </div>
                                    <div className="ltr:ml-2 rtl:mr-2">
                                        <h6 className="text-dark dark:text-white-light">Okullar</h6>
                                        <p className="text-xs text-white-dark">Tüm şubeler</p>
                                    </div>
                                </div>
                                <div className="text-2xl font-bold">{fmt(stats?.total_schools)}</div>
                                <div className="mt-1 text-xs text-success flex items-center gap-1"><TrendingUp className="h-3 w-3" />Aktif</div>
                            </div>

                            <div className="panel">
                                <div className="mb-3 flex items-center font-semibold">
                                    <div className="grid h-10 w-10 shrink-0 place-content-center rounded-full bg-info/20 text-info">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div className="ltr:ml-2 rtl:mr-2">
                                        <h6 className="text-dark dark:text-white-light">Kurumlar</h6>
                                        <p className="text-xs text-white-dark">Aktif tenant</p>
                                    </div>
                                </div>
                                <div className="text-2xl font-bold">{fmt(stats?.active_tenants)}</div>
                                <div className="mt-1 text-xs text-success flex items-center gap-1"><TrendingUp className="h-3 w-3" />Aktif</div>
                            </div>

                            <div className="panel">
                                <div className="mb-3 flex items-center font-semibold">
                                    <div className="grid h-10 w-10 shrink-0 place-content-center rounded-full bg-success/20 text-success">
                                        <Globe className="h-5 w-5" />
                                    </div>
                                    <div className="ltr:ml-2 rtl:mr-2">
                                        <h6 className="text-dark dark:text-white-light">Abonelik</h6>
                                        <p className="text-xs text-white-dark">Aktif plan</p>
                                    </div>
                                </div>
                                <div className="text-2xl font-bold">{fmt(stats?.active_subscriptions)}</div>
                                <div className="mt-1 text-xs text-success flex items-center gap-1"><TrendingUp className="h-3 w-3" />Çalışıyor</div>
                            </div>
                        </div>
                    </div>

                    {/* Revenue Chart */}
                    <div>
                        <div className="mb-5 flex items-center font-bold">
                            <span className="text-lg">Gelir Trendi</span>
                            <Link href="/finance" className="text-primary hover:text-black ltr:ml-auto rtl:mr-auto dark:hover:text-white-dark text-sm font-normal">
                                Finans Raporu
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
                                <div className="text-lg font-bold">Sistem Özeti</div>
                                <div className="text-success text-sm">{new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</div>
                            </div>
                            <IconCircleCheck className="h-10 w-10 text-success opacity-20" />
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-3">
                            <div>
                                <div className="text-primary text-sm">Toplam Kurum</div>
                                <div className="mt-1 text-2xl font-semibold">{fmt(stats?.total_tenants)}</div>
                            </div>
                            <div>
                                <div className="text-primary text-sm">Aktif Kurum</div>
                                <div className="mt-1 text-2xl font-semibold">{fmt(stats?.active_tenants)}</div>
                            </div>
                            <div>
                                <div className="text-primary text-sm">Toplam Okul</div>
                                <div className="mt-1 text-2xl font-semibold">{fmt(stats?.total_schools)}</div>
                            </div>
                            <div>
                                <div className="text-primary text-sm">Toplam Kullanıcı</div>
                                <div className="mt-1 text-2xl font-semibold">{fmt(stats?.total_users)}</div>
                            </div>
                            <div>
                                <div className="text-primary text-sm">Aktif Abonelik</div>
                                <div className="mt-1 text-2xl font-semibold">{fmt(stats?.active_subscriptions)}</div>
                            </div>
                            <div>
                                <div className="text-primary text-sm">Toplam Gelir</div>
                                <div className="mt-1 text-2xl font-semibold">{fmtCurrency(stats?.total_revenue)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="panel">
                        <div className="mb-5 flex items-center justify-between">
                            <div className="text-lg font-bold flex items-center gap-2">
                                <Activity className="h-5 w-5 text-primary" /> Son Aktiviteler
                            </div>
                            <Link href="/activity-logs" className="text-primary text-sm hover:underline">Tümünü Gör</Link>
                        </div>
                        {activities.length === 0 ? (
                            <div className="flex h-32 items-center justify-center text-muted-foreground gap-2">
                                <AlertCircle className="h-4 w-4" /> Aktivite bulunamadı
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
                                                <span className="font-medium">{a.user?.name ?? a.user?.email ?? 'Sistem'}</span>
                                                {a.model?.label ? ` → ${a.model.label}` : ''}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{a.time_ago ?? new Date(a.created_at).toLocaleDateString('tr-TR')}</p>
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
