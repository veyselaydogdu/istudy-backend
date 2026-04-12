'use client';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import apiClient from '@/lib/apiClient';
import { School, Country } from '@/types';
import { Plus, Search, Trash2, ChevronLeft, ChevronRight, Edit2, X, ToggleLeft, ToggleRight, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

// ─── Phone Code Types ───────────────────────────────────────────────────────

type PhoneCode = {
    id: number;
    name: string;
    iso2: string;
    phone_code: string; // stored without +
    flag_emoji?: string;
};

type PhoneFieldKey = 'phone' | 'fax' | 'gsm' | 'whatsapp';

type PhoneState = {
    digits: string;
    code: PhoneCode | null;
};

// ─── Phone Input Component ──────────────────────────────────────────────────

interface PhoneInputFieldProps {
    digits: string;
    selectedCode: PhoneCode | null;
    phoneCodes: PhoneCode[];
    onDigitsChange: (digits: string) => void;
    onCodeChange: (code: PhoneCode) => void;
    disabled?: boolean;
    placeholder?: string;
    searchPlaceholder: string;
    noResultLabel: string;
}

function PhoneInputField({ digits, selectedCode, phoneCodes, onDigitsChange, onCodeChange, disabled, placeholder, searchPlaceholder, noResultLabel }: PhoneInputFieldProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const filtered = useMemo(() => {
        if (!search) return phoneCodes;
        const s = search.toLowerCase();
        return phoneCodes.filter(c => c.name.toLowerCase().includes(s) || c.phone_code.includes(s));
    }, [phoneCodes, search]);

    return (
        <div className="flex gap-2">
            <div className="relative" ref={dropdownRef}>
                <button
                    type="button"
                    className="form-input flex h-[38px] min-w-[110px] items-center gap-1.5 px-2 text-sm"
                    onClick={() => setDropdownOpen(v => !v)}
                    disabled={disabled}
                >
                    <span className="text-base">{selectedCode?.flag_emoji || '🌍'}</span>
                    <span className="font-medium">+{selectedCode?.phone_code || '—'}</span>
                    <ChevronDown className="ml-auto h-3.5 w-3.5 text-white-dark" />
                </button>

                {dropdownOpen && (
                    <div className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-md border border-white-light bg-white shadow-lg dark:border-[#1b2e4b] dark:bg-[#1b2e4b]">
                        <div className="border-b border-white-light p-2 dark:border-[#253b5e]">
                            <input
                                type="text"
                                className="w-full rounded border border-white-light px-2 py-1 text-sm focus:outline-none dark:border-[#253b5e] dark:bg-[#0e1726] dark:text-white"
                                placeholder={searchPlaceholder}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <ul className="max-h-52 overflow-y-auto">
                            {filtered.length === 0 && (
                                <li className="px-3 py-2 text-sm text-[#888ea8]">{noResultLabel}</li>
                            )}
                            {filtered.map(c => (
                                <li key={c.id}>
                                    <button
                                        type="button"
                                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#f1f2f3] dark:hover:bg-[#253b5e] ${
                                            selectedCode?.id === c.id ? 'bg-primary/10 text-primary' : 'text-[#515365] dark:text-[#888ea8]'
                                        }`}
                                        onClick={() => { onCodeChange(c); setDropdownOpen(false); setSearch(''); }}
                                    >
                                        <span className="text-base">{c.flag_emoji || '🌍'}</span>
                                        <span className="flex-1 truncate">{c.name}</span>
                                        <span className="text-xs font-medium text-primary">+{c.phone_code}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="relative flex-1">
                <input
                    type="tel"
                    inputMode="numeric"
                    placeholder={placeholder || '5xx xxx xx xx'}
                    className="form-input w-full pr-12"
                    value={digits}
                    onChange={e => onDigitsChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    disabled={disabled}
                    maxLength={10}
                />
                {digits.length > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF]">
                        {digits.length}/10
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function parsePhone(value: string | null | undefined, codes: PhoneCode[]): PhoneState {
    if (!value) { return { digits: '', code: null }; }
    if (!value.startsWith('+')) { return { digits: value, code: null }; }
    const raw = value.slice(1);
    const sorted = [...codes].sort((a, b) => b.phone_code.length - a.phone_code.length);
    for (const c of sorted) {
        if (raw.startsWith(c.phone_code)) {
            return { code: c, digits: raw.slice(c.phone_code.length) };
        }
    }
    return { digits: raw, code: null };
}

function buildPhone(state: PhoneState): string | null {
    if (!state.digits.trim()) { return null; }
    const code = state.code?.phone_code || '';
    return code ? `+${code}${state.digits.trim()}` : state.digits.trim();
}

// ─── Form Type ──────────────────────────────────────────────────────────────

type SchoolForm = {
    name: string;
    code: string;
    country_id: string;
    city: string;
    address: string;
    email: string;
    website: string;
    description: string;
};

const emptyForm: SchoolForm = {
    name: '', code: '', country_id: '', city: '', address: '',
    email: '', website: '', description: '',
};

const emptyPhoneStates = (): Record<PhoneFieldKey, PhoneState> => ({
    phone: { digits: '', code: null },
    fax: { digits: '', code: null },
    gsm: { digits: '', code: null },
    whatsapp: { digits: '', code: null },
});

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SchoolsPage() {
    const { t } = useTranslation();
    const [schools, setSchools] = useState<School[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    const [phoneCodes, setPhoneCodes] = useState<PhoneCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editingSchool, setEditingSchool] = useState<School | null>(null);
    const [form, setForm] = useState<SchoolForm>(emptyForm);
    const [phoneStates, setPhoneStates] = useState<Record<PhoneFieldKey, PhoneState>>(emptyPhoneStates());
    const [saving, setSaving] = useState(false);

    const fetchSchools = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/schools', { params: { page, search: search || undefined } });
            if (res.data?.data) {
                setSchools(res.data.data);
                setLastPage(res.data.meta?.last_page ?? 1);
            }
        } catch {
            toast.error(t('schools.loadError'));
        } finally {
            setLoading(false);
        }
    }, [page, search, t]);

    const fetchCountries = useCallback(async () => {
        try {
            const res = await apiClient.get('/countries');
            if (res.data?.data) { setCountries(res.data.data); }
        } catch {
            // silent
        }
    }, []);

    useEffect(() => { fetchSchools(); }, [fetchSchools]);
    useEffect(() => { fetchCountries(); }, [fetchCountries]);

    useEffect(() => {
        apiClient
            .get('/countries/phone-codes')
            .then(res => {
                const data: PhoneCode[] = (res.data?.data || []).map((c: PhoneCode) => ({
                    ...c,
                    phone_code: c.phone_code.replace(/^\+/, ''),
                }));
                setPhoneCodes(data);
            })
            .catch(() => {});
    }, []);

    const defaultCode = useCallback((codes: PhoneCode[]) => {
        return codes.find(c => c.iso2 === 'TR') || codes[0] || null;
    }, []);

    const openCreate = () => {
        setEditingSchool(null);
        setForm(emptyForm);
        const def = defaultCode(phoneCodes);
        setPhoneStates({
            phone: { digits: '', code: def },
            fax: { digits: '', code: def },
            gsm: { digits: '', code: def },
            whatsapp: { digits: '', code: def },
        });
        setShowModal(true);
    };

    const openEdit = (school: School) => {
        setEditingSchool(school);
        setForm({
            name: school.name ?? '',
            code: school.code ?? '',
            country_id: school.country_id ? String(school.country_id) : '',
            city: school.city ?? '',
            address: school.address ?? '',
            email: school.email ?? '',
            website: school.website ?? '',
            description: school.description ?? '',
        });
        setPhoneStates({
            phone: parsePhone(school.phone, phoneCodes),
            fax: parsePhone(school.fax, phoneCodes),
            gsm: parsePhone(school.gsm, phoneCodes),
            whatsapp: parsePhone(school.whatsapp, phoneCodes),
        });
        setShowModal(true);
    };

    const setPhoneField = (field: PhoneFieldKey, update: Partial<PhoneState>) => {
        setPhoneStates(prev => ({ ...prev, [field]: { ...prev[field], ...update } }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) { toast.error(t('schools.nameRequired')); return; }
        setSaving(true);
        const payload = {
            ...form,
            country_id: form.country_id ? Number(form.country_id) : null,
            phone: buildPhone(phoneStates.phone),
            fax: buildPhone(phoneStates.fax),
            gsm: buildPhone(phoneStates.gsm),
            whatsapp: buildPhone(phoneStates.whatsapp),
        };
        try {
            if (editingSchool) {
                await apiClient.put(`/schools/${editingSchool.id}`, payload);
                toast.success(t('schools.updateSuccess'));
            } else {
                await apiClient.post('/schools', payload);
                toast.success(t('schools.createSuccess'));
            }
            setShowModal(false);
            setForm(emptyForm);
            setPage(1);
            fetchSchools();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? t('common.error'));
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (school: School) => {
        const isActive = school.is_active !== false;
        const action = isActive ? t('schools.makeInactive') : t('schools.makeActive');
        const result = await Swal.fire({
            title: action,
            text: `"${school.name}" ${action.toLowerCase()}. ${t('common.confirm')}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: t('common.yes'),
            cancelButtonText: t('common.cancel'),
        });
        if (!result.isConfirmed) { return; }
        try {
            await apiClient.patch(`/schools/${school.id}/toggle-status`);
            toast.success(`${school.name} ${isActive ? t('schools.toggleDeactivate') : t('schools.toggleActivate')}`);
            fetchSchools();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? t('schools.toggleStatusError'));
        }
    };

    const handleDelete = async (school: School) => {
        const result = await Swal.fire({
            title: t('schools.deleteSchoolTitle'),
            text: t('schools.deleteSchoolText', { name: school.name }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('swal.confirmDelete'),
            cancelButtonText: t('swal.cancel'),
            confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) { return; }
        try {
            await apiClient.delete(`/schools/${school.id}`);
            toast.success(t('schools.deleteSuccess'));
            fetchSchools();
        } catch {
            toast.error(t('schools.deleteFailed'));
        }
    };

    const f = (field: keyof SchoolForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [field]: e.target.value }));

    return (
        <div className="p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-dark dark:text-white">{t('schools.title')}</h1>
                <button type="button" className="btn btn-primary gap-2" onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                    {t('schools.newSchool')}
                </button>
            </div>

            <div className="panel">
                <div className="mb-4 flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888ea8]" />
                        <input
                            type="text"
                            className="form-input pl-9"
                            placeholder={t('schools.searchPlaceholderFull')}
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex h-32 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                ) : schools.length === 0 ? (
                    <div className="py-12 text-center text-[#515365] dark:text-[#888ea8]">
                        {t('schools.noSchool')}
                    </div>
                ) : (
                    <>
                        <div className="table-responsive">
                            <table className="table-hover">
                                <thead>
                                    <tr>
                                        <th>{t('schools.schoolName')}</th>
                                        <th>{t('schools.cityCol')}</th>
                                        <th>{t('schools.emailCol')}</th>
                                        <th>{t('schools.phoneCol')}</th>
                                        <th>{t('schools.classCol')}</th>
                                        <th>{t('schools.studentCol')}</th>
                                        <th>{t('common.status')}</th>
                                        <th>{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schools.map((school) => (
                                        <tr key={school.id}>
                                            <td>
                                                <Link href={`/schools/${school.id}`} className="font-medium text-primary hover:underline">
                                                    {school.name}
                                                </Link>
                                            </td>
                                            <td>{school.city ?? '—'}</td>
                                            <td>{school.email ?? '—'}</td>
                                            <td>{school.phone ?? '—'}</td>
                                            <td>{school.classes_count ?? 0}</td>
                                            <td>{school.children_count ?? 0}</td>
                                            <td>
                                                {school.is_active !== false ? (
                                                    <span className="badge badge-outline-success">{t('schools.statusActive')}</span>
                                                ) : (
                                                    <span className="badge badge-outline-secondary">{t('schools.statusInactive')}</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        className={`btn btn-sm p-2 ${school.is_active !== false ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                                        onClick={() => handleToggleStatus(school)}
                                                        title={school.is_active !== false ? t('schools.makeInactive') : t('schools.makeActive')}
                                                    >
                                                        {school.is_active !== false
                                                            ? <ToggleRight className="h-4 w-4" />
                                                            : <ToggleLeft className="h-4 w-4" />
                                                        }
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-primary p-2"
                                                        onClick={() => openEdit(school)}
                                                        title={t('schools.editTitle')}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger p-2"
                                                        onClick={() => handleDelete(school)}
                                                        title={t('schools.deleteTitle')}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {lastPage > 1 && (
                            <div className="mt-4 flex items-center justify-center gap-2">
                                <button type="button" className="btn btn-sm btn-outline-primary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="text-sm text-[#515365] dark:text-[#888ea8]">{page} / {lastPage}</span>
                                <button type="button" className="btn btn-sm btn-outline-primary" disabled={page === lastPage} onClick={() => setPage(p => p + 1)}>
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">
                                {editingSchool ? t('schools.editSchoolTitle') : t('schools.addSchoolTitle')}
                            </h2>
                            <button type="button" onClick={() => setShowModal(false)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">{t('schools.schoolNameLabel')}</label>
                                    <input type="text" className="form-input mt-1" value={form.name} onChange={f('name')} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">{t('schools.schoolCodeLabel')}</label>
                                    <input type="text" className="form-input mt-1" placeholder={t('schools.schoolCodePlaceholder')} value={form.code} onChange={f('code')} required={!editingSchool} />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">{t('schools.countryLabel')}</label>
                                    <select className="form-select mt-1" value={form.country_id} onChange={f('country_id')}>
                                        <option value="">{t('schools.selectCountry')}</option>
                                        {countries.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">{t('schools.cityLabel')}</label>
                                    <input type="text" className="form-input mt-1" value={form.city} onChange={f('city')} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">{t('schools.addressLabel')}</label>
                                <textarea className="form-input mt-1" rows={2} value={form.address} onChange={f('address')} />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">{t('schools.phoneLabel')}</label>
                                    <div className="mt-1">
                                        <PhoneInputField
                                            digits={phoneStates.phone.digits}
                                            selectedCode={phoneStates.phone.code}
                                            phoneCodes={phoneCodes}
                                            onDigitsChange={digits => setPhoneField('phone', { digits })}
                                            onCodeChange={code => setPhoneField('phone', { code })}
                                            disabled={saving}
                                            searchPlaceholder={t('schools.countrySearch')}
                                            noResultLabel={t('schools.noCountryResult')}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">{t('schools.faxLabel')}</label>
                                    <div className="mt-1">
                                        <PhoneInputField
                                            digits={phoneStates.fax.digits}
                                            selectedCode={phoneStates.fax.code}
                                            phoneCodes={phoneCodes}
                                            onDigitsChange={digits => setPhoneField('fax', { digits })}
                                            onCodeChange={code => setPhoneField('fax', { code })}
                                            disabled={saving}
                                            searchPlaceholder={t('schools.countrySearch')}
                                            noResultLabel={t('schools.noCountryResult')}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">{t('schools.gsmLabel')}</label>
                                    <div className="mt-1">
                                        <PhoneInputField
                                            digits={phoneStates.gsm.digits}
                                            selectedCode={phoneStates.gsm.code}
                                            phoneCodes={phoneCodes}
                                            onDigitsChange={digits => setPhoneField('gsm', { digits })}
                                            onCodeChange={code => setPhoneField('gsm', { code })}
                                            disabled={saving}
                                            searchPlaceholder={t('schools.countrySearch')}
                                            noResultLabel={t('schools.noCountryResult')}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">{t('schools.whatsappLabel')}</label>
                                    <div className="mt-1">
                                        <PhoneInputField
                                            digits={phoneStates.whatsapp.digits}
                                            selectedCode={phoneStates.whatsapp.code}
                                            phoneCodes={phoneCodes}
                                            onDigitsChange={digits => setPhoneField('whatsapp', { digits })}
                                            onCodeChange={code => setPhoneField('whatsapp', { code })}
                                            disabled={saving}
                                            searchPlaceholder={t('schools.countrySearch')}
                                            noResultLabel={t('schools.noCountryResult')}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">{t('schools.emailLabel')}</label>
                                    <input type="email" className="form-input mt-1" value={form.email} onChange={f('email')} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark dark:text-white-light">{t('schools.websiteLabel')}</label>
                                    <input type="text" className="form-input mt-1" placeholder="https://" value={form.website} onChange={f('website')} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">{t('schools.descriptionLabel')}</label>
                                <textarea className="form-input mt-1" rows={2} value={form.description} onChange={f('description')} />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
                                    {saving ? t('schools.saving') : (editingSchool ? t('common.update') : t('common.save'))}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowModal(false)}>
                                    {t('common.cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
