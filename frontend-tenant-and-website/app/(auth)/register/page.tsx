'use client';

import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import { Loader2, ChevronDown, Eye, EyeOff, CheckCircle2, Circle } from 'lucide-react';
import Image from 'next/image';

// ─── Types ────────────────────────────────────────────────

type PhoneCode = {
    id: number;
    name: string;
    iso2: string;
    phone_code: string;
    flag_emoji?: string;
};

// ─── Password strength ────────────────────────────────────

interface PasswordStrength {
    score: number;
    hasLength: boolean;
    hasUpper: boolean;
    hasSpecial: boolean;
    hasNumber: boolean;
}

function calcStrength(pwd: string): PasswordStrength {
    const hasLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const score = [hasLength, hasUpper, hasSpecial, hasNumber].filter(Boolean).length;
    return { score, hasLength, hasUpper, hasSpecial, hasNumber };
}

const STRENGTH_COLORS = ['#EF4444', '#F59E0B', '#F59E0B', '#10B981', '#208AEF'];
const STRENGTH_LABELS = ['', 'Çok Zayıf', 'Zayıf', 'Orta', 'Güçlü', 'Çok Güçlü'];

function PasswordStrengthBar({ password }: { password: string }) {
    const { score, hasLength, hasUpper, hasSpecial, hasNumber } = calcStrength(password);
    if (!password) return null;

    const color = STRENGTH_COLORS[score] ?? '#E5E7EB';
    const label = STRENGTH_LABELS[score] ?? '';

    return (
        <div className="mt-2 space-y-2">
            {/* Progress bars */}
            <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((n) => (
                    <div
                        key={n}
                        className="h-1.5 flex-1 rounded-full transition-all duration-300"
                        style={{ backgroundColor: n <= score ? color : '#E5E7EB' }}
                    />
                ))}
            </div>

            {/* Label */}
            <p className="text-right text-xs font-bold" style={{ color }}>{label}</p>

            {/* Rules */}
            <div className="space-y-1">
                <RuleItem met={hasLength} text="En az 8 karakter" />
                <RuleItem met={hasUpper} text="En az 1 büyük harf (A-Z)" />
                <RuleItem met={hasNumber} text="En az 1 rakam (0-9)" />
                <RuleItem met={hasSpecial} text="En az 1 özel karakter (!@#$...)" />
            </div>
        </div>
    );
}

function RuleItem({ met, text }: { met: boolean; text: string }) {
    return (
        <div className="flex items-center gap-1.5">
            {met ? (
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-success" />
            ) : (
                <Circle className="h-3.5 w-3.5 flex-shrink-0 text-[#D1D5DB]" />
            )}
            <span className={`text-xs ${met ? 'text-success' : 'text-[#9CA3AF]'}`}>{text}</span>
        </div>
    );
}

// ─── Zod Schema ───────────────────────────────────────────

const registerSchema = z
    .object({
        name: z.string().min(2, 'Ad en az 2 karakter olmalıdır.'),
        email: z.string().email('Geçerli bir e-posta adresi giriniz.'),
        password: z
            .string()
            .min(8, 'Şifre en az 8 karakter olmalıdır.')
            .regex(/[A-Z]/, 'Şifre en az 1 büyük harf içermelidir.')
            .regex(/[0-9]/, 'Şifre en az 1 rakam içermelidir.')
            .regex(/[^A-Za-z0-9]/, 'Şifre en az 1 özel karakter içermelidir (!@#$...).'),
        password_confirmation: z.string(),
        phone: z.string().optional(),
        institution_name: z.string().min(2, 'Kurum adı en az 2 karakter olmalıdır.'),
    })
    .refine((d) => d.password === d.password_confirmation, {
        message: 'Şifreler eşleşmiyor.',
        path: ['password_confirmation'],
    });

type RegisterFormValues = z.infer<typeof registerSchema>;

