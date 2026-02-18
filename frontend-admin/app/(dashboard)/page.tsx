import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Building2, Users, CreditCard, DollarSign } from "lucide-react"

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Toplam Kurum
                        </CardTitle>
                        <Building2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            +2 geçen aydan beri
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Aktif Kullanıcılar
                        </CardTitle>
                        <Users className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+2350</div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            +180 geçen haftadan beri
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Satışlar</CardTitle>
                        <CreditCard className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+12,234 ₺</div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            +19% geçen aydan beri
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
                        <DollarSign className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">45,231.89 ₺</div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            +20.1% geçen aydan beri
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity / Charts could go here */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Genel Bakış</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[200px] flex items-center justify-center text-slate-400">
                            Grafik Alanı (Recharts vb. eklenecek)
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Son Aktiviteler</CardTitle>
                        <CardDescription>
                            Bu ay 265 yeni aktivite gerçekleşti.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            <div className="flex items-center">
                                <span className="relative flex h-2 w-2 mr-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                                </span>
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        Yeni okul kaydı: Bilge Kağan Koleji
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        2 dakika önce
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        Ödeme alındı: Yıldız Anaokulu
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        45 dakika önce
                                    </p>
                                </div>
                                <div className="ml-auto font-medium">+1,999.00 ₺</div>
                            </div>
                            <div className="flex items-center">
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        Yeni kullanıcı: Ahmet Yılmaz (Öğretmen)
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        2 saat önce
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
