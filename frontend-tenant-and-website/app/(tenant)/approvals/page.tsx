'use client';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import apiClient from '@/lib/apiClient';
import { CheckCircle, XCircle, Clock, Users, UserMinus, Edit3, RefreshCw, Award } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

type EnrollmentRequest = {
    id: number;
    type: 'enrollment';
    school_id: number;
    school_name: string | null;
    child_name: string | null;
    owner_name: string | null;
    created_at: string;
};

type RemovalRequest = {
    id: number;
    type: 'removal';
    school_id: number;
    school_name: string | null;
    child_name: string | null;
    owner_name: string | null;
    reason: string | null;
    created_at: string;
};

type FieldChangeRequest = {
    id: number;
    type: 'field_change';
    school_id: number;
    school_name: string | null;
    child_name: string | null;
    field_label: string;
    field_name: string;
    old_value: string | null;
    new_value: string;
    requested_by: string | null;
    created_at: string;
};

type ApprovalsData = {
    child_enrollment_requests: EnrollmentRequest[];
    child_removal_requests: RemovalRequest[];
    child_field_change_requests: FieldChangeRequest[];
    counts: {
        enrollment: number;
        removal: number;
        field_change: number;
        total: number;
    };
};

type CredentialItem = {
    type: 'certificate' | 'course' | 'education';
    id: number;
    title: string;
    subtitle: string | null;
    date: string | null;
    teacher_name: string;
    teacher_profile_id: number;
    has_document: boolean;
};

type ActiveTab = 'enrollment' | 'removal' | 'field_change' | 'credentials';

