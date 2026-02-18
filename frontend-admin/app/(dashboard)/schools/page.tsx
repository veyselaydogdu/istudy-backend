import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Filter, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function SchoolsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Okullar & Şubeler</h1>
                    <p className="text-muted-foreground">
                        Sistemdeki tüm kayıtlı okulların global listesi.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" /> Filtrele
                    </Button>
                    <Button variant="outline">
                        <Database className="mr-2 h-4 w-4" /> Excel Aktar
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="flex w-full max-w-sm items-center space-x-2">
                <Input type="text" placeholder="Okul adı veya tenant ile ara..." />
                <Button type="submit">Ara</Button>
            </div>

            <Card className="text-center py-12">
                <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="p-3 bg-slate-100 rounded-full dark:bg-slate-800">
                        <Search className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium">Henüz Listeleme Hazır Değil</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        Bu sayfada tüm müşterilerin okullarını tek bir havuzda görüntüleyebileceksiniz.
                    </p>
                </div>
            </Card>
        </div>
    )
}
