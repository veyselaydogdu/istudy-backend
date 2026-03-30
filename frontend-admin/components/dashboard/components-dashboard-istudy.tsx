'use client';
import dynamic from 'next/dynamic';
import Dropdown from '@/components/dropdown';
import IconCircleCheck from '@/components/icon/icon-circle-check';
import IconEye from '@/components/icon/icon-eye';
import IconHorizontalDots from '@/components/icon/icon-horizontal-dots';
import IconInfoCircle from '@/components/icon/icon-info-circle';
import { IRootState } from '@/store';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Building2, Users, GraduationCap, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const ComponentsDashboardIStudy = () => {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl';

    const tenantChart: any = {
        series: [{ data: [12, 15, 18, 14, 22, 28, 32, 29, 35, 42] }],
        options: {
            chart: { height: 45, type: 'line', sparkline: { enabled: true } },
            stroke: { width: 2 },
            markers: { size: 0 },
            colors: ['#00ab55'],
            grid: { padding: { top: 0, bottom: 0, left: 0 } },
            tooltip: { x: { show: false }, y: { title: { formatter: () => '' } } },
        },
    };

    const userChart: any = {
        series: [{ data: [210, 280, 320, 290, 410, 380, 450, 520, 490, 610] }],
        options: {
            chart: { height: 45, type: 'line', sparkline: { enabled: true } },
            stroke: { width: 2 },
            markers: { size: 0 },
            colors: ['#e7515a'],
            grid: { padding: { top: 0, bottom: 0, left: 0 } },
            tooltip: { x: { show: false }, y: { title: { formatter: () => '' } } },
        },
    };

    const subscriptionChart: any = {
        series: [{ data: [8, 10, 9, 12, 15, 14, 18, 20, 17, 24] }],
        options: {
            chart: { height: 45, type: 'line', sparkline: { enabled: true } },
            stroke: { width: 2 },
            markers: { size: 0 },
            colors: ['#00ab55'],
            grid: { padding: { top: 0, bottom: 0, left: 0 } },
            tooltip: { x: { show: false }, y: { title: { formatter: () => '' } } },
        },
    };

    const revenueChart: any = {
        series: [{ data: [4200, 5800, 4900, 6700, 7200, 6500, 8100, 9300, 8700, 10500] }],
        options: {
            chart: { height: 45, type: 'line', sparkline: { enabled: true } },
            stroke: { width: 2 },
            markers: { size: 0 },
            colors: ['#4361ee'],
            grid: { padding: { top: 0, bottom: 0, left: 0 } },
            tooltip: { x: { show: false }, y: { title: { formatter: () => '₺' } } },
        },
    };

    const monthlyRevenueChart: any = {
        series: [
            { name: 'Gelir', data: [42000, 58000, 49000, 67000, 72000, 65000, 81000, 93000, 87000, 105000, 98000, 112000] },
            { name: 'Gider', data: [18000, 22000, 19000, 25000, 28000, 24000, 31000, 35000, 33000, 38000, 36000, 42000] },
        ],
        options: {
            chart: { height: 200, type: 'area', toolbar: { show: false } },
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth', width: 2 },
            colors: ['#4361ee', '#e7515a'],
            fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.05 } },
            xaxis: {
                categories: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
                labels: { style: { fontSize: '11px' } },
            },
            yaxis: {
                labels: {
                    formatter: (value: number) => '₺' + (value / 1000).toFixed(0) + 'K',
                    style: { fontSize: '11px' },
                },
            },
            legend: { position: 'top' },
            grid: { borderColor: '#e0e6ed', strokeDashArray: 5, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } }, padding: { top: 0, right: 0, bottom: 0, left: 0 } },
            tooltip: { x: { show: false }, y: { formatter: (value: number) => '₺' + value.toLocaleString('tr-TR') } },
        },
    };

    const schoolChart: any = {
        series: [{ data: [5, 6, 8, 7, 10, 9, 12, 11, 14, 16] }],
        options: {
            chart: { height: 45, type: 'line', sparkline: { enabled: true } },
            stroke: { width: 2 },
            markers: { size: 0 },
            colors: ['#805dca'],
            grid: { padding: { top: 0, bottom: 0, left: 0 } },
            tooltip: { x: { show: false }, y: { title: { formatter: () => '' } } },
        },
    };

    const packageChart: any = {
        series: [{ data: [3, 4, 4, 5, 5, 6, 7, 7, 8, 9] }],
        options: {
            chart: { height: 45, type: 'line', sparkline: { enabled: true } },
            stroke: { width: 2 },
            markers: { size: 0 },
            colors: ['#2196f3'],
            grid: { padding: { top: 0, bottom: 0, left: 0 } },
            tooltip: { x: { show: false }, y: { title: { formatter: () => '' } } },
        },
    };

    const tetherChart: any = {
        series: [{ data: [95, 92, 97, 89, 94, 96, 91, 93, 98, 95] }],
        options: {
            chart: { height: 45, type: 'line', sparkline: { enabled: true } },
            stroke: { width: 2 },
            markers: { size: 0 },
            colors: ['#00ab55'],
            grid: { padding: { top: 0, bottom: 0, left: 0 } },
            tooltip: { x: { show: false }, y: { title: { formatter: () => '%' } } },
        },
    };

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link href="/" className="text-primary hover:underline">
                        Dashboard
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Genel Bakış</span>
                </li>
            </ul>

            <div className="pt-5">
                {/* Stats Row */}
                <div className="mb-6 grid grid-cols-1 gap-6 text-white sm:grid-cols-2 xl:grid-cols-4">
                    {/* Kurumlar */}
                    <div className="panel bg-gradient-to-r from-cyan-500 to-cyan-400">
                        <div className="flex justify-between">
                            <div className="text-md font-semibold ltr:mr-1 rtl:ml-1">Toplam Kurum</div>
                            <div className="dropdown">
                                <Dropdown
                                    offset={[0, 5]}
                                    placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                    btnClassName="hover:opacity-80"
                                    button={<IconHorizontalDots className="opacity-70 hover:opacity-80" />}
                                >
                                    <ul className="text-black dark:text-white-dark">
                                        <li><Link href="/tenants">Kurumları Görüntüle</Link></li>
                                        <li><Link href="/tenants">Kurum Ekle</Link></li>
                                    </ul>
                                </Dropdown>
                            </div>
                        </div>
                        <div className="mt-5 flex items-center">
                            <div className="text-3xl font-bold ltr:mr-3 rtl:ml-3">42</div>
                            <div className="badge bg-white/30">+ 3 bu ay</div>
                        </div>
                        <div className="mt-5 flex items-center font-semibold">
                            <Building2 className="h-5 w-5 shrink-0 ltr:mr-2 rtl:ml-2" />
                            Geçen ay: 39
                        </div>
                    </div>

                    {/* Kullanıcılar */}
                    <div className="panel bg-gradient-to-r from-violet-500 to-violet-400">
                        <div className="flex justify-between">
                            <div className="text-md font-semibold ltr:mr-1 rtl:ml-1">Toplam Kullanıcı</div>
                            <div className="dropdown">
                                <Dropdown
                                    offset={[0, 5]}
                                    placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                    btnClassName="hover:opacity-80"
                                    button={<IconHorizontalDots className="opacity-70 hover:opacity-80" />}
                                >
                                    <ul className="text-black dark:text-white-dark">
                                        <li><Link href="/users">Kullanıcıları Görüntüle</Link></li>
                                    </ul>
                                </Dropdown>
                            </div>
                        </div>
                        <div className="mt-5 flex items-center">
                            <div className="text-3xl font-bold ltr:mr-3 rtl:ml-3">1,284</div>
                            <div className="badge bg-white/30">+ 121</div>
                        </div>
                        <div className="mt-5 flex items-center font-semibold">
                            <Users className="h-5 w-5 shrink-0 ltr:mr-2 rtl:ml-2" />
                            Geçen ay: 1,163
                        </div>
                    </div>

                    {/* Abonelikler */}
                    <div className="panel bg-gradient-to-r from-blue-500 to-blue-400">
                        <div className="flex justify-between">
                            <div className="text-md font-semibold ltr:mr-1 rtl:ml-1">Aktif Abonelik</div>
                            <div className="dropdown">
                                <Dropdown
                                    offset={[0, 5]}
                                    placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                    btnClassName="hover:opacity-80"
                                    button={<IconHorizontalDots className="opacity-70 hover:opacity-80" />}
                                >
                                    <ul className="text-black dark:text-white-dark">
                                        <li><Link href="/subscriptions">Abonelikleri Görüntüle</Link></li>
                                    </ul>
                                </Dropdown>
                            </div>
                        </div>
                        <div className="mt-5 flex items-center">
                            <div className="text-3xl font-bold ltr:mr-3 rtl:ml-3">38</div>
                            <div className="badge bg-white/30">+ 2 bu ay</div>
                        </div>
                        <div className="mt-5 flex items-center font-semibold">
                            <IconEye className="shrink-0 ltr:mr-2 rtl:ml-2" />
                            Geçen ay: 36
                        </div>
                    </div>

                    {/* Gelir */}
                    <div className="panel bg-gradient-to-r from-fuchsia-500 to-fuchsia-400">
                        <div className="flex justify-between">
                            <div className="text-md font-semibold ltr:mr-1 rtl:ml-1">Aylık Gelir</div>
                            <div className="dropdown">
                                <Dropdown
                                    offset={[0, 5]}
                                    placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                    btnClassName="hover:opacity-80"
                                    button={<IconHorizontalDots className="opacity-70 hover:opacity-80" />}
                                >
                                    <ul className="text-black dark:text-white-dark">
                                        <li><Link href="/finance">Finans Raporu</Link></li>
                                    </ul>
                                </Dropdown>
                            </div>
                        </div>
                        <div className="mt-5 flex items-center">
                            <div className="text-3xl font-bold ltr:mr-3 rtl:ml-3">₺112K</div>
                            <div className="badge bg-white/30">+ 14.3%</div>
                        </div>
                        <div className="mt-5 flex items-center font-semibold">
                            <CreditCard className="h-5 w-5 shrink-0 ltr:mr-2 rtl:ml-2" />
                            Geçen ay: ₺98K
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    {/* Hızlı Metrikler */}
                    <div>
                        <div className="mb-5 flex items-center font-bold">
                            <span className="text-lg">Sistem Metrikleri</span>
                            <button type="button" className="text-primary hover:text-black ltr:ml-auto rtl:mr-auto dark:hover:text-white-dark">
                                Tümünü Gör
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 md:mb-5">
                            {/* Okullar */}
                            <div className="panel">
                                <div className="mb-5 flex items-center font-semibold">
                                    <div className="grid h-10 w-10 shrink-0 place-content-center rounded-full bg-secondary/20 text-secondary">
                                        <GraduationCap className="h-5 w-5" />
                                    </div>
                                    <div className="ltr:ml-2 rtl:mr-2">
                                        <h6 className="text-dark dark:text-white-light">Okullar</h6>
                                        <p className="text-xs text-white-dark">Şubeler dahil</p>
                                    </div>
                                </div>
                                <div className="mb-5">{isMounted && <ReactApexChart series={schoolChart.series} options={schoolChart.options} type="line" height={45} width={'100%'} />}</div>
                                <div className="flex items-center justify-between text-base font-bold">
                                    16 <span className="text-sm font-normal text-success flex items-center gap-1"><TrendingUp className="h-3 w-3" />+14.3%</span>
                                </div>
                            </div>

                            {/* Paket Planları */}
                            <div className="panel">
                                <div className="mb-5 flex items-center font-semibold">
                                    <div className="grid h-10 w-10 shrink-0 place-content-center rounded-full bg-info/20 text-info">
                                        <CreditCard className="h-5 w-5" />
                                    </div>
                                    <div className="ltr:ml-2 rtl:mr-2">
                                        <h6 className="text-dark dark:text-white-light">Paketler</h6>
                                        <p className="text-xs text-white-dark">Aktif planlar</p>
                                    </div>
                                </div>
                                <div className="mb-5">{isMounted && <ReactApexChart series={packageChart.series} options={packageChart.options} type="line" height={45} width={'100%'} />}</div>
                                <div className="flex items-center justify-between text-base font-bold">
                                    9 <span className="text-sm font-normal text-success flex items-center gap-1"><TrendingUp className="h-3 w-3" />+12.5%</span>
                                </div>
                            </div>

                            {/* Sistem Sağlığı */}
                            <div className="panel">
                                <div className="mb-5 flex items-center font-semibold">
                                    <div className="grid h-10 w-10 shrink-0 place-content-center rounded-full bg-success/20 text-success">
                                        <IconEye className="h-5 w-5" />
                                    </div>
                                    <div className="ltr:ml-2 rtl:mr-2">
                                        <h6 className="text-dark dark:text-white-light">Uptime</h6>
                                        <p className="text-xs text-white-dark">Son 30 gün</p>
                                    </div>
                                </div>
                                <div className="mb-5">{isMounted && <ReactApexChart series={tetherChart.series} options={tetherChart.options} type="line" height={45} width={'100%'} />}</div>
                                <div className="flex items-center justify-between text-base font-bold">
                                    99.9% <span className="text-sm font-normal text-success flex items-center gap-1"><TrendingUp className="h-3 w-3" />Stabil</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Gelir Trendi */}
                    <div>
                        <div className="mb-5 flex items-center font-bold">
                            <span className="text-lg">Gelir Trendi</span>
                            <button type="button" className="text-primary hover:text-black ltr:ml-auto rtl:mr-auto dark:hover:text-white-dark">
                                Rapor
                            </button>
                        </div>
                        <div className="panel">
                            {isMounted && (
                                <ReactApexChart
                                    series={monthlyRevenueChart.series}
                                    options={monthlyRevenueChart.options}
                                    type="area"
                                    height={200}
                                    width={'100%'}
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <div className="grid gap-6 xl:grid-flow-row">
                        {/* Mevcut Dönem Özeti */}
                        <div className="panel overflow-hidden">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-lg font-bold">Mevcut Dönem</div>
                                    <div className="text-success">Şubat 2026</div>
                                </div>
                                <div className="dropdown">
                                    <Dropdown
                                        offset={[0, 5]}
                                        placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                        btnClassName="hover:opacity-80"
                                        button={<IconHorizontalDots className="opacity-70 hover:opacity-80" />}
                                    >
                                        <ul>
                                            <li><Link href="/finance">Raporu Görüntüle</Link></li>
                                        </ul>
                                    </Dropdown>
                                </div>
                            </div>
                            <div className="relative mt-10">
                                <div className="absolute -bottom-12 h-24 w-24 ltr:-right-12 rtl:-left-12">
                                    <IconCircleCheck className="h-full w-full text-success opacity-20" />
                                </div>
                                <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
                                    <div>
                                        <div className="text-primary">Hedef</div>
                                        <div className="mt-2 text-2xl font-semibold">₺120,000</div>
                                    </div>
                                    <div>
                                        <div className="text-primary">Gerçekleşen</div>
                                        <div className="mt-2 text-2xl font-semibold">₺112,000</div>
                                    </div>
                                    <div>
                                        <div className="text-primary">Kalan</div>
                                        <div className="mt-2 text-2xl font-semibold">₺8,000</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Gecikmiş Ödemeler */}
                        <div className="panel overflow-hidden">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-lg font-bold">Gecikmiş Ödemeler</div>
                                    <div className="text-danger">3 kurum dikkat gerektiriyor</div>
                                </div>
                                <div className="dropdown">
                                    <Dropdown
                                        offset={[0, 5]}
                                        placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                        button={<IconHorizontalDots className="opacity-70 hover:opacity-80" />}
                                    >
                                        <ul>
                                            <li><Link href="/finance">Detayları Gör</Link></li>
                                        </ul>
                                    </Dropdown>
                                </div>
                            </div>
                            <div className="relative mt-10">
                                <div className="absolute -bottom-12 h-24 w-24 ltr:-right-12 rtl:-left-12">
                                    <IconInfoCircle className="h-full w-24 text-danger opacity-20" />
                                </div>
                                <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
                                    <div>
                                        <div className="text-primary">Toplam</div>
                                        <div className="mt-2 text-2xl font-semibold">₺24,500</div>
                                    </div>
                                    <div>
                                        <div className="text-primary">Kurum</div>
                                        <div className="mt-2 text-2xl font-semibold">3</div>
                                    </div>
                                    <div>
                                        <div className="text-primary">Ortalama Gecikme</div>
                                        <div className="mt-2 text-2xl font-semibold">12 gün</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Son İşlemler */}
                    <div className="panel">
                        <div className="mb-5 text-lg font-bold">Son İşlemler</div>
                        <div className="table-responsive">
                            <table>
                                <thead>
                                    <tr>
                                        <th className="ltr:rounded-l-md rtl:rounded-r-md">ID</th>
                                        <th>TARİH</th>
                                        <th>KURUM</th>
                                        <th>TUTAR</th>
                                        <th className="text-center ltr:rounded-r-md rtl:rounded-l-md">DURUM</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="font-semibold">#1042</td>
                                        <td className="whitespace-nowrap">01 Şub 2026</td>
                                        <td className="whitespace-nowrap">Güneş Anaokulu</td>
                                        <td>₺4,500</td>
                                        <td className="text-center">
                                            <span className="badge rounded-full bg-success/20 text-success hover:top-0">Tamamlandı</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="font-semibold">#1041</td>
                                        <td className="whitespace-nowrap">31 Oca 2026</td>
                                        <td className="whitespace-nowrap">Yıldız Kreş</td>
                                        <td>₺3,200</td>
                                        <td className="text-center">
                                            <span className="badge rounded-full bg-info/20 text-info hover:top-0">İşlemde</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="font-semibold">#1040</td>
                                        <td className="whitespace-nowrap">28 Oca 2026</td>
                                        <td className="whitespace-nowrap">Bahar Nursery</td>
                                        <td>₺6,800</td>
                                        <td className="text-center">
                                            <span className="badge rounded-full bg-danger/20 text-danger hover:top-0">Beklemede</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="font-semibold">#1039</td>
                                        <td className="whitespace-nowrap">25 Oca 2026</td>
                                        <td className="whitespace-nowrap">Minikler Yuvası</td>
                                        <td>₺5,100</td>
                                        <td className="text-center">
                                            <span className="badge rounded-full bg-success/20 text-success hover:top-0">Tamamlandı</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="font-semibold">#1038</td>
                                        <td className="whitespace-nowrap">22 Oca 2026</td>
                                        <td className="whitespace-nowrap">Gökkuşağı Anaokulu</td>
                                        <td>₺4,200</td>
                                        <td className="text-center">
                                            <span className="badge rounded-full bg-success/20 text-success hover:top-0">Tamamlandı</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="font-semibold">#1037</td>
                                        <td className="whitespace-nowrap">18 Oca 2026</td>
                                        <td className="whitespace-nowrap">Çiçek Kreş</td>
                                        <td>₺2,900</td>
                                        <td className="text-center">
                                            <span className="badge rounded-full bg-info/20 text-info hover:top-0">İşlemde</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComponentsDashboardIStudy;
