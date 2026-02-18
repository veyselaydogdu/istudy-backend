import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpRight, ArrowDownLeft, Wallet } from "lucide-react"

export default function FinancePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Finans & Ödemeler</h1>
                <p className="text-muted-foreground">
                    B2B fatura takibi, sanal POS işlemleri ve finansal raporlar.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Toplam Bekleyen Ödeme
                        </CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12,500 ₺</div>
                        <p className="text-xs text-muted-foreground">
                            3 Kurum ödeme bekliyor
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Bu Ayki Tahsilat
                        </CardTitle>
                        <ArrowDownLeft className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">45,231 ₺</div>
                        <p className="text-xs text-muted-foreground">
                            Geçen aya göre +%12
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="invoices" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="invoices">Faturalar</TabsTrigger>
                    <TabsTrigger value="transactions">POS İşlemleri</TabsTrigger>
                    <TabsTrigger value="reports">Raporlar</TabsTrigger>
                </TabsList>

                <TabsContent value="invoices" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Kesilen Faturalar</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm">Fatura listesi burada yer alacak.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
