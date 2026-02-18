import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"

export default function NotificationsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Bildirim Merkezi</h1>
                <p className="text-muted-foreground">
                    Müşterilere ve kullanıcılara toplu bildirim gönderin.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Yeni Bildirim Gönder</CardTitle>
                        <CardDescription>Push Notification ve Email olarak gönderilir.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4">
                            <div className="space-y-2">
                                <Label>Hedef Kitle</Label>
                                <select className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm">
                                    <option>Tüm Kurum Yöneticileri</option>
                                    <option>Sadece Okul Müdürleri</option>
                                    <option>Belirli Bir Paket Kullananlar</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Başlık</Label>
                                <Input placeholder="Bildirim Başlığı" />
                            </div>
                            <div className="space-y-2">
                                <Label>Mesaj İçeriği</Label>
                                <Textarea placeholder="Göndermek istediğiniz mesaj..." />
                            </div>
                            <Button className="w-full">
                                <Send className="mr-2 h-4 w-4" /> Gönder
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Gönderim Geçmişi</CardTitle>
                        <CardDescription>Son gönderilen bildirimlerin durumu.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-slate-500 text-center py-8">
                            Henüz işlem yok.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
