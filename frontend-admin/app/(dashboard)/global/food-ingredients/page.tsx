'use client';

import { useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/apiClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Loader2, Trash2, Apple, ChevronLeft, ChevronRight, Search, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { FoodIngredient, Allergen } from '@/types';

type Meta = { current_page: number; last_page: number; per_page: number; total: number };

const schema = z.object({
    name: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
    allergen_info: z.string().optional(),
    allergen_ids: z.array(z.number()).optional(),
});

type FormValues = z.infer<typeof schema>;

function AllergenPicker({ allergens, selected, onChange }: { allergens: Allergen[]; selected: number[]; onChange: (ids: number[]) => void }) {
    const toggle = (id: number) => {
        if (selected.includes(id)) {
            onChange(selected.filter((x) => x !== id));
        } else {
            onChange([...selected, id]);
        }
    };

    return (
        <div className="rounded-md border p-3 max-h-44 overflow-y-auto">
            {allergens.length === 0 ? (
                <p className="text-sm text-muted-foreground">Alerjen bulunamadı</p>
            ) : (
                <div className="grid grid-cols-2 gap-2">
                    {allergens.map((a) => (
                        <label key={a.id} className="flex cursor-pointer items-center gap-2 rounded p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800">
                            <input type="checkbox" checked={selected.includes(a.id)} onChange={() => toggle(a.id)} className="rounded border-gray-300" />
                            <span className="text-sm">{a.name}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function FoodIngredientsPage() {
    const [items, setItems] = useState<FoodIngredient[]>([]);
    const [allergens, setAllergens] = useState<Allergen[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editItem, setEditItem] = useState<FoodIngredient | null>(null);
    const [addSelected, setAddSelected] = useState<number[]>([]);
    const [editSelected, setEditSelected] = useState<number[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });
    const { register: regEdit, handleSubmit: handleEdit, reset: resetEdit, formState: { errors: errEdit, isSubmitting: isEditSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page, per_page: 15 };
            if (search) { params.search = search; }
            const res = await apiClient.get('/admin/food-ingredients', { params });
            if (res.data?.data) {
                setItems(res.data.data);
                setMeta(res.data.meta ?? null);
            }
        } catch {
            toast.error('Besin içerikleri yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    const fetchAllergens = useCallback(async () => {
        try {
            const res = await apiClient.get('/admin/allergens?per_page=100');
            if (res.data?.data) { setAllergens(res.data.data); }
        } catch { /* silent */ }
    }, []);

    useEffect(() => { setPage(1); }, [search]);
    useEffect(() => { fetchItems(); }, [fetchItems]);
    useEffect(() => { fetchAllergens(); }, [fetchAllergens]);

    const onAdd = async (data: FormValues) => {
        try {
            await apiClient.post('/admin/food-ingredients', { ...data, allergen_ids: addSelected });
            toast.success('Besin içeriği eklendi.');
            setIsAddOpen(false);
            reset();
            setAddSelected([]);
            fetchItems();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? 'Besin eklenemedi.');
        }
    };

    const onEdit = async (data: FormValues) => {
        if (!editItem) { return; }
        try {
            await apiClient.put(`/admin/food-ingredients/${editItem.id}`, { ...data, allergen_ids: editSelected });
            toast.success('Besin içeriği güncellendi.');
            setEditItem(null);
            fetchItems();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? 'Güncelleme başarısız.');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bu besin içeriğini silmek istediğinizden emin misiniz?')) { return; }
        try {
            await apiClient.delete(`/admin/food-ingredients/${id}`);
            toast.success('Besin içeriği silindi.');
            setItems((prev) => prev.filter((i) => i.id !== id));
        } catch {
            toast.error('Silinemedi.');
        }
    };

    const openEdit = (item: FoodIngredient) => {
        setEditItem(item);
        setEditSelected(item.allergens?.map((a) => a.id) ?? []);
        resetEdit({ name: item.name, allergen_info: item.allergen_info ?? '' });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Besin İçerikleri</h1>
                    <p className="text-muted-foreground">Yemek menülerinde kullanılan standart besin tanımları.</p>
                </div>
                <Button onClick={() => setIsAddOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Besin Ekle
                </Button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="Besin adı ile ara..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Apple className="h-5 w-5 text-green-500" /> Besin İçerikleri Listesi
                    </CardTitle>
                    <CardDescription>{meta ? `Toplam ${meta.total} besin tanımı` : 'Yükleniyor...'}</CardDescription>
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
                                        <TableHead>Besin Adı</TableHead>
                                        <TableHead>Alerjenler</TableHead>
                                        <TableHead>Alerjen Notu</TableHead>
                                        <TableHead>Eklenme</TableHead>
                                        <TableHead className="w-20" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell>
                                                {item.allergens && item.allergens.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {item.allergens.map((a) => (
                                                            <Badge key={a.id} variant="warning" className="text-xs">{a.name}</Badge>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="max-w-xs text-sm text-muted-foreground truncate">{item.allergen_info ?? '—'}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(item.created_at).toLocaleDateString('tr-TR')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
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
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Besin içeriği bulunamadı.</TableCell>
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

            {/* Add Dialog */}
            <Dialog open={isAddOpen} onOpenChange={(o) => { if (!o) { setIsAddOpen(false); reset(); setAddSelected([]); } else { setIsAddOpen(true); } }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Besin Ekle</DialogTitle>
                        <DialogDescription>Global besin havuzuna yeni içerik ekleyin.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onAdd)}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Besin Adı *</Label>
                                <Input {...register('name')} />
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Alerjen Notu</Label>
                                <Textarea rows={2} {...register('allergen_info')} />
                            </div>
                            <div className="space-y-2">
                                <Label>İçerdiği Alerjenler</Label>
                                <AllergenPicker allergens={allergens} selected={addSelected} onChange={setAddSelected} />
                                <p className="text-xs text-muted-foreground">{addSelected.length} alerjen seçildi</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); reset(); setAddSelected([]); }}>İptal</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Ekle
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) { setEditItem(null); } }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Besin Düzenle</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit(onEdit)}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Besin Adı *</Label>
                                <Input {...regEdit('name')} />
                                {errEdit.name && <p className="text-xs text-red-500">{errEdit.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Alerjen Notu</Label>
                                <Textarea rows={2} {...regEdit('allergen_info')} />
                            </div>
                            <div className="space-y-2">
                                <Label>İçerdiği Alerjenler</Label>
                                <AllergenPicker allergens={allergens} selected={editSelected} onChange={setEditSelected} />
                                <p className="text-xs text-muted-foreground">{editSelected.length} alerjen seçildi</p>
                            </div>
                        </div>
                        <DialogFooter>
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
