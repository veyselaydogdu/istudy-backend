'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useTranslation } from '@/hooks/useTranslation';
import { availableLocales, type Locale } from '@/i18n';
import { useDispatch } from 'react-redux';
import { toggleLocale } from '@/store/themeConfigSlice';

export default function LoginPage() {
    const { t, locale, switchLocale } = useTranslation();
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);

    const loginSchema = z.object({
        email: z.string().email(t('validation.emailRequired')),
        password: z.string().min(6, t('validation.passwordMin')),
    });

    type LoginFormValues = z.infer<typeof loginSchema>;

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);
        try {
            const response = await apiClient.post('/auth/login', data);
            const token = response.data?.data?.token;
            if (!token) throw new Error(t('auth.tokenError'));
            localStorage.setItem('admin_token', token);
            toast.success(t('auth.loginSuccess'));
            router.push('/');
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: { message?: string } } };
            const message = axiosError.response?.data?.message || t('auth.loginError');
            toast.error(t('auth.loginFailed'), { description: message });
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
                <Image src="/assets/images/auth/coming-soon-object2.png" alt="" width={300} height={160} className="absolute left-24 top-0 h-40 w-auto md:left-[30%] object-contain" />
                <Image src="/assets/images/auth/coming-soon-object3.png" alt="" width={300} height={300} className="absolute right-0 top-0 h-[300px] w-auto object-contain" />
                <Image src="/assets/images/auth/polygon-object.svg" alt="" width={120} height={120} className="absolute bottom-0 end-[28%]" />

                {/* Language switcher on login page */}
                <div className="absolute right-4 top-4 z-10 flex gap-1">
                    {availableLocales.map((loc) => (
                        <button
                            key={loc.code}
                            type="button"
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                locale === loc.code
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'bg-white/60 text-dark hover:bg-white/80 dark:bg-black/40 dark:text-white dark:hover:bg-black/60'
                            }`}
                            onClick={() => switchLocale(loc.code)}
                        >
                            {loc.flag} {loc.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full max-w-[870px] rounded-md bg-[linear-gradient(45deg,#fff9f9_0%,rgba(255,255,255,0)_25%,rgba(255,255,255,0)_75%,_#fff9f9_100%)] p-2 dark:bg-[linear-gradient(52.22deg,#0E1726_0%,rgba(14,23,38,0)_18.66%,rgba(14,23,38,0)_51.04%,rgba(14,23,38,0)_80.07%,#0E1726_100%)]">
                    <div className="relative flex flex-col justify-center rounded-md bg-white/60 px-6 py-20 backdrop-blur-lg dark:bg-black/50 lg:min-h-[758px]">
                        <div className="mx-auto w-full max-w-[440px]">
                            <div className="mb-10">
                                <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">{t('auth.loginTitle')}</h1>
                                <p className="text-base font-bold leading-normal text-white-dark">{t('auth.loginSubtitle')}</p>
                            </div>

                            <form className="space-y-5 dark:text-white" onSubmit={handleSubmit(onSubmit)}>
                                <div className={errors.email ? 'has-error' : ''}>
                                    <label htmlFor="email">{t('auth.email')}</label>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder={t('auth.emailPlaceholder')}
                                        className="form-input"
                                        {...register('email')}
                                        disabled={isLoading}
                                    />
                                    {errors.email && (
                                        <p className="form-help mt-1 text-xs text-danger">{errors.email.message}</p>
                                    )}
                                </div>

                                <div className={errors.password ? 'has-error' : ''}>
                                    <label htmlFor="password">{t('auth.password')}</label>
                                    <input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="form-input"
                                        {...register('password')}
                                        disabled={isLoading}
                                    />
                                    {errors.password && (
                                        <p className="form-help mt-1 text-xs text-danger">{errors.password.message}</p>
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
                                            {t('auth.loggingIn')}
                                        </span>
                                    ) : (
                                        t('auth.login')
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
