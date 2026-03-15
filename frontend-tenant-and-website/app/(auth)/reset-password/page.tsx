'use client';

import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import { Loader2, Eye, EyeOff, CheckCircle2, Circle } from 'lucide-react';
import Image from 'next/image';

// ─── Password strength (aynı register ile) ───────────────

function calcStrength(pwd: string) {
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
            <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((n) => (
                    <div
                        key={n}
                        className="h-1.5 flex-1 rounded-full transition-all duration-300"
                        style={{ backgroundColor: n <= score ? color : '#E5E7EB' }}
                    />
                ))}
            </div>
            <p className="text-right text-xs font-bold" style={{ color }}>{label}</p>
            <div className="space-y-1">
                {[
                    { met: hasLength, text: 'En az 8 karakter' },
                    { met: hasUpper, text: 'En az 1 büyük harf (A-Z)' },
                    { met: hasNumber, text: 'En az 1 rakam (0-9)' },
                    { met: hasSpecial, text: 'En az 1 özel karakter (!@#$...)' },
                ].map(({ met, text }) => (
                    <div key={text} className="flex items-center gap-1.5">
                        {met ? (
                            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-success" />
                        ) : (
                            <Circle className="h-3.5 w-3.5 flex-shrink-0 text-[#D1D5DB]" />
                        )}
                        <span className={`text-xs ${met ? 'text-success' : 'text-[#9CA3AF]'}`}>{text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Schema ──────────────────────────────────────────────

const resetSchema = z
    .object({
        password: z
            .string()
            .min(8, 'Şifre en az 8 karakter olmalıdır.')
            .regex(/[A-Z]/, 'Şifre en az 1 büyük harf içermelidir.')
            .regex(/[0-9]/, 'Şifre en az 1 rakam içermelidir.')
            .regex(/[^A-Za-z0-9]/, 'Şifre en az 1 özel karakter içermelidir (!@#$...).'),
        password_confirmation: z.string(),
    })
    .refine((d) => d.password === d.password_confirmation, {
        message: 'Şifreler eşleşmiyor.',
        path: ['password_confirmation'],
    });

type ResetFormValues = z.infer<typeof resetSchema>;

// ─── Main Page ────────────────────────────────────────────

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token') ?? '';
    const email = searchParams.get('email') ?? '';

    const [isLoading, setIsLoading] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirm, setShowConfirm] = React.useState(false);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<ResetFormValues>({
        resolver: zodResolver(resetSchema),
    });

    const passwordValue = useWatch({ control, name: 'password' }) ?? '';

    const onSubmit = async (data: ResetFormValues) => {
        if (!token || !email) {
            toast.error('Hata', { description: 'Geçersiz sıfırlama bağlantısı.' });
            return;
        }

        setIsLoading(true);
        try {
            await apiClient.post('/auth/reset-password', {
                token,
                email,
                password: data.password,
                password_confirmation: data.password_confirmation,
            });
            toast.success('Şifreniz güncellendi! Giriş yapabilirsiniz.');
            router.push('/login');
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: { message?: string } } };
            const message = axiosError.response?.data?.message || 'Şifre sıfırlanırken bir hata oluştu.';
            toast.error('Hata', { description: message });
        } finally {
            setIsLoading(false);
        }
    };

    if (!token || !email) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <p className="mb-4 text-danger">Geçersiz veya eksik sıfırlama bağlantısı.</p>
                    <Link href="/forgot-password" className="font-semibold text-primary hover:underline">
                        Yeni bağlantı talep et
                    </Link>
                </div>
            </div>
        );
    }

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
                    <div className="relative flex flex-col justify-center rounded-md bg-white/60 px-6 py-20 backdrop-blur-lg dark:bg-black/50 lg:min-h-[580px]">
                        <div className="mx-auto w-full max-w-[440px]">
                            <div className="mb-8">
                                <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">
                                    Yeni Şifre
                                </h1>
                                <p className="text-base font-bold leading-normal text-white-dark">
                                    {email} için yeni şifrenizi belirleyin.
                                </p>
                            </div>

                            <form className="space-y-5 dark:text-white" onSubmit={handleSubmit(onSubmit)}>
                                {/* Yeni Şifre */}
                                <div className={errors.password ? 'has-error' : ''}>
                                    <label htmlFor="password">Yeni Şifre</label>
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
                                            Güncelleniyor...
                                        </span>
                                    ) : (
                                        'Şifremi Güncelle'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
