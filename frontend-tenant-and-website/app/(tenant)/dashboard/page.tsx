'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';
import { User, TenantSubscription, SubscriptionUsage, School } from '@/types';
import { Building2, Users, BookOpen, CreditCard, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function DashboardPage() {
    const { t } = useTranslation();
    const [user, setUser] = useState<User | null>(null);
    const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
    const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
    const [schools, setSchools] = useState<School[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            apiClient.get('/auth/me'),
            apiClient.get('/tenant/subscription').catch(() => ({ data: { data: null } })),
            apiClient.get('/tenant/subscription/usage').catch(() => ({ data: { data: null } })),
            apiClient.get('/schools').catch(() => ({ data: { data: [] } })),
        ]).then(([userRes, subRes, usageRes, schoolsRes]) => {
            if (userRes.data?.data) setUser(userRes.data.data);
            if (subRes.data?.data) setSubscription(subRes.data.data);
            if (usageRes.data?.data) setUsage(usageRes.data.data);
            if (schoolsRes.data?.data) setSchools(schoolsRes.data.data.slice(0, 5));
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const getUsageColor = (used: number, limit: number) => {
        if (limit === 0) return 'bg-success';
        const pct = (used / limit) * 100;
        if (pct >= 90) return 'bg-danger';
        if (pct >= 70) return 'bg-warning';
        return 'bg-success';
    };

    const getUsagePct = (used: number, limit: number) => {
        if (limit === 0) return 0;
        return Math.min((used / limit) * 100, 100);
    };

    const formatLimit = (val: number) => (val === 0 ? t('dashboard.unlimited') : val.toString());

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-dark dark:text-white">
                    {t('dashboard.welcome')}{user ? `, ${user.name}` : ''}!
                </h1>
                <p className="text-[#515365] dark:text-[#888ea8]">
                    {user?.tenant?.name ?? ''} {t('dashboard.managementPanel')}
                </p>
            </div>

            {/* No subscription warning */}
            {!subscription && (
                <div className="mb-6 flex items-start gap-4 rounded-lg border border-warning/30 bg-warning/10 p-4">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 text-warning mt-0.5" />
                    <div>
                        <p className="font-semibold text-warning">{t('dashboard.noSubWarning')}</p>
                        <p className="mt-1 text-sm text-[#515365] dark:text-[#888ea8]">
                            {t('dashboard.noSubDesc')}
                        </p>
                        <Link href="/subscription" className="btn btn-warning btn-sm mt-3">
                            {t('dashboard.selectPlanBtn')}
                        </Link>
                    </div>
                </div>
            )}

            {/* Stat cards */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="panel">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                            <CreditCard className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-[#515365] dark:text-[#888ea8]">{t('dashboard.subscriptionCard')}</p>
                            <p className="text-lg font-bold text-dark dark:text-white">
                                {subscription ? subscription.package?.name ?? t('dashboard.subscriptionActive') : t('dashboard.subscriptionNone')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="panel">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
                            <Building2 className="h-6 w-6 text-info" />
                        </div>
                        <div>
                            <p className="text-sm text-[#515365] dark:text-[#888ea8]">{t('dashboard.schoolsCard')}</p>
                            <p className="text-lg font-bold text-dark dark:text-white">
                                {usage?.schools ? `${usage.schools.used} / ${formatLimit(usage.schools.limit)}` : schools.length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="panel">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                            <Users className="h-6 w-6 text-success" />
                        </div>
                        <div>
                            <p className="text-sm text-[#515365] dark:text-[#888ea8]">{t('dashboard.studentsCard')}</p>
                            <p className="text-lg font-bold text-dark dark:text-white">
                                {usage?.students ? `${usage.students.used} / ${formatLimit(usage.students.limit)}` : '—'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="panel">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                            <BookOpen className="h-6 w-6 text-warning" />
                        </div>
                        <div>
                            <p className="text-sm text-[#515365] dark:text-[#888ea8]">{t('dashboard.classesCard')}</p>
                            <p className="text-lg font-bold text-dark dark:text-white">
                                {usage?.classes ? `${usage.classes.used} / ${formatLimit(usage.classes.limit)}` : '—'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Usage progress bars */}
            {usage?.schools && (
                <div className="panel mb-6">
                    <h2 className="mb-4 font-semibold text-dark dark:text-white">{t('dashboard.usageTitle')}</h2>
                    <div className="space-y-4">
                        {[
                            { label: t('dashboard.schoolsCard'), ...usage.schools },
                            { label: t('dashboard.studentsCard'), ...usage.students },
                            { label: t('dashboard.classesCard'), ...usage.classes },
                        ].map((item) => (
                            <div key={item.label}>
                                <div className="mb-1 flex justify-between text-sm">
                                    <span className="font-medium text-dark dark:text-white">{item.label}</span>
                                    <span className="text-[#515365] dark:text-[#888ea8]">
                                        {item.used} / {formatLimit(item.limit)}
                                    </span>
                                </div>
                                {item.limit > 0 ? (
                                    <div className="h-2 w-full rounded-full bg-[#ebedf2] dark:bg-[#1b2e4b]">
                                        <div
                                            className={`h-2 rounded-full transition-all ${getUsageColor(item.used, item.limit)}`}
                                            style={{ width: `${getUsagePct(item.used, item.limit)}%` }}
                                        />
                                    </div>
                                ) : (
                                    <p className="text-xs text-success">{t('dashboard.unlimited')}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent schools */}
            {schools.length > 0 && (
                <div className="panel">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-semibold text-dark dark:text-white">{t('dashboard.recentSchoolsTitle')}</h2>
                        <Link href="/schools" className="text-sm font-semibold text-primary hover:underline">
                            {t('dashboard.viewAll')}
                        </Link>
                    </div>
                    <div className="table-responsive">
                        <table className="table-hover">
                            <thead>
                                <tr>
                                    <th>{t('dashboard.schoolNameCol')}</th>
                                    <th>{t('dashboard.classCol')}</th>
                                    <th>{t('dashboard.studentCol')}</th>
                                    <th>{t('dashboard.statusCol')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schools.map((school) => (
                                    <tr key={school.id}>
                                        <td>
                                            <Link href={`/schools/${school.id}`} className="font-medium text-primary hover:underline">
                                                {school.name}
                                            </Link>
                                        </td>
                                        <td>{school.classes_count ?? 0}</td>
                                        <td>{school.children_count ?? 0}</td>
                                        <td>
                                            <span className={`badge ${school.status === 'active' ? 'badge-outline-success' : 'badge-outline-danger'}`}>
                                                {school.status === 'active' ? t('common.active') : t('common.inactive')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
