'use client';
import Link from 'next/link';
import { useState } from 'react';
import IconX from '@/components/icon/icon-x';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

export default function AlertsPage() {
    const [alerts, setAlerts] = useState({
        primary: true, secondary: true, success: true, danger: true, warning: true, info: true,
        p2: true, s2: true, su2: true, d2: true, w2: true, i2: true,
    });

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li><Link href="/" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Uyarılar</span></li>
            </ul>

            <div className="mt-5 space-y-6">
                {/* Default Alerts */}
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">Varsayılan Uyarılar</div>
                    <div className="grid gap-4 lg:grid-cols-2">
                        {alerts.primary && (
                            <div className="flex items-center rounded bg-primary-light p-3.5 text-primary dark:bg-primary-dark-light">
                                <span className="ltr:pr-2 rtl:pl-2"><strong className="ltr:mr-1 rtl:ml-1">Primary!</strong>Bu bir bilgi mesajıdır.</span>
                                <button type="button" onClick={() => setAlerts(a => ({...a, primary: false}))} className="hover:opacity-80 ltr:ml-auto rtl:mr-auto"><IconX className="h-5 w-5" /></button>
                            </div>
                        )}
                        {alerts.secondary && (
                            <div className="flex items-center rounded bg-secondary-light p-3.5 text-secondary dark:bg-secondary-dark-light">
                                <span className="ltr:pr-2 rtl:pl-2"><strong className="ltr:mr-1 rtl:ml-1">Secondary!</strong>Bu bir bilgi mesajıdır.</span>
                                <button type="button" onClick={() => setAlerts(a => ({...a, secondary: false}))} className="hover:opacity-80 ltr:ml-auto rtl:mr-auto"><IconX className="h-5 w-5" /></button>
                            </div>
                        )}
                        {alerts.success && (
                            <div className="flex items-center rounded bg-success-light p-3.5 text-success dark:bg-success-dark-light">
                                <span className="ltr:pr-2 rtl:pl-2"><strong className="ltr:mr-1 rtl:ml-1">Başarılı!</strong>İşlem başarıyla tamamlandı.</span>
                                <button type="button" onClick={() => setAlerts(a => ({...a, success: false}))} className="hover:opacity-80 ltr:ml-auto rtl:mr-auto"><IconX className="h-5 w-5" /></button>
                            </div>
                        )}
                        {alerts.danger && (
                            <div className="flex items-center rounded bg-danger-light p-3.5 text-danger dark:bg-danger-dark-light">
                                <span className="ltr:pr-2 rtl:pl-2"><strong className="ltr:mr-1 rtl:ml-1">Hata!</strong>Bir sorun oluştu, tekrar deneyin.</span>
                                <button type="button" onClick={() => setAlerts(a => ({...a, danger: false}))} className="hover:opacity-80 ltr:ml-auto rtl:mr-auto"><IconX className="h-5 w-5" /></button>
                            </div>
                        )}
                        {alerts.warning && (
                            <div className="flex items-center rounded bg-warning-light p-3.5 text-warning dark:bg-warning-dark-light">
                                <span className="ltr:pr-2 rtl:pl-2"><strong className="ltr:mr-1 rtl:ml-1">Uyarı!</strong>Bu işlemi dikkatlice gözden geçirin.</span>
                                <button type="button" onClick={() => setAlerts(a => ({...a, warning: false}))} className="hover:opacity-80 ltr:ml-auto rtl:mr-auto"><IconX className="h-5 w-5" /></button>
                            </div>
                        )}
                        {alerts.info && (
                            <div className="flex items-center rounded bg-info-light p-3.5 text-info dark:bg-info-dark-light">
                                <span className="ltr:pr-2 rtl:pl-2"><strong className="ltr:mr-1 rtl:ml-1">Bilgi!</strong>Sistem güncelleme bildirim mesajı.</span>
                                <button type="button" onClick={() => setAlerts(a => ({...a, info: false}))} className="hover:opacity-80 ltr:ml-auto rtl:mr-auto"><IconX className="h-5 w-5" /></button>
                            </div>
                        )}
                    </div>
                </div>

                {/* With Icons */}
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">İkonlu Uyarılar</div>
                    <div className="grid gap-4 lg:grid-cols-2">
                        <div className="flex items-center rounded border border-success/50 bg-success-light p-3.5 text-success dark:bg-success-dark-light">
                            <CheckCircle className="h-5 w-5 shrink-0 ltr:mr-3 rtl:ml-3" />
                            <span><strong>Başarılı!</strong> Veriler başarıyla kaydedildi.</span>
                        </div>
                        <div className="flex items-center rounded border border-danger/50 bg-danger-light p-3.5 text-danger dark:bg-danger-dark-light">
                            <X className="h-5 w-5 shrink-0 ltr:mr-3 rtl:ml-3" />
                            <span><strong>Hata!</strong> Lütfen form alanlarını kontrol edin.</span>
                        </div>
                        <div className="flex items-center rounded border border-warning/50 bg-warning-light p-3.5 text-warning dark:bg-warning-dark-light">
                            <AlertTriangle className="h-5 w-5 shrink-0 ltr:mr-3 rtl:ml-3" />
                            <span><strong>Uyarı!</strong> Bu işlem geri alınamaz.</span>
                        </div>
                        <div className="flex items-center rounded border border-info/50 bg-info-light p-3.5 text-info dark:bg-info-dark-light">
                            <Info className="h-5 w-5 shrink-0 ltr:mr-3 rtl:ml-3" />
                            <span><strong>Bilgi!</strong> Yeni özellikler eklendi.</span>
                        </div>
                    </div>
                </div>

                {/* Solid Alerts */}
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">Solid Uyarılar</div>
                    <div className="grid gap-4 lg:grid-cols-2">
                        <div className="flex items-center rounded bg-primary p-3.5 text-white">
                            <span><strong className="ltr:mr-1 rtl:ml-1">Primary!</strong>Solid uyarı mesajı.</span>
                        </div>
                        <div className="flex items-center rounded bg-success p-3.5 text-white">
                            <span><strong className="ltr:mr-1 rtl:ml-1">Başarılı!</strong>Solid uyarı mesajı.</span>
                        </div>
                        <div className="flex items-center rounded bg-danger p-3.5 text-white">
                            <span><strong className="ltr:mr-1 rtl:ml-1">Hata!</strong>Solid uyarı mesajı.</span>
                        </div>
                        <div className="flex items-center rounded bg-warning p-3.5 text-white">
                            <span><strong className="ltr:mr-1 rtl:ml-1">Uyarı!</strong>Solid uyarı mesajı.</span>
                        </div>
                    </div>
                </div>

                {/* Arrow Alerts */}
                <div className="panel">
                    <div className="mb-5 text-lg font-semibold dark:text-white-light">Oklu Uyarılar</div>
                    <div className="grid gap-4 lg:grid-cols-2">
                        <div className="relative flex items-center rounded border-l-4 border-primary bg-primary-light p-3.5 text-primary dark:bg-primary-dark-light">
                            <span><strong>Primary!</strong> Sol kenarlıklı uyarı mesajı.</span>
                        </div>
                        <div className="relative flex items-center rounded border-l-4 border-success bg-success-light p-3.5 text-success dark:bg-success-dark-light">
                            <span><strong>Başarılı!</strong> Sol kenarlıklı uyarı mesajı.</span>
                        </div>
                        <div className="relative flex items-center rounded border-l-4 border-danger bg-danger-light p-3.5 text-danger dark:bg-danger-dark-light">
                            <span><strong>Hata!</strong> Sol kenarlıklı uyarı mesajı.</span>
                        </div>
                        <div className="relative flex items-center rounded border-l-4 border-warning bg-warning-light p-3.5 text-warning dark:bg-warning-dark-light">
                            <span><strong>Uyarı!</strong> Sol kenarlıklı uyarı mesajı.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
