'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import { Loader2, LayoutDashboard } from 'lucide-react';

const loginSchema = z.object({
    email: z.string().email('Geçerli bir e-posta adresi giriniz.'),
    password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);

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
            if (!token) throw new Error('Token alınamadı.');
            localStorage.setItem('admin_token', token);
            toast.success('Giriş başarılı!');
            router.push('/');
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: { message?: string } } };
            const message = axiosError.response?.data?.message || 'E-posta veya şifre hatalı.';
            toast.error('Giriş Başarısız', { description: message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/bg-gradient.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
            <div className="relative flex w-full max-w-[1502px] flex-col justify-between overflow-hidden rounded-md bg-white/60 backdrop-blur-lg dark:bg-black/50 lg:min-h-[758px] lg:flex-row lg:gap-10 xl:gap-0">
                {/* Left panel */}
                <div className="relative hidden w-full items-center justify-center bg-gradient-to-r from-primary via-primary/80 to-secondary p-5 lg:inline-flex lg:max-w-[835px] xl:p-24">
                    <div className="my-auto w-full max-w-[430px] text-center">
                        <div className="flex items-center justify-center mb-8">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-white">
                                <LayoutDashboard className="h-8 w-8" />
                            </div>
                        </div>
                        <h1 className="text-4xl font-extrabold text-white">iStudy Admin</h1>
                        <p className="mt-4 text-base text-white/70">
                            Anaokulu yönetim sisteminin süper admin paneline hoş geldiniz.
                        </p>
                        <div className="mt-8 flex justify-center gap-4">
                            <div className="rounded-full bg-white/20 px-4 py-2 text-sm text-white">Çok Kiracılı</div>
                            <div className="rounded-full bg-white/20 px-4 py-2 text-sm text-white">Güvenli</div>
                            <div className="rounded-full bg-white/20 px-4 py-2 text-sm text-white">Modern</div>
                        </div>
                    </div>
                </div>

                {/* Right panel */}
                <div className="flex w-full flex-col items-center justify-center px-4 py-10 sm:px-6 lg:max-w-[667px] lg:px-8">
                    <div className="w-full max-w-[440px]">
                        {/* Mobile logo */}
                        <div className="mb-8 flex items-center justify-center lg:hidden">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white mr-3">
                                <LayoutDashboard className="h-6 w-6" />
                            </div>
                            <span className="text-2xl font-bold dark:text-white">iStudy Admin</span>
                        </div>

                        <div className="mb-10">
                            <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">
                                Giriş Yap
                            </h1>
                            <p className="text-base font-bold leading-normal text-white-dark">
                                Yönetici hesabınızla devam edin
                            </p>
                        </div>

                        <form className="space-y-5 dark:text-white" onSubmit={handleSubmit(onSubmit)}>
                            <div className={errors.email ? 'has-error' : ''}>
                                <label htmlFor="email">E-posta</label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="admin@istudy.com"
                                    className="form-input"
                                    {...register('email')}
                                    disabled={isLoading}
                                />
                                {errors.email && (
                                    <p className="form-help mt-1 text-xs text-danger">{errors.email.message}</p>
                                )}
                            </div>

                            <div className={errors.password ? 'has-error' : ''}>
                                <label htmlFor="password">Şifre</label>
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
                                        Giriş Yapılıyor...
                                    </span>
                                ) : (
                                    'Giriş Yap'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
