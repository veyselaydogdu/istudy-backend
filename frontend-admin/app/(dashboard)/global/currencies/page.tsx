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
import { useTranslation } from '@/hooks/useTranslation';

type Meta = { current_page: number; last_page: number; per_page: number; total: number };

const schema = z.object({
    code: z.string().min(3).max(3),
    name: z.string().min(2),
    name_tr: z.string().optional(),
    symbol: z.string().min(1),
    symbol_position: z.enum(['before', 'after']).optional(),
    decimal_places: z.string().optional(),
    thousands_separator: z.string().optional(),
    decimal_separator: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CurrenciesPage() {
    const { t } = useTranslation();
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
            toast.error(t('global.currencies.loadError'));
        } finally {
            setLoading(false);
        }
    }, [page, search, t]);

    useEffect(() => { setPage(1); }, [search]);
    useEffect(() => { fetchItems(); }, [fetchItems]);

    const onAdd = async (data: FormValues) => {
        try {
            await apiClient.post('/admin/currencies', data);
            toast.success(t('global.currencies.addSuccess'));
            setIsAddOpen(false);
            reset();
            fetchItems();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? t('global.currencies.addError'));
        }
    };

    const onEdit = async (data: FormValues) => {
        if (!editItem) { return; }
        try {
            await apiClient.put(`/admin/currencies/${editItem.id}`, data);
            toast.success(t('global.currencies.updateSuccess'));
            setEditItem(null);
            fetchItems();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? t('global.currencies.updateError'));
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t('global.currencies.deleteConfirm'))) { return; }
        try {
            await apiClient.delete(`/admin/currencies/${id}`);
            toast.success(t('global.currencies.deleteSuccess'));
            setItems((prev) => prev.filter((i) => i.id !== id));
        } catch {
            toast.error(t('global.currencies.deleteError'));
        }
    };

    const handleToggleStatus = async (id: number) => {
        try {
            await apiClient.patch(`/admin/currencies/${id}/toggle-status`);
            setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_active: !i.is_active } : i)));
        } catch {
            toast.error(t('global.currencies.toggleError'));
        }
    };

    const handleSetBase = async (id: number) => {
        if (!confirm(t('global.currencies.setBaseConfirm'))) { return; }
        try {
            await apiClient.patch(`/admin/currencies/${id}/set-base`);
            toast.success(t('global.currencies.setBaseSuccess'));
            fetchItems();
        } catch {
            toast.error(t('global.currencies.setBaseError'));
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
                    <Label>{t('global.currencies.codeLabel')}</Label>
                    <Input {...reg('code')} maxLength={3} placeholder="TRY" />
                    {errs.code && <p className="text-xs text-red-500">{errs.code.message}</p>}
                </div>
                <div className="space-y-1">
                    <Label>{t('global.currencies.symbolLabel')}</Label>
                    <Input {...reg('symbol')} placeholder="₺" />
                    {errs.symbol && <p className="text-xs text-red-500">{errs.symbol.message}</p>}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label>{t('global.currencies.nameEnLabel')}</Label>
                    <Input {...reg('name')} placeholder="Turkish Lira" />
                    {errs.name && <p className="text-xs text-red-500">{errs.name.message}</p>}
                </div>
                <div className="space-y-1">
                    <Label>{t('global.currencies.nameTrLabel')}</Label>
                    <Input {...reg('name_tr')} placeholder="Türk Lirası" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label>{t('global.currencies.symbolPositionLabel')}</Label>
                    <select {...reg('symbol_position')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                        <option value="before">{t('global.currencies.symbolBefore')}</option>
                        <option value="after">{t('global.currencies.symbolAfter')}</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <Label>{t('global.currencies.decimalPlacesLabel')}</Label>
                    <Input type="number" min={0} max={4} {...reg('decimal_places')} placeholder="2" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label>{t('global.currencies.thousandsSepLabel')}</Label>
                    <Input {...reg('thousands_separator')} placeholder="." maxLength={1} />
                </div>
                <div className="space-y-1">
                    <Label>{t('global.currencies.decimalSepLabel')}</Label>
                    <Input {...reg('decimal_separator')} placeholder="," maxLength={1} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('global.currencies.title')}</h1>
                    <p className="text-muted-foreground">{t('global.currencies.subtitle')}</p>
                </div>
                <Button onClick={() => setIsAddOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> {t('global.currencies.addBtn')}
                </Button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder={t('global.currencies.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-yellow-500" /> {t('global.currencies.listTitle')}
                    </CardTitle>
                    <CardDescription>
                        {meta ? t('global.currencies.totalCount', { count: meta.total }) : t('common.loading')}
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
                                        <TableHead>{t('global.currencies.codeCol')}</TableHead>
                                        <TableHead>{t('global.currencies.nameCol')}</TableHead>
                                        <TableHead>{t('global.currencies.symbolCol')}</TableHead>
                                        <TableHead>{t('global.currencies.decimalCol')}</TableHead>
                                        <TableHead>{t('common.status')}</TableHead>
                                        <TableHead>{t('global.currencies.baseCol')}</TableHead>
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
                                                    {item.is_active ? t('common.active') : t('common.inactive')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {item.is_base ? (
                                                    <Badge variant="warning" className="flex items-center gap-1 w-fit">
                                                        <Star className="h-3 w-3" /> {t('global.currencies.baseBadge')}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    {!item.is_base && (
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSetBase(item.id)}>
                                                            <Star className="h-4 w-4 text-yellow-500" />
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleStatus(item.id)}>
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
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">{t('global.currencies.noRecord')}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            {meta && meta.last_page > 1 && (
                                <div className="mt-4 flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">
                                        {t('global.currencies.pageInfo', { current: meta.current_page, total: meta.last_page, count: meta.total })}
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
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t('global.currencies.addTitle')}</DialogTitle>
                        <DialogDescription>{t('global.currencies.addDescription')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onAdd)}>
                        <CurrencyFormFields reg={register} errs={errors} />
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); reset(); }}>{t('common.cancel')}</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('common.add')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) { setEditItem(null); } }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t('global.currencies.editTitle')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit(onEdit)}>
                        <CurrencyFormFields reg={regEdit} errs={errEdit} />
                        <DialogFooter className="mt-4">
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
