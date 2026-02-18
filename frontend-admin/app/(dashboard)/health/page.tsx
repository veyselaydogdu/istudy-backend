import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function HealthPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Sağlık & Beslenme</h1>
                <p className="text-muted-foreground">
                    Merkezi alerjen, hastalık ve yemek veritabanı yönetimi.
                </p>
            </div>

            <Tabs defaultValue="allergens" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="allergens">Alerjenler</TabsTrigger>
                    <TabsTrigger value="conditions">Hastalıklar</TabsTrigger>
                    <TabsTrigger value="ingredients">Yemek İçerikleri</TabsTrigger>
                </TabsList>

                <TabsContent value="allergens">
                    <Card>
                        <CardHeader>
                            <CardTitle>Alerjen Havuzu</CardTitle>
                            <CardDescription>Sisteme yeni alerjen tanımları ekleyin (örn: Yer Fıstığı, Süt, Gluten).</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button>+ Yeni Alerjen Ekle</Button>
                            <div className="mt-4 p-4 border border-dashed rounded-lg text-center text-slate-500">
                                Alerjen listesi burada görünecek.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="conditions">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tıbbi Durumlar / Hastalıklar</CardTitle>
                            <CardDescription>Takibi yapılacak kronik hastalıklar (örn: Astım, Epilepsi).</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button>+ Yeni Hastalık Ekle</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="ingredients">
                    <Card>
                        <CardHeader>
                            <CardTitle>Yemek & Besin İçerikleri</CardTitle>
                            <CardDescription>Menülerde kullanılacak standart yemek ve malzeme tanımları.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button>+ Yeni Besin Ekle</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
