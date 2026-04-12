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
import { Plus, Loader2, Trash2, Globe, ChevronLeft, ChevronRight, Search, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Country } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

type Meta = { current_page: number; last_page: number; per_page: number; total: number };

const schema = z.object({
    name: z.string().min(2),
    official_name: z.string().optional(),
    native_name: z.string().optional(),
    iso2: z.string().length(2),
    iso3: z.string().optional(),
    phone_code: z.string().optional(),
    currency_code: z.string().optional(),
    region: z.string().optional(),
    capital: z.string().optional(),
    flag_emoji: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CountriesPage() {
    const { t } = useTranslation();
    const [items, setItems] = useState<Country[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editItem, setEditItem] = useState<Country | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });
    const { register: regEdit, handleSubmit: handleEdit, reset: resetEdit, formState: { errors: errEdit, isSubmitting: isEditSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page, per_page: 20 };
            if (search) { params.search = search; }
            const res = await apiClient.get('/admin/countries', { params });
            if (res.data?.data) {
                setItems(res.data.data);
                setMeta(res.data.meta ?? null);
            }
        } catch {
            toast.error(t('global.countries.loadError'));
        } finally {
            setLoading(false);
        }
    }, [page, search, t]);

    useEffect(() => { setPage(1); }, [search]);
    useEffect(() => { fetchItems(); }, [fetchItems]);

    const onAdd = async (data: FormValues) => {
        try {
            await apiClient.post('/admin/countries', data);
            toast.success(t('global.countries.addSuccess'));
            setIsAddOpen(false);
            reset();
            fetchItems();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? t('global.countries.addError'));
        }
    };

    const onEdit = async (data: FormValues) => {
        if (!editItem) { return; }
        try {
            await apiClient.put(`/admin/countries/${editItem.id}`, data);
            toast.success(t('global.countries.updateSuccess'));
            setEditItem(null);
            fetchItems();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message ?? t('global.countries.updateError'));
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t('global.countries.deleteConfirm'))) { return; }
        try {
            await apiClient.delete(`/admin/countries/${id}`);
            toast.success(t('global.countries.deleteSuccess'));
            setItems((prev) => prev.filter((i) => i.id !== id));
        } catch {
            toast.error(t('global.countries.deleteError'));
        }
    };

    const handleToggleActive = async (id: number) => {
        try {
            await apiClient.patch(`/admin/countries/${id}/toggle-active`);
            setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_active: !i.is_active } : i)));
        } catch {
            toast.error(t('global.countries.toggleError'));
        }
    };

    const openEdit = (item: Country) => {
        setEditItem(item);
        resetEdit({
            name: item.name,
            iso2: item.iso2,
            iso3: item.iso3 ?? '',
            phone_code: item.phone_code ?? '',
            currency_code: item.currency_code ?? '',
            region: item.region ?? '',
            capital: item.capital ?? '',
            flag_emoji: item.flag_emoji ?? '',
        });
    };

    const CountryFormFields = ({ reg, errs }: { reg: typeof register; errs: typeof errors }) => (
        <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label>{t('global.countries.nameLabel')}</Label>
                    <Input {...reg('name')} />
                    {errs.name && <p className="text-xs text-red-500">{errs.name.message}</p>}
                </div>
                <div className="space-y-1">
                    <Label>{t('global.countries.iso2Label')}</Label>
                    <Input {...reg('iso2')} maxLength={2} placeholder="TR" />
                    {errs.iso2 && <p className="text-xs text-red-500">{errs.iso2.message}</p>}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label>{t('global.countries.iso3Label')}</Label>
                    <Input {...reg('iso3')} maxLength={3} placeholder="TUR" />
                </div>
                <div className="space-y-1">
                    <Label>{t('global.countries.phoneCodeLabel')}</Label>
                    <Input {...reg('phone_code')} placeholder="+90" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label>{t('global.countries.currencyCodeLabel')}</Label>
                    <Input {...reg('currency_code')} maxLength={3} placeholder="TRY" />
                </div>
                <div className="space-y-1">
                    <Label>{t('global.countries.capitalLabel')}</Label>
                    <Input {...reg('capital')} placeholder="Ankara" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label>{t('global.countries.regionLabel')}</Label>
                    <Input {...reg('region')} placeholder="Asia" />
                </div>
                <div className="space-y-1">
                    <Label>{t('global.countries.flagLabel')}</Label>
                    <Input {...reg('flag_emoji')} placeholder="🇹🇷" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('global.countries.title')}</h1>
                    <p className="text-muted-foreground">{t('global.countries.subtitle')}</p>
                </div>
                <Button onClick={() => setIsAddOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> {t('global.countries.addBtn')}
                </Button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder={t('global.countries.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-blue-500" /> {t('global.countries.listTitle')}
                    </CardTitle>
                    <CardDescription>
                        {meta ? t('global.countries.totalCount', { count: meta.total }) : t('common.loading')}
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
                                        <TableHead>{t('global.countries.nameCol')}</TableHead>
                                        <TableHead>{t('global.countries.iso2Col')}</TableHead>
                                        <TableHead>{t('global.countries.phoneCol')}</TableHead>
                                        <TableHead>{t('global.countries.currencyCol')}</TableHead>
                                        <TableHead>{t('global.countries.regionCol')}</TableHead>
                                        <TableHead>{t('common.status')}</TableHead>
                                        <TableHead className="w-24" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                <span className="mr-2">{item.flag_emoji}</span>
                                                {item.name}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{item.iso2}</Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{item.phone_code ?? '—'}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{item.currency_code ?? '—'}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{item.region ?? '—'}</TableCell>
                                            <TableCell>
                                                <Badge variant={item.is_active ? 'success' : 'secondary'}>
                                                    {item.is_active ? t('common.active') : t('common.inactive')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleActive(item.id)}>
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
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">{t('global.countries.noRecord')}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            {meta && meta.last_page > 1 && (
                                <div className="mt-4 flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">
                                        {t('global.countries.pageInfo', { current: meta.current_page, total: meta.last_page, count: meta.total })}
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
                        <DialogTitle>{t('global.countries.addTitle')}</DialogTitle>
                        <DialogDescription>{t('global.countries.addDescription')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onAdd)}>
                        <CountryFormFields reg={register} errs={errors} />
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
                        <DialogTitle>{t('global.countries.editTitle')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit(onEdit)}>
                        <CountryFormFields reg={regEdit} errs={errEdit} />
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
