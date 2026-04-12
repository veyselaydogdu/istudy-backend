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
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Trash2, AlertTriangle, ChevronLeft, ChevronRight, Search, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Allergen } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

type Meta = { current_page: number; last_page: number; per_page: number; total: number };

const RISK_VARIANT_MAP: Record<string, 'success' | 'warning' | 'danger'> = {
    low: 'success',
    medium: 'warning',
    high: 'danger',
};

const schema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    risk_level: z.enum(['low', 'medium', 'high']).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function AllergensPage() {
    const { t } = useTranslation();
    const [items, setItems] = useState<Allergen[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editItem, setEditItem] = useState<Allergen | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const RISK_LABELS: Record<string, string> = {
        low: t('global.allergens.riskLow'),
        medium: t('global.allergens.riskMedium'),
        high: t('global.allergens.riskHigh'),
    };

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });
    const { register: regEdit, handleSubmit: handleEdit, reset: resetEdit, formState: { errors: errEdit, isSubmitting: isEditSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page, per_page: 15 };
            if (search) { params.search = search; }
            const res = await apiClient.get('/admin/allergens', { params });
            if (res.data?.data) {
                setItems(res.data.data);
                setMeta(res.data.meta ?? null);
            }
        } catch {
            toast.error(t('global.allergens.loadError'));
        } finally {
            setLoading(false);
        }
    }, [page, search, t]);

    useEffect(() => { setPage(1); }, [search]);
    useEffect(() => { fetchItems(); }, [fetchItems]);

    const onAdd = async (data: FormValues) => {
        try {
            await apiClient.post('/admin/allergens', data);
            toast.success(t('global.allergens.addSuccess'));
            setIsAddOpen(false);
            reset();
            fetchItems();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? t('global.allergens.addError'));
        }
    };

    const onEdit = async (data: FormValues) => {
        if (!editItem) { return; }
        try {
            await apiClient.put(`/admin/allergens/${editItem.id}`, data);
            toast.success(t('global.allergens.updateSuccess'));
            setEditItem(null);
            fetchItems();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? t('global.allergens.updateError'));
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t('global.allergens.deleteConfirm'))) { return; }
        try {
            await apiClient.delete(`/admin/allergens/${id}`);
            toast.success(t('global.allergens.deleteSuccess'));
            setItems((prev) => prev.filter((i) => i.id !== id));
        } catch {
            toast.error(t('global.allergens.deleteError'));
        }
    };

    const openEdit = (item: Allergen) => {
        setEditItem(item);
        resetEdit({ name: item.name, description: item.description ?? '', risk_level: item.risk_level });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('global.allergens.title')}</h1>
                    <p className="text-muted-foreground">{t('global.allergens.subtitle')}</p>
                </div>
                <Button onClick={() => setIsAddOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> {t('global.allergens.addBtn')}
                </Button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder={t('global.allergens.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" /> {t('global.allergens.listTitle')}
                    </CardTitle>
                    <CardDescription>
                        {meta ? t('global.allergens.totalCount', { count: meta.total }) : t('common.loading')}
                    </CardDescription>
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
                                        <TableHead>{t('global.allergens.nameCol')}</TableHead>
                                        <TableHead>{t('global.allergens.descCol')}</TableHead>
                                        <TableHead>{t('global.allergens.riskCol')}</TableHead>
                                        <TableHead>{t('global.allergens.addedCol')}</TableHead>
                                        <TableHead className="w-20" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell className="max-w-xs text-sm text-muted-foreground truncate">{item.description ?? '—'}</TableCell>
                                            <TableCell>
                                                {item.risk_level ? (
                                                    <Badge variant={RISK_VARIANT_MAP[item.risk_level]}>{RISK_LABELS[item.risk_level]}</Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
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
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">{t('global.allergens.noRecord')}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            {meta && meta.last_page > 1 && (
                                <div className="mt-4 flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">
                                        {t('global.allergens.pageInfo', { current: meta.current_page, total: meta.last_page, count: meta.total })}
                                    </p>
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
                        <DialogTitle>{t('global.allergens.addTitle')}</DialogTitle>
                        <DialogDescription>{t('global.allergens.addDescription')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onAdd)}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>{t('global.allergens.nameLabel')}</Label>
                                <Input {...register('name')} />
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>{t('global.allergens.descLabel')}</Label>
                                <Textarea rows={3} {...register('description')} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('global.allergens.riskLabel')}</Label>
                                <select {...register('risk_level')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                                    <option value="">{t('global.allergens.riskOptional')}</option>
                                    <option value="low">{t('global.allergens.riskLow')}</option>
                                    <option value="medium">{t('global.allergens.riskMedium')}</option>
                                    <option value="high">{t('global.allergens.riskHigh')}</option>
                                </select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); reset(); }}>{t('common.cancel')}</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('common.add')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) { setEditItem(null); } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('global.allergens.editTitle')}</DialogTitle>
                        <DialogDescription>{t('global.allergens.editDescription')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEdit(onEdit)}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>{t('global.allergens.nameLabel')}</Label>
                                <Input {...regEdit('name')} />
                                {errEdit.name && <p className="text-xs text-red-500">{errEdit.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>{t('global.allergens.descLabel')}</Label>
                                <Textarea rows={3} {...regEdit('description')} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('global.allergens.riskLabel')}</Label>
                                <select {...regEdit('risk_level')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                                    <option value="">{t('global.allergens.riskOptional')}</option>
                                    <option value="low">{t('global.allergens.riskLow')}</option>
                                    <option value="medium">{t('global.allergens.riskMedium')}</option>
                                    <option value="high">{t('global.allergens.riskHigh')}</option>
                                </select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditItem(null)}>{t('common.cancel')}</Button>
                            <Button type="submit" disabled={isEditSubmitting}>
                                {isEditSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('common.save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
