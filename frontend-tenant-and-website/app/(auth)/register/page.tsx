'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import { Loader2, ChevronDown } from 'lucide-react';
import Image from 'next/image';

type PhoneCode = {
    id: number;
    name: string;
    iso2: string;
    phone_code: string;
    flag_emoji?: string;
};

const registerSchema = z
    .object({
        name: z.string().min(2, 'Ad en az 2 karakter olmalıdır.'),
        email: z.string().email('Geçerli bir e-posta adresi giriniz.'),
        password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır.'),
        password_confirmation: z.string(),
        phone: z.string().optional(),
        institution_name: z.string().min(2, 'Kurum adı en az 2 karakter olmalıdır.'),
    })
    .refine((d) => d.password === d.password_confirmation, {
        message: 'Şifreler eşleşmiyor.',
        path: ['password_confirmation'],
    });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);
    const [phoneCodes, setPhoneCodes] = React.useState<PhoneCode[]>([]);
    const [selectedCode, setSelectedCode] = React.useState<PhoneCode | null>(null);
    const [dropdownOpen, setDropdownOpen] = React.useState(false);
    const [codeSearch, setCodeSearch] = React.useState('');
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
    });

    // Ülke telefon kodlarını çek
    React.useEffect(() => {
        apiClient
            .get('/countries/phone-codes')
            .then((res) => {
                const data: PhoneCode[] = res.data?.data || [];
                setPhoneCodes(data);
                // Türkiye'yi varsayılan seç (iso2: TR)
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
            (c) => c.name.toLowerCase().includes(s) || c.phone_code.includes(s)
        );
    }, [phoneCodes, codeSearch]);

    const onSubmit = async (data: RegisterFormValues) => {
        setIsLoading(true);
        try {
            // Telefon varsa: alan kodu (+ olmadan) + numara birleştir
            let phone: string | undefined = undefined;
            if (data.phone && data.phone.trim()) {
                const code = selectedCode?.phone_code || '';
                // Sadece rakamları al, + veya sıfır başını temizle
                const digits = data.phone.trim().replace(/\D/g, '');
                phone = code ? `${code}${digits}` : digits;
            }

            const response = await apiClient.post('/auth/register', {
                name: data.name,
                email: data.email,
                password: data.password,
                password_confirmation: data.password_confirmation,
                institution_name: data.institution_name,
                ...(phone ? { phone } : {}),
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

                                {/* Telefon — alan kodu selectbox + numara */}
                                <div>
                                    <label htmlFor="phone">Telefon (opsiyonel)</label>
                                    <div className="flex gap-2">
                                        {/* Alan kodu dropdown */}
                                        <div className="relative" ref={dropdownRef}>
                                            <button
                                                type="button"
                                                className="form-input flex h-[38px] min-w-[110px] items-center gap-1.5 px-2 text-sm"
                                                onClick={() => setDropdownOpen((v) => !v)}
                                                disabled={isLoading}
                                            >
                                                <span className="text-base">{selectedCode?.flag_emoji || '🌍'}</span>
                                                <span className="font-medium">
                                                    +{selectedCode?.phone_code || '—'}
                                                </span>
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

                                        {/* Numara input */}
                                        <input
                                            id="phone"
                                            type="tel"
                                            placeholder="5xx xxx xx xx"
                                            className="form-input flex-1"
                                            {...register('phone')}
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-white-dark">
                                        Seçilen kod: +{selectedCode?.phone_code} — numara &quot;+&quot; olmadan giriniz
                                    </p>
                                </div>

                                <div className={errors.password ? 'has-error' : ''}>
                                    <label htmlFor="password">Şifre</label>
                                    <input
                                        id="password"
                                        type="password"
                                        placeholder="En az 8 karakter"
                                        className="form-input"
                                        {...register('password')}
                                        disabled={isLoading}
                                    />
                                    {errors.password && (
                                        <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
                                    )}
                                </div>

                                <div className={errors.password_confirmation ? 'has-error' : ''}>
                                    <label htmlFor="password_confirmation">Şifre Tekrar</label>
                                    <input
                                        id="password_confirmation"
                                        type="password"
                                        placeholder="Şifrenizi tekrar giriniz"
                                        className="form-input"
                                        {...register('password_confirmation')}
                                        disabled={isLoading}
                                    />
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
