import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Sistem Ayarları</h1>
                <p className="text-muted-foreground">
                    Global parametreleri yönetin.
                </p>
            </div>

            <Tabs defaultValue="countries" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="countries">Ülke Tanımları</TabsTrigger>
                    <TabsTrigger value="currencies">Para Birimleri</TabsTrigger>
                    <TabsTrigger value="languages">Diller</TabsTrigger>
                </TabsList>

                <TabsContent value="countries">
                    <Card>
                        <CardHeader>
                            <CardTitle>Ülkeler</CardTitle>
                            <CardDescription>RestCountries API ile senkronize edilebilir.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline">Senkronize Et</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="currencies">
                    <Card>
                        <CardHeader>
                            <CardTitle>Döviz Kurları</CardTitle>
                            <CardDescription>Sistemde aktif olan para birimleri ve günlük kurlar.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button>+ Yeni Para Birimi</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
