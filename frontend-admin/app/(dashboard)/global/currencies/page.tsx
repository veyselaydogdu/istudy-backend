'use client';

import { useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/apiClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Loader2, Trash2, Coins, ChevronLeft, ChevronRight, Search, Pencil, Star, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Currency } from '@/types';

type Meta = { current_page: number; last_page: number; per_page: number; total: number };

const schema = z.object({
    code: z.string().min(3).max(3, 'Para birimi kodu 3 karakter olmalıdır'),
    name: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
    name_tr: z.string().optional(),
    symbol: z.string().min(1, 'Sembol gereklidir'),
    symbol_position: z.enum(['before', 'after']).optional(),
    decimal_places: z.string().optional(),
    thousands_separator: z.string().optional(),
    decimal_separator: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CurrenciesPage() {
    const [items, setItems] = useState<Currency[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editItem, setEditItem] = useState<Currency | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });
    const { register: regEdit, handleSubmit: handleEdit, reset: resetEdit, formState: { errors: errEdit, isSubmitting: isEditSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page, per_page: 15 };
            if (search) { params.search = search; }
            const res = await apiClient.get('/admin/currencies', { params });
            if (res.data?.data) {
                setItems(res.data.data);
                setMeta(res.data.meta ?? null);
            }
        } catch {
            toast.error('Para birimleri yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => { setPage(1); }, [search]);
    useEffect(() => { fetchItems(); }, [fetchItems]);

    const onAdd = async (data: FormValues) => {
        try {
            await apiClient.post('/admin/currencies', data);
            toast.success('Para birimi eklendi.');
            setIsAddOpen(false);
            reset();
            fetchItems();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? 'Para birimi eklenemedi.');
        }
    };

    const onEdit = async (data: FormValues) => {
        if (!editItem) { return; }
        try {
            await apiClient.put(`/admin/currencies/${editItem.id}`, data);
            toast.success('Para birimi güncellendi.');
            setEditItem(null);
            fetchItems();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? 'Güncelleme başarısız.');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bu para birimini silmek istediğinizden emin misiniz?')) { return; }
        try {
            await apiClient.delete(`/admin/currencies/${id}`);
            toast.success('Para birimi silindi.');
            setItems((prev) => prev.filter((i) => i.id !== id));
        } catch {
            toast.error('Silinemedi.');
        }
    };

    const handleToggleStatus = async (id: number) => {
        try {
            await apiClient.patch(`/admin/currencies/${id}/toggle-status`);
            setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_active: !i.is_active } : i)));
        } catch {
            toast.error('Durum güncellenemedi.');
        }
    };

    const handleSetBase = async (id: number) => {
        if (!confirm('Bu para birimini temel para birimi olarak ayarlamak istediğinizden emin misiniz?')) { return; }
        try {
            await apiClient.patch(`/admin/currencies/${id}/set-base`);
            toast.success('Temel para birimi güncellendi.');
            fetchItems();
        } catch {
            toast.error('Güncelleme başarısız.');
        }
    };

    const openEdit = (item: Currency) => {
        setEditItem(item);
        resetEdit({
            code: item.code,
            name: item.name,
            symbol: item.symbol,
            decimal_places: item.decimal_places !== undefined ? String(item.decimal_places) : '',
        });
    };

    const CurrencyFormFields = ({ reg, errs }: { reg: typeof register; errs: typeof errors }) => (
        <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label>Para Birimi Kodu *</Label>
                    <Input {...reg('code')} maxLength={3} placeholder="TRY" />
                    {errs.code && <p className="text-xs text-red-500">{errs.code.message}</p>}
                </div>
                <div className="space-y-1">
                    <Label>Sembol *</Label>
                    <Input {...reg('symbol')} placeholder="₺" />
                    {errs.symbol && <p className="text-xs text-red-500">{errs.symbol.message}</p>}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label>Ad (İngilizce) *</Label>
                    <Input {...reg('name')} placeholder="Turkish Lira" />
                    {errs.name && <p className="text-xs text-red-500">{errs.name.message}</p>}
                </div>
                <div className="space-y-1">
                    <Label>Ad (Türkçe)</Label>
                    <Input {...reg('name_tr')} placeholder="Türk Lirası" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label>Sembol Pozisyonu</Label>
                    <select {...reg('symbol_position')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                        <option value="before">Önde (₺ 100)</option>
                        <option value="after">Sonda (100 ₺)</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <Label>Ondalık Basamak</Label>
                    <Input type="number" min={0} max={4} {...reg('decimal_places')} placeholder="2" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label>Binler Ayıracı</Label>
                    <Input {...reg('thousands_separator')} placeholder="." maxLength={1} />
                </div>
                <div className="space-y-1">
                    <Label>Ondalık Ayıracı</Label>
                    <Input {...reg('decimal_separator')} placeholder="," maxLength={1} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Para Birimleri</h1>
                    <p className="text-muted-foreground">Sistemde kullanılan para birimleri ve döviz kuru yönetimi.</p>
                </div>
                <Button onClick={() => setIsAddOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Para Birimi Ekle
                </Button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="Kod veya ad ile ara..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-yellow-500" /> Para Birimi Listesi
                    </CardTitle>
                    <CardDescription>{meta ? `Toplam ${meta.total} para birimi` : 'Yükleniyor...'}</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex h-32 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kod</TableHead>
                                        <TableHead>Ad</TableHead>
                                        <TableHead>Sembol</TableHead>
                                        <TableHead>Ondalık</TableHead>
                                        <TableHead>Durum</TableHead>
                                        <TableHead>Temel</TableHead>
                                        <TableHead className="w-28" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-mono font-bold">{item.code}</Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell className="text-lg">{item.symbol}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{item.decimal_places}</TableCell>
                                            <TableCell>
                                                <Badge variant={item.is_active ? 'success' : 'secondary'}>
                                                    {item.is_active ? 'Aktif' : 'Pasif'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {item.is_base ? (
                                                    <Badge variant="warning" className="flex items-center gap-1 w-fit">
                                                        <Star className="h-3 w-3" /> Temel
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    {!item.is_base && (
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Temel Para Birimi Yap" onClick={() => handleSetBase(item.id)}>
                                                            <Star className="h-4 w-4 text-yellow-500" />
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" title={item.is_active ? 'Pasife Al' : 'Aktife Al'} onClick={() => handleToggleStatus(item.id)}>
                                                        {item.is_active ? <ToggleRight className="h-4 w-4 text-success" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleDelete(item.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {items.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Para birimi bulunamadı.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            {meta && meta.last_page > 1 && (
                                <div className="mt-4 flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">Sayfa {meta.current_page} / {meta.last_page} — {meta.total} kayıt</p>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" disabled={meta.current_page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                                        <Button variant="outline" size="sm" disabled={meta.current_page === meta.last_page} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Para Birimi Ekle</DialogTitle>
                        <DialogDescription>Sisteme yeni para birimi ekleyin.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onAdd)}>
                        <CurrencyFormFields reg={register} errs={errors} />
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); reset(); }}>İptal</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Ekle
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) { setEditItem(null); } }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Para Birimi Düzenle</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit(onEdit)}>
                        <CurrencyFormFields reg={regEdit} errs={errEdit} />
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setEditItem(null)}>İptal</Button>
                            <Button type="submit" disabled={isEditSubmitting}>
                                {isEditSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Kaydet
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
