import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function UsersPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Kullanıcı Havuzu</h1>
                <p className="text-muted-foreground">
                    Sistemdeki tüm Öğretmen, Veli ve Öğrencilerin yönetimi.
                </p>
            </div>

            <div className="flex w-full max-w-md items-center space-x-2">
                <Input type="text" placeholder="Ad, Soyad veya Email ile global arama..." />
                <Button size="icon"><Search className="h-4 w-4" /></Button>
            </div>

            <Tabs defaultValue="teachers" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="teachers">Öğretmenler</TabsTrigger>
                    <TabsTrigger value="parents">Ebeveynler</TabsTrigger>
                    <TabsTrigger value="students">Öğrenciler</TabsTrigger>
                </TabsList>
                <TabsContent value="teachers" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Öğretmen Listesi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-500 text-sm">Tüm tenant'lardaki öğretmenler listelenecek.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="parents" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Veli Listesi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-500 text-sm">Tüm veliler listelenecek.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="students" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Öğrenci Listesi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-500 text-sm">Tüm öğrenciler listelenecek.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
