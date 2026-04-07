'use client';

import { useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/apiClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Loader2, Trash2, Stethoscope, ChevronLeft, ChevronRight, Search, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { MedicalCondition } from '@/types';

type Meta = { current_page: number; last_page: number; per_page: number; total: number };

const schema = z.object({
    name: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
    description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function MedicalConditionsPage() {
    const [items, setItems] = useState<MedicalCondition[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editItem, setEditItem] = useState<MedicalCondition | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });
    const { register: regEdit, handleSubmit: handleEdit, reset: resetEdit, formState: { errors: errEdit, isSubmitting: isEditSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page, per_page: 15 };
            if (search) { params.search = search; }
            const res = await apiClient.get('/admin/medical-conditions', { params });
            if (res.data?.data) {
                setItems(res.data.data);
                setMeta(res.data.meta ?? null);
            }
        } catch {
            toast.error('Tıbbi durumlar yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => { setPage(1); }, [search]);
    useEffect(() => { fetchItems(); }, [fetchItems]);

    const onAdd = async (data: FormValues) => {
        try {
            await apiClient.post('/admin/medical-conditions', data);
            toast.success('Tıbbi durum eklendi.');
            setIsAddOpen(false);
            reset();
            fetchItems();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? 'Kayıt eklenemedi.');
        }
    };

    const onEdit = async (data: FormValues) => {
        if (!editItem) { return; }
        try {
            await apiClient.put(`/admin/medical-conditions/${editItem.id}`, data);
            toast.success('Tıbbi durum güncellendi.');
            setEditItem(null);
            fetchItems();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? 'Güncelleme başarısız.');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bu tıbbi durumu silmek istediğinizden emin misiniz?')) { return; }
        try {
            await apiClient.delete(`/admin/medical-conditions/${id}`);
            toast.success('Tıbbi durum silindi.');
            setItems((prev) => prev.filter((i) => i.id !== id));
        } catch {
            toast.error('Silinemedi.');
        }
    };

    const openEdit = (item: MedicalCondition) => {
        setEditItem(item);
        resetEdit({ name: item.name, description: item.description ?? '' });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tıbbi Durumlar</h1>
                    <p className="text-muted-foreground">Kronik hastalıklar ve tıbbi durumlar global havuzu.</p>
                </div>
                <Button onClick={() => setIsAddOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Durum Ekle
                </Button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="Durum adı ile ara..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Stethoscope className="h-5 w-5 text-red-500" /> Tıbbi Durumlar Listesi
                    </CardTitle>
                    <CardDescription>{meta ? `Toplam ${meta.total} tıbbi durum` : 'Yükleniyor...'}</CardDescription>
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
                                        <TableHead>Durum Adı</TableHead>
                                        <TableHead>Açıklama</TableHead>
                                        <TableHead>Eklenme</TableHead>
                                        <TableHead className="w-20" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell className="max-w-xs text-sm text-muted-foreground truncate">{item.description ?? '—'}</TableCell>
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
                                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Tıbbi durum bulunamadı.</TableCell>
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tıbbi Durum Ekle</DialogTitle>
                        <DialogDescription>Global tıbbi durumlar havuzuna yeni kayıt ekleyin.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onAdd)}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Durum Adı *</Label>
                                <Input {...register('name')} />
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Açıklama</Label>
                                <Textarea rows={3} {...register('description')} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); reset(); }}>İptal</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Ekle
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) { setEditItem(null); } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tıbbi Durum Düzenle</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit(onEdit)}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Durum Adı *</Label>
                                <Input {...regEdit('name')} />
                                {errEdit.name && <p className="text-xs text-red-500">{errEdit.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Açıklama</Label>
                                <Textarea rows={3} {...regEdit('description')} />
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