export default function ApprovalsPage() {
    const { t } = useTranslation();
    const [data, setData] = useState<ApprovalsData | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>('enrollment');
    const [rejectModal, setRejectModal] = useState<{ open: boolean; type: ActiveTab; id: number; schoolId: number } | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [processing, setProcessing] = useState(false);

    // Öğretmen belgeleri
    const [credentials, setCredentials] = useState<CredentialItem[]>([]);
    const [credentialsLoading, setCredentialsLoading] = useState(false);
    const [credentialProcessing, setCredentialProcessing] = useState<string | null>(null);

    const fetchApprovals = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/pending-approvals');
            setData(res.data?.data ?? null);
        } catch {
            toast.error(t('approvals.loadError'));
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCredentials = useCallback(async () => {
        setCredentialsLoading(true);
        try {
            const res = await apiClient.get('/teacher-approvals');
            setCredentials(res.data?.data ?? []);
        } catch {
            toast.error('Öğretmen belgeleri yüklenemedi.');
        } finally {
            setCredentialsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchApprovals();
    }, [fetchApprovals]);

    useEffect(() => {
        if (activeTab === 'credentials') { fetchCredentials(); }
    }, [activeTab, fetchCredentials]);

    const handleApproveCredential = async (item: CredentialItem) => {
        const key = `${item.type}-${item.id}`;
        setCredentialProcessing(key);
        try {
            const pathMap = { certificate: 'certificates', course: 'courses', education: 'educations' };
            await apiClient.patch(`/teacher-approvals/${pathMap[item.type]}/${item.id}/approve`);
            toast.success('Onaylandı.');
            setCredentials(prev => prev.filter(c => !(c.type === item.type && c.id === item.id)));
        } catch { toast.error('Onay işlemi başarısız.'); }
        finally { setCredentialProcessing(null); }
    };

    const handleRejectCredential = async (item: CredentialItem) => {
        const { value: reason } = await Swal.fire({
            title: 'Red Sebebi',
            input: 'textarea',
            inputLabel: 'Lütfen red sebebini yazın',
            inputPlaceholder: 'Red sebebi...',
            inputAttributes: { maxlength: '1000' },
            showCancelButton: true,
            confirmButtonText: 'Reddet',
            cancelButtonText: 'İptal',
            confirmButtonColor: '#e7515a',
            inputValidator: (v) => { if (!v?.trim()) { return 'Red sebebi zorunludur.'; } },
        });
        if (!reason) { return; }

        const key = `${item.type}-${item.id}`;
        setCredentialProcessing(key);
        try {
            const pathMap = { certificate: 'certificates', course: 'courses', education: 'educations' };
            await apiClient.patch(`/teacher-approvals/${pathMap[item.type]}/${item.id}/reject`, { rejection_reason: reason });
            toast.success('Reddedildi.');
            setCredentials(prev => prev.filter(c => !(c.type === item.type && c.id === item.id)));
        } catch { toast.error('Red işlemi başarısız.'); }
        finally { setCredentialProcessing(null); }
    };

    const handleApproveEnrollment = async (req: EnrollmentRequest) => {
        const result = await Swal.fire({
            title: t('approvals.approveEnrollmentTitle'),
            text: t('approvals.approveEnrollmentText', { child: req.child_name ?? '-', school: req.school_name ?? '-' }),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: t('approvals.approveBtn'),
            cancelButtonText: t('common.cancel'),
            confirmButtonColor: '#16a34a',
        });
        if (!result.isConfirmed) return;
        setProcessing(true);
        try {
            await apiClient.patch(`/schools/${req.school_id}/child-enrollment-requests/${req.id}/approve`);
            toast.success(t('approvals.approveEnrollmentSuccess'));
            fetchApprovals();
        } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? t('approvals.approveError'));
        } finally {
            setProcessing(false);
        }
    };

    const handleApproveRemoval = async (req: RemovalRequest) => {
        const result = await Swal.fire({
            title: t('approvals.approveRemovalTitle'),
            text: t('approvals.approveRemovalText', { child: req.child_name ?? '-' }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('approvals.approveBtn'),
            cancelButtonText: t('common.cancel'),
            confirmButtonColor: '#dc2626',
        });
        if (!result.isConfirmed) return;
        setProcessing(true);
        try {
            await apiClient.patch(`/schools/${req.school_id}/child-removal-requests/${req.id}/approve`);
            toast.success(t('approvals.approveRemovalSuccess'));
            fetchApprovals();
        } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? t('approvals.approveError'));
        } finally {
            setProcessing(false);
        }
    };

    const handleApproveFieldChange = async (req: FieldChangeRequest) => {
        const result = await Swal.fire({
            title: t('approvals.approveFieldChangeTitle'),
            text: t('approvals.approveFieldChangeText', { child: req.child_name ?? '-', field: req.field_label, old: req.old_value ?? '-', new: req.new_value }),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: t('approvals.approveBtn'),
            cancelButtonText: t('common.cancel'),
            confirmButtonColor: '#16a34a',
        });
        if (!result.isConfirmed) return;
        setProcessing(true);
        try {
            await apiClient.patch(`/schools/${req.school_id}/child-field-change-requests/${req.id}/approve`);
            toast.success(t('approvals.approveFieldChangeSuccess'));
            fetchApprovals();
        } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? t('approvals.approveError'));
        } finally {
            setProcessing(false);
        }
    };

    const openRejectModal = (type: ActiveTab, id: number, schoolId: number) => {
        setRejectReason('');
        setRejectModal({ open: true, type, id, schoolId });
    };

    const handleReject = async () => {
        if (!rejectModal) return;
        if (!rejectReason.trim() || rejectReason.trim().length < 5) {
            toast.error(t('approvals.rejectReasonRequired'));
            return;
        }
        setProcessing(true);
        try {
            const endpoint = rejectModal.type === 'enrollment'
                ? `/schools/${rejectModal.schoolId}/child-enrollment-requests/${rejectModal.id}/reject`
                : rejectModal.type === 'removal'
                    ? `/schools/${rejectModal.schoolId}/child-removal-requests/${rejectModal.id}/reject`
                    : `/schools/${rejectModal.schoolId}/child-field-change-requests/${rejectModal.id}/reject`;

            await apiClient.patch(endpoint, { rejection_reason: rejectReason });
            toast.success(t('approvals.rejectSuccess'));
            setRejectModal(null);
            fetchApprovals();
        } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? t('approvals.rejectError'));
        } finally {
            setProcessing(false);
        }
    };

    const tabs: { key: ActiveTab; label: string; icon: React.ReactNode; count: number; color: string }[] = [
        {
            key: 'enrollment',
            label: t('approvals.enrollmentTab'),
            icon: <Users size={16} />,
            count: data?.counts.enrollment ?? 0,
            color: 'text-blue-600',
        },
        {
            key: 'removal',
            label: t('approvals.removalTab'),
            icon: <UserMinus size={16} />,
            count: data?.counts.removal ?? 0,
            color: 'text-red-600',
        },
        {
            key: 'field_change',
            label: t('approvals.fieldChangeTab'),
            icon: <Edit3 size={16} />,
            count: data?.counts.field_change ?? 0,
            color: 'text-orange-600',
        },
        {
            key: 'credentials',
            label: 'Öğretmen Belgesi',
            icon: <Award size={16} />,
            count: credentials.length,
            color: 'text-purple-600',
        },
    ];

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{t('approvals.title')}</h1>
                    {data && (
                        <p className="text-sm text-gray-500 mt-1">
                            {t('approvals.pendingCount', { count: data.counts.total })}
                        </p>
                    )}
                </div>
                <button
                    onClick={fetchApprovals}
                    disabled={loading}
                    className="btn btn-outline-primary flex items-center gap-2"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    {t('approvals.refreshBtn')}
                </button>
            </div>

            {/* Tabs */}
            <div className="panel mb-4">
                <div className="flex border-b border-gray-200">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === tab.key
                                    ? `border-primary ${tab.color} bg-primary/5`
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold text-white ${
                                    tab.key === 'removal' ? 'bg-red-500' : tab.key === 'field_change' ? 'bg-orange-500' : tab.key === 'credentials' ? 'bg-purple-500' : 'bg-blue-500'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="pt-4">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                    ) : (
                        <>
                            {/* Enrollment Requests */}
                            {activeTab === 'enrollment' && (
                                <div>
                                    {(data?.child_enrollment_requests ?? []).length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">
                                            <Users size={40} className="mx-auto mb-2 text-gray-300" />
                                            <p>{t('approvals.noEnrollment')}</p>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>{t('approvals.childCol')}</th>
                                                        <th>{t('approvals.parentCol')}</th>
                                                        <th>{t('approvals.schoolCol')}</th>
                                                        <th>{t('approvals.dateCol')}</th>
                                                        <th className="text-center">{t('approvals.actionsCol')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data!.child_enrollment_requests.map(req => (
                                                        <tr key={req.id}>
                                                            <td className="font-medium">{req.child_name ?? '-'}</td>
                                                            <td>{req.owner_name ?? '-'}</td>
                                                            <td>{req.school_name ?? '-'}</td>
                                                            <td className="text-sm text-gray-500">
                                                                {new Date(req.created_at).toLocaleDateString('tr-TR')}
                                                            </td>
                                                            <td>
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button
                                                                        onClick={() => handleApproveEnrollment(req)}
                                                                        disabled={processing}
                                                                        className="btn btn-sm bg-green-600 text-white hover:bg-green-700 flex items-center gap-1"
                                                                    >
                                                                        <CheckCircle size={14} />
                                                                        {t('approvals.approveBtn')}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => openRejectModal('enrollment', req.id, req.school_id)}
                                                                        disabled={processing}
                                                                        className="btn btn-sm bg-red-600 text-white hover:bg-red-700 flex items-center gap-1"
                                                                    >
                                                                        <XCircle size={14} />
                                                                        {t('approvals.rejectBtn')}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Removal Requests */}
                            {activeTab === 'removal' && (
                                <div>
                                    {(data?.child_removal_requests ?? []).length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">
                                            <UserMinus size={40} className="mx-auto mb-2 text-gray-300" />
                                            <p>{t('approvals.noRemoval')}</p>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>{t('approvals.childCol')}</th>
                                                        <th>{t('approvals.parentCol')}</th>
                                                        <th>{t('approvals.schoolCol')}</th>
                                                        <th>{t('approvals.reasonCol')}</th>
                                                        <th>{t('approvals.dateCol')}</th>
                                                        <th className="text-center">{t('approvals.actionsCol')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data!.child_removal_requests.map(req => (
                                                        <tr key={req.id}>
                                                            <td className="font-medium">{req.child_name ?? '-'}</td>
                                                            <td>{req.owner_name ?? '-'}</td>
                                                            <td>{req.school_name ?? '-'}</td>
                                                            <td className="text-sm max-w-xs truncate" title={req.reason ?? undefined}>
                                                                {req.reason ?? '-'}
                                                            </td>
                                                            <td className="text-sm text-gray-500">
                                                                {new Date(req.created_at).toLocaleDateString('tr-TR')}
                                                            </td>
                                                            <td>
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button
                                                                        onClick={() => handleApproveRemoval(req)}
                                                                        disabled={processing}
                                                                        className="btn btn-sm bg-green-600 text-white hover:bg-green-700 flex items-center gap-1"
                                                                    >
                                                                        <CheckCircle size={14} />
                                                                        {t('approvals.approveBtn')}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => openRejectModal('removal', req.id, req.school_id)}
                                                                        disabled={processing}
                                                                        className="btn btn-sm bg-red-600 text-white hover:bg-red-700 flex items-center gap-1"
                                                                    >
                                                                        <XCircle size={14} />
                                                                        {t('approvals.rejectBtn')}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Field Change Requests */}
                            {activeTab === 'field_change' && (
                                <div>
                                    {(data?.child_field_change_requests ?? []).length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">
                                            <Edit3 size={40} className="mx-auto mb-2 text-gray-300" />
                                            <p>{t('approvals.noFieldChange')}</p>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>{t('approvals.childCol')}</th>
                                                        <th>{t('approvals.schoolCol')}</th>
                                                        <th>{t('approvals.fieldCol')}</th>
                                                        <th>{t('approvals.oldValueCol')}</th>
                                                        <th>{t('approvals.newValueCol')}</th>
                                                        <th>{t('approvals.requestedByCol')}</th>
                                                        <th>{t('approvals.dateCol')}</th>
                                                        <th className="text-center">{t('approvals.actionsCol')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data!.child_field_change_requests.map(req => (
                                                        <tr key={req.id}>
                                                            <td className="font-medium">{req.child_name ?? '-'}</td>
                                                            <td>{req.school_name ?? '-'}</td>
                                                            <td>
                                                                <span className="badge badge-outline-warning">{req.field_label}</span>
                                                            </td>
                                                            <td className="text-sm text-gray-500">{req.old_value ?? '-'}</td>
                                                            <td className="text-sm font-medium text-green-700">{req.new_value}</td>
                                                            <td className="text-sm">{req.requested_by ?? '-'}</td>
                                                            <td className="text-sm text-gray-500">
                                                                {new Date(req.created_at).toLocaleDateString('tr-TR')}
                                                            </td>
                                                            <td>
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button
                                                                        onClick={() => handleApproveFieldChange(req)}
                                                                        disabled={processing}
                                                                        className="btn btn-sm bg-green-600 text-white hover:bg-green-700 flex items-center gap-1"
                                                                    >
                                                                        <CheckCircle size={14} />
                                                                        {t('approvals.approveBtn')}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => openRejectModal('field_change', req.id, req.school_id)}
                                                                        disabled={processing}
                                                                        className="btn btn-sm bg-red-600 text-white hover:bg-red-700 flex items-center gap-1"
                                                                    >
                                                                        <XCircle size={14} />
                                                                        {t('approvals.rejectBtn')}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* Teacher Credentials */}
                            {activeTab === 'credentials' && (
                                <div>
                                    {credentialsLoading ? (
                                        <div className="flex justify-center py-12">
                                            <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
                                        </div>
                                    ) : credentials.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">
                                            <Award size={40} className="mx-auto mb-2 text-gray-300" />
                                            <p>Onay bekleyen öğretmen belgesi yok.</p>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Belge Türü</th>
                                                        <th>Başlık</th>
                                                        <th>Kurum / Sağlayıcı</th>
                                                        <th>Öğretmen</th>
                                                        <th>Tarih</th>
                                                        <th className="text-center">İşlem</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {credentials.map(item => {
                                                        const key = `${item.type}-${item.id}`;
                                                        const isBusy = credentialProcessing === key;
                                                        return (
                                                            <tr key={key}>
                                                                <td>
                                                                    <span className={`badge ${item.type === 'certificate' ? 'badge-outline-warning' : item.type === 'education' ? 'badge-outline-success' : 'badge-outline-info'} text-xs`}>
                                                                        {item.type === 'certificate' ? 'Sertifika' : item.type === 'education' ? 'Eğitim' : 'Kurs/Seminer'}
                                                                    </span>
                                                                </td>
                                                                <td className="font-medium">{item.title}</td>
                                                                <td className="text-sm text-gray-500">{item.subtitle ?? '—'}</td>
                                                                <td className="text-sm">{item.teacher_name}</td>
                                                                <td className="text-sm text-gray-500">
                                                                    {item.date ? new Date(item.date).toLocaleDateString('tr-TR') : '—'}
                                                                </td>
                                                                <td>
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <button
                                                                            onClick={() => handleApproveCredential(item)}
                                                                            disabled={isBusy}
                                                                            className="btn btn-sm bg-green-600 text-white hover:bg-green-700 flex items-center gap-1"
                                                                        >
                                                                            <CheckCircle size={14} />Onayla
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleRejectCredential(item)}
                                                                            disabled={isBusy}
                                                                            className="btn btn-sm bg-red-600 text-white hover:bg-red-700 flex items-center gap-1"
                                                                        >
                                                                            <XCircle size={14} />Reddet
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Status legend */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                    <Clock size={14} className="text-yellow-500" />
                    {t('approvals.statusLegend1')}
                </span>
                <span className="flex items-center gap-1">
                    <CheckCircle size={14} className="text-green-500" />
                    {t('approvals.statusLegend2')}
                </span>
            </div>

            {/* Reject Modal */}
            {rejectModal?.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('approvals.rejectModalTitle')}</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('approvals.rejectReasonLabel')} <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                rows={4}
                                className="form-input w-full resize-none"
                                placeholder={t('approvals.rejectReasonPlaceholder')}
                            />
                            <p className="text-xs text-gray-400 mt-1">{rejectReason.length} / 500</p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setRejectModal(null)}
                                disabled={processing}
                                className="btn btn-outline-secondary"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={processing || rejectReason.trim().length < 5}
                                className="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
                            >
                                {processing ? <div className="animate-spin h-4 w-4 rounded-full border-2 border-white border-t-transparent" /> : <XCircle size={16} />}
                                {t('approvals.rejectConfirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