// ─── Main Page ────────────────────────────────────────────

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);
    const [phoneCodes, setPhoneCodes] = React.useState<PhoneCode[]>([]);
    const [selectedCode, setSelectedCode] = React.useState<PhoneCode | null>(null);
    const [dropdownOpen, setDropdownOpen] = React.useState(false);
    const [codeSearch, setCodeSearch] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirm, setShowConfirm] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: { phone: '' },
    });

    const passwordValue = useWatch({ control, name: 'password' }) ?? '';
    const phoneValue = watch('phone') ?? '';

    // Ülke telefon kodlarını çek
    React.useEffect(() => {
        apiClient
            .get('/countries/phone-codes')
            .then((res) => {
                const data: PhoneCode[] = (res.data?.data || []).map((c: PhoneCode) => ({
                    ...c,
                    phone_code: c.phone_code.replace(/^\+/, ''),
                }));
                setPhoneCodes(data);
                const turkey = data.find((c) => c.iso2 === 'TR') || data[0] || null;
                setSelectedCode(turkey);
            })
            .catch(() => {});
    }, []);

    // Dropdown dışına tıklandığında kapat
    React.useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const filteredCodes = React.useMemo(() => {
        if (!codeSearch) return phoneCodes;
        const s = codeSearch.toLowerCase();
        return phoneCodes.filter(
            (c) => c.name.toLowerCase().includes(s) || c.phone_code.includes(s),
        );
    }, [phoneCodes, codeSearch]);

    // Sadece rakam, max 10 hane
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
        setValue('phone', digits, { shouldValidate: false });
    };

    const onSubmit = async (data: RegisterFormValues) => {
        setIsLoading(true);
        try {
            let phone: string | undefined;
            if (data.phone && data.phone.trim()) {
                if (!selectedCode) {
                    toast.error('Telefon numarası girmek için ülke seçimi zorunludur.');
                    setIsLoading(false);
                    return;
                }
                const code = selectedCode.phone_code.replace(/^\+/, '');
                phone = `+${code}${data.phone.trim()}`;
            }

            const response = await apiClient.post('/auth/register', {
                name: data.name,
                email: data.email,
                password: data.password,
                password_confirmation: data.password_confirmation,
                institution_name: data.institution_name,
                ...(phone && selectedCode ? { phone, country: selectedCode.iso2 } : {}),
            });

            const token = response.data?.data?.token;
            if (!token) throw new Error('Token alınamadı.');
            localStorage.setItem('tenant_token', token);
            toast.success('Hesap oluşturuldu!');
            router.push('/register/plans');
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: { message?: string } } };
            const message = axiosError.response?.data?.message || 'Kayıt sırasında bir hata oluştu.';
            toast.error('Kayıt Başarısız', { description: message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="absolute inset-0">
                <Image src="/assets/images/auth/bg-gradient.png" alt="background" fill className="object-cover" priority />
            </div>

            <div className="relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
                <Image src="/assets/images/auth/coming-soon-object1.png" alt="" width={300} height={893} className="absolute left-0 top-1/2 h-full max-h-[893px] w-auto -translate-y-1/2 object-contain" />
                <Image src="/assets/images/auth/coming-soon-object3.png" alt="" width={300} height={300} className="absolute right-0 top-0 h-[300px] w-auto object-contain" />
                <Image src="/assets/images/auth/polygon-object.svg" alt="" width={120} height={120} className="absolute bottom-0 end-[28%]" />

                <div className="relative w-full max-w-[870px] rounded-md bg-[linear-gradient(45deg,#fff9f9_0%,rgba(255,255,255,0)_25%,rgba(255,255,255,0)_75%,_#fff9f9_100%)] p-2 dark:bg-[linear-gradient(52.22deg,#0E1726_0%,rgba(14,23,38,0)_18.66%,rgba(14,23,38,0)_51.04%,rgba(14,23,38,0)_80.07%,#0E1726_100%)]">
                    <div className="relative flex flex-col justify-center rounded-md bg-white/60 px-6 py-16 backdrop-blur-lg dark:bg-black/50">
                        <div className="mx-auto w-full max-w-[440px]">
                            <div className="mb-8">
                                <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">Kayıt Ol</h1>
                                <p className="text-base font-bold leading-normal text-white-dark">
                                    Adım 1/2 — Hesap bilgileri
                                </p>
                            </div>

                            <form className="space-y-4 dark:text-white" onSubmit={handleSubmit(onSubmit)}>
                                {/* Ad Soyad */}
                                <div className={errors.name ? 'has-error' : ''}>
                                    <label htmlFor="name">Ad Soyad</label>
                                    <input
                                        id="name"
                                        type="text"
                                        placeholder="Adınız ve soyadınız"
                                        className="form-input"
                                        {...register('name')}
                                        disabled={isLoading}
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-xs text-danger">{errors.name.message}</p>
                                    )}
                                </div>

                                {/* Kurum Adı */}
                                <div className={errors.institution_name ? 'has-error' : ''}>
                                    <label htmlFor="institution_name">Kurum Adı</label>
                                    <input
                                        id="institution_name"
                                        type="text"
                                        placeholder="Anaokulu / Kreş adı"
                                        className="form-input"
                                        {...register('institution_name')}
                                        disabled={isLoading}
                                    />
                                    {errors.institution_name && (
                                        <p className="mt-1 text-xs text-danger">{errors.institution_name.message}</p>
                                    )}
                                </div>

                                {/* E-posta */}
                                <div className={errors.email ? 'has-error' : ''}>
                                    <label htmlFor="email">E-posta</label>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="kurum@istudy.com"
                                        className="form-input"
                                        {...register('email')}
                                        disabled={isLoading}
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
                                    )}
                                </div>

                                {/* Telefon — ülke kodu + max 10 hane */}
                                <div>
                                    <label htmlFor="phone">Telefon (opsiyonel)</label>
                                    <div className="flex gap-2">
                                        {/* Ülke kodu dropdown */}
                                        <div className="relative" ref={dropdownRef}>
                                            <button
                                                type="button"
                                                className="form-input flex h-[38px] min-w-[110px] items-center gap-1.5 px-2 text-sm"
                                                onClick={() => setDropdownOpen((v) => !v)}
                                                disabled={isLoading}
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
                                                            placeholder="Ülke ara..."
                                                            value={codeSearch}
                                                            onChange={(e) => setCodeSearch(e.target.value)}
                                                            autoFocus
                                                        />
                                                    </div>
                                                    <ul className="max-h-52 overflow-y-auto">
                                                        {filteredCodes.length === 0 && (
                                                            <li className="px-3 py-2 text-sm text-[#888ea8]">Sonuç bulunamadı</li>
                                                        )}
                                                        {filteredCodes.map((c) => (
                                                            <li key={c.id}>
                                                                <button
                                                                    type="button"
                                                                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#f1f2f3] dark:hover:bg-[#253b5e] ${
                                                                        selectedCode?.id === c.id
                                                                            ? 'bg-primary/10 text-primary'
                                                                            : 'text-[#515365] dark:text-[#888ea8]'
                                                                    }`}
                                                                    onClick={() => {
                                                                        setSelectedCode(c);
                                                                        setDropdownOpen(false);
                                                                        setCodeSearch('');
                                                                    }}
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

                                        {/* Numara — sadece rakam, max 10 hane */}
                                        <div className="relative flex-1">
                                            <input
                                                id="phone"
                                                type="tel"
                                                inputMode="numeric"
                                                placeholder="5xx xxx xx xx"
                                                className="form-input w-full pr-12"
                                                value={phoneValue}
                                                onChange={handlePhoneChange}
                                                disabled={isLoading}
                                                maxLength={10}
                                            />
                                            {phoneValue.length > 0 && (
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF]">
                                                    {phoneValue.length}/10
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Şifre */}
                                <div className={errors.password ? 'has-error' : ''}>
                                    <label htmlFor="password">Şifre</label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="En az 8 karakter"
                                            className="form-input w-full pr-10"
                                            {...register('password')}
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#515365]"
                                            onClick={() => setShowPassword((v) => !v)}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
                                    )}
                                    <PasswordStrengthBar password={passwordValue} />
                                </div>

                                {/* Şifre Tekrar */}
                                <div className={errors.password_confirmation ? 'has-error' : ''}>
                                    <label htmlFor="password_confirmation">Şifre Tekrar</label>
                                    <div className="relative">
                                        <input
                                            id="password_confirmation"
                                            type={showConfirm ? 'text' : 'password'}
                                            placeholder="Şifrenizi tekrar giriniz"
                                            className="form-input w-full pr-10"
                                            {...register('password_confirmation')}
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#515365]"
                                            onClick={() => setShowConfirm((v) => !v)}
                                            tabIndex={-1}
                                        >
                                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {errors.password_confirmation && (
                                        <p className="mt-1 text-xs text-danger">{errors.password_confirmation.message}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-gradient w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Hesap Oluşturuluyor...
                                        </span>
                                    ) : (
                                        'Devam Et →'
                                    )}
                                </button>
                            </form>

                            <p className="mt-6 text-center text-sm text-white-dark">
                                Zaten hesabınız var mı?{' '}
                                <Link href="/login" className="font-semibold text-primary hover:underline">
                                    Giriş Yapın
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
