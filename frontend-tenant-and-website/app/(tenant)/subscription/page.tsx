'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import apiClient from '@/lib/apiClient';
import { TenantSubscription, SubscriptionUsage, Package } from '@/types';
import { Check, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

type SubscriptionHistory = {
    id: number;
    status: string;
    billing_cycle: string;
    starts_at: string;
    ends_at: string;
    package?: { name: string };
};

export default function SubscriptionPage() {
    const { t } = useTranslation();
    const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
    const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
    const [history, setHistory] = useState<SubscriptionHistory[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [subscribing, setSubscribing] = useState<number | null>(null);
    const [cancelling, setCancelling] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [subRes, usageRes, historyRes, pkgRes] = await Promise.all([
                apiClient.get('/tenant/subscription').catch(() => ({ data: { data: null } })),
                apiClient.get('/tenant/subscription/usage').catch(() => ({ data: { data: null } })),
                apiClient.get('/tenant/subscription/history').catch(() => ({ data: { data: [] } })),
                apiClient.get('/packages').catch(() => ({ data: { data: [] } })),
            ]);
            if (subRes.data?.data) { setSubscription(subRes.data.data); }
            if (usageRes.data?.data) { setUsage(usageRes.data.data); }
            if (historyRes.data?.data) { setHistory(historyRes.data.data); }
            if (pkgRes.data?.data) { setPackages(pkgRes.data.data); }
        } catch {
            toast.error(t('subscription.loadError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSubscribe = async (packageId: number) => {
        setSubscribing(packageId);
        try {
            await apiClient.post('/tenant/subscribe', { package_id: packageId, billing_cycle: billingCycle });
            toast.success(t('subscription.subscribeSuccess'));
            fetchData();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? t('subscription.subscribeError'));
        } finally {
            setSubscribing(null);
        }
    };

    const handleCancel = async () => {
        const result = await Swal.fire({
            title: t('subscription.cancelTitle'),
            text: t('subscription.cancelText'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('subscription.cancelConfirm'),
            cancelButtonText: t('common.back'),
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) { return; }
        setCancelling(true);
        try {
            await apiClient.post('/tenant/subscription/cancel');
            toast.success(t('subscription.cancelSuccess'));
            fetchData();
        } catch {
            toast.error(t('subscription.cancelError'));
        } finally {
            setCancelling(false);
        }
    };

    const formatLimit = (val: number) => (val === 0 ? t('subscription.unlimited') : val.toString());
    const getPrice = (pkg: Package) => billingCycle === 'monthly' ? pkg.monthly_price : pkg.yearly_price;
    const getStatusLabel = (status: string) => {
        const map: Record<string, string> = {
            active: t('subscription.activeStatus'),
            cancelled: t('subscription.cancelledStatus'),
            expired: t('subscription.expiredStatus'),
            trial: t('subscription.trialStatus'),
        };
        return map[status] ?? status;
    };
    const getStatusClass = (status: string) => {
        const map: Record<string, string> = {
            active: 'badge-outline-success',
            cancelled: 'badge-outline-danger',
            expired: 'badge-outline-secondary',
            trial: 'badge-outline-info',
        };
        return map[status] ?? 'badge-outline-secondary';
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold text-dark dark:text-white">{t('subscription.title')}</h1>

            {subscription ? (
                <>
                    {/* Current plan */}
                    <div className="panel mb-6">
                        <div className="mb-4 flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-dark dark:text-white">
                                    {subscription.package?.name ?? t('subscription.currentPlan')}
                                </h2>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className={`badge ${getStatusClass(subscription.status)}`}>
                                        {getStatusLabel(subscription.status)}
                                    </span>
                                    <span className="text-sm text-[#515365] dark:text-[#888ea8]">
                                        {subscription.billing_cycle === 'monthly' ? t('subscription.billingMonthly') : t('subscription.billingYearly')}
                                    </span>
                                </div>
                            </div>
                            {subscription.status === 'active' && (
                                <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={handleCancel}
                                    disabled={cancelling}
                                >
                                    {cancelling ? t('subscription.cancellingBtn') : t('subscription.cancelBtn')}
                                </button>
                            )}
                        </div>
                        <div className="grid gap-4 text-sm sm:grid-cols-2">
                            <div>
                                <p className="text-[#888ea8]">{t('subscription.startDate')}</p>
                                <p className="font-medium text-dark dark:text-white">
                                    {new Date(subscription.starts_at).toLocaleDateString('tr-TR')}
                                </p>
                            </div>
                            <div>
                                <p className="text-[#888ea8]">{t('subscription.endDate')}</p>
                                <p className="font-medium text-dark dark:text-white">
                                    {new Date(subscription.ends_at).toLocaleDateString('tr-TR')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Usage bars */}
                    {usage && (
                        <div className="panel mb-6">
                            <h2 className="mb-4 font-semibold text-dark dark:text-white">{t('subscription.usageTitle')}</h2>
                            <div className="space-y-4">
                                {[
                                    { label: t('subscription.usageSchools'), ...usage.schools },
                                    { label: t('subscription.usageStudents'), ...usage.students },
                                    { label: t('subscription.usageClasses'), ...usage.classes },
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
                                                    className="h-2 rounded-full bg-primary transition-all"
                                                    style={{ width: `${Math.min((item.used / item.limit) * 100, 100)}%` }}
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-xs text-success">{t('subscription.unlimited')}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upgrade / Change Plan */}
                    {packages.length > 0 && (
                        <div className="panel mb-6">
                            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <h2 className="font-semibold text-dark dark:text-white">{t('subscription.changePlanTitle')}</h2>
                                <div className="inline-flex items-center gap-1 rounded-full bg-[#f1f2f3] p-1 dark:bg-[#1b2e4b]">
                                    {(['monthly', 'yearly'] as const).map((cycle) => (
                                        <button
                                            key={cycle}
                                            type="button"
                                            className={`rounded-full px-4 py-1 text-sm font-semibold transition-colors ${billingCycle === cycle ? 'bg-white text-primary shadow dark:bg-[#0e1726]' : 'text-[#515365] dark:text-[#888ea8]'}`}
                                            onClick={() => setBillingCycle(cycle)}
                                        >
                                            {cycle === 'monthly' ? t('subscription.monthly') : t('subscription.yearly')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {packages.map((pkg, idx) => {
                                    const isCurrent = subscription?.package_id === pkg.id;
                                    return (
                                        <div key={pkg.id} className={`rounded border p-4 ${isCurrent ? 'border-primary bg-primary/5' : 'border-[#ebedf2] dark:border-[#1b2e4b]'}`}>
                                            <div className="mb-2 flex items-start justify-between">
                                                <h3 className="font-bold text-dark dark:text-white">{pkg.name}</h3>
                                                {isCurrent && <span className="badge badge-outline-primary text-xs">{t('subscription.currentBadge')}</span>}
                                                {idx === 1 && !isCurrent && <span className="badge badge-outline-success text-xs">{t('subscription.popularBadge')}</span>}
                                            </div>
                                            <div className="mb-3">
                                                <span className="text-2xl font-extrabold text-primary">₺{getPrice(pkg)}</span>
                                                <span className="text-xs text-[#515365] dark:text-[#888ea8]">{billingCycle === 'monthly' ? t('subscription.perMonth') : t('subscription.perYear')}</span>
                                            </div>
                                            <ul className="mb-4 space-y-1 text-sm">
                                                <li className="flex items-center gap-2 text-[#515365] dark:text-[#888ea8]">
                                                    <Check className="h-3.5 w-3.5 shrink-0 text-success" />
                                                    {formatLimit(pkg.max_schools)} {t('subscription.schoolUnit')}
                                                </li>
                                                <li className="flex items-center gap-2 text-[#515365] dark:text-[#888ea8]">
                                                    <Check className="h-3.5 w-3.5 shrink-0 text-success" />
                                                    {formatLimit(pkg.max_students)} {t('subscription.studentUnit')}
                                                </li>
                                            </ul>
                                            <button
                                                type="button"
                                                className={`btn btn-sm w-full ${isCurrent ? 'btn-outline-secondary' : 'btn-primary'}`}
                                                onClick={() => !isCurrent && handleSubscribe(pkg.id)}
                                                disabled={isCurrent || subscribing === pkg.id}
                                            >
                                                {subscribing === pkg.id ? <Loader2 className="h-4 w-4 animate-spin" /> : isCurrent ? t('subscription.currentPlanBtn') : t('subscription.switchPlanBtn')}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* History */}
                    {history.length > 0 && (
                        <div className="panel">
                            <h2 className="mb-4 font-semibold text-dark dark:text-white">{t('subscription.historyTitle')}</h2>
                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th>{t('subscription.planCol')}</th>
                                            <th>{t('subscription.periodCol')}</th>
                                            <th>{t('subscription.startCol')}</th>
                                            <th>{t('subscription.endCol')}</th>
                                            <th>{t('subscription.statusCol')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((h) => (
                                            <tr key={h.id}>
                                                <td>{h.package?.name ?? '—'}</td>
                                                <td>{h.billing_cycle === 'monthly' ? t('subscription.monthly') : t('subscription.yearly')}</td>
                                                <td>{new Date(h.starts_at).toLocaleDateString('tr-TR')}</td>
                                                <td>{new Date(h.ends_at).toLocaleDateString('tr-TR')}</td>
                                                <td>
                                                    <span className={`badge ${getStatusClass(h.status)}`}>
                                                        {getStatusLabel(h.status)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* No subscription — show packages */
                <>
                    <div className="mb-6 rounded-lg border border-warning/30 bg-warning/10 p-4 text-warning">
                        {t('subscription.noSubscriptionMsg')}
                    </div>

                    <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-[#f1f2f3] p-1 dark:bg-[#1b2e4b]">
                        {(['monthly', 'yearly'] as const).map((cycle) => (
                            <button
                                key={cycle}
                                type="button"
                                className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                                    billingCycle === cycle
                                        ? 'bg-white text-primary shadow dark:bg-[#0e1726]'
                                        : 'text-[#515365] dark:text-[#888ea8]'
                                }`}
                                onClick={() => setBillingCycle(cycle)}
                            >
                                {cycle === 'monthly' ? t('subscription.monthly') : t('subscription.yearly')}
                            </button>
                        ))}
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {packages.map((pkg, idx) => (
                            <div key={pkg.id} className={`panel flex flex-col ${idx === 1 ? 'border-2 border-primary' : ''}`}>
                                <h2 className="mb-2 text-xl font-bold text-dark dark:text-white">{pkg.name}</h2>
                                <div className="mb-4">
                                    <span className="text-3xl font-extrabold text-primary">₺{getPrice(pkg)}</span>
                                    <span className="text-sm text-[#515365] dark:text-[#888ea8]">
                                        {billingCycle === 'monthly' ? t('subscription.perMonth') : t('subscription.perYear')}
                                    </span>
                                </div>
                                <ul className="mb-6 flex-1 space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <Check className="h-4 w-4 flex-shrink-0 text-success" />
                                        <span className="text-[#515365] dark:text-[#888ea8]">{formatLimit(pkg.max_schools)} {t('subscription.schoolUnit')}</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="h-4 w-4 flex-shrink-0 text-success" />
                                        <span className="text-[#515365] dark:text-[#888ea8]">{formatLimit(pkg.max_students)} {t('subscription.studentUnit')}</span>
                                    </li>
                                </ul>
                                <button
                                    type="button"
                                    className={`btn ${idx === 1 ? 'btn-primary' : 'btn-outline-primary'} mt-auto w-full`}
                                    onClick={() => handleSubscribe(pkg.id)}
                                    disabled={subscribing === pkg.id}
                                >
                                    {subscribing === pkg.id ? <Loader2 className="h-4 w-4 animate-spin" /> : t('subscription.selectBtn')}
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
